# Podcast Image Migration

This script updates all existing podcasts in the database to use cover images from their RSS feeds.

## What it does

- Fetches all podcasts from the database
- For each podcast that has an RSS feed URL but no cover image:
  - Validates the RSS feed
  - Extracts the cover image URL from the feed
  - Updates the podcast document with the extracted image URL
- Skips podcasts that already have cover images
- Provides a detailed summary of the migration

## Prerequisites

Make sure you have the required environment variables set up:

- `BE_FIREBASE_SERVICE_ACCOUNT_KEY` (JSON string), OR
- `BE_FIREBASE_PROJECT_ID`, `BE_FIREBASE_PRIVATE_KEY`, and `BE_FIREBASE_CLIENT_EMAIL`

## Usage

Run the migration script:

```bash
npm run migrate:podcast-images
```

Or directly with node:

```bash
node scripts/migrate-podcast-images.js
```

## Output

The script will display:

- Progress for each podcast being processed
- Status indicators (✅ updated, ⏭️ skipped, ❌ failed)
- A summary at the end showing:
  - Total podcasts processed
  - Number successfully updated
  - Number skipped (already had image or no RSS feed)
  - Number failed

## Safety

- The script is safe to run multiple times
- It skips podcasts that already have cover images
- It only updates the `coverImageUrl` and `updatedAt` fields
- No podcasts are deleted or have other fields modified

## Notes

- This is a one-time migration script
- Going forward, new podcasts will automatically get their cover images from RSS feeds
- Podcasts with invalid RSS feeds or feeds without cover images will be skipped
