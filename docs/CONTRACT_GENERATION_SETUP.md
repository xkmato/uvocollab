# Contract Generation & E-Signature Setup

This document explains how the contract generation and e-signature system works in UvoCollab, including setup instructions for DocuSign integration.

## Overview

After a collaboration pitch is accepted and payment is received (held in escrow), the system automatically generates a Work for Hire (WFH) contract that both parties must sign electronically before work can begin.

## System Flow

1. **Payment Verified** → Collaboration status changes to `awaiting_contract`
2. **Generate Contract** → Either party (or system) triggers contract generation
3. **Contract PDF Created** → System generates a WFH contract with all relevant details
4. **Sent to DocuSign** → Contract is sent to both parties for e-signature
5. **Both Parties Sign** → DocuSign sends webhook notification
6. **Contract Finalized** → Status changes to `in_progress`, work can begin

## Work for Hire Contract Template

The MVP uses a standard Work for Hire music collaboration agreement that includes:

### Key Clauses

1. **Master Ownership (Work for Hire)**

   - Buyer owns 100% of the master recording
   - Full rights to reproduce, distribute, and publicly perform
   - Right to create derivative works
   - Right to register copyright in buyer's name

2. **Publisher Share (Songwriter Rights)**

   - Seller retains 100% of songwriter's share (writer's share)
   - Right to register with PRO (ASCAP, BMI, SESAC)
   - Publisher's share negotiated separately if applicable

3. **Credit & Attribution**

   - Proper credit in liner notes and digital metadata
   - Format: "Produced by [Legend Name]" or "Featuring [Legend Name]"

4. **Deliverables & Timeline**

   - Industry-standard formats
   - Delivered through UvoCollab platform

5. **Payment & Escrow**

   - Total service fee held in escrow
   - Released upon buyer's acceptance (minus 20% platform commission)

6. **Warranties**

   - Work is original
   - No unauthorized samples or copyrighted material
   - Seller has authority to enter agreement
   - Indemnification clause

7. **Dispute Resolution**
   - UvoCollab dispute process first
   - Binding arbitration if unresolved

## DocuSign Integration

### Required Environment Variables

Add these to your `.env.local` file:

```bash
# DocuSign Configuration
DOCUSIGN_INTEGRATION_KEY=your_integration_key_here
DOCUSIGN_USER_ID=your_user_id_here
DOCUSIGN_ACCOUNT_ID=your_account_id_here
DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYour_Private_Key_Here\n-----END RSA PRIVATE KEY-----"
DOCUSIGN_ENV=demo  # Use 'production' for live environment
```

### DocuSign Setup Steps

1. **Create DocuSign Developer Account**

   - Go to https://developers.docusign.com/
   - Sign up for a free developer account

2. **Create an Integration Key**

   - Navigate to "Apps and Keys" in your DocuSign admin
   - Click "Add App and Integration Key"
   - Note the Integration Key (this is your `DOCUSIGN_INTEGRATION_KEY`)

3. **Generate RSA Key Pair**

   - In the same app configuration, click "Add RSA Keypair"
   - Download the private key
   - Copy the entire private key content to `DOCUSIGN_PRIVATE_KEY` environment variable
   - **Important:** Replace actual newlines with `\n` in the .env file

4. **Get User ID**

   - In DocuSign admin, go to "My Account"
   - Your User ID (API Username/GUID) is shown there
   - Set as `DOCUSIGN_USER_ID`

5. **Get Account ID**

   - In the same section, find your Account ID
   - Set as `DOCUSIGN_ACCOUNT_ID`

6. **Grant Consent**

   - Before the app can work, you need to grant consent
   - Visit this URL (replace YOUR_INTEGRATION_KEY):

   ```
   https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=YOUR_INTEGRATION_KEY&redirect_uri=https://www.docusign.com
   ```

   - For production, use `account.docusign.com` instead of `account-d.docusign.com`
   - Click "Allow Access"

7. **Configure Webhook**
   - In your DocuSign account, go to Settings → Connect
   - Add a new connection configuration
   - Set the webhook URL to: `https://yourdomain.com/api/contract/webhook`
   - Enable "envelope-completed" event
   - Save configuration

### Testing DocuSign Integration

1. **Test in Demo Environment**

   - Always test in demo environment first (`DOCUSIGN_ENV=demo`)
   - Demo accounts don't send real emails
   - You can access envelopes directly in DocuSign demo portal

2. **Verify Webhook Endpoint**

   ```bash
   curl https://yourdomain.com/api/contract/webhook
   ```

   Should return:

   ```json
   {
     "message": "DocuSign webhook endpoint is active",
     "timestamp": "2024-..."
   }
   ```

