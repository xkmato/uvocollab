// Type definitions for collaboration feedback
export interface CollaborationFeedback {
  id?: string;
  collaborationId: string;
  fromUserId: string; // User giving the feedback
  toUserId: string; // User receiving the feedback
  rating: number; // 1-5 stars
  review?: string; // Written review (optional)
  wouldCollaborateAgain: boolean;
  isPublic: boolean; // Whether review should be shown publicly
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackStats {
  averageRating: number;
  totalReviews: number;
  wouldCollaborateAgainPercentage: number;
}
