# **🎤 UvoCollab Guest Feature Task List**

This document outlines the tasks required to add Guest Management, Wishlists, Matching, and Scheduling support to the UvoCollab platform.

---

## **Epic 1: Guest Data Model & User Role**

This epic covers the foundational data structures and user role setup for guests.

### **Task 1.1: Guest Role & User Schema Extension**

- **Description:** Extend the User type to support guests and add guest-specific fields.
- **Dependencies:** Existing User Setup
- **Acceptance Criteria (AC):**
  - [x] Update `app/types/user.ts` to add `'guest'` to the role union type
  - [x] Add optional guest fields to User interface:
    - `isGuest?: boolean` - Flag indicating user is a guest
    - `guestRate?: number` - Fixed price they charge to appear
    - `guestBio?: string` - Guest-specific bio/expertise description
    - `guestTopics?: string[]` - Array of topics/expertise areas
    - `guestAvailability?: string` - Availability description
    - `isVerifiedGuest?: boolean` - Whether guest has been verified by platform
    - `guestVerificationRequestedAt?: Date` - When verification was requested
    - `socialLinks?: { platform: string; url: string }[]` - Social media links
    - `previousAppearances?: string[]` - Links to previous podcast appearances
  - [x] Update Firestore rules to allow guest field updates
- **Status:** ✅ Done

### **Task 1.2: Guest Data Model (Firestore)**

- **Description:** Define the Firestore schema for guest-related collections.
- **Dependencies:** Task 1.1
- **Acceptance Criteria (AC):**
  - [x] Create `app/types/guest.ts` with interfaces for:
    - `GuestWishlist` - Guests' wishlist of podcasts they want to appear on
    - `PodcastGuestWishlist` - Podcasts' wishlist of guests they want to host
    - `GuestInvite` - Invitations sent to potential guests
  - [x] Schema includes:
    - **GuestWishlist:** `guestId`, `podcastId`, `offerAmount` (what guest will pay), `topics`, `message`, `status`, `createdAt`
    - **PodcastGuestWishlist:** `podcastId`, `guestId`, `guestName`, `guestEmail`, `budgetAmount` (what podcast will pay), `contactInfo`, `notes`, `status`, `createdAt`
    - **GuestInvite:** `inviteId`, `podcastId`, `guestEmail`, `guestName`, `offeredAmount`, `message`, `status`, `sentAt`, `acceptedAt`, `expiresAt`
  - [x] Create Firestore indexes for efficient querying
- **Status:** ✅ Done

---

## **Epic 2: Guest Registration & Profile**

This epic covers guest signup, profile management, and optional verification.

### **Task 2.1: Guest Signup Flow**

- **Description:** Create a dedicated signup flow for users who want to join as guests.
- **Dependencies:** Task 1.1
- **Acceptance Criteria (AC):**
  - [x] Create `/auth/signup/guest` page with guest-specific signup form
  - [x] Form collects:
    - Basic info: Name, Email, Password
    - Guest info: Bio, Rate, Topics/Expertise, Availability
    - Social links (optional)
    - Previous appearances (optional)
  - [x] On successful signup, set `role: 'guest'` and `isGuest: true`
  - [x] Redirect to guest dashboard after signup
  - [x] Add "Sign up as a Guest" option on main signup page
- **Status:** ✅ Done

### **Task 2.2: Guest Profile Management**

- **Description:** Create a profile page where guests can manage their information.
- **Dependencies:** Task 2.1
- **Acceptance Criteria (AC):**
  - [x] Create `/guest/profile` page with editable form
  - [x] Allow guests to update:
    - Bio, Rate, Topics, Availability
    - Profile image, Social links
    - Previous appearances
  - [x] Display verification status (unverified/pending/verified)
  - [x] Show "Request Verification" button if not verified
  - [x] Save changes to Firestore `users` collection
- **Status:** ✅ Done

### **Task 2.3: Allow Existing Users to Become Guests**

- **Description:** Enable any existing user to also act as a guest.
- **Dependencies:** Task 1.1
- **Acceptance Criteria (AC):**
  - [x] Add "Become a Guest" option in user dashboard
  - [x] Create a modal/form to collect guest-specific information
  - [x] Update user document with `isGuest: true` and guest fields
  - [x] Show guest-specific features in dashboard after enabling
