import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { Match, CompatibilityFactors, MatchNotificationData } from '@/app/types/match';
import { GuestWishlist, PodcastGuestWishlist } from '@/app/types/guest';
import { sendEmail } from '@/lib/mailgun';

/**
 * Calculate compatibility score between a guest and podcast
 */
function calculateCompatibilityScore(
  guestWishlist: GuestWishlist,
  podcastWishlist: PodcastGuestWishlist,
  factors: CompatibilityFactors
): number {
  let score = 0;

  // Topic overlap score (40% weight)
  const topicScore = factors.totalTopics > 0 
    ? (factors.topicOverlap / factors.totalTopics) * 40 
    : 0;
  score += topicScore;

  // Budget alignment score (30% weight)
  let budgetScore = 0;
  if (guestWishlist.offerAmount === 0 && podcastWishlist.budgetAmount === 0) {
    // Both free - perfect match
    budgetScore = 30;
  } else if (guestWishlist.offerAmount > 0 && podcastWishlist.budgetAmount > 0) {
    // Both paid - check how they align
    // If guest pays and podcast pays, they might need to negotiate
    budgetScore = 15; // Medium score for negotiation needed
  } else if (guestWishlist.offerAmount === 0 && podcastWishlist.budgetAmount > 0) {
    // Guest appears free, podcast willing to pay - great match
    budgetScore = 30;
  } else if (guestWishlist.offerAmount > 0 && podcastWishlist.budgetAmount === 0) {
    // Guest wants to pay, podcast offers free - good match
    budgetScore = 25;
  }
  score += budgetScore;

  // Verification bonus (15% weight)
  if (factors.guestVerified) {
    score += 15;
  }

  // Service availability bonus (15% weight)
  if (factors.podcastServiceAvailable) {
    score += 15;
  }

  return Math.min(Math.round(score), 100);
}

/**
 * Determine budget alignment category
 */
function determineBudgetAlignment(
  guestOffer: number,
  podcastBudget: number
): 'perfect' | 'close' | 'negotiable' {
  if (guestOffer === 0 && podcastBudget === 0) {
    return 'perfect'; // Both free
  }
  
  if (guestOffer === 0 && podcastBudget > 0) {
    return 'perfect'; // Guest free, podcast will pay
  }
  
  if (guestOffer > 0 && podcastBudget === 0) {
    return 'close'; // Guest will pay, podcast free
  }
  
  // Both have budgets - needs negotiation
  return 'negotiable';
}

/**
 * Find topic overlap between guest and podcast
 */
function findTopicOverlap(guestTopics: string[], podcastTopics?: string[]): string[] {
  if (!podcastTopics || podcastTopics.length === 0) {
    return [];
  }
  
  const podcastTopicsLower = podcastTopics.map(t => t.toLowerCase());
  
  return guestTopics.filter(topic => 
    podcastTopicsLower.includes(topic.toLowerCase())
  );
}

/**
 * Send match notification emails to both parties
 */
