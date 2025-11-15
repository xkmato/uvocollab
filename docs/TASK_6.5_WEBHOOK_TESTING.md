# Task 6.5 - Contract Signed Webhook Testing Guide

## Overview

This document provides a comprehensive testing guide for the DocuSign webhook endpoint that handles contract signing completion events.

## Implementation Summary

Task 6.5 has been successfully implemented with the following components:

### 1. **Webhook Endpoint**: `/api/contract/webhook`

**Location**: `app/api/contract/webhook/route.ts`

**Functionality**:

- ✅ Receives POST notifications from DocuSign when envelope events occur
- ✅ Verifies envelope status is "completed" (both parties have signed)
- ✅ Downloads the signed contract PDF from DocuSign
- ✅ Uploads the signed contract to Firebase Storage
- ✅ Updates collaboration document with:
  - `contractUrl` (signed URL to the PDF, valid for 10 years)
  - `allPartiesSignedAt` timestamp
  - `status: 'in_progress'`
- ✅ Sends email notifications to both parties
- ✅ Includes GET endpoint for health check verification

### 2. **Email Notifications**

**Location**: `lib/mailgun.ts`

**New Function**: `sendContractSignedEmails()`

**Functionality**:

- Sends customized emails to both buyer and legend
- Includes links to the Collaboration Hub (when implemented in Epic 7)
- Confirms escrow payment status
- Provides clear next steps for both parties

## Acceptance Criteria Status

All acceptance criteria from Task 6.5 have been met:

- ✅ The webhook waits until _both_ parties have signed
- ✅ Once all signatures are collected, it saves the final PDF to Firebase Storage
- ✅ It updates the collaborations doc `contractUrl` with the path to the PDF
- ✅ It updates the collaborations doc status to `in_progress`
- ✅ Email notifications sent to both parties (implemented)
- ⏳ Creates the "Collaboration Hub" - Properly marked as TODO for Epic 7

## Testing Procedures

### Prerequisites

Before testing, ensure the following environment variables are configured:

```bash
# DocuSign Configuration
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_USER_ID=your_user_id
DOCUSIGN_ACCOUNT_ID=your_account_id
DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
DOCUSIGN_ENV=demo  # Use 'demo' for testing

# Mailgun Configuration (for email notifications)
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
MAILGUN_FROM_EMAIL=noreply@yourdomain.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Or your deployed URL
```

### Test 1: Webhook Health Check

**Purpose**: Verify the webhook endpoint is accessible.

**Steps**:

```bash
curl http://localhost:3000/api/contract/webhook
```

**Expected Response**:

```json
{
  "message": "DocuSign webhook endpoint is active",
  "timestamp": "2024-11-15T..."
}
```

### Test 2: DocuSign Connect Configuration

**Purpose**: Configure DocuSign to send webhooks to your endpoint.

**Steps**:

1. Log into your DocuSign account (demo environment)
2. Navigate to **Settings → Connect**
3. Click **Add Configuration**
4. Configure the webhook:
   - **Name**: UvoCollab Webhook
   - **URL**: `https://yourdomain.com/api/contract/webhook` (must be HTTPS in production)
   - **Events**: Enable `envelope-completed`
   - **Include Document PDFs**: Enabled (optional, we fetch via API)
5. Save configuration
6. Test the connection using DocuSign's test feature

### Test 3: End-to-End Contract Signing Flow

**Purpose**: Test the complete flow from contract generation to webhook processing.

**Steps**:

1. **Create a test collaboration**:

   - Create two test users (buyer and legend)
   - Submit a pitch
   - Accept the pitch
   - Process payment
   - Verify collaboration status is `awaiting_contract`

2. **Generate contract**:

   ```bash
   curl -X POST http://localhost:3000/api/contract/generate \
     -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"collaborationId": "YOUR_COLLAB_ID"}'
   ```

3. **Sign the contract**:

   - Check both email inboxes for DocuSign signature requests
   - Sign as the buyer (first signer)
   - Sign as the legend (second signer)
   - DocuSign should automatically send webhook to your endpoint

4. **Verify webhook processing**:
   - Check server logs for webhook receipt
   - Verify collaboration status updated to `in_progress`
   - Verify `contractUrl` field is populated
   - Verify `allPartiesSignedAt` timestamp is set
   - Check both email inboxes for "Contract Signed" notifications

### Test 4: Webhook Security & Validation

**Purpose**: Ensure webhook properly validates requests.

**Test Cases**:

1. **Invalid envelope ID**:

   ```bash
   curl -X POST http://localhost:3000/api/contract/webhook \
     -H "Content-Type: application/json" \
     -d '{
       "event": "envelope-completed",
       "data": {
         "envelopeSummary": {
           "envelopeId": "invalid-id",
           "status": "completed"
         }
       }
     }'
   ```

   **Expected**: 400 error - envelope verification fails

2. **Non-completed envelope**:

   ```bash
   curl -X POST http://localhost:3000/api/contract/webhook \
     -H "Content-Type: application/json" \
     -d '{
       "event": "envelope-sent",
       "data": {
         "envelopeSummary": {
           "envelopeId": "valid-id",
           "status": "sent"
         }
       }
     }'
   ```

   **Expected**: 200 response but no processing (event ignored)

