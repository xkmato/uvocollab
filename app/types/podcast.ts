export type PodcastStatus = 'pending' | 'approved' | 'rejected';

export interface Podcast {
  id: string; // Firestore document ID
  ownerId: string; // Reference to the user who owns the podcast
  title: string;
  description: string;
  coverImageUrl: string;
  categories: string[]; // e.g., Tech, Music, Business
  avgListeners?: number; // Optional
  rssFeedUrl: string;
  websiteUrl?: string; // Optional
  status: PodcastStatus;
  createdAt: Date; // Firestore Timestamp
  updatedAt: Date; // Firestore Timestamp
}