3. **Test Contract Generation**
   - Create a test collaboration
   - Complete payment
   - Click "Generate & Sign Contract" in dashboard
   - Check server logs for any errors

## API Endpoints

### Generate Contract

**POST** `/api/contract/generate`

Generates a Work for Hire contract PDF and sends it to DocuSign for signature.

**Headers:**

```
Authorization: Bearer {firebase_id_token}
Content-Type: application/json
```

**Body:**

```json
{
  "collaborationId": "collab_id_here"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Contract generated and sent for signature",
  "envelopeId": "docusign_envelope_id",
  "unsignedContractUrl": "firebase_storage_url"
}
```

### DocuSign Webhook

**POST** `/api/contract/webhook`

Receives notifications from DocuSign when envelope events occur (specifically when all parties have signed).

**Body:** (Sent by DocuSign)

```json
{
  "event": "envelope-completed",
  "data": {
    "envelopeSummary": {
      "envelopeId": "...",
      "status": "completed"
    }
  }
}
```

**Actions Performed:**

1. Verifies envelope is completed
2. Downloads signed contract from DocuSign
3. Uploads signed contract to Firebase Storage
4. Updates collaboration status to `in_progress`
5. Creates collaboration hub (TODO: Epic 7)

## Database Schema Updates

### Collaboration Document

New fields added to track contract status:

```typescript
{
  docusignEnvelopeId?: string;        // DocuSign envelope ID
  contractSentAt?: Date;               // When contract sent for signature
  allPartiesSignedAt?: Date;          // When all parties signed
  contractUrl?: string;                // URL to signed contract PDF
}
```

## File Structure

```
lib/
  ├── contract-generator.ts      # PDF generation logic
  ├── docusign.ts                # DocuSign API integration
  └── firebase-admin.ts          # Firebase Admin SDK (updated)

app/
  └── api/
      └── contract/
          ├── generate/
          │   └── route.ts       # Contract generation endpoint
          └── webhook/
              └── route.ts       # DocuSign webhook handler
```

## Security Considerations

1. **Private Key Storage**

   - Never commit private keys to version control
   - Use environment variables only
   - Rotate keys periodically

2. **Webhook Verification**

   - Always verify envelope status with DocuSign API
   - Don't trust webhook data alone
   - Validate collaboration IDs match

3. **Access Control**

   - Only parties to the collaboration can generate contracts
   - Admins have override capability
   - Firebase Auth tokens required for all operations

4. **Contract Storage**
   - Unsigned contracts: temporary signed URLs (7 days)
   - Signed contracts: long-lived signed URLs (10 years)
   - All contracts stored in Firebase Storage with proper metadata

## Troubleshooting

### "Failed to send contract for signature"

**Possible causes:**

- Invalid DocuSign credentials
- Expired access token (should auto-refresh)
- Missing consent grant
- Network connectivity issues

**Solutions:**

1. Verify all environment variables are set correctly
2. Check DocuSign admin for any account issues
3. Re-grant consent using the OAuth URL
4. Check server logs for specific error messages

### Webhook not receiving events

**Possible causes:**

- Webhook URL not configured in DocuSign
- Firewall blocking DocuSign IPs
- Invalid SSL certificate
- Webhook endpoint not publicly accessible

**Solutions:**

1. Verify webhook configuration in DocuSign Connect settings
2. Ensure your domain has valid SSL certificate
3. Test webhook endpoint accessibility from external network
4. Check DocuSign Connect logs for delivery failures

### Contract not generating properly

**Possible causes:**

- Missing collaboration data
- Invalid user/service information
- Firebase Storage permissions issue
- PDFKit font loading errors

**Solutions:**

1. Verify collaboration exists and has all required fields
2. Check Firebase Storage rules allow admin writes
3. Review server logs for specific error details
4. Ensure all user data is populated (displayName, email)

## Next Steps (Epic 7)

After contract is signed and collaboration status is `in_progress`:

1. Create Collaboration Hub (private project space)
2. Enable file sharing for deliverables
3. Add messaging thread
4. Implement milestone tracking
5. Add "Mark as Complete" button (for buyer)

## Production Checklist

Before going to production:

- [ ] Obtain production DocuSign account
- [ ] Generate production RSA keys
- [ ] Set `DOCUSIGN_ENV=production`
- [ ] Configure production webhook URL
- [ ] Test complete flow in production environment
- [ ] Set up monitoring for webhook failures
- [ ] Implement email notifications (currently TODO)
- [ ] Add comprehensive error logging
- [ ] Set up backup contract storage
- [ ] Review and update legal language with attorney
- [ ] Add support for international contracts (if needed)
