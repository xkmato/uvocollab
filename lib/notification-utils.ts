/**
 * Notification utilities for creating and managing notifications
 */

import { CreateNotificationData, NotificationType } from '@/app/types/notification';

/**
 * Create a notification via API
 */
export async function createNotification(data: CreateNotificationData): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create notification');
    }

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(
  notificationIds: string[],
  idToken: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ notificationIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to mark notifications as read');
    }

    return true;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(idToken: string): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }

    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

/**
 * Helper to create standard notification messages for different types
 */
export function getNotificationContent(
  type: NotificationType,
  context: {
    name?: string;
    amount?: number;
    date?: string;
    title?: string;
    [key: string]: any;
  }
): { title: string; message: string; actionText: string } {
  switch (type) {
    case 'match_found':
      return {
        title: '🎉 New Match!',
        message: `You've been matched with ${context.name}! Both of you are interested in collaborating.`,
        actionText: 'View Match',
      };

    case 'wishlist_response':
      return {
        title: '💫 Wishlist Update',
        message: `${context.name} has responded to your wishlist interest.`,
        actionText: 'View Response',
      };

    case 'collaboration_proposal':
      return {
        title: '🎙️ New Collaboration Proposal',
        message: `${context.name} sent you a collaboration proposal for a guest appearance.`,
        actionText: 'Review Proposal',
      };

    case 'collaboration_accepted':
      return {
        title: '✅ Proposal Accepted',
        message: `${context.name} accepted your collaboration proposal!`,
        actionText: 'View Collaboration',
      };

    case 'collaboration_declined':
      return {
        title: '❌ Proposal Declined',
        message: `${context.name} declined your collaboration proposal.`,
        actionText: 'View Details',
      };

    case 'payment_received':
      return {
        title: '💰 Payment Received',
        message: `Payment of $${context.amount} has been received and held in escrow.`,
        actionText: 'View Collaboration',
      };

    case 'payment_released':
      return {
        title: '💸 Payment Released',
        message: `Your payment of $${context.amount} has been released and will be transferred shortly.`,
        actionText: 'View Details',
      };

    case 'recording_reminder_24h':
      return {
        title: '📅 Recording Tomorrow',
        message: `Reminder: Your recording with ${context.name} is scheduled for tomorrow at ${context.time}.`,
        actionText: 'View Details',
      };

    case 'recording_reminder_1h':
      return {
        title: '⏰ Recording Starting Soon',
        message: `Your recording with ${context.name} starts in 1 hour!`,
        actionText: 'Join Recording',
      };

    case 'recording_scheduled':
      return {
        title: '📅 Recording Scheduled',
        message: `Your recording with ${context.name} has been scheduled for ${context.date}.`,
        actionText: 'View Schedule',
      };

    case 'recording_rescheduled':
      return {
        title: '🔄 Recording Rescheduled',
        message: `${context.name} has requested to reschedule your recording.`,
        actionText: 'Review Request',
      };

    case 'recording_link_added':
      return {
        title: '🎙️ Recording Link Added',
        message: `${context.name} has added the recording platform link.`,
        actionText: 'View Link',
      };

    case 'recording_completed':
      return {
        title: '✅ Recording Complete',
        message: `${context.name} marked the recording as complete.`,
        actionText: 'View Collaboration',
      };

    case 'episode_released':
      return {
        title: '🎉 Episode Released!',
        message: `Your episode "${context.title}" on ${context.name} is now live!`,
        actionText: 'Listen Now',
      };

    case 'guest_invitation':
      return {
        title: '🎙️ Podcast Invitation',
        message: `${context.name} invited you to be a guest on their podcast.`,
        actionText: 'View Invitation',
      };

    case 'guest_verification_approved':
      return {
        title: '✅ Profile Verified',
        message: 'Congratulations! Your guest profile has been verified.',
        actionText: 'View Profile',
      };

    case 'guest_verification_declined':
      return {
        title: 'Verification Update',
        message: 'Your guest verification request needs some updates.',
        actionText: 'View Details',
      };

    case 'message_received':
      return {
        title: '💬 New Message',
        message: `${context.name} sent you a message.`,
        actionText: 'View Message',
      };

    case 'contract_signed':
      return {
        title: '📝 Contract Signed',
        message: `${context.name} signed the collaboration contract.`,
        actionText: 'View Contract',
      };

    case 'milestone_completed':
      return {
        title: '🎯 Milestone Completed',
        message: `A milestone in your collaboration with ${context.name} has been completed.`,
        actionText: 'View Progress',
      };

    case 'feedback_received':
      return {
        title: '⭐ New Feedback',
        message: `${context.name} left feedback on your collaboration.`,
        actionText: 'View Feedback',
      };

    default:
      return {
        title: 'New Notification',
        message: 'You have a new notification.',
        actionText: 'View Details',
      };
  }
}
