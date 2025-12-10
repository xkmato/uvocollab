# Legend Public Profile (Storefront)

## Overview

The Legend Public Profile page is the public-facing "storefront" for verified Legends. It displays their profile information, verified badge, and available services that buyers can request collaborations for.

## Route

`/legend/[legendId]` - Dynamic route where `legendId` is the Legend's user UID

## Features

### 1. Profile Display

- **Hero Section**: Gradient header with profile image and information
- **Profile Image**: Legend's profile photo (or initial if not set)
- **Verified Badge**: Prominent "Verified Legend" badge with checkmark icon
- **Bio**: Legend's professional biography
- **Management Info**: Contact information for management/booking

### 2. Services Listing

- Displays all **active** services created by the Legend
- Each service card shows:
  - Service title (e.g., "16-bar verse")
  - Detailed description
  - Price in UGX
  - Deliverable information (e.g., "1 WAV file")
  - "Request Collaboration" button

### 3. Trust Indicators

- Verified Professional badge
- Secure Payments indicator
- Legal Contracts indicator

## Access Control

- **Public page** - No authentication required
- Only displays users with `role: 'legend'`
- Returns 404 if user is not a Legend or doesn't exist
- Only shows services where `isActive: true`

## User Flow

1. Buyer discovers Legend through marketplace (Epic 4) or direct link
2. Buyer views Legend's profile and available services
3. Buyer clicks "Request Collaboration" on a service (triggers Epic 5 flow)

## Components Used

- Next.js Image component for optimized profile images
- Firestore queries for user data and services subcollection
- Dynamic routing with useParams

## Data Sources

- `users/{legendId}` - Legend profile data
- `users/{legendId}/services` - Legend's services subcollection (filtered by `isActive: true`)

## Related Tasks

- **Epic 3 - Task 3.3**: Legend Public Profile Page (Storefront) ✅ Completed
- **Epic 4 - Task 4.1**: Marketplace Browse Page (To Do)
- **Epic 5 - Task 5.2**: Collaboration Request Form (To Do)

## Testing

To test the Legend public profile:

1. Ensure you have a Legend user with:

   - `role: 'legend'`
   - Profile information (displayName, bio, etc.)
   - At least one active service

2. Navigate to: `/legend/{legendUserId}`

3. Verify:
   - Profile displays correctly
   - Verified badge is visible
   - Services are listed
   - "Request Collaboration" buttons are present

## Next Steps

- **Task 4.1**: Create marketplace browse page with links to Legend profiles
- **Task 5.2**: Implement collaboration request form functionality
