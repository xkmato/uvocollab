import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { Recommendation } from '@/app/types/match';

/**
 * Calculate topic similarity score between two sets of topics
 */
function calculateTopicScore(userTopics: string[], targetTopics: string[]): number {
  if (!userTopics || !targetTopics || userTopics.length === 0 || targetTopics.length === 0) {
    return 0;
  }

  const userTopicsLower = userTopics.map(t => t.toLowerCase());
  const targetTopicsLower = targetTopics.map(t => t.toLowerCase());
  
  const matches = userTopicsLower.filter(topic => 
    targetTopicsLower.includes(topic)
  ).length;

  const totalUnique = new Set([...userTopicsLower, ...targetTopicsLower]).size;
  
  return totalUnique > 0 ? (matches / totalUnique) * 100 : 0;
}

/**
 * Calculate budget/rate alignment score
 */
function calculateBudgetScore(userBudget: number, targetRate: number): number {
  // If both are free, perfect match
  if (userBudget === 0 && targetRate === 0) {
    return 100;
  }

  // If user has budget and target is free, great match
  if (userBudget > 0 && targetRate === 0) {
    return 90;
  }

  // If user wants free but target charges, low match
  if (userBudget === 0 && targetRate > 0) {
    return 20;
  }

  // If both have values, calculate how close they are
  const difference = Math.abs(userBudget - targetRate);
  const average = (userBudget + targetRate) / 2;
  
  if (average === 0) return 50;
  
  const percentDifference = (difference / average) * 100;
  
  if (percentDifference <= 10) return 100;
  if (percentDifference <= 25) return 80;
  if (percentDifference <= 50) return 60;
  if (percentDifference <= 100) return 40;
  return 20;
}

/**
 * Calculate overall compatibility score
 */
function calculateCompatibilityScore(
  topicScore: number,
  budgetScore: number,
  popularityScore: number,
  recentActivityScore: number
): number {
  // Weighted average
  const score = (
    topicScore * 0.4 +           // 40% weight on topic match
    budgetScore * 0.3 +           // 30% weight on budget alignment
    popularityScore * 0.15 +      // 15% weight on popularity
    recentActivityScore * 0.15    // 15% weight on recent activity
  );
  
  return Math.round(score);
}

/**
 * Generate reasons for recommendation
 */
function generateReasons(
  topicMatches: string[],
  budgetMatch: boolean,
  isVerified: boolean,
  isActive: boolean
): string[] {
  const reasons: string[] = [];
  
  if (topicMatches.length > 0) {
    reasons.push(`Shared interests: ${topicMatches.slice(0, 3).join(', ')}`);
  }
  
  if (budgetMatch) {
    reasons.push('Budget/rate alignment');
  }
  
  if (isVerified) {
    reasons.push('Verified guest');
  }
  
  if (isActive) {
    reasons.push('Recently active on platform');
  }
  
  return reasons;
}

