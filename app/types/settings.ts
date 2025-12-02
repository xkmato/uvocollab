export interface GuestSettings {
    // Rate Settings
    minGuestRate: number; // Minimum allowed guest rate (USD)
    maxGuestRate: number; // Maximum allowed guest rate (USD)
    
    // Invite Settings
    inviteExpirationDays: number; // Days until invite expires (default: 30)
    
    // Matching Settings
    autoMatchingEnabled: boolean; // Whether to auto-create matches
    minimumMatchScore: number; // Minimum compatibility score for auto-matching (0-100)
    
    // Verification Settings
    verificationRequired: boolean; // Whether verification is required to appear in premium listings
    autoVerifyThreshold: number; // Number of successful collaborations before auto-verification
    
    // Email Templates (stored as template keys, actual templates in Mailgun)
    inviteEmailTemplate: string;
    matchNotificationTemplate: string;
    verificationApprovalTemplate: string;
    verificationDeclineTemplate: string;
    
    // Feature Flags
    guestFeatureEnabled: boolean; // Master switch for guest features
    publicGuestDiscoveryEnabled: boolean; // Whether guests appear in public marketplace
    
    // Last Updated
    updatedAt: Date;
    updatedBy: string; // Admin UID who last updated
}

export const DEFAULT_GUEST_SETTINGS: Partial<GuestSettings> = {
    minGuestRate: 0,
    maxGuestRate: 10000,
    inviteExpirationDays: 30,
    autoMatchingEnabled: true,
    minimumMatchScore: 70,
    verificationRequired: false,
    autoVerifyThreshold: 5,
    guestFeatureEnabled: true,
    publicGuestDiscoveryEnabled: true,
    inviteEmailTemplate: 'guest_invitation',
    matchNotificationTemplate: 'match_notification',
    verificationApprovalTemplate: 'verification_approved',
    verificationDeclineTemplate: 'verification_declined',
};