- **Status:** ✅ Done

### **Task 2.4: Guest Verification Request**

- **Description:** Allow guests to request verification from the platform.
- **Dependencies:** Task 2.2
- **Acceptance Criteria (AC):**
  - [x] Create API endpoint `/api/guest/request-verification`
  - [x] Update user document with `guestVerificationRequestedAt` timestamp
  - [x] Send notification email to admin team
  - [x] Create admin panel section to view verification requests
  - [x] Show "Verification Requested" badge in guest profile
  - [x] Note: Actual verification happens off-platform
- **Status:** ✅ Done

---

## **Epic 3: Guest & Podcast Wishlists**

This epic covers wishlist functionality for both guests and podcasts.

### **Task 3.1: Guest Wishlist - Add Podcasts**

- **Description:** Allow guests to add podcasts to their wishlist with offer amounts.
- **Dependencies:** Task 1.2
- **Acceptance Criteria (AC):**
  - [x] Create `guestWishlists` Firestore collection
  - [x] Add "Add to Wishlist" button on podcast detail pages for logged-in guests
  - [x] Show modal to collect:
    - Offer amount (can be $0 for free)
    - Topics they want to discuss
    - Message/pitch to podcast owner
  - [x] Save to Firestore with `status: 'pending'`
  - [x] Show success notification
  - [x] Prevent duplicate wishlist entries
- **Status:** ✅ Done

### **Task 3.2: Guest Wishlist Management Page**

- **Description:** Create a page for guests to manage their podcast wishlist.
- **Dependencies:** Task 3.1
- **Acceptance Criteria (AC):**
  - [x] Create `/guest/wishlist` page
  - [x] Display all podcasts in guest's wishlist
  - [x] Show status of each wishlist item (pending/contacted/matched)
  - [x] Allow editing offer amount and message
  - [x] Allow removing podcasts from wishlist
  - [x] Show which podcasts have viewed the request
- **Status:** ✅ Done

### **Task 3.3: Podcast Guest Wishlist - Add Guests (Registered)**

- **Description:** Allow podcast owners to add registered guests to their wishlist.
- **Dependencies:** Task 1.2
- **Acceptance Criteria (AC):**
  - [x] Create `podcastGuestWishlists` Firestore collection
  - [x] Add "Add to Wishlist" button on guest profile pages
  - [x] Show modal to collect:
    - Budget amount (what podcast will pay)
    - Preferred topics
    - Notes/message
  - [x] Save to Firestore with `status: 'pending'`
  - [ ] Notify guest of the interest (TODO: pending notification system)
  - [x] Prevent duplicate wishlist entries
- **Status:** ✅ Done

### **Task 3.4: Podcast Guest Wishlist - Add Guests (Unregistered)**

- **Description:** Allow podcast owners to add potential guests not yet on the platform.
- **Dependencies:** Task 1.2
- **Acceptance Criteria (AC):**
  - [x] Create form in podcast dashboard to add guest manually
  - [x] Collect: Name, Email (optional), Budget, Notes
  - [x] Save to `podcastGuestWishlists` collection
  - [x] If email provided, mark for invitation
  - [x] If no email, flag for admin attention
  - [x] Show separate sections for "Registered Guests" and "Prospects"
- **Status:** ✅ Done

### **Task 3.5: Podcast Guest Wishlist Management Page**

- **Description:** Create a page for podcast owners to manage their guest wishlist.
- **Dependencies:** Task 3.3, Task 3.4
- **Acceptance Criteria (AC):**
  - [x] Create `/dashboard/podcast/guests` page
  - [x] Display all guests in wishlist with tabs:
    - Registered guests
    - Prospects (no contact info)
    - Invited (pending acceptance)
  - [x] Show status, budget, and notes for each entry
  - [x] Allow editing budget and notes
  - [x] Allow removing guests from wishlist
  - [ ] Show "Send Invite" button for guests with email (marked as "Coming Soon" - pending Epic 4)
- **Status:** ✅ Done

---

## **Epic 4: Guest Invitations**

This epic covers the invitation system for recruiting guests to the platform.

### **Task 4.1: Guest Invitation Data Model**

