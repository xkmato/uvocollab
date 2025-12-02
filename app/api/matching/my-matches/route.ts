import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/matching/my-matches
 * Fetch matches for the authenticated user (guest or podcast owner)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user document
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const isGuest = userData?.isGuest || false;

    // Fetch matches based on user type
    let matchesQuery;
    
    if (isGuest) {
      // Get matches where user is the guest
      matchesQuery = adminDb
        .collection('matches')
        .where('guestId', '==', uid)
        .where('status', 'in', ['active', 'collaboration_started'])
        .orderBy('matchedAt', 'desc');
    } else {
      // Get matches where user owns the podcast
      matchesQuery = adminDb
        .collection('matches')
        .where('podcastOwnerId', '==', uid)
        .where('status', 'in', ['active', 'collaboration_started'])
        .orderBy('matchedAt', 'desc');
    }

    const matchesSnapshot = await matchesQuery.get();
    const matches = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      matchedAt: doc.data().matchedAt?.toDate().toISOString(),
      notifiedAt: doc.data().notifiedAt?.toDate().toISOString(),
      guestViewedAt: doc.data().guestViewedAt?.toDate().toISOString(),
      podcastViewedAt: doc.data().podcastViewedAt?.toDate().toISOString(),
      expiresAt: doc.data().expiresAt?.toDate().toISOString(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    }));

    // Mark matches as viewed
    const viewedField = isGuest ? 'guestViewedAt' : 'podcastViewedAt';
    const updatePromises = matchesSnapshot.docs
      .filter(doc => !doc.data()[viewedField])
      .map(doc => 
        adminDb.collection('matches').doc(doc.id).update({
          [viewedField]: new Date()
        })
      );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      matches,
      userType: isGuest ? 'guest' : 'podcast'
    });

  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch matches',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
