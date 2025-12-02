# Epic 8: Scheduling Integration - Setup Instructions

## Overview
This implementation adds comprehensive scheduling functionality for podcast recordings, including:
- Multi-timezone scheduling with proposal/acceptance workflow
- Rescheduling with tracking and limits
- Recording platform link management
- Calendar invites (.ics files)
- Automated reminders (24h and 1h before recording)

## Quick Start

### 1. Environment Variables

Add to your `.env.local` file:

```bash
# Cron Job Security (generate a random secure string)
CRON_SECRET=your-random-secret-key-here

# Base URL (for email links)
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # or https://your-domain.com for production
```

To generate a secure CRON_SECRET:
```bash
openssl rand -base64 32
```

### 2. Deploy Firestore Indexes

The indexes have been added to `firestore.indexes.json`. Deploy them:

```bash
firebase deploy --only firestore:indexes
```

### 3. Deploy the Application

```bash
npm run build
npm run dev  # for local testing
# or
vercel --prod  # for production deployment
```

### 4. Verify Cron Job Setup

The cron job is configured in `vercel.json` to run hourly. After deployment to Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
2. Verify that the `/api/cron/send-reminders` job appears with schedule `0 * * * *`
3. You can trigger it manually for testing

## Features Implemented

### 🗓️ Schedule Proposals
- Either party (guest or podcast owner) can propose recording times
- Support for multiple time slot options
- Timezone-aware (13 common timezones supported)
- Duration selection (30 min to 2 hours)
- Optional message with proposal
- Email notifications sent automatically

### ✅ Schedule Acceptance
- View all proposed time slots
- Accept one time slot or decline all
- Automatic confirmation emails to both parties
- Calendar invites generated
- Collaboration status updated to 'scheduled'

### 🔄 Rescheduling
- Request reschedule with mandatory reason
- Maximum 2 reschedules per collaboration (configurable)
- Propose new time slots
- Email notifications
- Reschedule history tracked

### 🔗 Recording Links
- Add/update recording platform links
- Auto-detect platform (Zoom, Riverside, StreamYard, Zencastr)
- Email notification when link is added
- Prominent display in collaboration hub
- One-click "Join Recording" button

### 📧 Automated Reminders
- 24-hour before recording reminder
- 1-hour before recording reminder
- Includes all recording details
- Includes prep notes if available
- Includes recording link
- Cron job runs hourly to check for due reminders

### 📅 Calendar Integration
- iCalendar (.ics) file generation
- Compatible with Google Calendar, Outlook, Apple Calendar, etc.
- Embedded reminders in calendar events
- Timezone conversion handled automatically

## File Structure

```
app/
├── api/
│   ├── collaboration/
│   │   ├── recording-link/route.ts         # Recording link management
│   │   ├── calendar-invite/route.ts        # Send calendar invites
│   │   └── schedule/
│   │       ├── propose/route.ts            # Propose & get schedules
│   │       ├── respond/route.ts            # Accept/decline schedules
│   │       └── reschedule/route.ts         # Reschedule workflow
│   └── cron/
│       └── send-reminders/route.ts         # Automated reminder cron job
├── components/
│   ├── SchedulingInterface.tsx             # Schedule proposal UI
│   ├── RescheduleInterface.tsx             # Reschedule UI
│   └── RecordingLinkManager.tsx            # Recording link UI
├── types/
│   ├── schedule.ts                         # Scheduling type definitions
│   └── collaboration.ts                    # Updated with scheduling fields
└── collaboration/
    └── [collaborationId]/page.tsx          # Integrated all components

lib/
└── calendar-utils.ts                       # Calendar/reminder utilities

docs/
└── SCHEDULING_SYSTEM_SETUP.md              # Detailed documentation
```

## API Endpoints

### Schedule Management
```bash
# Propose times
POST /api/collaboration/schedule/propose
Body: { collaborationId, proposedBy, proposedByRole, slots, message }

# Get proposals
GET /api/collaboration/schedule/propose?collaborationId={id}

# Accept/decline proposal
POST /api/collaboration/schedule/respond
Body: { collaborationId, proposalId, userId, action, acceptedSlotIndex?, declineReason? }
```