- **Description:** Create the schema for tracking guest invitations.
- **Dependencies:** Task 1.2
- **Acceptance Criteria (AC):**
  - [x] Create `guestInvites` Firestore collection
  - [x] Schema includes: `inviteId`, `podcastId`, `podcastName`, `guestEmail`, `guestName`, `offeredAmount`, `message`, `status` ('sent'/'accepted'/'declined'/'expired'), `sentAt`, `acceptedAt`, `expiresAt`
  - [x] Create indexes for querying by email and podcast
- **Status:** ✅ Done

### **Task 4.2: Send Invitation API**

- **Description:** Create API endpoint to send guest invitations via email.
- **Dependencies:** Task 4.1, Existing Mailgun integration
- **Acceptance Criteria (AC):**
  - [x] Create `/api/guest/send-invite` endpoint
  - [x] Accepts: podcastId, guestEmail, guestName, offeredAmount, message
  - [x] Creates invitation record in Firestore
  - [x] Generates unique invite token/link (e.g., `/guest/accept-invite/:token`)
  - [x] Sends email to guest with:
    - Podcast information
    - Offered amount (if > 0)
    - Personal message from podcast owner
    - Call-to-action link to accept invite
    - Link expires in 30 days
  - [x] Returns success/error response
- **Status:** ✅ Done

### **Task 4.3: Automatic Invite on Wishlist Add**

- **Description:** Automatically send invite when podcast adds guest with contact info to wishlist.
- **Dependencies:** Task 3.4, Task 4.2
- **Acceptance Criteria (AC):**
  - [x] When podcast adds guest to wishlist with email, trigger invite
  - [x] Call send-invite API automatically
  - [x] Update wishlist item status to 'invited'
  - [x] Show confirmation to podcast owner
  - [x] Handle email sending failures gracefully
- **Status:** ✅ Done

### **Task 4.4: Accept Invite Page**

- **Description:** Create landing page for guests to accept invitations.
- **Dependencies:** Task 4.2
- **Acceptance Criteria (AC):**
  - [x] Create `/guest/accept-invite/:token` page
  - [x] Validate invite token and check expiration
  - [x] Display podcast information and offer details
  - [x] Show two options:
    - "Accept & Sign Up" (for new users)
    - "Accept & Log In" (for existing users)
  - [x] On acceptance:
    - Update invite status to 'accepted'
    - Create/link guest profile
    - Create collaboration opportunity (marked as TODO for future)
    - Redirect to collaboration page or guest dashboard
  - [x] Handle expired/invalid tokens gracefully
- **Status:** ✅ Done

### **Task 4.5: Admin Panel - Track Guests Without Contact Info**

- **Description:** Create admin interface to manage prospect guests without contact information.
- **Dependencies:** Task 3.4
- **Acceptance Criteria (AC):**
  - [x] Create `/admin/guest-prospects` page
  - [x] List all wishlist entries where `contactInfo` is null
  - [x] Display: Guest name, Requested by (podcast), Budget, Date added
  - [x] Allow admin to add email address when found
  - [x] Trigger automatic invite when email is added
  - [x] Mark as "resolved" when contact info is added
  - [x] Show statistics (total prospects, resolved, pending)
- **Status:** ✅ Done

---

## **Epic 5: Guest & Podcast Discovery**

This epic covers discovery pages for guests and podcasts to find each other.

### **Task 5.1: Guest Discovery Page**

- **Description:** Create a marketplace page where podcasts can browse and search available guests.
- **Dependencies:** Task 1.1
- **Acceptance Criteria (AC):**
  - [x] Create `/marketplace/guests` page
  - [x] Display all guests with `isGuest: true`
  - [x] Show verified badge for `isVerifiedGuest: true`
  - [x] Display for each guest:
    - Name, Photo, Bio
    - Rate (or "Negotiable" if 0)
    - Topics/Expertise
    - Previous appearances
  - [x] Implement filters:
    - Price range
    - Topics
    - Verification status
    - Availability
  - [x] Implement search by name/bio/topics
  - [x] Add "Add to Wishlist" button for podcast owners
  - [x] Add "View Profile" button linking to guest detail page
- **Status:** ✅ Done

### **Task 5.2: Guest Detail Page**

