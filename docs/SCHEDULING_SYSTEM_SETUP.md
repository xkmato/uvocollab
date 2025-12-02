# Scheduling System Setup

## Overview
Epic 8 implements a comprehensive scheduling system for podcast recordings with guest appearances, including:
- Schedule proposal and acceptance workflow
- Rescheduling with tracking limits
- Recording link management
- Calendar invites (.ics files)
- Automated email reminders (24h and 1h before recording)

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Cron Job Security
CRON_SECRET=your-random-secret-key-here

# Base URL for email links
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # or your production URL
```

## Features Implemented

### 1. Scheduling Data Model
- `app/types/schedule.ts` - Complete type definitions for scheduling
- `app/types/collaboration.ts` - Updated with scheduling fields
- Firestore subcollections:
  - `collaborations/{id}/schedules` - Schedule proposals
  - `collaborations/{id}/reschedules` - Reschedule requests
  - `reminders` - Reminder tracking for cron job

### 2. API Endpoints

#### Schedule Proposals
- `POST /api/collaboration/schedule/propose` - Propose recording times
- `GET /api/collaboration/schedule/propose?collaborationId={id}` - Get all proposals
- `POST /api/collaboration/schedule/respond` - Accept/decline proposed times

#### Rescheduling
- `POST /api/collaboration/schedule/reschedule` - Request reschedule
- `PUT /api/collaboration/schedule/reschedule` - Accept/decline reschedule
- `GET /api/collaboration/schedule/reschedule?collaborationId={id}` - Get reschedule history

#### Recording Links
- `PUT /api/collaboration/recording-link` - Add/update recording platform link

#### Calendar & Reminders
- `POST /api/collaboration/calendar-invite` - Send calendar invites
- `GET /api/cron/send-reminders` - Cron job for automated reminders (runs hourly)

### 3. UI Components

#### SchedulingInterface
- Propose multiple time slots with timezone support
- View and respond to proposals from other party
- Support for common timezones
- Duration selection (30 min to 2 hours)

#### RescheduleInterface
- Request reschedule with mandatory reason
- Track reschedule count (max 2 by default)
- Propose new time slots
- Accept/decline reschedule requests

#### RecordingLinkManager
- Add/update recording platform links (Zoom, Riverside, StreamYard, Zencastr, etc.)
- Auto-detect platform from URL
- Display recording link prominently
- One-click join button
- Email notification when link is added

### 4. Email Notifications

All scheduling actions trigger appropriate email notifications:
- Schedule proposal sent
- Schedule confirmed (both parties)
- Reschedule requested
- Reschedule confirmed
- Recording link added
- 24-hour reminder
- 1-hour reminder
- Calendar invites (.ics attachment support)

### 5. Calendar Integration

- Generate iCalendar (.ics) files for calendar imports
- Automatic reminders embedded in calendar events
- Timezone-aware scheduling
- Support for all major calendar applications

## Usage Flow

### Initial Scheduling
1. After collaboration agreement is reached, status changes to 'scheduling'
2. Either party can propose recording times
3. Proposer selects multiple time slots with timezone
4. Other party receives email notification
5. Other party accepts one slot or declines all
6. On acceptance:
   - Status changes to 'scheduled'
   - Both parties receive confirmation emails
   - Calendar invites are sent
   - Reminders are scheduled

### Rescheduling
1. Either party can request reschedule (up to 2 times)
2. Requester must provide reason
3. Requester proposes new time slots
4. Other party receives notification
5. On acceptance:
   - Schedule is updated
   - Reschedule count increments
   - Confirmation emails sent
   - Calendar invites updated

### Recording Link
1. Podcast owner adds recording platform link
2. Platform auto-detected from URL
3. Guest receives email notification
4. Link displayed prominently in collaboration hub
5. One-click join button available

## Cron Job Setup

### Vercel Deployment
The `vercel.json` file is already configured to run the reminder cron job hourly.

### Manual Trigger (Testing)
```bash
curl -X GET \
  https://your-domain.com/api/cron/send-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Monitoring
The cron endpoint returns:
```json
{
  "success": true,
  "remindersSent": 5,
  "remindersProcessed": 10,
  "oldRemindersDeleted": 3,
  "results": [
    { "type": "24h", "collaborationId": "..." },
    { "type": "1h", "collaborationId": "..." }
  ]
}
```

## Firestore Indexes Required

Add these indexes to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "schedules",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "collaborationId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reschedules",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "collaborationId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reminders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "recordingDate", "order": "ASCENDING" },
        { "fieldPath": "reminder24hSent", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "reminders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "recordingDate", "order": "ASCENDING" },
        { "fieldPath": "reminder1hSent", "order": "ASCENDING" }
      ]
    }
  ]
}
```

## Testing Checklist

- [ ] Propose recording times from guest perspective
- [ ] Propose recording times from podcast owner perspective
- [ ] Accept proposed time slot
- [ ] Decline proposed time slots
- [ ] Verify confirmation emails sent
- [ ] Request reschedule
- [ ] Accept reschedule
- [ ] Verify reschedule count increments
- [ ] Test reschedule limit (max 2)
- [ ] Add recording link (Zoom)
- [ ] Add recording link (Riverside)
- [ ] Update existing recording link
- [ ] Verify recording link email notification
- [ ] Test timezone conversions
- [ ] Test calendar invite generation
- [ ] Test 24-hour reminder (modify recordingDate in Firestore)
- [ ] Test 1-hour reminder
- [ ] Verify cron job cleans up old reminders

## Future Enhancements

- Real-time calendar availability integration (Google Calendar, Outlook)
- Video meeting creation automation (Zoom, Google Meet API)
- SMS reminders option
- Guest pre-call checklist automation
- Post-recording feedback collection
- Episode release tracking with automatic notification
- Analytics on best recording times
- Batch scheduling for multiple episodes

## Support

For issues or questions:
- Check Firestore for schedule/reschedule documents
- Check `reminders` collection for pending notifications
- Verify environment variables are set
- Check Mailgun logs for email delivery
- Monitor Vercel cron job logs
