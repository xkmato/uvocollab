# **🧪 UvoCollab E2E Testing Task List**

This document outlines comprehensive end-to-end tests needed to robustly test the UvoCollab platform. Tests are organized by epic to match the MVP functionality.

---

## **Epic 1: Core Setup & Authentication - E2E Tests**

### **Test 1.1: User Registration Flow**

- **Description:** Test the complete user registration process from sign-up to initial dashboard access.
- **Test Steps:**
  1. Navigate to `/auth/signup`
  2. Fill in email and password fields
  3. Submit registration form
  4. Verify user is redirected to dashboard
  5. Verify Firebase Auth user is created
  6. Verify Firestore `users` document exists with `role: 'new_artist'`
  7. Verify all required fields are populated (uid, email, displayName)
- **Expected Results:**
  - User can successfully register
  - Default role is set to 'new_artist'
  - User document is created in Firestore
  - User is authenticated and redirected appropriately

### **Test 1.2: User Login Flow**

- **Description:** Test user login with valid and invalid credentials.
- **Test Steps:**
  1. Navigate to `/auth/login`
  2. Attempt login with invalid credentials (verify error)
  3. Attempt login with valid credentials
  4. Verify successful authentication
  5. Verify redirect to dashboard
  6. Verify auth state persists across page refresh
- **Expected Results:**
  - Invalid credentials show appropriate error
  - Valid credentials authenticate successfully
  - User session persists

### **Test 1.3: Protected Route Access**

- **Description:** Test that protected routes are inaccessible to unauthenticated users.
- **Test Steps:**
  1. Ensure user is logged out
  2. Attempt to navigate to `/dashboard`
  3. Verify redirect to login page
  4. Log in as user
  5. Verify can now access `/dashboard`
- **Expected Results:**
  - Unauthenticated users cannot access protected routes
  - Authenticated users can access protected routes

### **Test 1.4: User Logout Flow**

- **Description:** Test user logout and session termination.
- **Test Steps:**
  1. Log in as user
  2. Click logout button
  3. Verify redirect to home/login page
  4. Verify auth state is cleared
  5. Attempt to access protected route
  6. Verify redirect to login
- **Expected Results:**
  - Logout clears authentication
  - Protected routes become inaccessible

---

## **Epic 2: "Legend" Onboarding & Vetting - E2E Tests**

### **Test 2.1: Legend Application Submission (New User)**

- **Description:** Test the complete legend application flow for a user who doesn't have an account.
- **Test Steps:**
  1. Navigate to `/apply`
  2. Fill out all required fields:
     - Primary contact info
     - Management/agency info
     - Spotify/social media links
     - Press links
  3. Submit application
  4. Verify success message is displayed
  5. Verify Firebase Auth account is created
  6. Verify `users` document created with `role: 'legend_applicant'`
  7. Verify `legend_applications` document created with `status: 'pending'`
- **Expected Results:**
  - Application submitted successfully
  - Auth account and user document created
  - Application document created with pending status

### **Test 2.2: Legend Application Submission (Existing User)**

- **Description:** Test legend application for an existing user.
- **Test Steps:**
  1. Create and log in as a 'new_artist' user
  2. Navigate to `/apply`
  3. Fill out application form
  4. Submit application
  5. Verify user document role updated to 'legend_applicant'
  6. Verify application document created
- **Expected Results:**
  - Existing user can apply
  - User role is updated appropriately
  - Application is created

### **Test 2.3: Legend Application Form Validation**

- **Description:** Test form validation for required fields.
- **Test Steps:**
  1. Navigate to `/apply`
  2. Attempt to submit with empty fields
  3. Verify validation errors shown
  4. Fill required fields incrementally
  5. Verify submit enabled only when all required fields complete
- **Expected Results:**
  - Form validates required fields
  - Clear error messages displayed
  - Submit disabled until form valid

### **Test 2.4: Admin Vetting Dashboard Access Control**