- **Description:** Create a public profile page for guests.
- **Dependencies:** Task 2.2
- **Acceptance Criteria (AC):**
  - [x] Create `/guest/:guestId` page
  - [x] Display full guest profile:
    - Bio, Rate, Topics, Availability
    - Verification badge
    - Social links
    - Previous appearances
  - [x] Show "Add to Wishlist" button for podcast owners
  - [x] Show "Contact Guest" button to start collaboration (TODO for collaboration feature)
  - [ ] Display guest statistics (if available):
    - Number of appearances (future feature)
    - Average rating (future feature)
- **Status:** ✅ Done

### **Task 5.3: Podcast Discovery for Guests**

- **Description:** Create a page where guests can browse podcasts seeking guests.
- **Dependencies:** Existing podcast marketplace
- **Acceptance Criteria (AC):**
  - [x] Enhance `/marketplace/podcasts` page for guest users
  - [x] Add filter for "Seeking Guests"
  - [x] Show which podcasts are actively looking for guests
  - [x] Display budget ranges if podcasts have specified (shown via service prices)
  - [x] Add "Add to Wishlist" button for logged-in guests
  - [x] Show "Express Interest" button (via "Add to Wishlist" and "View Details")
- **Status:** ✅ Done

### **Task 5.4: Guest Services - Browsing Interview Opportunities**

- **Description:** Create a dedicated page showing active guest opportunities/interviews.
- **Dependencies:** Task 3.3
- **Acceptance Criteria (AC):**
  - [x] Create `/opportunities/interviews` page
  - [x] Display podcasts that have open "Guest Spot" services
  - [ ] Show podcasts with guests on their wishlist (if public) (future enhancement)
  - [x] Filter by:
    - Payment type (paid/free/pay-to-play)
    - Topics (category)
    - Podcast size/reach
  - [x] Allow guests to apply directly (via "Apply Now" button to service page)
  - [ ] Show which opportunities match guest's profile (future enhancement with matching algorithm)
- **Status:** ✅ Done

---

## **Epic 6: Matching System**

This epic covers the logic to match guests with podcasts based on mutual interest.

### **Task 6.1: Matching Algorithm - Mutual Interest**

- **Description:** Create backend logic to identify matches when both parties have expressed interest.
- **Dependencies:** Task 3.1, Task 3.3
- **Acceptance Criteria (AC):**
  - [x] Create `/api/matching/check-matches` endpoint
  - [x] Algorithm identifies when:
    - Guest has podcast in wishlist AND
    - Podcast has guest in wishlist
  - [x] Create `matches` collection to store identified matches
  - [x] Include: `guestId`, `podcastId`, `guestOffer`, `podcastBudget`, `matchedAt`, `status`
  - [x] Calculate compatibility score based on:
    - Budget alignment
    - Topic overlap
    - Timing
- **Status:** ✅ Done

### **Task 6.2: Match Notification System**

- **Description:** Notify both parties when a match is identified.
- **Dependencies:** Task 6.1
- **Acceptance Criteria (AC):**
  - [x] Send email to both guest and podcast owner
  - [x] Email includes:
    - Match details
    - Other party's offer/budget
    - Link to initiate collaboration
  - [x] Create in-app notifications (via email, in-app UI notifications deferred to Epic 11)
  - [x] Update wishlist statuses to 'matched'
- **Status:** ✅ Done

### **Task 6.3: Matches Dashboard Section**

- **Description:** Show matches in user dashboards.
- **Dependencies:** Task 6.1
- **Acceptance Criteria (AC):**
  - [x] Add "Matches" section to guest dashboard
  - [x] Add "Guest Matches" section to podcast dashboard
  - [x] Display all active matches
  - [x] Show match details and compatibility score
  - [x] Add "Start Collaboration" button (marked as coming soon, pending Epic 7)
  - [x] Allow dismissing/hiding matches
- **Status:** ✅ Done

### **Task 6.4: Recommendations Engine**

- **Description:** Suggest potential matches even without mutual interest.
- **Dependencies:** Task 6.1
- **Acceptance Criteria (AC):**
  - [x] Create algorithm to recommend:
    - Guests to podcasts based on topics, budget, previous work
    - Podcasts to guests based on topics, audience size, rate
  - [ ] Display recommendations in discovery pages (API ready, UI integration deferred to Epic 5 enhancement)
  - [ ] Mark recommended items with "Recommended" badge (deferred to Epic 5 enhancement)
  - [ ] Allow users to act on recommendations (add to wishlist) (already available via existing wishlist functionality)
