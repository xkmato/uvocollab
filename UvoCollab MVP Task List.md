# **🚀 UvoCollab MVP Task List**

### **Epic 1: Core Setup & Authentication**

This epic covers the foundational setup of the Next.js application, Firebase project, and the core user authentication system.

- **Task 1.1: Project Setup (Firebase & Next.js)**
  - **Description:** Initialize the Firebase project (enabling Auth, Firestore, Storage, and Functions). Set up the Next.js application and integrate the Firebase SDK.
  - **Dependencies:** None.
  - **Acceptance Criteria (AC):**
    - \[ \] Firebase project is created.
    - \[ \] Firestore, Firebase Auth, Firebase Storage, and Backends are enabled.
    - \[ \] A new Next.js project is created.
    - \[ \] The Next.js app can successfully connect to the Firebase project.
  - **Status:** To Do
- **Task 1.2: User Data Model (Firestore)**

  - **Description:** Define and create the Firestore schema for the users collection. This will store public-facing data and internal roles.
  - **Dependencies:** Task 1.1
  - **Acceptance Criteria (AC):**

    - \[x\] A users collection is created.
    - \[x\] The user document schema includes fields for uid, email, displayName, role (e.g., 'new_artist', 'legend_applicant', 'legend', 'admin'), profileImageUrl, bio, and managementInfo1.

  - **Status:** Completed

- **Task 1.3: Authentication Flow (Firebase Auth & Next.js)**

  - **Description:** Implement the sign-up and login pages. New users should, by default, be assigned the new_artist (Buyer) role. The "Apply as a Legend" path is a separate flow (see Epic 2).

  - **Dependencies:** Task 1.2
  - **Acceptance Criteria (AC):**
    - \[x\] Users can create an account with email and password.
    - \[x\] Users can log in and log out.
    - \[x\] Upon creation, a corresponding user document is created in Firestore with role: 'new_artist'.
    - \[x\] Implement basic protected routes in Next.js (e.g., for a user dashboard).
  - **Status:** Completed

### **Epic 2: "Legend" (Seller) Onboarding & Vetting**

This epic is the platform's core curation mechanism. It covers the _application_ process for "Legends," which is separate from the standard user sign-up.

- **Task 2.1: "Apply as a Legend" Page & Form**

  - **Description:** Create a static page explaining the value proposition for Legends3. This page will host the application form, which is not a sign-up but a data collection form4444.

  - **Dependencies:** Task 1.1
  - **Acceptance Criteria (AC):**

    - \[x\] A public page /apply is created.
    - \[x\] The form includes all fields necessary for vetting:

      - \[x\] Primary Contact Info5.

      - \[x\] Management/Agency Info (name, email)666.

      - \[x\] Proof of Status (links to Spotify, social media, press)7777.

      - \[x\] Optional: Referral from an existing member8888.

  - **Status:** Completed

- **Task 2.2: Backend: submitLegendApplication Function**
  - **Description:** Create a Nextjs severside that saves the application data. If the applicant is not yet a user, it should create an auth account for them and a users doc with the role: 'legend_applicant'. If they are, it updates their role.
  - **Dependencies:** Task 2.1, Task 1.2
  - **Acceptance Criteria (AC):**
    - \[x\] A new document is created in an legend_applications collection with status: 'pending'.
    - \[x\] The applicant's users doc is created/updated with role: 'legend_applicant'.
    - \[x\] The function returns a success message to the user.
  - **Status:** Completed
- **Task 2.3: Admin Vetting Dashboard (Internal Tool)**

  - **Description:** Create a new page/section in the Next.js app, protected for users with the admin role. This page will list all documents from the legend_applications collection9.

  - **Dependencies:** Task 2.2
  - **Acceptance Criteria (AC):**
    - \[x\] The page /admin/vetting is only accessible to admin users.
    - \[x\] The dashboard lists all pending applications, showing key data (Artist Name, Management, Links).
    - \[x\] Each application has an "Approve" and "Decline" button.
  - **Status:** Completed

- **Task 2.4: Backend: reviewLegendApplication Function**

  - **Description:** Create a Backend callable only by admins. This function takes an applicationId and an action ('approve' or 'decline').
  - **Dependencies:** Task 2.3
  - **Acceptance Criteria (AC):**

    - \[x\] Clicking "Approve" updates the legend_applications doc to status: 'approved'.
    - \[x\] "Approve" triggers setting a custom claim on the user's Firebase Auth account: { role: 'legend' }.
    - \[x\] "Approve" updates the user's Firestore users doc to role: 'legend'10.

    - \[x\] Clicking "Decline" updates the application doc to status: 'declined'.
    - \[x\] An automated email is sent to the applicant (or their manager 11) informing them of the decision.

  - **Status:** Completed

