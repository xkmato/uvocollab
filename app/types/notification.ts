/**
 * Notification system types for UvoCollab
 */

export type NotificationType =
  | 'match_found'
  | 'wishlist_response'
  | 'collaboration_proposal'
  | 'collaboration_accepted'
  | 'collaboration_declined'
  | 'payment_received'
  | 'payment_released'
  | 'recording_reminder_24h'
  | 'recording_reminder_1h'
  | 'recording_scheduled'
  | 'recording_rescheduled'
  | 'recording_link_added'
  | 'recording_completed'
  | 'episode_released'
  | 'guest_invitation'
  | 'guest_verification_approved'
  | 'guest_verification_declined'
  | 'message_received'
  | 'contract_signed'
  | 'milestone_completed'
  | 'feedback_received';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string; // Link to relevant page
  actionText?: string; // Text for action button (e.g., "View Match", "Review Proposal")
  read: boolean;
  createdAt: Date;
  expiresAt?: Date; // Optional expiration for time-sensitive notifications
  metadata?: {
    collaborationId?: string;
    matchId?: string;
    guestId?: string;
    podcastId?: string;
    userId?: string;
    amount?: number;
    [key: string]: any;
  };
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  expiresAt?: Date;
  metadata?: Notification['metadata'];
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: {
    matches: boolean;
    collaborations: boolean;
    payments: boolean;
    recordings: boolean;
    messages: boolean;
    marketing: boolean;
  };
  inAppNotifications: {
    matches: boolean;
    collaborations: boolean;
    payments: boolean;
    recordings: boolean;
    messages: boolean;
  };
  updatedAt: Date;
}
