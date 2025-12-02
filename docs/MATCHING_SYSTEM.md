# Guest-Podcast Matching System

This document provides an overview of the matching system implementation for Epic 6 of the Guest Feature.

## Overview

The matching system identifies and facilitates connections between guests and podcasts that have mutual interest. It includes:
- **Mutual Interest Matching**: Automatically identifies when both a guest and podcast have added each other to their wishlists
- **Compatibility Scoring**: Calculates how well a guest and podcast align based on multiple factors
- **Notifications**: Sends email notifications to both parties when a match is found
- **Match Management**: Provides UI for viewing, exploring, and dismissing matches
- **Recommendations Engine**: Suggests potential matches based on compatibility factors

## Architecture

### Data Model

#### Match Type (`app/types/match.ts`)
```typescript
interface Match {
  id: string;
  guestId: string;
  podcastId: string;
  guestWishlistId: string;
  podcastWishlistId: string;
  guestOfferAmount: number;
  podcastBudgetAmount: number;
  compatibilityScore: number;
  topicOverlap: string[];
  budgetAlignment: 'perfect' | 'close' | 'negotiable';
  status: MatchStatus;
  matchedAt: Date;
  // ... additional fields
}
```

#### Recommendation Type
```typescript
interface Recommendation {
  id: string;
  targetUserId: string;
  targetUserType: 'guest' | 'podcast';
  recommendedId: string;
  recommendedType: 'guest' | 'podcast';
  compatibilityScore: number;
  reasons: string[];
  similarityFactors: {...};
  // ... additional fields
}
```

### API Endpoints

#### 1. Check Matches (`POST /api/matching/check-matches`)
- **Purpose**: Identifies mutual interest matches and creates match records
- **Auth**: Admin or cron job (via CRON_SECRET)
- **Process**:
  1. Fetches all pending guest wishlists
  2. Fetches all pending podcast guest wishlists (registered guests only)
  3. Identifies mutual interests (guest added podcast AND podcast added guest)
  4. Calculates compatibility scores
  5. Creates match records in Firestore
  6. Updates wishlist statuses to 'matched'
  7. Sends email notifications to both parties

#### 2. Get My Matches (`GET /api/matching/my-matches`)
- **Purpose**: Retrieves matches for the authenticated user
- **Auth**: Required (guest or podcast owner)
- **Returns**: List of active matches for the user
- **Features**:
  - Marks matches as viewed
  - Returns different data based on user type

#### 3. Dismiss Match (`POST /api/matching/dismiss-match`)
- **Purpose**: Allows users to dismiss a match
- **Auth**: Required (must be party in the match)
- **Process**:
  1. Verifies user permission
  2. Updates match status to dismissed
  3. Records who dismissed the match

#### 4. Get Recommendations (`GET /api/matching/recommendations`)
- **Purpose**: Generates personalized recommendations for users
- **Auth**: Required (guest or podcast owner)
- **Algorithm**:
  - **Topic Score (40%)**: Overlap between guest topics and podcast category
  - **Budget Score (30%)**: Alignment between guest rate and podcast budget
  - **Popularity Score (15%)**: Based on verification, previous appearances
  - **Recent Activity Score (15%)**: Platform activity level
- **Returns**: Top 20 recommendations sorted by compatibility score

## Compatibility Scoring

### Algorithm Components

1. **Topic Overlap (40% weight)**
   - Compares guest topics with podcast preferred topics
   - Calculates ratio of matching topics to total unique topics

2. **Budget Alignment (30% weight)**
   - Perfect (30 points): Both free, or guest free + podcast pays
   - Close (25 points): Guest pays + podcast free
   - Negotiable (15 points): Both have budgets that need discussion

3. **Verification Bonus (15% weight)**
   - Adds points if guest is verified

4. **Service Availability (15% weight)**
   - Adds points if podcast has guest services available

### Budget Alignment Categories
- **Perfect**: Both parties' budgets align perfectly
- **Close**: Minor negotiation may be needed
- **Negotiable**: Significant discussion required

## User Interface