- **Description:** Test that only admin users can access the vetting dashboard.
- **Test Steps:**
  1. Attempt to access `/admin/vetting` as unauthenticated user
  2. Verify redirect to login
  3. Log in as 'new_artist' user
  4. Attempt to access `/admin/vetting`
  5. Verify access denied
  6. Log in as 'admin' user
  7. Verify can access `/admin/vetting`
- **Expected Results:**
  - Only admin users can access vetting dashboard
  - Non-admin users are blocked

### **Test 2.5: Admin Approves Legend Application**

- **Description:** Test the complete approval flow for a legend application.
- **Test Steps:**
  1. Submit legend application (Test 2.1 setup)
  2. Log in as admin
  3. Navigate to `/admin/vetting`
  4. Verify application appears in pending list
  5. Click "Approve" button
  6. Verify application status updated to 'approved'
  7. Verify user role updated to 'legend' in Firestore
  8. Verify Firebase Auth custom claim set to `role: 'legend'`
  9. Verify approval email sent to applicant/manager
  10. Log in as approved user
  11. Verify access to legend dashboard
- **Expected Results:**
  - Application approved successfully
  - User role and claims updated
  - Notification email sent
  - User gains legend privileges

### **Test 2.6: Admin Declines Legend Application**

- **Description:** Test the decline flow for a legend application.
- **Test Steps:**
  1. Submit legend application
  2. Log in as admin
  3. Navigate to `/admin/vetting`
  4. Click "Decline" button on application
  5. Verify application status updated to 'declined'
  6. Verify user role remains 'legend_applicant'
  7. Verify decline email sent
- **Expected Results:**
  - Application declined successfully
  - User role not elevated
  - Decline notification sent

---

## **Epic 3: "Legend" Profile & Service Management - E2E Tests**

### **Test 3.1: Legend Profile Setup**

- **Description:** Test legend profile editing functionality.
- **Test Steps:**
  1. Log in as approved legend user
  2. Navigate to `/legend/dashboard`
  3. Edit profile fields (bio, profile image, links)
  4. Save changes
  5. Verify updates saved to Firestore
  6. Navigate to public profile `/legend/[legendId]`
  7. Verify changes reflected on public page
- **Expected Results:**
  - Legend can edit profile
  - Changes persist and display publicly

### **Test 3.2: Service Creation**

- **Description:** Test creating a new service offering.
- **Test Steps:**
  1. Log in as legend
  2. Navigate to legend dashboard
  3. Click "Add New Service"
  4. Fill in service details:
     - Title (e.g., "16-bar verse")
     - Description
     - Price (non-zero)
     - Deliverable
  5. Save service
  6. Verify service appears in dashboard
  7. Verify service document created in Firestore subcollection
  8. Navigate to public profile
  9. Verify service listed with correct details
- **Expected Results:**
  - Service created successfully
  - Service visible in dashboard and public profile

### **Test 3.3: Service Price Validation**

- **Description:** Test that services cannot be created with $0 price.
- **Test Steps:**
  1. Log in as legend
  2. Attempt to create service with price = $0
  3. Verify validation error shown
  4. Set price > $0
  5. Verify service can be saved
- **Expected Results:**
  - Zero price rejected
  - Positive price accepted

### **Test 3.4: Service Edit and Delete**

- **Description:** Test editing and deleting existing services.
- **Test Steps:**
  1. Create a service (Test 3.2 setup)
  2. Edit service details
  3. Save changes
  4. Verify updates reflected in Firestore and public profile
  5. Delete service
  6. Verify service removed from Firestore
  7. Verify service no longer appears on public profile
- **Expected Results:**
  - Services can be edited
  - Services can be deleted
  - Changes reflect correctly

### **Test 3.5: Legend Public Profile Display**

