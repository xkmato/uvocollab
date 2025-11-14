# Legend Application Setup

## Environment Variables Required

For the legend application backend to work, you need to configure Firebase Admin credentials:

### Option 1: Using Service Account Key (Recommended for Production)

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Add to your `.env.local`:

```
FIREBASE_SERVICE_ACCOUNT_KEY=<paste the entire JSON content here as a single line>
```

### Option 2: Using Application Default Credentials (For Local Development)

If you have gcloud CLI installed and authenticated:

```bash
gcloud auth application-default login
```

The system will automatically use your application default credentials.

## Testing the Implementation

To test the legend application submission:

1. Navigate to `/apply`
2. Fill out the form with all required fields
3. Submit the application
4. The system will:
   - Create a new Firebase Auth user (if the email doesn't exist) with a temporary password
   - Create/update a user document in Firestore with role `legend_applicant`
   - Create a new document in the `legend_applications` collection with status `pending`
   - Return a success message

## What Was Implemented (Task 2.2)

✅ Created API route: `/app/api/legend-application/route.ts`

- Validates all required form fields
- Checks if user exists by email
- Creates new Firebase Auth account if needed (with temporary password)
- Creates or updates user document with role 'legend_applicant'
- Creates legend_applications document with status 'pending'
- Returns success response to frontend

✅ Created types: `/app/types/legendApplication.ts`

- `LegendApplicationData` interface for form data
- `LegendApplication` interface for Firestore document

✅ Created Firebase Admin SDK configuration: `/lib/firebase-admin.ts`

- Server-side Firebase Admin initialization
- Supports both service account and application default credentials

✅ Updated apply page: `/app/apply/page.tsx`

- Replaced mock API call with actual fetch to backend endpoint
- Proper error handling and user feedback

## Next Steps

Task 2.3 will implement the Admin Vetting Dashboard to review these applications.