3. **Missing collaboration ID in envelope**:
   - Generate a test envelope without custom fields
   - Attempt to process via webhook
     **Expected**: 400 error - collaboration ID not found

### Test 5: Email Notification Verification

**Purpose**: Verify email notifications are sent correctly.

**Steps**:

1. Complete a contract signing flow (Test 3)
2. Check buyer's email inbox for:
   - Subject: "✅ Contract Signed - Collaboration Begins!"
   - Contains collaboration hub link
   - Contains project details
   - Professional formatting
3. Check legend's email inbox for:
   - Subject: "✅ Contract Signed - Time to Create!"
   - Contains collaboration hub link
   - Contains payment info (escrow)
   - Professional formatting

**Note**: If Mailgun is not configured, emails will be logged to console but not sent.

### Test 6: Firebase Storage Verification

**Purpose**: Verify signed contracts are properly stored.

**Steps**:

1. Complete a contract signing flow
2. Check Firebase Storage console:
   - Navigate to `contracts/{collaborationId}/`
   - Verify `signed_contract.pdf` exists
   - Download and verify PDF is complete and signed
3. Test the signed URL from the collaboration document:
   ```bash
   curl -I "SIGNED_URL_FROM_FIRESTORE"
   ```
   **Expected**: 200 OK response

### Test 7: Error Handling

**Purpose**: Verify robust error handling.

**Test Cases**:

1. **DocuSign API failure**:

   - Temporarily set invalid DocuSign credentials
   - Attempt to process webhook
     **Expected**: Proper error logging and 500 response

2. **Firebase Storage failure**:

   - Temporarily restrict Firebase Storage permissions
   - Process webhook
     **Expected**: Proper error logging and 500 response

3. **Email sending failure**:
   - Set invalid Mailgun credentials
   - Process webhook
     **Expected**: Webhook succeeds, but error logged for email failure

## Monitoring & Debugging

### Log Monitoring

Key log messages to watch for:

```
✅ Success: "Contract signed for collaboration {id}, status updated to in_progress"
✅ Success: "Sent contract signed notifications to both parties"
⚠️  Warning: "Ignoring event: {event} with status: {status}"
❌ Error: "Error processing DocuSign webhook: {error}"
```

### Common Issues & Solutions

#### Issue: Webhook not receiving events

**Possible Causes**:

- DocuSign Connect not configured
- Invalid webhook URL (must be HTTPS in production)
- Firewall blocking DocuSign IPs

**Solutions**:

1. Verify Connect configuration in DocuSign admin
2. Check DocuSign Connect logs for delivery failures
3. Ensure webhook endpoint is publicly accessible
4. Use ngrok for local testing: `ngrok http 3000`

#### Issue: "Envelope not completed" error

**Possible Causes**:

- Only one party has signed
- Envelope was voided or declined

**Solutions**:

1. Check envelope status in DocuSign admin
2. Verify both signers have completed their signatures
3. Check signer email inboxes for signing links

#### Issue: Email notifications not sent

**Possible Causes**:

- Mailgun not configured
- Invalid email addresses
- Mailgun API rate limits

**Solutions**:

1. Verify Mailgun environment variables
2. Check Mailgun dashboard for delivery logs
3. Review server logs for email errors
4. Note: Webhook will still succeed if email fails

#### Issue: Signed contract not in Firebase Storage

**Possible Causes**:

- Firebase Storage permissions issue
- DocuSign download failed
- Network connectivity problem

**Solutions**:

1. Check Firebase Storage rules
2. Verify admin SDK has write permissions
3. Check server logs for specific error
4. Test DocuSign API credentials

## Production Checklist

Before deploying to production:

- [ ] Switch `DOCUSIGN_ENV` from `demo` to `production`
- [ ] Update DocuSign Connect webhook URL to production domain
- [ ] Verify production domain has valid SSL certificate
- [ ] Test webhook with production credentials
- [ ] Set up monitoring for webhook failures
- [ ] Configure email alerts for critical errors
- [ ] Test with real user accounts (internal team first)
- [ ] Document support procedures for contract issues
- [ ] Set up backup/archival process for signed contracts
- [ ] Verify signed URL expiration (10 years) meets requirements

## Next Steps

With Task 6.5 complete, the system is ready for:

1. **Epic 7**: Collaboration Hub implementation
   - Task 7.1: Private collaboration hub page
   - Task 7.2: Milestone checklist
   - Task 7.3: File sharing for deliverables
   - Task 7.4: Communication thread
   - Task 7.5: "Mark as Complete" button

The webhook successfully transitions collaborations to `in_progress` status, which is the trigger for Epic 7 functionality.

## Support & Troubleshooting

For issues or questions:

- Check server logs first
- Review DocuSign Connect logs
- Test webhook endpoint health
- Verify all environment variables
- Check Firebase Storage permissions

## Summary

Task 6.5 is **COMPLETE** with all acceptance criteria met:

✅ Webhook receives DocuSign events
✅ Verifies both parties have signed
✅ Downloads and stores signed contract PDF
✅ Updates collaboration status to `in_progress`
✅ Sets `contractUrl` with signed URL
✅ Records `allPartiesSignedAt` timestamp
✅ Sends email notifications to both parties
⏳ Collaboration Hub creation properly deferred to Epic 7

The system is now ready for production testing and Epic 7 implementation.