- **Description:** Test the public legend profile page displays correctly.
- **Test Steps:**
  1. Create legend with profile and services
  2. Navigate to `/legend/[legendId]` (logged out)
  3. Verify "Verified Legend" badge displayed
  4. Verify bio and profile information shown
  5. Verify all services listed with prices and descriptions
  6. Verify "Request Collaboration" button on each service
- **Expected Results:**
  - Public profile displays all information correctly
  - Badge and services visible
  - CTAs present

---

## **Epic 4: Marketplace & Discovery - E2E Tests**

### **Test 4.1: Marketplace Browse**

- **Description:** Test browsing all legends in the marketplace.
- **Test Steps:**
  1. Create multiple legend users with different profiles
  2. Navigate to `/marketplace`
  3. Verify all legends displayed as cards
  4. Verify each card shows photo, name, and specialty
  5. Click on a legend card
  6. Verify redirect to legend's public profile
- **Expected Results:**
  - All legends visible in marketplace
  - Navigation to profiles works

### **Test 4.2: Marketplace Filtering by Genre**

- **Description:** Test filtering legends by genre.
- **Test Steps:**
  1. Create legends with different genres
  2. Navigate to `/marketplace`
  3. Apply genre filter
  4. Verify only legends matching genre displayed
  5. Clear filter
  6. Verify all legends shown again
- **Expected Results:**
  - Genre filter works correctly
  - Results update dynamically

### **Test 4.3: Marketplace Filtering by Price Range**

- **Description:** Test filtering by service price range.
- **Test Steps:**
  1. Create legends with services at different price points
  2. Navigate to `/marketplace`
  3. Set price range filter (e.g., $100-$500)
  4. Verify only legends with services in range displayed
  5. Adjust range
  6. Verify results update
- **Expected Results:**
  - Price filter works correctly
  - Multiple filter criteria can be applied

### **Test 4.4: Marketplace Filtering by Service Type**

- **Description:** Test filtering by type of service offered.
- **Test Steps:**
  1. Create legends with different service types
  2. Apply service type filter
  3. Verify correct legends displayed
  4. Combine with other filters
  5. Verify multiple filters work together
- **Expected Results:**
  - Service type filter works
  - Combined filters function correctly

---

## **Epic 5: Collaboration Flow - E2E Tests**

### **Test 5.1: Submit Pitch - Complete Flow**

- **Description:** Test the complete pitch submission process.
- **Test Steps:**
  1. Log in as 'new_artist' (buyer)
  2. Navigate to legend profile
  3. Click "Request Collaboration" on a service
  4. Verify pitch form displayed
  5. Attempt to submit with incomplete fields
  6. Verify validation prevents submission
  7. Upload demo track to Firebase Storage
  8. Provide link to previous work
  9. Write creative concept message
  10. Submit pitch
  11. Verify success message
  12. Verify collaboration document created with `status: 'pending_review'`
  13. Verify demo uploaded to Firebase Storage
  14. Verify notification sent to legend/manager
- **Expected Results:**
  - Pitch form validates required fields
  - Files upload successfully
  - Collaboration document created
  - Legend notified

### **Test 5.2: Legend Reviews and Declines Pitch**

- **Description:** Test legend declining a collaboration request.
- **Test Steps:**
  1. Submit pitch (Test 5.1 setup)
  2. Log in as legend
  3. Navigate to legend dashboard
  4. Verify pitch appears in pending requests
  5. Listen to demo track
  6. Read pitch message
  7. Click "Decline"
  8. Verify collaboration status updated to 'declined'
  9. Verify rejection email sent to buyer
  10. Log in as buyer
  11. Verify cannot proceed with declined collaboration
- **Expected Results:**
  - Legend can review pitch details
  - Decline updates status correctly
  - Buyer notified of rejection

### **Test 5.3: Legend Accepts Pitch**

- **Description:** Test legend accepting a collaboration request.
- **Test Steps:**
  1. Submit pitch (Test 5.1 setup)
  2. Log in as legend
  3. Navigate to dashboard
  4. Click "Accept" on pitch
  5. Verify collaboration status updated to 'pending_payment'
  6. Verify acceptance email sent to buyer
  7. Verify email includes payment prompt