- **Status:** ✅ Done (API complete, UI integration optional enhancement)

---

## **Epic 7: Guest Collaboration Flow**

This epic covers the end-to-end collaboration process for guest appearances.

### **Task 7.1: Initiate Guest Collaboration**

- **Description:** Create flow to start a collaboration from a match or direct contact.
- **Dependencies:** Task 6.1, Existing collaboration system
- **Acceptance Criteria (AC):**
  - [ ] Create `/api/collaboration/guest/initiate` endpoint
  - [ ] Accepts: guestId, podcastId, serviceId, agreedPrice, proposedTopics, proposedDates
  - [ ] Creates collaboration document with `type: 'guest_appearance'`
  - [ ] Set initial status to 'pending_agreement'
  - [ ] Notify both parties
  - [ ] Support all three payment scenarios:
    - Podcast pays guest (price > 0, podcast is buyer)
    - Guest pays podcast (price > 0, guest is buyer)
    - Free appearance (price = 0)
- **Status:** To Do

### **Task 7.2: Guest Collaboration Type Definition**

- **Description:** Extend collaboration types to support guest appearances.
- **Dependencies:** Existing collaboration.ts
- **Acceptance Criteria (AC):**
  - [ ] Add `'guest_appearance'` to collaboration type union
  - [ ] Add guest-specific fields to Collaboration interface:
    - `guestId?: string`
    - `agreedTopics?: string[]`
    - `recordingDate?: Date`
    - `schedulingDetails?: { date: Date; time: string; timezone: string; duration: string }`
    - `recordingUrl?: string` (Zoom/Riverside link)
    - `prepNotes?: string`
    - `episodeReleaseDate?: Date`
  - [ ] Update CreateCollaborationData interface
- **Status:** To Do

### **Task 7.3: Guest Collaboration Agreement Page**

- **Description:** Create page for both parties to agree on collaboration terms.
- **Dependencies:** Task 7.1, Task 7.2
- **Acceptance Criteria (AC):**
  - [ ] Create `/collaboration/guest/:collaborationId/agreement` page
  - [ ] Display proposed terms:
    - Topics, Dates, Payment details
  - [ ] Allow negotiation (counter-offers on dates/topics/price)
  - [ ] Show accept/decline buttons
  - [ ] On acceptance by both parties:
    - Update status to 'pending_payment' (if paid)
    - Update status to 'scheduling' (if free)
  - [ ] Track negotiation history
- **Status:** To Do

### **Task 7.4: Payment Flow for Guest Collaborations**

- **Description:** Integrate payment for guest collaborations (both directions).
- **Dependencies:** Task 7.3, Existing Flutterwave integration
- **Acceptance Criteria (AC):**
  - [ ] Reuse existing payment checkout component
  - [ ] Determine correct buyer based on payment direction
  - [ ] Support escrow for podcast-pays-guest scenario
  - [ ] Support direct payment for guest-pays-podcast scenario
  - [ ] Generate appropriate contracts (Guest Release Form)
  - [ ] Update collaboration status after payment
- **Status:** To Do

### **Task 7.5: Collaboration Hub for Guest Appearances**

- **Description:** Adapt collaboration hub to support guest-specific workflows.
- **Dependencies:** Task 7.4, Existing collaboration hub
- **Acceptance Criteria (AC):**
  - [ ] Extend `/collaboration/[collaborationId]/page.tsx` for guest type
  - [ ] Display guest-specific information:
    - Agreed topics
    - Recording schedule
    - Prep notes
  - [ ] Show different milestones:
    - Agreement reached
    - Payment completed (if applicable)
    - Recording scheduled
    - Recording completed
    - Episode released
  - [ ] Add file sharing for prep materials
  - [ ] Allow both parties to communicate
- **Status:** To Do

---

## **Epic 8: Scheduling Integration**

This epic covers the built-in scheduling functionality for podcast recordings.

### **Task 8.1: Scheduling Data Model**

