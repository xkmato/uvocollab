/**
 * Migration script to update existing podcasts with cover images from their RSS feeds
 * Run this once to populate coverImageUrl for all existing podcasts that have RSS feeds
 *
 * Usage: node scripts/migrate-podcast-images.js
 */

// Load environment variables from .env.local
require("dotenv").config({ path: ".env.local" });

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const Parser = require("rss-parser");

const parser = new Parser();

// Initialize Firebase Admin using environment variables (same as lib/firebase-admin.ts)
if (!getApps().length) {
  const hasIndividualCredentials =
    process.env.BE_FIREBASE_PROJECT_ID &&
    process.env.BE_FIREBASE_PRIVATE_KEY &&
    process.env.BE_FIREBASE_CLIENT_EMAIL;

  let serviceAccount;
  if (process.env.BE_FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.BE_FIREBASE_SERVICE_ACCOUNT_KEY);
  } else if (hasIndividualCredentials) {
    serviceAccount = {
      projectId: process.env.BE_FIREBASE_PROJECT_ID,
      privateKey: process.env.BE_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.BE_FIREBASE_CLIENT_EMAIL,
    };
  }

  initializeApp(
    serviceAccount
      ? {
          credential: cert(serviceAccount),
          projectId:
            process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
            process.env.BE_FIREBASE_PROJECT_ID,
        }
      : {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        }
  );
}

const db = getFirestore();

async function validateRssFeed(feedUrl) {
  try {
    if (!feedUrl || typeof feedUrl !== "string") {
      return { isValid: false, error: "RSS feed URL is required" };
    }

    const feed = await parser.parseURL(feedUrl);

    if (!feed.title) {
      return {
        isValid: false,
        error: "RSS feed is missing required title field",
      };
    }

    const coverImageUrl = feed.itunes?.image || feed.image?.url || null;

    return {
      isValid: true,
      feedTitle: feed.title,
      itemCount: feed.items?.length || 0,
      coverImageUrl: coverImageUrl || undefined,
    };
  } catch (error) {
    console.error("RSS validation error:", error);
    return {
      isValid: false,
      error: error.message || "Failed to validate RSS feed",
    };
  }
}

async function migratePodcastImages() {
  console.log("🚀 Starting podcast image migration...\n");

  try {
    // Fetch all podcasts
    const podcastsSnapshot = await db.collection("podcasts").get();

    if (podcastsSnapshot.empty) {
      console.log("No podcasts found.");
      return;
    }

    console.log(`Found ${podcastsSnapshot.size} podcasts to process.\n`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const doc of podcastsSnapshot.docs) {
      const podcast = doc.data();
      const podcastId = doc.id;
      const title = podcast.title || "Untitled";

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
          console.log(
            `  ❌ Failed - Invalid RSS feed: ${rssValidation.error}\n`
          );
          failed++;
          continue;
        }

        if (!rssValidation.coverImageUrl) {
          console.log(`  ⚠️  Warning - RSS feed has no cover image\n`);
          skipped++;
          continue;
        }

        // Update podcast with cover image
        await db.collection("podcasts").doc(podcastId).update({
          coverImageUrl: rssValidation.coverImageUrl,
          updatedAt: new Date(),
        });

        console.log(
          `  ✅ Updated with image: ${rssValidation.coverImageUrl}\n`
        );
        updated++;
      } catch (error) {
        console.log(
          `  ❌ Error processing: ${error.message || "Unknown error"}\n`
        );
        failed++;
      }
    }

    console.log("─────────────────────────────────────────");
    console.log("📊 Migration Summary:");
    console.log(`   Total podcasts: ${podcastsSnapshot.size}`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log("─────────────────────────────────────────\n");

    if (updated > 0) {
      console.log("✨ Migration completed successfully!");
    } else {
      console.log("ℹ️  No podcasts were updated.");
    }
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
migratePodcastImages()
  .then(() => {
    console.log("\n✅ Script finished.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script error:", error);
    process.exit(1);
  });