- **Expected Results:**
  - Accept updates status to pending_payment
  - Buyer notified and prompted to pay

### **Test 5.4: Multiple Concurrent Pitches**

- **Description:** Test that legends can manage multiple pitches simultaneously.
- **Test Steps:**
  1. Submit multiple pitches from different buyers to same legend
  2. Log in as legend
  3. Verify all pitches listed
  4. Accept one, decline another
  5. Verify each collaboration has correct independent status
- **Expected Results:**
  - Multiple pitches handled independently
  - No interference between collaborations

---

## **Epic 6: Financials & Legal - E2E Tests**

### **Test 6.1: Legend Bank Account Connection**

- **Description:** Test Flutterwave subaccount connection for legends.
- **Test Steps:**
  1. Log in as newly approved legend
  2. Navigate to legend dashboard
  3. Click "Connect Bank Account"
  4. Complete Flutterwave subaccount setup
  5. Verify subaccount ID saved to user document
  6. Verify services can now be published
  7. Test that unconnected legend cannot publish services
- **Expected Results:**
  - Bank connection flow works
  - Subaccount ID persisted
  - Services require connected account

### **Test 6.2: Payment Flow - Complete Transaction**

- **Description:** Test the complete payment process from checkout to escrow.
- **Test Steps:**
  1. Create accepted collaboration (Epic 5 setup)
  2. Log in as buyer
  3. Navigate to dashboard/collaboration details
  4. Click "Pay Now"
  5. Verify checkout page displays correct amount
  6. Complete Flutterwave payment modal
  7. Verify payment processed
  8. Verify funds held in escrow (not immediately sent to legend)
  9. Verify collaboration status updated to 'awaiting_contract'
  10. Verify payment confirmation recorded
- **Expected Results:**
  - Payment processes successfully
  - Funds held in escrow
  - Status updates correctly

### **Test 6.3: Payment Failure Handling**

- **Description:** Test handling of failed payments.
- **Test Steps:**
  1. Attempt payment with invalid card
  2. Verify payment fails gracefully
  3. Verify error message shown to user
  4. Verify collaboration status remains 'pending_payment'
  5. Verify user can retry payment
- **Expected Results:**
  - Payment failures handled gracefully
  - User can retry
  - Status not incorrectly updated

### **Test 6.4: Contract Generation After Payment**

- **Description:** Test automatic contract generation after successful payment.
- **Test Steps:**
  1. Complete payment (Test 6.2 setup)
  2. Verify contract generation triggered
  3. Verify contract uses Work for Hire template
  4. Verify dynamic fields populated:
     - Buyer name
     - Legend name
     - Service description
     - Price
  5. Verify contract includes required clauses:
     - WFH Master Ownership
     - Publisher Share
     - Credit
  6. Verify e-signature request sent to both parties
- **Expected Results:**
  - Contract auto-generated
  - All fields populated correctly
  - Both parties receive signature request

### **Test 6.5: Contract Signing - Both Parties Sign**

- **Description:** Test the complete contract signing flow.
- **Test Steps:**
  1. Generate contract (Test 6.4 setup)
  2. Sign contract as buyer
  3. Verify status remains 'awaiting_contract' (waiting for legend)
  4. Sign contract as legend
  5. Verify webhook triggered
  6. Verify signed PDF saved to Firebase Storage
  7. Verify collaboration document updated with contract URL
  8. Verify status updated to 'in_progress'
  9. Verify collaboration hub created/accessible
- **Expected Results:**
  - Both signatures required
  - Contract saved properly
  - Status advances to in_progress

### **Test 6.6: Contract Signing - Partial Signature**

- **Description:** Test that collaboration doesn't advance with only one signature.
- **Test Steps:**
  1. Generate contract
  2. Sign as buyer only
  3. Verify status remains 'awaiting_contract'
  4. Verify collaboration hub not yet accessible
  5. Complete signing as legend
  6. Verify hub now accessible
