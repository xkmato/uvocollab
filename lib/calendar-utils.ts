// Utility functions for calendar integration

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  organizerEmail: string;
  attendeeEmails: string[];
}

/**
 * Generate an iCalendar (.ics) file content
 */
export function generateICS(event: CalendarEvent): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const uid = `${Date.now()}@uvocollab.com`;
  const now = formatDate(new Date());
  const startTime = formatDate(event.startTime);
  const endTime = formatDate(event.endTime);

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UvoCollab//Podcast Recording//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${startTime}`,
    `DTEND:${endTime}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    `ORGANIZER:mailto:${event.organizerEmail}`,
  ];

  // Add attendees
  event.attendeeEmails.forEach((email) => {
    ics.push(`ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${email}`);
  });

  ics.push(
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Podcast recording in 24 hours',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Podcast recording in 1 hour',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  );

  return ics.join('\r\n');
}

/**
 * Calculate the time until the recording for reminder scheduling
 */
export function getTimeUntilRecording(recordingDate: Date): {
  hours: number;
  isPast: boolean;
  shouldSend24HourReminder: boolean;
  shouldSend1HourReminder: boolean;
} {
  const now = new Date();
  const diffMs = recordingDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return {
    hours: diffHours,
    isPast: diffHours < 0,
    shouldSend24HourReminder: diffHours <= 24 && diffHours > 23,
    shouldSend1HourReminder: diffHours <= 1 && diffHours > 0,
  };
}

/**
 * Format recording details for email
 */
export function formatRecordingDetails(
  schedulingDetails: any,
  recordingUrl?: string,
  prepNotes?: string
): string {
  const date = new Date(schedulingDetails.date);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let details = `
Recording Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Date: ${dateStr}
⏰ Time: ${schedulingDetails.time} ${schedulingDetails.timezone}
⏱️  Duration: ${schedulingDetails.duration || '60 minutes'}
${recordingUrl ? `🔗 Recording Link: ${recordingUrl}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  if (prepNotes) {
    details += `\n📝 Preparation Notes:\n${prepNotes}\n\n`;
  }

  return details;
}
