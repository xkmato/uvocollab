import { adminDb as db } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/mailgun';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      collaborationId,
      userId,
      recordingUrl,
      recordingPlatform,
    } = body;

    // Validate required fields
    if (!collaborationId || !userId || !recordingUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(recordingUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
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

    // Verify user is the podcast owner (buyer)
    if (collabData?.buyerId !== userId) {
      return NextResponse.json(
        { error: 'Only the podcast owner can set the recording link' },
        { status: 403 }
      );
    }

    // Verify collaboration type is guest_appearance
    if (collabData?.type !== 'guest_appearance') {
      return NextResponse.json(
        { error: 'Recording links are only for guest appearances' },
        { status: 400 }
      );
    }

    // Auto-detect platform if not provided
    let platform = recordingPlatform;
    if (!platform) {
      const urlLower = recordingUrl.toLowerCase();
      if (urlLower.includes('zoom.us')) {
        platform = 'zoom';
      } else if (urlLower.includes('riverside.fm')) {
        platform = 'riverside';
      } else if (urlLower.includes('streamyard.com')) {
        platform = 'streamyard';
      } else if (urlLower.includes('zencastr.com')) {
        platform = 'zencastr';
      } else {
        platform = 'other';
      }
    }

    // Update collaboration with recording link
    await collabRef.update({
      recordingUrl,
      recordingPlatform: platform,
      updatedAt: new Date(),
    });

    // If recording is scheduled, notify the guest
    if (collabData?.status === 'scheduled' && collabData?.guestId) {
      const guestSnap = await db.collection('users').where('uid', '==', collabData.guestId).get();
      const guestData = guestSnap.empty ? null : guestSnap.docs[0].data();

      if (guestData?.email && collabData?.schedulingDetails) {
        const dateStr = new Date(collabData.schedulingDetails.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const subject = '🎙️ Recording Link Added - UvoCollab';
        const text = `The recording link has been added for your upcoming podcast appearance!

Recording Details:
Date: ${dateStr}
Time: ${collabData.schedulingDetails.time} ${collabData.schedulingDetails.timezone}
Platform: ${platform.charAt(0).toUpperCase() + platform.slice(1)}

Recording Link: ${recordingUrl}

${collabData.prepNotes ? `Prep Notes:\n${collabData.prepNotes}\n\n` : ''}View full collaboration details: ${process.env.NEXT_PUBLIC_BASE_URL}/collaboration/${collaborationId}

Best regards,
The UvoCollab Team`;

        await sendEmail({ to: guestData.email, subject, text });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Recording link updated successfully',
      platform,
    });
  } catch (error) {
    console.error('Error updating recording link:', error);
    return NextResponse.json(
      { error: 'Failed to update recording link' },
      { status: 500 }
    );
  }
}