- **Expected Results:**
  - Both signatures required before advancing
  - Hub only accessible after both sign

---

## **Epic 7: Collaboration Hub - E2E Tests**

### **Test 7.1: Collaboration Hub Access Control**

- **Description:** Test that only authorized parties can access the hub.
- **Test Steps:**
  1. Create collaboration in 'in_progress' status
  2. Attempt to access hub as unauthenticated user
  3. Verify redirect/access denied
  4. Log in as unrelated user
  5. Attempt to access hub
  6. Verify access denied
  7. Log in as buyer
  8. Verify can access hub
  9. Log in as legend
  10. Verify can access hub
- **Expected Results:**
  - Only buyer and legend can access hub
  - Other users denied access

### **Test 7.2: Milestone Checklist Display**

- **Description:** Test that milestone checklist accurately reflects project status.
- **Test Steps:**
  1. Access collaboration hub
  2. Verify checklist shows current status
  3. Verify completed milestones marked (Project Funded, In Progress)
  4. Verify upcoming milestones shown (Deliverables Submitted, Completed)
  5. Update collaboration status
  6. Refresh hub
  7. Verify checklist updates accordingly
- **Expected Results:**
  - Checklist reflects current state
  - Updates as status changes

### **Test 7.3: File Upload by Legend**

- **Description:** Test legend uploading deliverable files.
- **Test Steps:**
  1. Log in as legend
  2. Access collaboration hub
  3. Upload WAV file
  4. Verify file uploaded to Firebase Storage at correct path
  5. Verify upload timestamp recorded
  6. Verify file appears in hub file list
  7. Upload additional files
  8. Verify all files listed
- **Expected Results:**
  - Legend can upload files
  - Files saved to protected location
  - Upload history tracked

### **Test 7.4: File Download by Buyer**

- **Description:** Test buyer downloading deliverable files.
- **Test Steps:**
  1. Upload files as legend (Test 7.3 setup)
  2. Log in as buyer
  3. Access collaboration hub
  4. Verify files listed
  5. Download file
  6. Verify file downloads successfully
  7. Verify correct file received
- **Expected Results:**
  - Buyer can see uploaded files
  - Files download correctly

### **Test 7.5: Communication Thread**

- **Description:** Test real-time messaging between buyer and legend.
- **Test Steps:**
  1. Log in as buyer
  2. Access collaboration hub
  3. Send message
  4. Verify message saved to Firestore subcollection
  5. Log in as legend (different browser/session)
  6. Access same hub
  7. Verify message appears
  8. Reply to message
  9. Switch to buyer view
  10. Verify reply received in real-time
  11. Send multiple messages
  12. Verify all messages persisted and displayed in order
- **Expected Results:**
  - Messages sent and received
  - Real-time updates work
  - All communication logged

### **Test 7.6: Mark as Complete - Button State**

- **Description:** Test that "Mark as Complete" button is properly controlled.
- **Test Steps:**
  1. Log in as buyer
  2. Access hub with no deliverables uploaded
  3. Verify "Mark as Complete" button disabled
  4. Switch to legend
  5. Upload at least one file
  6. Switch back to buyer
  7. Verify button now enabled
  8. Verify button only visible to buyer (not legend)
- **Expected Results:**
  - Button disabled until files uploaded
  - Button only visible to buyer

### **Test 7.7: Mark as Complete - Trigger Payout**

- **Description:** Test clicking "Mark as Complete" triggers payout.
- **Test Steps:**
  1. Set up collaboration with deliverables uploaded
  2. Log in as buyer
  3. Click "Mark as Complete"
  4. Verify confirmation prompt shown
  5. Confirm action
  6. Verify payout function triggered (Epic 8)
  7. Verify collaboration status updated
- **Expected Results:**
  - Confirmation required
  - Payout initiated on confirmation
  - Status updates

