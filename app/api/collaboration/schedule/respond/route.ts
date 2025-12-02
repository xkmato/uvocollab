import { adminDb as db } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/mailgun';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      collaborationId,
      proposalId,
      userId,
      action, // 'accept' or 'decline'
      acceptedSlotIndex, // Index of accepted slot (required if action is 'accept')
      declineReason, // Reason for declining (optional)
    } = body;

    // Validate required fields
    if (!collaborationId || !proposalId || !userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action === 'accept' && acceptedSlotIndex === undefined) {
      return NextResponse.json(
        { error: 'Must specify which slot to accept' },
        { status: 400 }
      );
    }

    // Get collaboration to verify access
    const collabRef = db.collection('collaborations').doc(collaborationId);
    const collabSnap = await collabRef.get();

    if (!collabSnap.exists) {
      return NextResponse.json(
        { error: 'Collaboration not found' },
        { status: 404 }
      );
    }

    const collabData = collabSnap.data();

    // Verify user has access and is NOT the proposer
    const hasAccess = 
      collabData?.guestId === userId || 
      collabData?.buyerId === userId;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get the proposal
    const proposalRef = db
      .collection('collaborations')
      .doc(collaborationId)
      .collection('schedules')
      .doc(proposalId);

    const proposalSnap = await proposalRef.get();

    if (!proposalSnap.exists) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    const proposalData = proposalSnap.data();

    // Verify user is not the proposer
    if (proposalData?.proposedBy === userId) {
      return NextResponse.json(
        { error: 'Cannot respond to your own proposal' },
        { status: 400 }
      );
    }

    // Verify proposal is in proposed status
    if (proposalData?.status !== 'proposed') {
      return NextResponse.json(
        { error: 'This proposal has already been responded to' },
        { status: 400 }
      );
    }

    const batch = db.batch();

    if (action === 'accept') {
      // Update proposal status
      batch.update(proposalRef, {
        status: 'accepted',
        acceptedSlotIndex,
        respondedAt: new Date(),
      });

      // Get the accepted slot
      const acceptedSlot = proposalData?.slots[acceptedSlotIndex];

      if (!acceptedSlot) {
        return NextResponse.json(
          { error: 'Invalid slot index' },
          { status: 400 }
        );
      }

      // Update collaboration with confirmed schedule
      batch.update(collabRef, {
        status: 'scheduled',
        schedulingDetails: acceptedSlot,
        updatedAt: new Date(),
      });

      // Mark all other proposals as superseded
      const otherProposalsSnap = await db
        .collection('collaborations')
        .doc(collaborationId)
        .collection('schedules')
        .where('status', '==', 'proposed')
        .get();

      otherProposalsSnap.docs.forEach((doc) => {
        if (doc.id !== proposalId) {
          batch.update(doc.ref, { status: 'superseded' });
        }
      });

      await batch.commit();

      // Get user information for confirmation email
      const guestSnap = await db.collection('users').where('uid', '==', collabData?.guestId).get();
      const ownerSnap = await db.collection('users').where('uid', '==', collabData?.buyerId).get();

      const guestData = guestSnap.empty ? null : guestSnap.docs[0].data();
      const ownerData = ownerSnap.empty ? null : ownerSnap.docs[0].data();

      // Send confirmation emails to both parties
      if (guestData?.email && ownerData?.email) {
        const dateStr = new Date(acceptedSlot.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const subject = '📅 Recording Scheduled - UvoCollab';
        const text = `Great news! Your recording has been scheduled.

Date: ${dateStr}
Time: ${acceptedSlot.time} ${acceptedSlot.timezone}
Duration: ${acceptedSlot.duration || '60 minutes'}

${collabData?.recordingUrl ? `Recording Link: ${collabData.recordingUrl}` : 'Recording link will be shared soon.'}

View collaboration details: ${process.env.NEXT_PUBLIC_BASE_URL}/collaboration/${collaborationId}

You'll receive reminder emails 24 hours and 1 hour before the recording.

Best regards,
The UvoCollab Team`;

        await sendEmail({ to: guestData.email, subject, text });
        await sendEmail({ to: ownerData.email, subject, text });
      }

      return NextResponse.json({
        success: true,
        message: 'Schedule accepted and confirmed',
      });
    } else if (action === 'decline') {
      // Update proposal status
      batch.update(proposalRef, {
        status: 'declined',
        declineReason: declineReason || '',
        respondedAt: new Date(),
      });

      await batch.commit();

      return NextResponse.json({
        success: true,
        message: 'Schedule declined',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "decline"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error responding to schedule:', error);
    return NextResponse.json(
      { error: 'Failed to respond to schedule' },
      { status: 500 }
    );
  }
}
