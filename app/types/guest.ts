/**
 * Guest Data Models for UvoCollab
 * Defines interfaces for guest wishlists, podcast guest wishlists, and guest invitations
 */

/**
 * Status for wishlist entries
 */
export type WishlistStatus = 'pending' | 'contacted' | 'matched' | 'declined' | 'completed';

/**
 * Status for guest invitations
 */
export type InviteStatus = 'sent' | 'accepted' | 'declined' | 'expired';

/**
 * Guest Wishlist - Podcasts that a guest wants to appear on
 */
export interface GuestWishlist {
  id: string; // Unique identifier for the wishlist entry
  guestId: string; // User ID of the guest
  podcastId: string; // ID of the podcast they want to appear on
  podcastName?: string; // Cached podcast name for easy display
  podcastImageUrl?: string; // Cached podcast image
  offerAmount: number; // Amount the guest is willing to pay (0 for free)
  topics: string[]; // Topics the guest wants to discuss
  message: string; // Pitch message to the podcast owner
  status: WishlistStatus; // Current status of the wishlist entry
  createdAt: Date; // When the entry was created
  updatedAt?: Date; // When the entry was last updated
  viewedByPodcast?: boolean; // Whether the podcast owner has viewed this
  viewedAt?: Date; // When it was viewed
}

/**
 * Podcast Guest Wishlist - Guests that a podcast wants to host
 */
export interface PodcastGuestWishlist {
  id: string; // Unique identifier for the wishlist entry
  podcastId: string; // ID of the podcast
  podcastName?: string; // Cached podcast name
  guestId?: string; // User ID of the guest (if registered)
  guestName: string; // Name of the guest
  guestEmail?: string; // Email of the guest (if known)
  guestProfileImageUrl?: string; // Cached guest image (if registered)
  budgetAmount: number; // Amount the podcast is willing to pay (0 for free)
  preferredTopics?: string[]; // Topics the podcast wants to discuss
  notes: string; // Notes about why they want this guest
  contactInfo?: string; // Additional contact info (if guest not registered)
  status: WishlistStatus; // Current status of the wishlist entry
  isRegistered: boolean; // Whether the guest is registered on the platform
  inviteSent?: boolean; // Whether an invitation has been sent
  inviteSentAt?: Date; // When the invitation was sent
  createdAt: Date; // When the entry was created
  updatedAt?: Date; // When the entry was last updated
  viewedByGuest?: boolean; // Whether the guest has viewed this (if registered)
  viewedAt?: Date; // When it was viewed
}

/**
 * Guest Invitation - Invitations sent to potential guests
 */
export interface GuestInvite {
  id: string; // Unique identifier for the invitation
  inviteToken: string; // Unique token for the invite link
  podcastId: string; // ID of the podcast sending the invite
  podcastName: string; // Name of the podcast
  podcastImageUrl?: string; // Podcast image for display
  podcastOwnerId: string; // User ID of the podcast owner
  guestEmail: string; // Email address of the invited guest
  guestName: string; // Name of the invited guest
  offeredAmount: number; // Amount offered to the guest (0 for free)
  message: string; // Personal message from the podcast owner
  preferredTopics?: string[]; // Topics the podcast wants to discuss
  status: InviteStatus; // Current status of the invitation
  sentAt: Date; // When the invitation was sent
  acceptedAt?: Date; // When the invitation was accepted
  declinedAt?: Date; // When the invitation was declined
  expiresAt: Date; // When the invitation expires (default 30 days)
  acceptedByUserId?: string; // User ID if the guest accepted and signed up
  wishlistEntryId?: string; // Link back to the wishlist entry that triggered this
}

/**
 * Create Guest Wishlist Data - Used when creating a new wishlist entry
 */
export interface CreateGuestWishlistData {
  guestId: string;
  podcastId: string;
  offerAmount: number;
  topics: string[];
  message: string;
}

/**
 * Create Podcast Guest Wishlist Data - Used when creating a new wishlist entry
 */
export interface CreatePodcastGuestWishlistData {
  podcastId: string;
  guestId?: string; // Optional if guest is not registered
  guestName: string;
  guestEmail?: string; // Optional if guest is not registered
  budgetAmount: number;
  preferredTopics?: string[];
  notes: string;
  contactInfo?: string;
  isRegistered: boolean;
}

/**
 * Create Guest Invite Data - Used when creating a new invitation
 */
export interface CreateGuestInviteData {
  podcastId: string;
  podcastOwnerId: string;
  guestEmail: string;
  guestName: string;
  offeredAmount: number;
  message: string;
  preferredTopics?: string[];
  wishlistEntryId?: string;
  expirationDays?: number; // Default 30 days
}

/**
 * Update Wishlist Status Data - Used when updating wishlist status
 */
export interface UpdateWishlistStatusData {
  status: WishlistStatus;
  notes?: string;
}

/**
 * Match - Represents a mutual interest between guest and podcast
 */
export interface Match {
  id: string; // Unique identifier for the match
  guestId: string; // User ID of the guest
  guestName: string; // Cached guest name
  guestImageUrl?: string; // Cached guest image
  podcastId: string; // ID of the podcast
  podcastName: string; // Cached podcast name
  podcastImageUrl?: string; // Cached podcast image
  guestWishlistId: string; // Reference to guest's wishlist entry
  podcastWishlistId: string; // Reference to podcast's wishlist entry
  guestOffer: number; // Amount guest offered
  podcastBudget: number; // Amount podcast budgeted
  compatibilityScore: number; // Score from 0-100 based on alignment
  topicOverlap: string[]; // Common topics both parties mentioned
  matchedAt: Date; // When the match was identified
  status: 'new' | 'viewed' | 'contacted' | 'collaboration_started' | 'dismissed'; // Match status
  viewedByGuest?: boolean; // Whether guest has viewed the match
  viewedByPodcast?: boolean; // Whether podcast has viewed the match
  collaborationId?: string; // ID of collaboration if one was started
}