---

## **Epic 8: Payout & Completion - E2E Tests**

### **Test 8.1: Payout Calculation**

- **Description:** Test that platform fee is calculated correctly.
- **Test Steps:**
  1. Create collaboration with known price (e.g., $1000)
  2. Mark as complete to trigger payout
  3. Verify platform calculates 20% fee ($200)
  4. Verify legend receives $800
  5. Verify platform account receives $200
  6. Test with different price points
  7. Verify calculation always correct
- **Expected Results:**
  - Fee calculated correctly
  - Amounts split properly

### **Test 8.2: Flutterwave Transfer Execution**

- **Description:** Test that funds are transferred to legend's subaccount.
- **Test Steps:**
  1. Trigger payout (Test 8.1 setup)
  2. Verify Flutterwave transfer initiated
  3. Verify correct amount sent to legend's subaccount
  4. Verify transfer status recorded
  5. Verify platform fee remains in platform account
- **Expected Results:**
  - Transfer completes successfully
  - Correct amounts distributed

### **Test 8.3: Project Completion Status**

- **Description:** Test final project state after payout.
- **Test Steps:**
  1. Complete payout (Test 8.2 setup)
  2. Verify collaboration status updated to 'completed'
  3. Access collaboration hub
  4. Verify hub is now read-only
  5. Verify can view all messages (no new messages allowed)
  6. Verify can download files (no new uploads allowed)
  7. Verify "Mark as Complete" button no longer shown
- **Expected Results:**
  - Status set to completed
  - Hub becomes read-only
  - Historical data accessible

### **Test 8.4: Completion Notifications**

- **Description:** Test that both parties receive completion confirmation.
- **Test Steps:**
  1. Complete collaboration (Test 8.3 setup)
  2. Verify buyer receives completion email
  3. Verify legend receives completion email
  4. Verify emails include:
     - Project details
     - Final amount
     - Confirmation of completion
- **Expected Results:**
  - Both parties notified
  - Emails contain correct information

### **Test 8.5: Payout Failure Handling**

- **Description:** Test handling of failed payout transfers.
- **Test Steps:**
  1. Set up collaboration with invalid/disconnected subaccount
  2. Attempt to trigger payout
  3. Verify failure is caught and logged
  4. Verify collaboration status not incorrectly marked completed
  5. Verify error notification sent to admin
  6. Verify buyer notified of issue
- **Expected Results:**
  - Payout failures handled gracefully
  - Admin alerted for manual resolution
  - Project not incorrectly marked complete

---

## **Cross-Epic Integration Tests**

### **Test INT-1: Complete Happy Path Flow**

- **Description:** End-to-end test of entire platform flow from signup to payout.
- **Test Steps:**
  1. **Buyer signs up** → Verify account created as 'new_artist'
  2. **Legend applies** → Verify application submitted
  3. **Admin approves legend** → Verify role upgraded
  4. **Legend sets up profile** → Add bio, services
  5. **Legend connects bank** → Flutterwave subaccount
  6. **Buyer browses marketplace** → Find legend
  7. **Buyer submits pitch** → Upload demo, message
  8. **Legend accepts pitch** → Status to pending_payment
  9. **Buyer pays** → Funds in escrow
  10. **Contract generated** → Both parties sign
  11. **Hub created** → Collaboration begins
  12. **Legend uploads files** → Deliverables shared
  13. **Messages exchanged** → Communication logged
  14. **Buyer marks complete** → Payout triggered
  15. **Funds transferred** → Legend receives payment
  16. **Hub read-only** → Project completed
- **Expected Results:**
  - Complete flow executes without errors
  - All state transitions correct
  - All notifications sent
  - Money flows correctly

### **Test INT-2: Multiple Concurrent Collaborations**