async function sendMatchNotifications(data: MatchNotificationData): Promise<void> {
  const matchUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/matches/${data.matchId}`;
  
  // Email to guest
  await sendEmail({
    to: data.guestEmail,
    subject: `🎉 New Match: ${data.podcastName} wants to collaborate!`,
    html: `
      <h2>Great news! You have a new match!</h2>
      <p>Hi ${data.guestName},</p>
      <p><strong>${data.podcastName}</strong> is interested in having you as a guest on their podcast!</p>
      <p><strong>Compatibility Score:</strong> ${data.compatibilityScore}%</p>
      ${data.topicOverlap.length > 0 ? `
        <p><strong>Shared Topics:</strong> ${data.topicOverlap.join(', ')}</p>
      ` : ''}
      <p>This is a mutual match - you both added each other to your wishlists!</p>
      <p><a href="${matchUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">View Match Details</a></p>
      <p>Start a collaboration to discuss the details and schedule your appearance.</p>
      <p>Best regards,<br>The UvoCollab Team</p>
    `,
    text: `Great news! You have a new match!\n\nHi ${data.guestName},\n\n${data.podcastName} is interested in having you as a guest on their podcast!\n\nCompatibility Score: ${data.compatibilityScore}%\n${data.topicOverlap.length > 0 ? `Shared Topics: ${data.topicOverlap.join(', ')}\n` : ''}\nThis is a mutual match - you both added each other to your wishlists!\n\nView match details: ${matchUrl}\n\nStart a collaboration to discuss the details and schedule your appearance.\n\nBest regards,\nThe UvoCollab Team`
  });

  // Email to podcast owner
  await sendEmail({
    to: data.podcastOwnerEmail,
    subject: `🎉 New Match: ${data.guestName} wants to appear on your podcast!`,
    html: `
      <h2>Great news! You have a new match!</h2>
      <p>Hi,</p>
      <p><strong>${data.guestName}</strong> is interested in appearing on <strong>${data.podcastName}</strong>!</p>
      <p><strong>Compatibility Score:</strong> ${data.compatibilityScore}%</p>
      ${data.topicOverlap.length > 0 ? `
        <p><strong>Shared Topics:</strong> ${data.topicOverlap.join(', ')}</p>
      ` : ''}
      <p>This is a mutual match - you both added each other to your wishlists!</p>
      <p><a href="${matchUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">View Match Details</a></p>
      <p>Start a collaboration to discuss the details and schedule the recording.</p>
      <p>Best regards,<br>The UvoCollab Team</p>
    `,
    text: `Great news! You have a new match!\n\nHi,\n\n${data.guestName} is interested in appearing on ${data.podcastName}!\n\nCompatibility Score: ${data.compatibilityScore}%\n${data.topicOverlap.length > 0 ? `Shared Topics: ${data.topicOverlap.join(', ')}\n` : ''}\nThis is a mutual match - you both added each other to your wishlists!\n\nView match details: ${matchUrl}\n\nStart a collaboration to discuss the details and schedule the recording.\n\nBest regards,\nThe UvoCollab Team`
  });
}

/**
 * POST /api/matching/check-matches
 * Check for mutual interest matches and create match records
 * Can be called manually or via cron job
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication (admin or cron job)
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      const isAdmin = userDoc.data()?.role === 'admin';
      if (!isAdmin) {
        return NextResponse.json(
          { message: 'Forbidden: Admin access required' },
          { status: 403 }
        );
      }
    } catch {
      // Check if it's a cron secret
      const cronSecret = process.env.CRON_SECRET;
      if (!cronSecret || token !== cronSecret) {
        return NextResponse.json(
          { message: 'Unauthorized: Invalid token' },
          { status: 401 }
        );
      }
    }

    // Fetch all active guest wishlists
    const guestWishlistsSnapshot = await adminDb
      .collection('guestWishlists')
      .where('status', '==', 'pending')
      .get();

    // Fetch all active podcast guest wishlists for registered guests only
    const podcastWishlistsSnapshot = await adminDb
      .collection('podcastGuestWishlists')
      .where('status', '==', 'pending')
      .where('isRegistered', '==', true)
      .get();

    const guestWishlists = guestWishlistsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GuestWishlist[];

    const podcastWishlists = podcastWishlistsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PodcastGuestWishlist[];

    const newMatches: string[] = [];
    const errors: string[] = [];

    // Find mutual interest matches
    for (const guestWishlist of guestWishlists) {
      const matchingPodcastWishlists = podcastWishlists.filter(
        pw => pw.podcastId === guestWishlist.podcastId && 
              pw.guestId === guestWishlist.guestId
      );

      for (const podcastWishlist of matchingPodcastWishlists) {
        try {
          // Check if match already exists
          const existingMatchSnapshot = await adminDb
            .collection('matches')
            .where('guestId', '==', guestWishlist.guestId)
            .where('podcastId', '==', guestWishlist.podcastId)
            .where('status', 'in', ['active', 'collaboration_started'])
            .get();

          if (!existingMatchSnapshot.empty) {
            continue; // Match already exists
          }

          // Fetch guest and podcast details
          const guestDoc = await adminDb.collection('users').doc(guestWishlist.guestId).get();
          const podcastDoc = await adminDb.collection('podcasts').doc(guestWishlist.podcastId).get();

          if (!guestDoc.exists || !podcastDoc.exists) {
            errors.push(`Missing guest or podcast data for match between ${guestWishlist.guestId} and ${guestWishlist.podcastId}`);
            continue;
          }

          const guestData = guestDoc.data();
          const podcastData = podcastDoc.data();

          // Calculate topic overlap
          const topicOverlap = findTopicOverlap(
            guestWishlist.topics,
            podcastWishlist.preferredTopics
          );

          // Calculate compatibility factors
          const factors: CompatibilityFactors = {
            topicOverlap: topicOverlap.length,
            totalTopics: [...new Set([...guestWishlist.topics, ...(podcastWishlist.preferredTopics || [])])].length,
            budgetDifference: Math.abs(guestWishlist.offerAmount - podcastWishlist.budgetAmount),
            budgetAverage: (guestWishlist.offerAmount + podcastWishlist.budgetAmount) / 2,
            guestVerified: guestData?.isVerifiedGuest || false,
            podcastServiceAvailable: true // Could check if podcast has guest services
          };

          // Calculate compatibility score
          const compatibilityScore = calculateCompatibilityScore(
            guestWishlist,
            podcastWishlist,
            factors
          );

          // Determine budget alignment
          const budgetAlignment = determineBudgetAlignment(
            guestWishlist.offerAmount,
            podcastWishlist.budgetAmount
          );

          // Create match record
          const matchData: Partial<Match> = {
            guestId: guestWishlist.guestId,
            guestName: guestData?.displayName || 'Guest',
            guestImageUrl: guestData?.profileImageUrl,
            guestRate: guestData?.guestRate,
            guestTopics: guestData?.guestTopics,
            podcastId: guestWishlist.podcastId,
            podcastName: podcastData?.name || 'Podcast',
            podcastImageUrl: podcastData?.imageUrl,
            podcastOwnerId: podcastData?.ownerId,
            guestWishlistId: guestWishlist.id,
            podcastWishlistId: podcastWishlist.id,
            guestOfferAmount: guestWishlist.offerAmount,
            podcastBudgetAmount: podcastWishlist.budgetAmount,
            compatibilityScore,
            topicOverlap,
            budgetAlignment,
            status: 'active',
            matchedAt: new Date(),
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
            createdAt: new Date()
          };

          const matchRef = await adminDb.collection('matches').add(matchData);
          newMatches.push(matchRef.id);

          // Update wishlist statuses
          await adminDb.collection('guestWishlists').doc(guestWishlist.id).update({
            status: 'matched',
            updatedAt: new Date()
          });

          await adminDb.collection('podcastGuestWishlists').doc(podcastWishlist.id).update({
            status: 'matched',
            updatedAt: new Date()
          });

          // Send notifications
          const notificationData: MatchNotificationData = {
            matchId: matchRef.id,
            guestId: guestWishlist.guestId,
            guestEmail: guestData?.email || '',
            guestName: guestData?.displayName || 'Guest',
            podcastId: guestWishlist.podcastId,
            podcastOwnerId: podcastData?.ownerId,
            podcastOwnerEmail: '', // Will fetch below
            podcastName: podcastData?.name || 'Podcast',
            compatibilityScore,
            topicOverlap
          };

          // Fetch podcast owner email
          const ownerDoc = await adminDb.collection('users').doc(podcastData?.ownerId).get();
          if (ownerDoc.exists) {
            notificationData.podcastOwnerEmail = ownerDoc.data()?.email || '';
            
            // Send notifications
            await sendMatchNotifications(notificationData);
            
            // Update match with notification timestamp
            await adminDb.collection('matches').doc(matchRef.id).update({
              notifiedAt: new Date()
            });
          }

        } catch (error) {
          console.error('Error creating match:', error);
          errors.push(`Failed to create match: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Found ${newMatches.length} new matches`,
      matchIds: newMatches,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in check-matches:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to check matches',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/matching/check-matches
 * Get information about the matching system
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get statistics
    const matchesSnapshot = await adminDb.collection('matches').get();
    const activeMatches = matchesSnapshot.docs.filter(doc => doc.data().status === 'active').length;
    const totalMatches = matchesSnapshot.docs.length;

    const guestWishlistsSnapshot = await adminDb
      .collection('guestWishlists')
      .where('status', '==', 'pending')
      .get();

    const podcastWishlistsSnapshot = await adminDb
      .collection('podcastGuestWishlists')
      .where('status', '==', 'pending')
      .where('isRegistered', '==', true)
      .get();

    return NextResponse.json({
      success: true,
      statistics: {
        totalMatches,
        activeMatches,
        pendingGuestWishlists: guestWishlistsSnapshot.size,
        pendingPodcastWishlists: podcastWishlistsSnapshot.size
      }
    });

  } catch (error) {
    console.error('Error getting match statistics:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to get match statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