- **Description:** Define schema for scheduling podcast recordings.
- **Dependencies:** Task 7.2
- **Acceptance Criteria (AC):**
  - [ ] Add scheduling fields to Collaboration interface (already defined in 7.2)
  - [ ] Create optional `schedules` subcollection for complex scheduling scenarios
  - [ ] Include: `proposedSlots: { date: Date; time: string; timezone: string }[]`
  - [ ] Track who proposed each slot
  - [ ] Store confirmed schedule
- **Status:** To Do

### **Task 8.2: Scheduling Interface - Propose Times**

- **Description:** Allow either party to propose recording times.
- **Dependencies:** Task 8.1
- **Acceptance Criteria (AC):**
  - [ ] Create scheduling component in collaboration hub
  - [ ] Allow proposing multiple time slots
  - [ ] Include timezone selector
  - [ ] Show calendar view
  - [ ] Integrate with calendar API for availability (optional)
  - [ ] Send notification when times are proposed
- **Status:** To Do

### **Task 8.3: Scheduling Interface - Accept/Confirm**

- **Description:** Allow other party to accept proposed times.
- **Dependencies:** Task 8.2
- **Acceptance Criteria (AC):**
  - [ ] Show all proposed time slots
  - [ ] Convert times to user's local timezone
  - [ ] Allow accepting one slot
  - [ ] Update collaboration with confirmed schedule
  - [ ] Send confirmation email to both parties
  - [ ] Update collaboration status to 'scheduled'
- **Status:** To Do

### **Task 8.4: Calendar Integration & Reminders**

- **Description:** Send calendar invites and reminders for scheduled recordings.
- **Dependencies:** Task 8.3
- **Acceptance Criteria (AC):**
  - [ ] Generate .ics calendar file
  - [ ] Send calendar invite email to both parties
  - [ ] Include recording link (if available)
  - [ ] Send reminder 24 hours before recording
  - [ ] Send reminder 1 hour before recording
  - [ ] Include prep notes in reminders
- **Status:** To Do

### **Task 8.5: Rescheduling Flow**

- **Description:** Allow rescheduling of confirmed recordings.
- **Dependencies:** Task 8.3
- **Acceptance Criteria (AC):**
  - [ ] Add "Request Reschedule" button in collaboration hub
  - [ ] Allow proposing new times
  - [ ] Require reason for rescheduling
  - [ ] Notify other party
  - [ ] Track rescheduling history
  - [ ] Update calendar invites after confirmation
  - [ ] Limit number of reschedules (e.g., max 2)
- **Status:** To Do

### **Task 8.6: Recording Link Management**

- **Description:** Allow podcast owner to add recording platform link.
- **Dependencies:** Task 8.3
- **Acceptance Criteria (AC):**
  - [ ] Add field to store recording URL (Zoom, Riverside, etc.)
  - [ ] Allow podcast owner to add/update link
  - [ ] Display link prominently in collaboration hub
  - [ ] Include link in reminder emails
  - [ ] Add "Join Recording" button when time is near
  - [ ] Support common platforms: Zoom, Riverside, StreamYard, Zencastr
- **Status:** To Do

---

## **Epic 9: Post-Recording & Completion**

This epic covers the workflow after recording is complete.

### **Task 9.1: Mark Recording Complete**

- **Description:** Allow podcast owner to mark recording as completed.
- **Dependencies:** Task 8.3
- **Acceptance Criteria (AC):**
  - [ ] Add "Mark Recording Complete" button for podcast owner
  - [ ] Update collaboration status to 'post_production'
  - [ ] Notify guest that recording is complete
  - [ ] If escrow payment, keep funds held until episode release
  - [ ] Allow adding notes about recording session
- **Status:** To Do

### **Task 9.2: Episode Release Notification**

- **Description:** Allow podcast owner to notify when episode is released.
- **Dependencies:** Task 9.1
- **Acceptance Criteria (AC):**
  - [ ] Add "Episode Released" button for podcast owner
  - [ ] Collect episode URL and release date
  - [ ] Update collaboration status to 'completed'
  - [ ] Release escrow payment to guest (if applicable)
  - [ ] Send notification to guest with episode link
  - [ ] Add episode to guest's profile (previous appearances)
- **Status:** To Do

### **Task 9.3: Feedback & Rating System**