- **Description:** Test that a legend can handle multiple active projects.
- **Test Steps:**
  1. Create legend with multiple services
  2. Have 3 different buyers submit pitches
  3. Accept all 3 pitches
  4. All 3 buyers pay
  5. All 3 contracts signed
  6. All 3 hubs created
  7. Interleave actions across projects:
     - Upload files to project 1
     - Message in project 2
     - Upload to project 3
  8. Complete projects in different order
  9. Verify each project independent
  10. Verify all payouts correct
- **Expected Results:**
  - Multiple projects don't interfere
  - Legend can manage all simultaneously
  - Each completion triggers correct payout

### **Test INT-3: User Role Transitions**

- **Description:** Test that user can transition through multiple roles.
- **Test Steps:**
  1. Sign up as 'new_artist'
  2. Submit pitch to a legend (act as buyer)
  3. Apply to become legend
  4. Get approved to 'legend'
  5. Set up services
  6. Receive pitch (act as seller)
  7. Complete collaboration as buyer
  8. Complete collaboration as legend
  9. Verify both buyer and seller experiences work
- **Expected Results:**
  - User can function in multiple roles
  - No conflicts between role-based views
  - Permissions update correctly

### **Test INT-4: Payment Escrow Integrity**

- **Description:** Test that funds remain in escrow until completion.
- **Test Steps:**
  1. Buyer pays for collaboration
  2. Verify funds captured in platform account
  3. Contract signed, hub created
  4. Verify funds still in escrow (not transferred)
  5. Files uploaded, messages sent
  6. Verify funds still in escrow
  7. Mark as complete
  8. Verify funds now transferred to legend
  9. Verify timing of transfer is correct
- **Expected Results:**
  - Funds held until buyer confirms completion
  - No premature payouts
  - Transfer executes on correct trigger

---

## **Error Handling & Edge Case Tests**

### **Test ERR-1: Network Interruption During Payment**

- **Description:** Test payment resilience to network issues.
- **Test Steps:**
  1. Initiate payment
  2. Simulate network interruption mid-transaction
  3. Verify payment status handled correctly
  4. Verify user can retry
  5. Verify no duplicate charges
- **Expected Results:**
  - Payment failures handled gracefully
  - No money lost
  - Clear user guidance

### **Test ERR-2: File Upload Size Limits**

- **Description:** Test file upload validation and limits.
- **Test Steps:**
  1. Attempt to upload extremely large file
  2. Verify size limit enforced
  3. Verify error message shown
  4. Upload acceptable size file
  5. Verify success
- **Expected Results:**
  - Size limits enforced
  - Clear error messages

### **Test ERR-3: Concurrent Status Updates**

- **Description:** Test handling of simultaneous status changes.
- **Test Steps:**
  1. Have buyer and legend attempt actions simultaneously
  2. Verify database transactions prevent conflicts
  3. Verify status consistency maintained
- **Expected Results:**
  - No race conditions
  - Data consistency preserved

### **Test ERR-4: Invalid Contract Signatures**

- **Description:** Test handling of signature service failures.
- **Test Steps:**
  1. Generate contract
  2. Simulate signature service error
  3. Verify error logged
  4. Verify user notified
  5. Verify retry mechanism
- **Expected Results:**
  - Signature failures don't break flow
  - Users can retry
  - Admin notified of issues

---

## **Performance & Load Tests**

### **Test PERF-1: Marketplace with Many Legends**

- **Description:** Test marketplace performance with large dataset.
- **Test Steps:**
  1. Create 100+ legend profiles
  2. Navigate to marketplace
  3. Verify page loads in < 3 seconds
  4. Apply filters
  5. Verify filter results in < 1 second
- **Expected Results:**
  - Marketplace performs well at scale
  - Filtering remains responsive

### **Test PERF-2: Real-time Messaging Latency**

- **Description:** Test messaging performance under load.
- **Test Steps:**
  1. Send messages rapidly in hub
  2. Measure delivery time
  3. Verify messages appear in < 2 seconds
  4. Test with long message history
  5. Verify load times acceptable
