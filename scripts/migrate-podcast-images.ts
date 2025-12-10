/**
 * Migration script to update existing podcasts with cover images from their RSS feeds
 * Run this once to populate coverImageUrl for all existing podcasts that have RSS feeds
 * 
 * Usage: npx tsx scripts/migrate-podcast-images.ts
 */

import { validateRssFeed } from '../app/lib/validateRss';
import { adminDb } from '../lib/firebase-admin';

async function migratePodcastImages() {
  console.log('🚀 Starting podcast image migration...\n');

  try {
    // Fetch all podcasts
    const podcastsSnapshot = await adminDb.collection('podcasts').get();
    
    if (podcastsSnapshot.empty) {
      console.log('No podcasts found.');
      return;
    }

    console.log(`Found ${podcastsSnapshot.size} podcasts to process.\n`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const doc of podcastsSnapshot.docs) {
      const podcast = doc.data();
      const podcastId = doc.id;
      const title = podcast.title || 'Untitled';
      
      console.log(`Processing: ${title} (${podcastId})`);

      // Skip if no RSS feed
      if (!podcast.rssFeedUrl) {
        console.log(`  ⏭️  Skipped - No RSS feed URL\n`);
        skipped++;
        continue;
      }

      // Skip if already has a cover image
      if (podcast.coverImageUrl) {
        console.log(`  ⏭️  Skipped - Already has cover image\n`);
        skipped++;
        continue;
      }

      try {
        // Validate RSS feed and extract cover image
        console.log(`  🔍 Fetching RSS feed...`);
        const rssValidation = await validateRssFeed(podcast.rssFeedUrl);

        if (!rssValidation.isValid) {
          console.log(`  ❌ Failed - Invalid RSS feed: ${rssValidation.error}\n`);
          failed++;
          continue;
        }

        if (!rssValidation.coverImageUrl) {
          console.log(`  ⚠️  Warning - RSS feed has no cover image\n`);
          skipped++;
          continue;
        }

        // Update podcast with cover image
        await adminDb.collection('podcasts').doc(podcastId).update({
          coverImageUrl: rssValidation.coverImageUrl,
          updatedAt: new Date(),
        });

        console.log(`  ✅ Updated with image: ${rssValidation.coverImageUrl}\n`);
        updated++;

      } catch (error) {
        console.log(`  ❌ Error processing: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        failed++;
      }
    }

    console.log('─────────────────────────────────────────');
    console.log('📊 Migration Summary:');
    console.log(`   Total podcasts: ${podcastsSnapshot.size}`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log('─────────────────────────────────────────\n');

    if (updated > 0) {
      console.log('✨ Migration completed successfully!');
    } else {
      console.log('ℹ️  No podcasts were updated.');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migratePodcastImages()
  .then(() => {
    console.log('\n✅ Script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script error:', error);
    process.exit(1);
  });
