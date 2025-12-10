export type PodcastStatus = 'pending' | 'approved' | 'rejected';

export interface PodcastPlatformLink {
  platform: string; // e.g., "Spotify", "Apple Podcasts", "YouTube", etc.
  url: string;
}

export interface Podcast {
  id: string; // Firestore document ID
  ownerId: string; // Reference to the user who owns the podcast
  title: string;
  description: string;
  coverImageUrl: string;
  categories: string[]; // e.g., Tech, Music, Business
  avgListeners?: number; // Optional
  rssFeedUrl?: string; // Optional
  websiteUrl?: string; // Optional
  platformLinks?: PodcastPlatformLink[]; // Optional - platforms like Spotify, Apple Podcasts, etc.
  status: PodcastStatus;
  isActive?: boolean; // Optional - defaults to true, set to false for soft delete
  deactivatedAt?: Date; // Optional - timestamp when podcast was deactivated
  deactivatedBy?: string; // Optional - user ID who deactivated the podcast
  createdAt: Date; // Firestore Timestamp
  updatedAt: Date; // Firestore Timestamp
}

export type PodcastServiceType = 'guest_spot' | 'ad_read' | 'cross_promotion' | 'other';

export interface PodcastService {
  id: string;
  podcastId: string;
  title: string;
  description: string;
  price: number; // 0 for free/cross-promo
  duration: string; // e.g. "30 mins", "60 mins"
  type: PodcastServiceType;
  createdAt: Date;
  updatedAt: Date;
}
