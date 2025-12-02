/**
 * Match Data Models for UvoCollab
 * Defines interfaces for guest-podcast matching and recommendations
 */

/**
 * Status for match entries
 */
export type MatchStatus = 
  | 'active' // Match identified and active
  | 'collaboration_started' // Parties have started collaboration
  | 'dismissed_by_guest' // Guest dismissed the match
  | 'dismissed_by_podcast' // Podcast dismissed the match
  | 'completed' // Collaboration completed
  | 'expired'; // Match expired without action

/**
 * Match - Represents a mutual interest match between a guest and podcast
 */
export interface Match {
  id: string; // Unique identifier for the match
  guestId: string; // User ID of the guest
  guestName: string; // Cached guest name
  guestImageUrl?: string; // Cached guest profile image
  guestRate?: number; // Guest's rate
  guestTopics?: string[]; // Guest's topics
  podcastId: string; // ID of the podcast
  podcastName: string; // Cached podcast name
  podcastImageUrl?: string; // Cached podcast image
  podcastOwnerId: string; // User ID of the podcast owner
  guestWishlistId: string; // Reference to the guest's wishlist entry
  podcastWishlistId: string; // Reference to the podcast's wishlist entry
  guestOfferAmount: number; // Amount guest offered to pay
  podcastBudgetAmount: number; // Amount podcast offered to pay
  compatibilityScore: number; // Calculated compatibility score (0-100)
  topicOverlap: string[]; // Topics that both parties are interested in
  budgetAlignment: 'perfect' | 'close' | 'negotiable'; // How well budgets align
  status: MatchStatus; // Current status of the match
  matchedAt: Date; // When the match was identified
  notifiedAt?: Date; // When both parties were notified
  guestViewedAt?: Date; // When guest viewed the match
  podcastViewedAt?: Date; // When podcast owner viewed the match
  collaborationId?: string; // Reference to collaboration if started
  dismissedAt?: Date; // When the match was dismissed
  dismissedBy?: 'guest' | 'podcast'; // Who dismissed the match
  expiresAt: Date; // When the match expires (default 60 days)
  createdAt: Date; // When the match was created
  updatedAt?: Date; // When the match was last updated
}

/**
 * Recommendation - Represents a suggested match based on compatibility
 */
export interface Recommendation {
  id: string; // Unique identifier for the recommendation
  targetUserId: string; // User ID receiving the recommendation
  targetUserType: 'guest' | 'podcast'; // Type of user receiving recommendation
  recommendedId: string; // ID of recommended guest or podcast
  recommendedType: 'guest' | 'podcast'; // Type being recommended
  recommendedName: string; // Name of recommended entity
  recommendedImageUrl?: string; // Image of recommended entity
  compatibilityScore: number; // Calculated compatibility score (0-100)
  reasons: string[]; // Reasons for the recommendation (e.g., "Topic match: Technology")
  topicMatches?: string[]; // Matching topics
  budgetMatch?: boolean; // Whether budget/rate aligns
  similarityFactors: {
    topicScore: number; // Score based on topic overlap (0-100)
    budgetScore: number; // Score based on budget alignment (0-100)
    popularityScore: number; // Score based on popularity/reach (0-100)
    recentActivityScore: number; // Score based on recent activity (0-100)
  };
  status: 'active' | 'acted_on' | 'dismissed'; // Status of the recommendation
  createdAt: Date; // When the recommendation was generated
  viewedAt?: Date; // When the user viewed the recommendation
  actedOnAt?: Date; // When user took action (added to wishlist)
  dismissedAt?: Date; // When user dismissed the recommendation
}

/**
 * Match Compatibility Factors - Used to calculate compatibility scores
 */
export interface CompatibilityFactors {
  topicOverlap: number; // Number of overlapping topics
  totalTopics: number; // Total unique topics between both parties
  budgetDifference: number; // Absolute difference between budgets
  budgetAverage: number; // Average of both budgets
  guestVerified: boolean; // Whether guest is verified
  podcastServiceAvailable: boolean; // Whether podcast has guest services
}

/**
 * Create Match Data - Used when creating a new match
 */
export interface CreateMatchData {
  guestId: string;
  podcastId: string;
  guestWishlistId: string;
  podcastWishlistId: string;
  guestOfferAmount: number;
  podcastBudgetAmount: number;
  compatibilityScore: number;
  topicOverlap: string[];
  budgetAlignment: 'perfect' | 'close' | 'negotiable';
}

/**
 * Match Notification Data - Data passed to notification system
 */
export interface MatchNotificationData {
  matchId: string;
  guestId: string;
  guestEmail: string;
  guestName: string;
  podcastId: string;
  podcastOwnerId: string;
  podcastOwnerEmail: string;
  podcastName: string;
  compatibilityScore: number;
  topicOverlap: string[];
}
