import { db } from '@/lib/firebase';
import { sendEmail } from '@/lib/mailgun';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { collaborationId, userId, recordingNotes } = await request.json();

    if (!collaborationId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Verify it's a guest appearance
    if (collaboration.type !== 'guest_appearance') {
      return NextResponse.json(
        { error: 'This endpoint is only for guest appearance collaborations' },
        { status: 400 }
      );
    }

    // Verify user is the podcast owner (buyer)
    if (collaboration.buyerId !== userId) {
      return NextResponse.json(
        { error: 'Only the podcast owner can mark recording as complete' },
        { status: 403 }
      );
    }

    // Verify collaboration is in scheduled or in_progress status
    if (collaboration.status !== 'scheduled' && collaboration.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Recording can only be marked complete when status is scheduled or in_progress' },
        { status: 400 }
      );
    }

    // Update collaboration status to post_production
    const updateData: any = {
      status: 'post_production',
      updatedAt: Timestamp.now(),
      recordingCompletedAt: Timestamp.now(),
    };

    if (recordingNotes) {
      updateData.recordingNotes = recordingNotes;
    }

    await updateDoc(collabRef, updateData);

    // Get guest information
    let guestEmail = '';
    let guestName = '';
    if (collaboration.guestId) {
      const guestQuery = query(collection(db, 'users'), where('uid', '==', collaboration.guestId));
      const guestSnap = await getDocs(guestQuery);
      if (!guestSnap.empty) {
        const guestData = guestSnap.docs[0].data();
        guestEmail = guestData.email || '';
        guestName = guestData.displayName || guestData.email || 'Guest';
      }
    }

    // Get podcast information
    let podcastName = '';
    if (collaboration.podcastId) {
      const podcastDoc = await getDoc(doc(db, 'podcasts', collaboration.podcastId));
      if (podcastDoc.exists()) {
        podcastName = podcastDoc.data().title || 'the podcast';
      }
    }

    // Send notification email to guest
    if (guestEmail) {
      await sendEmail({
        to: guestEmail,
        subject: `Recording Complete - ${podcastName}`,
        text: `Hi ${guestName},

The podcast owner has marked your recording for "${podcastName}" as complete!

${recordingNotes ? `Recording Notes: ${recordingNotes}\n\n` : ''}The episode is now in post-production. You'll receive another notification when the episode is released.

${collaboration.price > 0 && collaboration.buyerId !== userId ? 'Your payment is being held in escrow and will be released when the episode is published.' : ''}

View Collaboration: ${process.env.NEXT_PUBLIC_BASE_URL}/collaboration/${collaborationId}

Thank you for your appearance!

Best regards,
The UvoCollab Team`,
        html: `
          <h2>Recording Complete! 🎙️</h2>
          <p>Hi ${guestName},</p>
          <p>The podcast owner has marked your recording for "<strong>${podcastName}</strong>" as complete!</p>
          ${recordingNotes ? `<p><strong>Recording Notes:</strong><br>${recordingNotes.replace(/\n/g, '<br>')}</p>` : ''}
          <p>The episode is now in post-production. You'll receive another notification when the episode is released.</p>
          ${collaboration.price > 0 && collaboration.buyerId !== userId ? '<p><em>Your payment is being held in escrow and will be released when the episode is published.</em></p>' : ''}
          <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/collaboration/${collaborationId}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Collaboration</a></p>
          <p>Thank you for your appearance!</p>
          <p>Best regards,<br>The UvoCollab Team</p>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Recording marked as complete and guest notified',
    });
  } catch (error: any) {
    console.error('Error marking recording complete:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark recording complete' },
      { status: 500 }
    );
  }
}