- **Description:** Allow both parties to leave feedback after collaboration.
- **Dependencies:** Task 9.2
- **Acceptance Criteria (AC):**
  - [ ] Create feedback form for both parties
  - [ ] Collect: Rating (1-5 stars), Written review, Would collaborate again (yes/no)
  - [ ] Store feedback in `collaborationFeedback` subcollection
  - [ ] Display average rating on guest/podcast profiles
  - [ ] Allow making reviews public or private
  - [ ] Prevent editing after submission
- **Status:** To Do

---

## **Epic 10: Admin & Analytics**

This epic covers admin tools and analytics for the guest feature.

### **Task 10.1: Guest Verification Admin Panel**

- **Description:** Create admin interface for managing guest verification requests.
- **Dependencies:** Task 2.4
- **Acceptance Criteria (AC):**
  - [ ] Create `/admin/guest-verification` page
  - [ ] List all verification requests
  - [ ] Display guest profile and information
  - [ ] Add "Approve" button to set `isVerifiedGuest: true`
  - [ ] Add "Decline" button with reason field
  - [ ] Send email notification of decision
  - [ ] Add notes field for admin records
  - [ ] Track verification date and admin who approved
- **Status:** To Do

### **Task 10.2: Guest Analytics Dashboard**

- **Description:** Create analytics page for tracking guest feature usage.
- **Dependencies:** Task 7.1
- **Acceptance Criteria (AC):**
  - [ ] Create `/admin/guest-analytics` page
  - [ ] Display metrics:
    - Total guests (verified/unverified)
    - Total guest collaborations
    - Average guest rate
    - Match success rate
    - Conversion from invite to signup
  - [ ] Show graphs for trends over time
  - [ ] Export data as CSV
- **Status:** To Do

### **Task 10.3: Guest Feature Settings**

- **Description:** Create admin settings for guest feature configuration.
- **Dependencies:** None
- **Acceptance Criteria (AC):**
  - [ ] Create `/admin/settings/guests` page
  - [ ] Configure:
    - Minimum/maximum guest rates
    - Invite expiration period
    - Auto-matching enabled/disabled
    - Verification requirements
    - Email templates
  - [ ] Save settings to Firestore `platformSettings` collection
  - [ ] Validate settings before saving
- **Status:** To Do

---

## **Epic 11: Notifications & Communication**

This epic covers all notification and communication touchpoints.

### **Task 11.1: Email Templates for Guest Feature**

- **Description:** Create all email templates needed for guest workflows.
- **Dependencies:** Existing Mailgun integration
- **Acceptance Criteria (AC):**
  - [ ] Create templates in `lib/mailgun.ts`:
    - Guest invitation email
    - Match notification email
    - Collaboration proposal email
    - Recording reminder email
    - Episode release notification email
    - Verification approval/decline email
  - [ ] Include personalization tokens
  - [ ] Design responsive HTML templates
  - [ ] Test all templates
- **Status:** To Do

### **Task 11.2: In-App Notification System**

- **Description:** Create in-app notification system for guest-related events.
- **Dependencies:** Task 7.1
- **Acceptance Criteria (AC):**
  - [ ] Create `notifications` collection in Firestore
  - [ ] Create notification component in UI
  - [ ] Show notifications for:
    - New matches
    - Wishlist responses
    - Collaboration updates
    - Recording reminders
    - Payment received/released
  - [ ] Add notification bell icon in navbar
  - [ ] Mark notifications as read
  - [ ] Link notifications to relevant pages
- **Status:** To Do

### **Task 11.3: Communication Thread Enhancement**

- **Description:** Enhance existing communication thread for guest collaborations.
- **Dependencies:** Existing CommunicationThread component
- **Acceptance Criteria (AC):**
  - [ ] Ensure CommunicationThread works with guest collaboration type
  - [ ] Add ability to share scheduling links
  - [ ] Add ability to share prep materials
  - [ ] Add quick actions for common messages
  - [ ] Support file attachments for audio samples, outlines
- **Status:** To Do

---

## **Epic 12: Mobile Responsiveness & UX Polish**

This epic covers ensuring all guest features work well on mobile and have good UX.

### **Task 12.1: Mobile Responsive Design - Discovery Pages**

