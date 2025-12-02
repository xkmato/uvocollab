export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'new_artist' | 'legend_applicant' | 'legend' | 'admin' | 'guest';
  profileImageUrl?: string;
  bio?: string;
  managementInfo?: string;
  genre?: string; // Primary genre (e.g., 'Hip Hop', 'R&B', 'Pop', 'Rock', 'Electronic', 'Jazz', etc.)
  priceRange?: 'budget' | 'mid' | 'premium'; // Price tier for filtering
  flutterwaveSubaccountId?: string; // Flutterwave subaccount ID for payments
  flutterwaveAccountBank?: string; // Bank code for the connected account
  flutterwaveAccountNumber?: string; // Account number (last 4 digits only for security)
  bankAccountVerified?: boolean; // Whether the bank account has been verified
  hasPodcast?: boolean; // Whether the user has registered a podcast
  paymentMethod?: 'bank' | 'mobile_money';
  mobileMoneyProvider?: string;
  businessName?: string;
  businessEmail?: string;
  businessContact?: string;
  businessMobile?: string;
  
  // Guest-specific fields
  isGuest?: boolean; // Flag indicating user is a guest
  guestRate?: number; // Fixed price they charge to appear (in USD)
  guestBio?: string; // Guest-specific bio/expertise description
  guestTopics?: string[]; // Array of topics/expertise areas
  guestAvailability?: string; // Availability description
  isVerifiedGuest?: boolean; // Whether guest has been verified by platform
  guestVerificationRequestedAt?: Date; // When verification was requested
  socialLinks?: { platform: string; url: string }[]; // Social media links
  previousAppearances?: string[]; // Links to previous podcast appearances
}