### Rescheduling
```bash
# Request reschedule
POST /api/collaboration/schedule/reschedule
Body: { collaborationId, requestedBy, requestedByRole, reason, proposedSlots }

# Accept/decline reschedule
PUT /api/collaboration/schedule/reschedule
Body: { collaborationId, rescheduleId, userId, action, acceptedSlotIndex?, declineReason? }

# Get reschedule history
GET /api/collaboration/schedule/reschedule?collaborationId={id}
```

### Recording Links
```bash
# Add/update recording link
PUT /api/collaboration/recording-link
Body: { collaborationId, userId, recordingUrl, recordingPlatform? }
```

### Calendar & Reminders
```bash
# Send calendar invite
POST /api/collaboration/calendar-invite
Body: { collaborationId }

# Cron job (protected by CRON_SECRET)
GET /api/cron/send-reminders
Header: Authorization: Bearer {CRON_SECRET}
```

## Testing

### Manual Testing Checklist

1. **Schedule Proposal**
   - [ ] Guest proposes times
   - [ ] Podcast owner proposes times
   - [ ] Multiple time slots work
   - [ ] Timezone selector works
   - [ ] Email sent to other party

2. **Schedule Acceptance**
   - [ ] View pending proposals
   - [ ] Accept one slot
   - [ ] Decline all slots
   - [ ] Confirmation emails received
   - [ ] Status changes to 'scheduled'

3. **Rescheduling**
   - [ ] Request reschedule with reason
   - [ ] Accept reschedule
   - [ ] Decline reschedule
   - [ ] Reschedule count increments
   - [ ] Max reschedule limit enforced

4. **Recording Links**
   - [ ] Add Zoom link (auto-detect)
   - [ ] Add Riverside link (auto-detect)
   - [ ] Update existing link
   - [ ] Email notification sent
   - [ ] Join button works

5. **Reminders (requires date manipulation)**
   - [ ] 24-hour reminder sent
   - [ ] 1-hour reminder sent
   - [ ] Old reminders cleaned up

### Testing Reminders

To test reminders without waiting:

1. Create a scheduled collaboration
2. Manually add a reminder document in Firestore:
   ```javascript
   // In Firestore console
   Collection: reminders
   Document: auto-ID
   Fields:
   - collaborationId: "your-collab-id"
   - recordingDate: (23 hours from now for 24h test, or 30 min from now for 1h test)
   - guestEmail: "guest@example.com"
   - ownerEmail: "owner@example.com"
   - reminder24hSent: false
   - reminder1hSent: false
   - createdAt: (current timestamp)
   ```
3. Trigger cron manually:
   ```bash
   curl -X GET https://your-domain.com/api/cron/send-reminders \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
4. Check email and Firestore for updates

## Troubleshooting

### Cron Job Not Running
- Verify `CRON_SECRET` is set in Vercel environment variables
- Check Vercel Dashboard → Settings → Cron Jobs
- Check Vercel Function Logs for errors

### Emails Not Sending
- Verify Mailgun credentials (MAILGUN_API_KEY, MAILGUN_DOMAIN)
- Check Mailgun logs
- Verify email addresses are valid

### Timezone Issues
- All times stored with timezone information
- Frontend displays timezone alongside time
- Users should select their own timezone when proposing

### Firestore Errors
- Deploy indexes: `firebase deploy --only firestore:indexes`
- Check Firestore console for index creation status
- May take a few minutes for indexes to build

## Production Deployment Checklist

- [ ] Set `CRON_SECRET` in Vercel environment variables
- [ ] Set `NEXT_PUBLIC_BASE_URL` to production domain
- [ ] Deploy Firestore indexes
- [ ] Test cron job manually
- [ ] Monitor first few reminder emails
- [ ] Set up error alerting (Vercel, Sentry, etc.)

## Future Enhancements

- Real-time availability calendar integration
- SMS reminders option
- Video meeting creation automation
- Multiple language support
- Custom reminder timing
- Analytics on scheduling patterns

## Support

For issues or questions:
- Check `docs/SCHEDULING_SYSTEM_SETUP.md` for detailed documentation
- Review Firestore console for data integrity
- Check Vercel function logs
- Monitor Mailgun email logs