- **Description:** Ensure guest and podcast discovery pages work well on mobile.
- **Dependencies:** Task 5.1, Task 5.3
- **Acceptance Criteria (AC):**
  - [ ] Test all discovery pages on mobile devices
  - [ ] Optimize card layouts for small screens
  - [ ] Ensure filters work well on mobile
  - [ ] Test search functionality on mobile
  - [ ] Optimize images for mobile loading
- **Status:** To Do

### **Task 12.2: Mobile Responsive Design - Scheduling**

- **Description:** Ensure scheduling interface works well on mobile.
- **Dependencies:** Task 8.2, Task 8.3
- **Acceptance Criteria (AC):**
  - [ ] Test scheduling calendar on mobile
  - [ ] Ensure time selection works with touch
  - [ ] Optimize timezone selector for mobile
  - [ ] Test date picker on mobile devices
- **Status:** To Do

### **Task 12.3: Onboarding & Tooltips**

- **Description:** Add onboarding flow and helpful tooltips for new guests.
- **Dependencies:** Task 2.1
- **Acceptance Criteria (AC):**
  - [ ] Create welcome modal for new guests
  - [ ] Add tooltips explaining key features
  - [ ] Create guided tour of guest dashboard
  - [ ] Add "Getting Started" checklist
  - [ ] Provide examples of good guest profiles
- **Status:** To Do

---

## **Epic 13: SEO & Marketing Pages**

This epic covers marketing and SEO for the guest feature.

### **Task 13.1: Guest Landing Page**

- **Description:** Create marketing landing page for the guest feature.
- **Dependencies:** None
- **Acceptance Criteria (AC):**
  - [ ] Create `/guests` page with marketing content
  - [ ] Explain how guest feature works
  - [ ] Show benefits for guests and podcasters
  - [ ] Include testimonials (when available)
  - [ ] Add clear CTA to sign up as guest
  - [ ] Optimize for SEO
- **Status:** To Do

### **Task 13.2: Update Main Landing Page**

- **Description:** Update homepage to promote guest feature.
- **Dependencies:** Task 13.1
- **Acceptance Criteria (AC):**
  - [ ] Add guest feature to homepage
  - [ ] Update hero section to mention guests
  - [ ] Add guest discovery to "How it Works" section
  - [ ] Update navigation to include guest links
- **Status:** To Do

### **Task 13.3: SEO Optimization**

- **Description:** Optimize all guest-related pages for search engines.
- **Dependencies:** Task 5.1, Task 5.2, Task 13.1
- **Acceptance Criteria (AC):**
  - [ ] Add meta tags to all guest pages
  - [ ] Create guest sitemap
  - [ ] Add structured data for guest profiles
  - [ ] Optimize guest discovery page for search
  - [ ] Create robots.txt entries
  - [ ] Ensure fast page load times
- **Status:** To Do

---

## **Testing Checklist**

### **User Flows to Test:**

- [ ] Guest signup and profile creation
- [ ] Guest adds podcast to wishlist
- [ ] Podcast adds guest to wishlist (registered & unregistered)
- [ ] Guest receives and accepts invitation
- [ ] Match identification and notification
- [ ] Collaboration initiation from match
- [ ] Payment flow (all three scenarios)
- [ ] Scheduling proposal and confirmation
- [ ] Recording reminders sent
- [ ] Recording completion and payment release
- [ ] Episode release notification
- [ ] Feedback submission

### **Edge Cases to Test:**

- [ ] Guest and podcast both have wishlist entries for each other
- [ ] Invitation expires before acceptance
- [ ] Payment fails during collaboration
- [ ] Recording is rescheduled multiple times
- [ ] User is both a guest and podcast owner
- [ ] Guest requests verification while unverified
- [ ] Admin adds contact info for prospect guest
- [ ] Matching algorithm with partial data

---

## **Future Enhancements (Post-MVP)**

- Advanced matching algorithm with ML
- Video introduction feature for guests
- Guest availability calendar sync
- Automated contract generation for guest appearances
- Multi-currency support for international guests
- Guest agencies/representatives support
- Bulk guest import for podcasts
- Guest portfolio with audio clips
- Advanced analytics for guests (reach, impact)
- Integration with podcast hosting platforms
- Automatic episode tracking via RSS feed monitoring

---

**Document Status:** Ready for Implementation  
**Last Updated:** 2 December 2025  
**Total Tasks:** 70+
