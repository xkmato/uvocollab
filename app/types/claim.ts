export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface PodcastClaim {
    id?: string;
    podcastId: string;
    podcastTitle?: string; // For reference
    claimantId: string; // User ID
    claimantEmail: string;
    evidence: string; // Explanation/proof of ownership
    status: ClaimStatus;
    createdAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string; // Admin user ID
    adminNotes?: string;
}
