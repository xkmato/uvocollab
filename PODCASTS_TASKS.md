# **🎙️ UvoCollab Podcast Expansion Task List**

This document outlines the tasks required to add Podcast Matching and Collaboration support to the UvoCollab platform.

### **Epic 1: Podcast Data Model & Onboarding**

This epic covers the data structure and the flow for users to list their podcasts on the platform.

- **Task 1.1: Podcast Data Model (Firestore)**

  - **Description:** Define the Firestore schema for a `podcasts` collection. Unlike "Legends" which are Users, a Podcast is an entity owned by a User.
  - **Dependencies:** Existing User Setup.
  - **Acceptance Criteria (AC):**
    - [x] A `podcasts` collection is created.
    - [x] Schema includes: `ownerId` (ref to users), `title`, `description`, `coverImageUrl`, `categories` (e.g., Tech, Music, Business), `avgListeners` (optional), `rssFeedUrl`, `websiteUrl`, `status` ('pending', 'approved', 'rejected').
    - [x] Indexes created for querying by category and status.
  - **Status:** Done

- **Task 1.2: "List Your Podcast" Page & Form**

  - **Description:** Create a page where authenticated users can register their podcast.
  - **Dependencies:** Task 1.1
  - **Acceptance Criteria (AC):**
    - [x] A protected route `/podcasts/register` is created.
    - [x] Form collects: Podcast Title, Description, RSS Feed, Category, Audience Size, Cover Image.
    - [x] Validation ensures required fields are present.
  - **Status:** Done

- **Task 1.3: Backend: submitPodcastListing Function**

  - **Description:** A server action/function to save the podcast data.
  - **Dependencies:** Task 1.2
  - **Acceptance Criteria (AC):**
    - [x] Creates a document in `podcasts` collection with `status: 'pending'`.
    - [x] Updates the user's document to indicate they are a "Podcaster" (adds `hasPodcast: true` on users doc).
    - [x] Sends a notification to Admins for vetting (sends email to `support@uvocollab.com` by default).
  - **Status:** To Do
  - **Status:** Done

- **Task 1.4: Admin Vetting for Podcasts**
  - **Description:** Update the Admin Dashboard to handle Podcast approvals.
  - **Dependencies:** Task 1.3
  - **Acceptance Criteria (AC):**
    - [x] Admin Dashboard lists pending podcast applications.
    - [x] Admin can "Approve" (sets status to `approved`) or "Decline" (sets status to `rejected`).
    - [x] Approval triggers an email to the user.
  - **Status:** Done

### **Epic 2: Podcast Services & Management**

Once a podcast is approved, the owner needs to define how others can collaborate with them.

- **Task 2.1: Podcast Services Schema**

  - **Description:** Define schema for services offered by a podcast (e.g., "Guest Spot", "Ad Read", "Cross-Promotion").
  - **Dependencies:** Task 1.1
  - **Acceptance Criteria (AC):**
    - [ ] A `services` subcollection under the `podcasts` document (or reuse existing structure linked to podcast).
    - [ ] Fields: `title`, `description`, `price` (can be 0 for cross-promo), `duration`, `type`.
  - **Status:** To Do

- **Task 2.2: Podcast Dashboard**
  - **Description:** A dashboard for Podcasters to manage their listing and services.
  - **Dependencies:** Task 1.4, Task 2.1
  - **Acceptance Criteria (AC):**
    - [ ] Route `/dashboard/podcast` created.
    - [ ] User can edit Podcast details.
    - [ ] User can Add/Edit/Delete services (e.g., "Interview Slot - $50", "Shoutout - Free").
  - **Status:** To Do

### **Epic 3: Podcast Marketplace & Discovery**

Allow users to find podcasts to collaborate with.

- **Task 3.1: Podcast Marketplace Page**

  - **Description:** A public/protected page listing available podcasts.
  - **Dependencies:** Task 1.4
  - **Acceptance Criteria (AC):**
    - [ ] Route `/marketplace/podcasts` created.
    - [ ] Displays grid of approved podcasts (Cover Art, Title, Category).
    - [ ] Search bar for keywords.
  - **Status:** To Do

- **Task 3.2: Filtering & Sorting**

  - **Description:** Advanced filtering for the marketplace.
  - **Dependencies:** Task 3.1
  - **Acceptance Criteria (AC):**
    - [ ] Filter by Category/Genre.
    - [ ] Filter by Audience Size.
    - [ ] Filter by Price Range (Free vs Paid).
  - **Status:** To Do

- **Task 3.3: Podcast Detail Page**
  - **Description:** Detailed view of a specific podcast.
  - **Dependencies:** Task 3.1
  - **Acceptance Criteria (AC):**
    - [ ] Route `/podcasts/[podcastId]` created.
    - [ ] Displays full info, episodes (optional parsing of RSS), and list of available Services.
    - [ ] "Request Collab" button for each service.
  - **Status:** To Do

### **Epic 4: Podcast Collaboration Flow**

The transaction loop for podcasting.

- **Task 4.1: Podcast Pitch Form**

  - **Description:** Form for users to pitch themselves to a podcast.
  - **Dependencies:** Task 3.3
  - **Acceptance Criteria (AC):**
    - [ ] When clicking "Request Collab", show form.
    - [ ] Fields: "Topic Proposal", "Guest Bio", "Previous Media/Links", "Proposed Date(s)".
    - [ ] Uploads: Press Kit or Audio Sample.
  - **Status:** To Do

- **Task 4.2: Backend: submitPodcastPitch**

  - **Description:** Creates a collaboration record.
  - **Dependencies:** Task 4.1
  - **Acceptance Criteria (AC):**
    - [ ] Creates doc in `collaborations` collection.
    - [ ] Distinguish from Legend collabs (add `type: 'podcast'` field).
    - [ ] Status: `pending_review`.
  - **Status:** To Do

- **Task 4.3: Podcast Owner Review**
  - **Description:** Allow Podcasters to accept/decline pitches.
  - **Dependencies:** Task 4.2
  - **Acceptance Criteria (AC):**
    - [ ] Podcast Dashboard shows incoming pitches.
    - [ ] Accept/Decline logic (reuse existing logic if possible).
  - **Status:** To Do

### **Epic 5: Execution & Delivery**

- **Task 5.1: Adaptation of Collaboration Hub**

  - **Description:** Ensure the Collab Hub works for Podcasts.
  - **Dependencies:** Task 4.3
  - **Acceptance Criteria (AC):**
    - [ ] Hub displays Podcast-specific milestones (e.g., "Recording Scheduled", "Episode Published").
    - [ ] File sharing for assets (Headshots, Bios, Audio Files).
  - **Status:** To Do

- **Task 5.2: Payment & Contract (If Paid)**
  - **Description:** Handle payments for paid slots.
  - **Dependencies:** Task 5.1
  - **Acceptance Criteria (AC):**
    - [ ] Reuse Flutterwave integration for paid services.
    - [ ] Generate appropriate contract (Guest Release Form instead of Work For Hire).
  - **Status:** To Do
