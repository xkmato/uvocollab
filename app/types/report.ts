export type ReportReason = 'inappropriate_content' | 'copyright_violation' | 'spam' | 'misleading' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface PodcastReport {
    id?: string;
    podcastId: string;
    reportedBy: string; // User ID
    reporterEmail?: string;
    reason: ReportReason;
    description: string;
    status: ReportStatus;
    createdAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string; // Admin user ID
    adminNotes?: string;
}