### **Epic 3: "Legend" (Seller) Profile & Service Management**

Once approved, "Legends" need to set up their "storefront"12.

- **Task 3.1: "Legend" Profile & Service Data Model (Firestore)**

  - **Description:** Define the Firestore schema for a services subcollection under each legend user's document.
  - **Dependencies:** Task 1.2
  - **Acceptance Criteria (AC):**

    - \[x\] A services subcollection is added to the users schema.
    - \[x\] The services document schema includes title (e.g., "16-bar verse") 13, description 141414, price 151515, and deliverable (e.g., "1 WAV file")16.

  - **Status:** Completed

- **Task 3.2: "Legend" Dashboard: Profile & Service Editor**

  - **Description:** Create a protected route for logged-in legend users. This dashboard will allow them to edit their public profile (bio, photos, links) 17and create, update, or delete their services18.

  - **Dependencies:** Task 2.4, Task 3.1
  - **Acceptance Criteria (AC):**
    - \[x\] Page is only accessible to users with the legend role.
    - \[x\] Legends can update their public profile information.
    - \[x\] Legends can add a new service, filling in the fields from Task 3.1.
    - \[x\] Legends can edit or delete existing services.
    - \[x\] Legends cannot set a price of $0.
  - **Status:** Completed

- **Task 3.3: "Legend" Public Profile Page (Storefront)**

  - **Description:** Create the public-facing "storefront" page for each Legend. This page will display their bio, credits, a "Verified Legend" badge 19, and their list of services (from Task 3.2)20.

  - **Dependencies:** Task 3.2
  - **Acceptance Criteria (AC):**

    - \[x\] A dynamic route /legend/\[legendId\] displays the Legend's public info.
    - \[x\] The page prominently features the "Verified Legend" badge21.

    - \[x\] The page lists all services created by the Legend, with their prices and descriptions.
    - \[x\] Each service has a "Request Collaboration" button.

  - **Status:** Completed

### **Epic 4: "New Artist" (Buyer) Marketplace & Discovery**

This epic covers the "Buyer" 22 experience of finding and exploring Legends.

- **Task 4.1: Marketplace Browse Page**

  - **Description:** Create the main marketplace page where "New Artists" can browse all approved "Legends"23232323.

  - **Dependencies:** Task 3.3
  - **Acceptance Criteria (AC):**
    - \[x\] A page /marketplace queries and displays all users with role: 'legend'.
    - \[x\] Each Legend is shown as a card with their photo, name, and specialty.
    - \[x\] Clicking a card navigates to their public profile page (Task 3.3).
  - **Status:** Completed

