import { adminDb as db } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/mailgun';
import { generateICS, formatRecordingDetails } from '@/lib/calendar-utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Send calendar invite when recording is scheduled
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { collaborationId } = body;

    if (!collaborationId) {
      return NextResponse.json(
        { error: 'Collaboration ID is required' },
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

    // Verify collaboration is scheduled
    if (collabData?.status !== 'scheduled' || !collabData?.schedulingDetails) {
      return NextResponse.json(
        { error: 'Collaboration must be scheduled with confirmed time' },
        { status: 400 }
      );
    }

    // Get guest and podcast owner information
    const guestSnap = await db.collection('users').where('uid', '==', collabData.guestId).get();
    const ownerSnap = await db.collection('users').where('uid', '==', collabData.buyerId).get();
    const podcastSnap = await db.collection('podcasts').doc(collabData.podcastId).get();

    if (guestSnap.empty || ownerSnap.empty) {
      return NextResponse.json(
        { error: 'Could not find user information' },
        { status: 404 }
      );
    }

    const guestData = guestSnap.docs[0].data();
    const ownerData = ownerSnap.docs[0].data();
    const podcastData = podcastSnap.exists ? podcastSnap.data() : null;

    if (!guestData?.email || !ownerData?.email) {
      return NextResponse.json(
        { error: 'Missing email addresses' },
        { status: 400 }
      );
    }

    // Prepare calendar event
    const schedulingDetails = collabData.schedulingDetails;
    const recordingDate = schedulingDetails.date.toDate();

    // Parse time to get hours and minutes
    const [hours, minutes] = schedulingDetails.time.split(':').map(Number);
    const startTime = new Date(recordingDate);
    startTime.setHours(hours, minutes, 0, 0);

    // Calculate end time based on duration
    const durationMatch = schedulingDetails.duration?.match(/(\d+)/);
    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60;
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const calendarEvent = {
      title: `🎙️ Podcast Recording: ${podcastData?.name || 'Podcast'}`,
      description: `Guest appearance on ${podcastData?.name || 'podcast'}\n\nGuest: ${guestData.displayName || guestData.email}\nHost: ${ownerData.displayName || ownerData.email}\n\n${collabData.recordingUrl ? `Recording Link: ${collabData.recordingUrl}\n\n` : ''}${collabData.prepNotes ? `Prep Notes:\n${collabData.prepNotes}` : ''}`,
      location: collabData.recordingUrl || 'Recording link to be provided',
      startTime,
      endTime,
      organizerEmail: process.env.MAILGUN_FROM_EMAIL || 'noreply@collab.uvotam.com',
      attendeeEmails: [guestData.email, ownerData.email],
    };

    // Generate ICS file
    const icsContent = generateICS(calendarEvent);

    // Send calendar invite emails
    const subject = '📅 Calendar Invite: Podcast Recording - UvoCollab';

    const details = formatRecordingDetails(
      schedulingDetails,
      collabData.recordingUrl,
      collabData.prepNotes
    );

    const text = `Your podcast recording has been scheduled!

${details}

A calendar invite is attached to this email. You can add it to your calendar to receive automatic reminders 24 hours and 1 hour before the recording.

View full collaboration details: ${process.env.NEXT_PUBLIC_BASE_URL}/collaboration/${collaborationId}

Best regards,
The UvoCollab Team`;

    // Send to both parties
    // Note: Mailgun attachment handling would require additional setup
    // For now, we'll include the calendar link in the email
    await sendEmail({
      to: guestData.email,
      subject,
      text,
    });

    await sendEmail({
      to: ownerData.email,
      subject,
      text,
    });

    // Store reminder info in Firestore for cron job processing
    const reminderRef = db.collection('reminders').doc();
    await reminderRef.set({
      collaborationId,
      recordingDate: startTime,
      guestEmail: guestData.email,
      ownerEmail: ownerData.email,
      reminder24hSent: false,
      reminder1hSent: false,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Calendar invites sent successfully',
    });
  } catch (error) {
    console.error('Error sending calendar invite:', error);
    return NextResponse.json(
      { error: 'Failed to send calendar invite' },
      { status: 500 }
    );
  }
}
