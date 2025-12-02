import { adminDb as db } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/mailgun';
import { formatRecordingDetails, getTimeUntilRecording } from '@/lib/calendar-utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron job to send recording reminders
 * Should be called every hour by a scheduler (e.g., Vercel Cron, GitHub Actions)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Find reminders that need to be sent
    const remindersSnap = await db
      .collection('reminders')
      .where('recordingDate', '>=', now)
      .where('recordingDate', '<=', twentyFiveHoursFromNow)
      .get();

    let remindersSent = 0;
    const results = [];

    for (const reminderDoc of remindersSnap.docs) {
      const reminder = reminderDoc.data();
      const recordingDate = reminder.recordingDate.toDate();
      
      const timing = getTimeUntilRecording(recordingDate);

      // Skip if already past
      if (timing.isPast) {
        continue;
      }

      // Get collaboration details
      const collabSnap = await db
        .collection('collaborations')
        .doc(reminder.collaborationId)
        .get();

      if (!collabSnap.exists) {
        continue;
      }

      const collabData = collabSnap.data();
      const podcastSnap = await db.collection('podcasts').doc(collabData?.podcastId).get();
      const podcastData = podcastSnap.exists ? podcastSnap.data() : null;

      let updateData: any = {};

      // Send 24-hour reminder
      if (timing.shouldSend24HourReminder && !reminder.reminder24hSent) {
        const subject = '⏰ Reminder: Podcast Recording Tomorrow - UvoCollab';
        const details = formatRecordingDetails(
          collabData?.schedulingDetails,
          collabData?.recordingUrl,
          collabData?.prepNotes
        );

        const text = `This is a reminder that your podcast recording is scheduled for tomorrow!

${details}

Please make sure you:
✅ Test your audio equipment
✅ Review any preparation notes
✅ Have the recording link ready
✅ Be in a quiet location

${collabData?.recordingUrl ? `Recording Link: ${collabData.recordingUrl}\n\n` : ''}View collaboration details: ${process.env.NEXT_PUBLIC_BASE_URL}/collaboration/${reminder.collaborationId}

Best regards,
The UvoCollab Team`;

        await sendEmail({ to: reminder.guestEmail, subject, text });
        await sendEmail({ to: reminder.ownerEmail, subject, text });

        updateData.reminder24hSent = true;
        remindersSent++;
        results.push({ type: '24h', collaborationId: reminder.collaborationId });
      }

      // Send 1-hour reminder
      if (timing.shouldSend1HourReminder && !reminder.reminder1hSent) {
        const subject = '🎙️ Starting Soon: Podcast Recording in 1 Hour - UvoCollab';
        const details = formatRecordingDetails(
          collabData?.schedulingDetails,
          collabData?.recordingUrl,
          collabData?.prepNotes
        );

        const text = `Your podcast recording starts in 1 hour!

${details}

${collabData?.recordingUrl ? `\n🚀 Join Recording: ${collabData.recordingUrl}\n\n` : ''}Last-minute checklist:
✅ Audio equipment working
✅ Quiet environment
✅ Recording link bookmarked
✅ Notes ready

See you soon!

Best regards,
The UvoCollab Team`;

        await sendEmail({ to: reminder.guestEmail, subject, text });
        await sendEmail({ to: reminder.ownerEmail, subject, text });

        updateData.reminder1hSent = true;
        remindersSent++;
        results.push({ type: '1h', collaborationId: reminder.collaborationId });
      }

      // Update reminder document if any reminders were sent
      if (Object.keys(updateData).length > 0) {
        await reminderDoc.ref.update(updateData);
      }
    }

    // Clean up old reminders (older than 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oldRemindersSnap = await db
      .collection('reminders')
      .where('recordingDate', '<', sevenDaysAgo)
      .get();

    const batch = db.batch();
    oldRemindersSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return NextResponse.json({
      success: true,
      remindersSent,
      remindersProcessed: remindersSnap.size,
      oldRemindersDeleted: oldRemindersSnap.size,
      results,
    });
  } catch (error) {
    console.error('Error processing reminders:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}