- **Expected Results:**
  - Messages deliver quickly
  - UI remains responsive

### **Test PERF-3: File Upload/Download Speed**

- **Description:** Test file transfer performance.
- **Test Steps:**
  1. Upload various file sizes
  2. Measure upload time
  3. Download files
  4. Measure download time
  5. Verify acceptable performance
- **Expected Results:**
  - File transfers complete reasonably
  - Progress indicators shown

---

## **Security Tests**

### **Test SEC-1: Unauthorized Data Access**

- **Description:** Test Firestore security rules prevent unauthorized access.
- **Test Steps:**
  1. As user A, attempt to read user B's private data
  2. Verify access denied
  3. Attempt to modify another user's document
  4. Verify blocked
  5. Attempt to access collaboration not part of
  6. Verify denied
- **Expected Results:**
  - Security rules enforce proper access control
  - No data leaks

### **Test SEC-2: File Access Control**

- **Description:** Test Firebase Storage security.
- **Test Steps:**
  1. Upload deliverable to collaboration
  2. Attempt to access file as unrelated user
  3. Verify access denied
  4. Attempt direct URL access without auth
  5. Verify blocked
- **Expected Results:**
  - Files only accessible to authorized parties

### **Test SEC-3: Admin Privilege Escalation**

- **Description:** Test that users cannot grant themselves admin privileges.
- **Test Steps:**
  1. As regular user, attempt to update own role to 'admin'
  2. Verify update blocked
  3. Attempt to manipulate client-side data
  4. Verify server-side validation prevents escalation
- **Expected Results:**
  - Roles can only be set by authorized processes
  - Client manipulation ineffective

### **Test SEC-4: Payment Manipulation**

- **Description:** Test that payment amounts cannot be manipulated.
- **Test Steps:**
  1. Attempt to modify payment amount client-side
  2. Verify server validates against collaboration document price
  3. Attempt to replay payment for different collaboration
  4. Verify blocked
- **Expected Results:**
  - Payment amounts validated server-side
  - No payment manipulation possible

---

## **Accessibility & UX Tests**

### **Test A11Y-1: Keyboard Navigation**

- **Description:** Test that all flows can be completed using keyboard only.
- **Test Steps:**
  1. Navigate entire application using Tab/Enter/Space
  2. Complete signup using keyboard
  3. Submit pitch using keyboard
  4. Upload files using keyboard
  5. Send messages using keyboard
- **Expected Results:**
  - All functionality accessible via keyboard
  - Focus indicators visible
  - Logical tab order

### **Test A11Y-2: Screen Reader Compatibility**

- **Description:** Test application with screen reader.
- **Test Steps:**
  1. Use screen reader on all pages
  2. Verify labels read correctly
  3. Verify form fields announced
  4. Verify error messages accessible
  5. Verify status changes announced
- **Expected Results:**
  - All content accessible to screen readers
  - Clear announcements

### **Test UX-1: Error Recovery**

- **Description:** Test that users can recover from errors.
- **Test Steps:**
  1. Trigger various error conditions
  2. Verify clear error messages shown
  3. Verify suggested actions provided
  4. Verify users can correct and retry
- **Expected Results:**
  - Error messages helpful
  - Recovery paths clear

---

## **Test Execution Notes**

### **Testing Tools & Frameworks**

- **Recommended:** Playwright or Cypress for E2E testing
- **Auth Testing:** Firebase Emulator Suite for local testing
- **Payment Testing:** Flutterwave test mode/sandbox
- **Contract Testing:** DocuSign sandbox environment

### **Test Data Management**

- Create reusable test fixtures for users, services, collaborations
- Use Firebase Emulator for isolated test data
- Clean up test data after each test suite

### **CI/CD Integration**

- Run critical path tests on every PR
- Run full test suite nightly
- Block deployment on test failures

### **Test Coverage Goals**

- Aim for 90%+ coverage of user-facing flows
- All payment flows must have tests
- All role-based access controls must be tested
