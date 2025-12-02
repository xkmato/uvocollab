import { adminDb as db } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      collaborationId,
      proposedBy,
      proposedByRole,
      slots,
      message,
    } = body;

    // Validate required fields
    if (!collaborationId || !proposedBy || !proposedByRole || !slots || slots.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate slots format
    for (const slot of slots) {
      if (!slot.date || !slot.time || !slot.timezone) {
        return NextResponse.json(
          { error: 'Each slot must have date, time, and timezone' },
          { status: 400 }
        );
      }
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

    // Verify user has access (is guest or podcast owner)
    const hasAccess = 
      collabData?.guestId === proposedBy || 
      collabData?.buyerId === proposedBy;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if collaboration is in correct status
    if (collabData?.status !== 'scheduling' && collabData?.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Collaboration must be in scheduling or scheduled status to propose times' },
        { status: 400 }
      );
    }

    // Mark any existing proposals as superseded
    const existingProposalsSnap = await db
      .collection('collaborations')
      .doc(collaborationId)
      .collection('schedules')
      .where('status', '==', 'proposed')
      .get();

    const batch = db.batch();
    existingProposalsSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { status: 'superseded' });
    });

    // Create new schedule proposal
    const scheduleRef = db
      .collection('collaborations')
      .doc(collaborationId)
      .collection('schedules')
      .doc();

    const proposalData = {
      collaborationId,
      proposedBy,
      proposedByRole,
      slots: slots.map((slot: any) => ({
        date: new Date(slot.date),
        time: slot.time,
        timezone: slot.timezone,
        duration: slot.duration || '60 minutes',
      })),
      message: message || '',
      status: 'proposed',
      createdAt: new Date(),
    };

    batch.set(scheduleRef, proposalData);

    // Update collaboration status to scheduling if not already
    if (collabData?.status !== 'scheduling' && collabData?.status !== 'scheduled') {
      batch.update(collabRef, {
        status: 'scheduling',
        updatedAt: new Date(),
      });
    }

    await batch.commit();

    // TODO: Send notification to other party (implement in Epic 11)
    // For now, we'll just return success

    return NextResponse.json({
      success: true,
      proposalId: scheduleRef.id,
      message: 'Schedule proposal created successfully',
    });
  } catch (error) {
    console.error('Error proposing schedule:', error);
    return NextResponse.json(
      { error: 'Failed to propose schedule' },
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

    // Get all schedule proposals for this collaboration
    const schedulesSnap = await db
      .collection('collaborations')
      .doc(collaborationId)
      .collection('schedules')
      .orderBy('createdAt', 'desc')
      .get();

    const schedules = schedulesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}