### Guest Matches Page (`/guest/matches`)
- Displays all active matches for the guest
- Shows compatibility scores with color coding:
  - Green (80%+): Excellent match
  - Blue (60-79%): Good match
  - Yellow (40-59%): Fair match
  - Gray (<40%): Low match
- Displays shared topics
- Shows budget comparison
- Allows dismissing matches
- Links to podcast details

### Podcast Matches Page (`/dashboard/podcast/matches`)
- Similar to guest matches page
- Shows guest expertise areas
- Displays guest rate information
- Links to guest profiles
- Allows dismissing matches

### Features
- **Empty States**: Helpful messages when no matches exist
- **Loading States**: Shows loading indicators during data fetch
- **Error Handling**: Displays errors gracefully
- **Responsive Design**: Works on mobile and desktop

## Firestore Structure

### Collections

#### `matches`
```
/matches/{matchId}
  - guestId: string
  - podcastId: string
  - compatibilityScore: number
  - status: string
  - topicOverlap: string[]
  - matchedAt: timestamp
  - ... (see Match type)
```

#### Indexes
- `guestId + status + matchedAt`
- `podcastOwnerId + status + matchedAt`
- `guestId + podcastId + status`

### Security Rules
- Users can read their own matches (guest or podcast owner)
- Writes only allowed via API (admin SDK)

## Email Notifications

### Match Notification Email
Sent to both guest and podcast owner when a match is identified:
- **Subject**: New Match notification
- **Content**:
  - Match details
  - Compatibility score
  - Shared topics
  - Link to view match details
  - Call-to-action to start collaboration

## Running the Match Detection

### Manual Trigger (Admin)
```bash
curl -X POST https://your-domain.com/api/matching/check-matches \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Scheduled Cron Job
Set up a cron job to run periodically:
```bash
curl -X POST https://your-domain.com/api/matching/check-matches \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Set `CRON_SECRET` in your environment variables.

## Future Enhancements

### Planned for Epic 7
- **Start Collaboration**: Direct button to initiate collaboration from match
- **In-app Notifications**: Real-time notifications for new matches
- **Match Chat**: Direct messaging between matched parties

### Recommendations UI Integration
- Display recommendations in discovery pages
- Add "Recommended" badges
- One-click actions to add recommendations to wishlist

## Testing

### Test Scenarios
1. **Mutual Interest Match**
   - Guest adds podcast to wishlist
   - Podcast adds same guest to wishlist
   - Run check-matches endpoint
   - Verify match is created and emails sent

2. **Compatibility Scoring**
   - Create matches with various topic overlaps
   - Verify scores are calculated correctly
   - Test budget alignment scenarios

3. **Match Dismissal**
   - Guest dismisses a match
   - Verify status updates correctly
   - Verify match no longer appears in list

4. **Recommendations**
   - Request recommendations as guest
   - Request recommendations as podcast owner
   - Verify results are relevant and scored correctly

## Environment Variables

Required environment variables:
- `CRON_SECRET`: Secret token for cron job authentication
- `NEXT_PUBLIC_APP_URL`: Base URL for email links
- `MAILGUN_API_KEY`: Mailgun API key for sending emails
- `MAILGUN_DOMAIN`: Mailgun domain

## Implementation Checklist

- [x] Create Match and Recommendation types
- [x] Implement check-matches algorithm
- [x] Add compatibility scoring logic
- [x] Implement email notifications
- [x] Create my-matches endpoint
- [x] Create dismiss-match endpoint
- [x] Create recommendations endpoint
- [x] Build guest matches UI
- [x] Build podcast matches UI
- [x] Add Firestore indexes
- [x] Update Firestore security rules
- [x] Update GUESTS_TASKS.md

## Next Steps

1. **Test the matching system**:
   - Create test guests and podcasts
   - Add to wishlists
   - Run check-matches
   - Verify matches and emails

2. **Set up cron job**:
   - Configure periodic execution (e.g., every 6 hours)
   - Monitor for errors

3. **Epic 7 Implementation**:
   - Implement collaboration initiation from matches
   - Add in-app notification system

## Support

For questions or issues with the matching system, refer to:
- GUESTS_TASKS.md for task details
- app/types/match.ts for type definitions
- app/api/matching/* for API implementations