- **Task 4.2: Marketplace Filtering**

  - **Description:** Implement filtering logic on the marketplace page.
  - **Dependencies:** Task 4.1
  - **Acceptance Criteria (AC):**

    - \[x\] Users can filter the list of Legends by genre, price range, and service type24242424. (Note: This requires adding genre and price_range fields to the Legend's user doc).

  - **Status:** Completed

### **Epic 5: Collaboration Flow: Pitch, Acceptance & Payment**

This is the core transaction loop, from the initial "pitch" to the secure payment.

- **Task 5.1: Collaboration Data Model (Firestore)**
  - **Description:** Define the schema for the root collaborations collection. This doc will track the entire lifecycle of a project.
  - **Dependencies:** Task 1.2, Task 3.1
  - **Acceptance Criteria (AC):**
    - \[x\] A collaborations collection is created.
    - \[x\] The doc schema includes buyerId, legendId, serviceId, price, status (e.g., 'pending_review', 'pending_payment', 'in_progress', 'completed'), pitchDemoUrl, pitchMessage, and contractUrl.
  - **Status:** Completed
- **Task 5.2: "New Artist" (Buyer) \- "Pitch" Form**

  - **Description:** When a "New Artist" clicks "Request Collaboration" (from Task 3.3), they are shown a form to submit their "pitch"25252525. This form is critical for the Legend's brand protection26.

  - **Dependencies:** Task 3.3, Task 5.1
  - **Acceptance Criteria (AC):**

    - \[x\] The form must require the Buyer to:

      - \[x\] Upload their demo track (to Firebase Storage)27272727.

      - \[x\] Provide a link to their best previous work28.

      - \[x\] Write a short message about the creative concept29.

    - \[x\] Submitting the form is disabled until all required fields are complete.

  - **Status:** Completed

- **Task 5.3: Backend: submitPitch Function**

  - **Description:** A backend that creates the collaborations document in Firestore with the data from the pitch form.
  - **Dependencies:** Task 5.2
  - **Acceptance Criteria (AC):**

    - \[ \] A new document is created in the collaborations collection.
    - \[ \] The document's status is set to pending_review.
    - \[ \] A notification (e.g., email) is sent to the "Legend" (or their manager 30) about the new request.

  - **Status:** To Do

- **Task 5.4: "Legend" Dashboard: Review Requests**

  - **Description:** Add a section to the "Legend" Dashboard (from Task 3.2) to list all incoming collaboration requests (collabs with status: 'pending_review')31.

  - **Dependencies:** Task 5.3
  - **Acceptance Criteria (AC):**

    - \[ \] The Legend can see a list of all pending pitches.
    - \[ \] The Legend can listen to the demo track and read the message within the dashboard3232.

    - \[ \] The Legend has "Accept" and "Decline" buttons for each pitch33333333.

  - **Status:** To Do

- **Task 5.5: Backend: respondToPitch Function**

  - **Description:** A Backend triggered by the Legend's "Accept" / "Decline" action.
  - **Dependencies:** Task 5.4
  - **Acceptance Criteria (AC):**

    - \[ \] If "Declined," the collaborations doc status is set to declined, and a polite rejection email is sent to the Buyer34.

    - \[ \] If "Accepted," the collaborations doc status is set to pending_payment.
    - \[ \] If "Accepted," an email is sent to the "New Artist" notifying them of the acceptance and prompting them to pay35353535.

  - **Status:** To Do

### **Epic 6: Financials & Legal**

This epic covers the critical payment (escrow) and contract generation that happens _after_ a pitch is accepted.

- **Task 6.1: Stripe Connect Integration (Seller Onboarding)**

  - **Description:** Integrate Stripe Connect. As part of the "Legend" profile setup (Task 3.2), Legends _must_ complete the Stripe Connect onboarding flow to connect their bank account for payouts36.

  - **Dependencies:** Task 3.2
  - **Acceptance Criteria (AC):**
    - \[ \] A "Connect Bank Account" button in the Legend dashboard starts the Stripe Connect flow.
    - \[ \] The platform correctly saves the Legend's Stripe Account ID to their user doc.
    - \[ \] A Legend's services cannot be "published" (visible in the marketplace) until their Stripe account is connected.
  - **Status:** To Do

- **Task 6.2: "New Artist" (Buyer) \- Payment Flow**

  - **Description:** When a collaboration doc has status: 'pending_payment', the "New Artist" is shown a "Pay Now" button. This leads to a checkout page.
  - **Dependencies:** Task 5.5, Task 6.1
  - **Acceptance Criteria (AC):**

    - \[ \] The checkout page uses Stripe Elements to collect payment info.
    - \[ \] The amount shown is the full, pre-funded service price37.

    - \[ \] Payment submission triggers a Backend.

  - **Status:** To Do

- **Task 6.3: Backend: processPayment Function (Escrow)**

  - **Description:** A Backend that creates a Stripe PaymentIntent. The function must be configured to hold the funds in the platform's Stripe account (acting as escrow) 38383838383838 and _not_ pay out to the Legend immediately.

  - **Dependencies:** Task 6.2
  - **Acceptance Criteria (AC):**

    - \[ \] The function creates a PaymentIntent for the correct amount.
    - \[ \] The payment is "captured" but held (using "Delayed Manual Payouts" 39 or similar Stripe Connect mechanism).

    - \[ \] Upon successful payment, the collaborations doc status is updated to awaiting_contract.

  - **Status:** To Do

- **Task 6.4: Backend: Dynamic Contract Generation**

  - **Description:** Create a Backend (or use an extension like PandaDoc 40or Dropbox Sign 4141) that triggers _after_ payment is successful (status awaiting_contract). This function generates a legal contract.

  - **Dependencies:** Task 6.3
  - **Acceptance Criteria (AC):**

    - \[ \] The function must use a "Work for Hire" (WFH) template as the MVP default42424242.

    - \[ \] It dynamically populates fields: \[Buyer Name\], \[Legend Name\], \[Service Description\], \[Price\] 43.

    - \[ \] The contract must include key clauses: WFH Master Ownership (Buyer owns master) 44, Publisher Share (Legend retains writer's share) 45, and Credit46.

    - \[ \] The contract is sent to both parties for e-signature47474747.

  - **Status:** To Do

- **Task 6.5: Backend: handleContractSigned Webhook**

  - **Description:** A Backend (HTTP webhook) to listen for the "contract signed" event from the e-signature service.
  - **Dependencies:** Task 6.4
  - **Acceptance Criteria (AC):**

    - \[ \] The webhook waits until _both_ parties have signed.
    - \[ \] Once all signatures are collected, it saves the final PDF to Firebase Storage48.

    - \[ \] It updates the collaborations doc contractUrl with the path to the PDF.
    - \[ \] It updates the collaborations doc status to in_progress.
    - \[ \] This triggers the creation of the "Collaboration Hub" (Epic 7).

  - **Status:** To Do

### **Epic 7: Collaboration Hub (Minor Project Management)**

This is the private space where the work happens49494949.

- **Task 7.1: Private "Collaboration Hub" Page**

  - **Description:** Create a dynamic, protected route /\[collaborationId\] that is only accessible to the Buyer and Legend associated with that collaboration doc50.

  - **Dependencies:** Task 6.5
  - **Acceptance Criteria (AC):**
    - \[ \] The page is created when the collaborations doc status becomes in_progress.
    - \[ \] Users not associated with the project are redirected.
    - \[ \] The page displays the project's details (service, deadline, etc.).
  - **Status:** To Do

- **Task 7.2: Hub: Milestone Checklist**

  - **Description:** Add a simple, non-editable checklist to the hub page that reflects the project's status51515151.

  - **Dependencies:** Task 7.1
  - **Acceptance Criteria (AC):**

    - \[ \] The checklist visualizes the key statuses: e.g., "Project Funded," "In Progress," "Deliverables Submitted," "Completed" 52525252.

  - **Status:** To Do

- **Task 7.3: Hub: Secure File Sharing**

  - **Description:** Add a file uploader/downloader component to the hub. This is for the Legend to deliver the final files (e.g., WAV stems)53535353.

  - **Dependencies:** Task 7.1
  - **Acceptance Criteria (AC):**

    - \[ \] The Legend can upload files (which are saved to a protected folder in Firebase Storage, e.g., /collaborations/\[collabId\]/deliverables/).
    - \[ \] The Buyer can download these files.
    - \[ \] All file uploads are logged with a timestamp54.

  - **Status:** To Do

- **Task 7.4: Hub: Communication Thread**

  - **Description:** Add a simple messaging thread to the hub page for all project-related communication55555555. This is critical for dispute resolution56.

  - **Dependencies:** Task 7.1
  - **Acceptance Criteria (AC):**
    - \[ \] Use a Firestore subcollection (/collaborations/\[collabId\]/messages) to store messages.
    - \[ \] Both Buyer and Legend can send and receive messages in real-time.
    - \[ \] All communication is saved on the platform.
  - **Status:** To Do

- **Task 7.5: Hub: "Mark as Complete" Button**

  - **Description:** Add a "Mark as Complete" button to the hub, visible _only_ to the "New Artist" (Buyer)57. This is the trigger for releasing the payment.

  - **Dependencies:** Task 7.3
  - **Acceptance Criteria (AC):**
    - \[ \] The button is only visible to the Buyer.
    - \[ \] The button is disabled until the Legend has uploaded at least one file to the "deliverables" (Task 7.3).
    - \[ \] Clicking this button triggers the final payout function.
  - **Status:** To Do

### **Epic 8: Payout & Completion**

The final step: paying the Legend.

- **Task 8.1: Backend: triggerPayout Function**

  - **Description:** A Backend triggered by the Buyer clicking "Mark as Complete" (Task 7.5)58.

  - **Dependencies:** Task 7.5, Task 6.1
  - **Acceptance Criteria (AC):**

    - \[ \] The function calculates the platform's commission (e.g., 20%)59.

    - \[ \] It instructs Stripe to execute the "Manual Payout" 60, transferring the (Price \- Fee) to the Legend's connected Stripe account61.

    - \[ \] The platform's fee is transferred to the platform's primary Stripe account.

  - **Status:** To Do

- **Task 8.2: Final Project State**
  - **Description:** After the triggerPayout function is successfully _initiated_, update the project's final state.
  - **Dependencies:** Task 8.1
  - **Acceptance Criteria (AC):**
    - \[ \] The collaborations doc status is set to completed.
    - \`\[ \]} The "Collaboration Hub" (Task 7.1) is now read-only.
    - \[ \] Both Buyer and Legend receive a final confirmation email.
  - **Status:** To Do