/**
 * GET /api/matching/recommendations
 * Get personalized recommendations for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user document
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const isGuest = userData?.isGuest || false;
    const hasPodcast = userData?.hasPodcast || false;

    if (!isGuest && !hasPodcast) {
      return NextResponse.json(
        { message: 'User is neither a guest nor a podcast owner' },
        { status: 400 }
      );
    }

    const recommendations: Partial<Recommendation>[] = [];

    if (isGuest) {
      // Recommend podcasts to guest
      const guestTopics = userData?.guestTopics || [];
      const guestRate = userData?.guestRate || 0;

      // Get podcasts
      const podcastsSnapshot = await adminDb.collection('podcasts').get();
      
      // Get guest's existing wishlists to filter out
      const guestWishlistsSnapshot = await adminDb
        .collection('guestWishlists')
        .where('guestId', '==', uid)
        .get();
      
      const wishlistedPodcastIds = new Set(
        guestWishlistsSnapshot.docs.map(doc => doc.data().podcastId)
      );

      for (const podcastDoc of podcastsSnapshot.docs) {
        const podcastData = podcastDoc.data();
        const podcastId = podcastDoc.id;

        // Skip if already in wishlist
        if (wishlistedPodcastIds.has(podcastId)) continue;

        // Skip own podcasts
        if (podcastData.ownerId === uid) continue;

        // Calculate scores
        const podcastTopics = podcastData.category ? [podcastData.category] : [];
        const topicScore = calculateTopicScore(guestTopics, podcastTopics);
        
        // For podcasts, we might not have a budget, so use 0 (free) as default
        const podcastBudget = 0; // Could be enhanced by checking service prices
        const budgetScore = calculateBudgetScore(podcastBudget, guestRate);
        
        // Popularity score based on services or episodes (simplified)
        const popularityScore = 50; // Could be enhanced with actual metrics
        
        // Recent activity score (simplified)
        const recentActivityScore = 50; // Could check last updated date
        
        const compatibilityScore = calculateCompatibilityScore(
          topicScore,
          budgetScore,
          popularityScore,
          recentActivityScore
        );

        // Only recommend if compatibility is decent
        if (compatibilityScore < 30) continue;

        const topicMatches = guestTopics.filter((topic: string) =>
          podcastTopics.map((t: string) => t.toLowerCase()).includes(topic.toLowerCase())
        );

        const budgetMatch = budgetScore >= 60;
        const reasons = generateReasons(
          topicMatches,
          budgetMatch,
          false,
          true
        );

        recommendations.push({
          targetUserId: uid,
          targetUserType: 'guest',
          recommendedId: podcastId,
          recommendedType: 'podcast',
          recommendedName: podcastData.name || 'Podcast',
          recommendedImageUrl: podcastData.imageUrl,
          compatibilityScore,
          reasons,
          topicMatches,
          budgetMatch,
          similarityFactors: {
            topicScore,
            budgetScore,
            popularityScore,
            recentActivityScore
          },
          status: 'active',
          createdAt: new Date()
        });
      }
    }

    if (hasPodcast) {
      // Recommend guests to podcast owner
      // Get user's podcasts
      const podcastsSnapshot = await adminDb
        .collection('podcasts')
        .where('ownerId', '==', uid)
        .get();

      if (podcastsSnapshot.empty) {
        return NextResponse.json({
          success: true,
          recommendations: []
        });
      }

      // Use first podcast for recommendations (could be enhanced to handle multiple)
      const firstPodcast = podcastsSnapshot.docs[0];
      const podcastData = firstPodcast.data();
      const podcastId = firstPodcast.id;
      const podcastTopics = podcastData.category ? [podcastData.category] : [];
      const podcastBudget = 0; // Could be enhanced by checking service budgets

      // Get existing wishlist to filter out
      const podcastWishlistsSnapshot = await adminDb
        .collection('podcastGuestWishlists')
        .where('podcastId', '==', podcastId)
        .get();
      
      const wishlistedGuestIds = new Set(
        podcastWishlistsSnapshot.docs
          .filter(doc => doc.data().guestId)
          .map(doc => doc.data().guestId)
      );

      // Get all guests
      const guestsSnapshot = await adminDb
        .collection('users')
        .where('isGuest', '==', true)
        .get();

      for (const guestDoc of guestsSnapshot.docs) {
        const guestData = guestDoc.data();
        const guestId = guestDoc.id;

        // Skip if already in wishlist
        if (wishlistedGuestIds.has(guestId)) continue;

        // Skip self
        if (guestId === uid) continue;

        const guestTopics = guestData.guestTopics || [];
        const guestRate = guestData.guestRate || 0;

        // Calculate scores
        const topicScore = calculateTopicScore(podcastTopics, guestTopics);
        const budgetScore = calculateBudgetScore(podcastBudget, guestRate);
        
        // Popularity score based on verification and appearances
        let popularityScore = 30;
        if (guestData.isVerifiedGuest) popularityScore += 30;
        if (guestData.previousAppearances && guestData.previousAppearances.length > 0) {
          popularityScore += Math.min(40, guestData.previousAppearances.length * 10);
        }
        
        // Recent activity score (simplified)
        const recentActivityScore = 50;
        
        const compatibilityScore = calculateCompatibilityScore(
          topicScore,
          budgetScore,
          popularityScore,
          recentActivityScore
        );

        // Only recommend if compatibility is decent
        if (compatibilityScore < 30) continue;

        const topicMatches = podcastTopics.filter((topic: string) =>
          guestTopics.map((t: string) => t.toLowerCase()).includes(topic.toLowerCase())
        );

        const budgetMatch = budgetScore >= 60;
        const reasons = generateReasons(
          topicMatches,
          budgetMatch,
          guestData.isVerifiedGuest || false,
          true
        );

        recommendations.push({
          targetUserId: uid,
          targetUserType: 'podcast',
          recommendedId: guestId,
          recommendedType: 'guest',
          recommendedName: guestData.displayName || 'Guest',
          recommendedImageUrl: guestData.profileImageUrl,
          compatibilityScore,
          reasons,
          topicMatches,
          budgetMatch,
          similarityFactors: {
            topicScore,
            budgetScore,
            popularityScore,
            recentActivityScore
          },
          status: 'active',
          createdAt: new Date()
        });
      }
    }

    // Sort by compatibility score
    recommendations.sort((a, b) => 
      (b.compatibilityScore || 0) - (a.compatibilityScore || 0)
    );

    // Limit to top 20 recommendations
    const topRecommendations = recommendations.slice(0, 20);

    return NextResponse.json({
      success: true,
      recommendations: topRecommendations,
      userType: isGuest ? 'guest' : 'podcast'
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to generate recommendations',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
