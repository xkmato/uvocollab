import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { collaborationId, userId, rating, review, wouldCollaborateAgain, isPublic } = await request.json();

    // Validate required fields
    if (!collaborationId || !userId || rating === undefined || wouldCollaborateAgain === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Load collaboration
    const collabRef = doc(db, 'collaborations', collaborationId);
    const collabSnap = await getDoc(collabRef);

    if (!collabSnap.exists()) {
      return NextResponse.json(
        { error: 'Collaboration not found' },
        { status: 404 }
      );
    }

    const collaboration = collabSnap.data();

    // Verify collaboration is completed
    if (collaboration.status !== 'completed') {
      return NextResponse.json(
        { error: 'Feedback can only be submitted for completed collaborations' },
        { status: 400 }
      );
    }

    // Determine who the user is giving feedback to
    let toUserId = '';
    if (collaboration.type === 'guest_appearance') {
      if (collaboration.guestId === userId) {
        // Guest is giving feedback to podcast owner
        toUserId = collaboration.buyerId;
      } else if (collaboration.buyerId === userId) {
        // Podcast owner is giving feedback to guest
        toUserId = collaboration.guestId;
      } else {
        return NextResponse.json(
          { error: 'User not part of this collaboration' },
          { status: 403 }
        );
      }
    } else {
      // For legend/podcast collaborations
      if (collaboration.buyerId === userId) {
        toUserId = collaboration.legendId || collaboration.podcastId;
      } else if (collaboration.legendId === userId || collaboration.podcastId === userId) {
        toUserId = collaboration.buyerId;
      } else {
        return NextResponse.json(
          { error: 'User not part of this collaboration' },
          { status: 403 }
        );
      }
    }

    // Check if feedback already exists
    const feedbackId = `${collaborationId}_${userId}_${toUserId}`;
    const feedbackRef = doc(db, 'collaborationFeedback', feedbackId);
    const existingFeedback = await getDoc(feedbackRef);

    if (existingFeedback.exists()) {
      return NextResponse.json(
        { error: 'Feedback already submitted for this collaboration' },
        { status: 400 }
      );
    }

    // Create feedback document
    const feedbackData = {
      collaborationId,
      fromUserId: userId,
      toUserId,
      rating,
      review: review || '',
      wouldCollaborateAgain,
      isPublic: isPublic !== false, // Default to true if not specified
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(feedbackRef, feedbackData);

    // Update recipient's feedback statistics
    await updateUserFeedbackStats(toUserId);

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId,
    });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collaborationId = searchParams.get('collaborationId');
    const userId = searchParams.get('userId');
    const toUserId = searchParams.get('toUserId');

    // Get feedback for a specific collaboration
    if (collaborationId) {
      const feedbackQuery = query(
        collection(db, 'collaborationFeedback'),
        where('collaborationId', '==', collaborationId)
      );
      const feedbackSnap = await getDocs(feedbackQuery);
      
      const feedback = feedbackSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));

      return NextResponse.json({ feedback });
    }

    // Get feedback given by a specific user
    if (userId) {
      const feedbackQuery = query(
        collection(db, 'collaborationFeedback'),
        where('fromUserId', '==', userId)
      );
      const feedbackSnap = await getDocs(feedbackQuery);
      
      const feedback = feedbackSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));

      return NextResponse.json({ feedback });
    }

    // Get feedback received by a specific user
    if (toUserId) {
      const feedbackQuery = query(
        collection(db, 'collaborationFeedback'),
        where('toUserId', '==', toUserId),
        where('isPublic', '==', true)
      );
      const feedbackSnap = await getDocs(feedbackQuery);
      
      const feedback = feedbackSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));

      return NextResponse.json({ feedback });
    }

    return NextResponse.json(
      { error: 'Missing query parameter: collaborationId, userId, or toUserId' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

async function updateUserFeedbackStats(userId: string) {
  try {
    // Get all public feedback for this user
    const feedbackQuery = query(
      collection(db, 'collaborationFeedback'),
      where('toUserId', '==', userId),
      where('isPublic', '==', true)
    );
    const feedbackSnap = await getDocs(feedbackQuery);

    if (feedbackSnap.empty) return;

    let totalRating = 0;
    let wouldCollaborateAgainCount = 0;
    const totalReviews = feedbackSnap.size;

    feedbackSnap.forEach(doc => {
      const data = doc.data();
      totalRating += data.rating;
      if (data.wouldCollaborateAgain) {
        wouldCollaborateAgainCount++;
      }
    });

    const averageRating = totalRating / totalReviews;
    const wouldCollaborateAgainPercentage = (wouldCollaborateAgainCount / totalReviews) * 100;

    // Update user's feedback stats
    const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
    const userSnap = await getDocs(userQuery);

    if (!userSnap.empty) {
      const userDocRef = userSnap.docs[0].ref;
      await setDoc(userDocRef, {
        feedbackStats: {
          averageRating: parseFloat(averageRating.toFixed(2)),
          totalReviews,
          wouldCollaborateAgainPercentage: parseFloat(wouldCollaborateAgainPercentage.toFixed(1)),
        },
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error updating feedback stats:', error);
    // Don't throw - this is a non-critical operation
  }
}
