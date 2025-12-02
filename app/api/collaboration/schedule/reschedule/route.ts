import { adminDb as db } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/mailgun';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      collaborationId,
      requestedBy,
      requestedByRole,
      reason,
      proposedSlots,
    } = body;

    // Validate required fields
    if (!collaborationId || !requestedBy || !requestedByRole || !reason || !proposedSlots || proposedSlots.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields. Reason is required for rescheduling.' },
        { status: 400 }
      );
    }

    // Get collaboration
    const collabRef = db.collection('collaborations').doc(collaborationId);
    const collabSnap = await collabRef.get();

    if (!collabSnap.exists) {
      return NextResponse.json(
        { error: 'Collaboration not found' },
        { status: 404 }
      );
    }

    const collabData = collabSnap.data();

    // Verify user has access
    const hasAccess = 
      collabData?.guestId === requestedBy || 
      collabData?.buyerId === requestedBy;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if collaboration is scheduled
    if (collabData?.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Can only reschedule a confirmed recording' },
        { status: 400 }
      );
    }

    // Check reschedule limit
    const rescheduleCount = collabData?.rescheduleCount || 0;
    const maxReschedules = collabData?.maxReschedules || 2;

    if (rescheduleCount >= maxReschedules) {
      return NextResponse.json(
        { error: `Maximum number of reschedules (${maxReschedules}) reached` },
        { status: 400 }
      );
    }

    // Create reschedule request
    const rescheduleRef = db
      .collection('collaborations')
      .doc(collaborationId)
      .collection('reschedules')
      .doc();

    const rescheduleData = {
      collaborationId,
      requestedBy,
      requestedByRole,
      reason,
      previousSchedule: collabData?.schedulingDetails,
      proposedSlots: proposedSlots.map((slot: any) => ({
        date: new Date(slot.date),
        time: slot.time,
        timezone: slot.timezone,
        duration: slot.duration || '60 minutes',
      })),
      status: 'pending',
      createdAt: new Date(),
    };

    await rescheduleRef.set(rescheduleData);

    // Get user information for notification
    const requesterSnap = await db.collection('users').where('uid', '==', requestedBy).get();
    const requesterData = requesterSnap.empty ? null : requesterSnap.docs[0].data();

    // Determine who to notify (the other party)
    const notifyUserId = collabData?.guestId === requestedBy ? collabData?.buyerId : collabData?.guestId;
    const notifyUserSnap = await db.collection('users').where('uid', '==', notifyUserId).get();
    const notifyUserData = notifyUserSnap.empty ? null : notifyUserSnap.docs[0].data();

    // Send notification email
    if (notifyUserData?.email && requesterData?.displayName) {
      const subject = '🔄 Reschedule Request - UvoCollab';
      
      const currentSchedule = collabData?.schedulingDetails;
      const currentDateStr = currentSchedule?.date ? new Date(currentSchedule.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }) : 'Unknown';

      const text = `${requesterData.displayName} has requested to reschedule your recording.

Current Schedule:
Date: ${currentDateStr}
Time: ${currentSchedule?.time} ${currentSchedule?.timezone}

Reason for Rescheduling: ${reason}

Proposed New Times:
${proposedSlots.map((slot: any, index: number) => {
  const slotDate = new Date(slot.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `Option ${index + 1}: ${slotDate} at ${slot.time} ${slot.timezone}`;
}).join('\n')}

Please review and respond to this reschedule request:
${process.env.NEXT_PUBLIC_BASE_URL}/collaboration/${collaborationId}

Best regards,
The UvoCollab Team`;

      await sendEmail({ to: notifyUserData.email, subject, text });
    }

    return NextResponse.json({
      success: true,
      rescheduleId: rescheduleRef.id,
      message: 'Reschedule request created successfully',
    });
  } catch (error) {
    console.error('Error requesting reschedule:', error);
    return NextResponse.json(
      { error: 'Failed to request reschedule' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      collaborationId,
      rescheduleId,
      userId,
      action, // 'accept' or 'decline'
      acceptedSlotIndex,
      declineReason,
    } = body;

    // Validate required fields
    if (!collaborationId || !rescheduleId || !userId || !action) {
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

    // Get reschedule request
    const rescheduleRef = db
      .collection('collaborations')
      .doc(collaborationId)
      .collection('reschedules')
      .doc(rescheduleId);

    const rescheduleSnap = await rescheduleRef.get();

    if (!rescheduleSnap.exists) {
      return NextResponse.json(
        { error: 'Reschedule request not found' },
        { status: 404 }
      );
    }

    const rescheduleData = rescheduleSnap.data();

    // Verify user is not the requester
    if (rescheduleData?.requestedBy === userId) {
      return NextResponse.json(
        { error: 'Cannot respond to your own reschedule request' },
        { status: 400 }
      );
    }

    // Verify request is pending
    if (rescheduleData?.status !== 'pending') {
      return NextResponse.json(
        { error: 'This reschedule request has already been responded to' },
        { status: 400 }
      );
    }

    const collabRef = db.collection('collaborations').doc(collaborationId);
    const collabSnap = await collabRef.get();
    const collabData = collabSnap.data();

    if (action === 'accept') {
      // Get the accepted slot
      const acceptedSlot = rescheduleData?.proposedSlots[acceptedSlotIndex];

      if (!acceptedSlot) {
        return NextResponse.json(
          { error: 'Invalid slot index' },
          { status: 400 }
        );
      }

      const batch = db.batch();

      // Update reschedule request
      batch.update(rescheduleRef, {
        status: 'accepted',
        acceptedSlotIndex,
        respondedAt: new Date(),
      });

      // Update collaboration with new schedule and increment reschedule count
      batch.update(collabRef, {
        schedulingDetails: acceptedSlot,
        rescheduleCount: (collabData?.rescheduleCount || 0) + 1,
        updatedAt: new Date(),
      });

      await batch.commit();

      // Send confirmation emails
      const guestSnap = await db.collection('users').where('uid', '==', collabData?.guestId).get();
      const ownerSnap = await db.collection('users').where('uid', '==', collabData?.buyerId).get();

      const guestData = guestSnap.empty ? null : guestSnap.docs[0].data();
      const ownerData = ownerSnap.empty ? null : ownerSnap.docs[0].data();

      if (guestData?.email && ownerData?.email) {
        const dateStr = new Date(acceptedSlot.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const subject = '✅ Recording Rescheduled - UvoCollab';
        const text = `Your recording has been rescheduled.

New Schedule:
Date: ${dateStr}
Time: ${acceptedSlot.time} ${acceptedSlot.timezone}
Duration: ${acceptedSlot.duration || '60 minutes'}

${collabData?.recordingUrl ? `Recording Link: ${collabData.recordingUrl}` : ''}

View collaboration details: ${process.env.NEXT_PUBLIC_BASE_URL}/collaboration/${collaborationId}

Best regards,
The UvoCollab Team`;

        await sendEmail({ to: guestData.email, subject, text });
        await sendEmail({ to: ownerData.email, subject, text });
      }

      return NextResponse.json({
        success: true,
        message: 'Reschedule accepted',
      });
    } else if (action === 'decline') {
      // Update reschedule request
      await rescheduleRef.update({
        status: 'declined',
        declineReason: declineReason || '',
        respondedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: 'Reschedule declined',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error responding to reschedule:', error);
    return NextResponse.json(
      { error: 'Failed to respond to reschedule' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collaborationId = searchParams.get('collaborationId');

    if (!collaborationId) {
      return NextResponse.json(
        { error: 'Collaboration ID is required' },
        { status: 400 }
      );
    }

    // Get all reschedule requests
    const reschedulesSnap = await db
      .collection('collaborations')
      .doc(collaborationId)
      .collection('reschedules')
      .orderBy('createdAt', 'desc')
      .get();

    const reschedules = reschedulesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ reschedules });
  } catch (error) {
    console.error('Error fetching reschedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reschedules' },
      { status: 500 }
    );
  }
}
