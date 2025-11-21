export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'new_artist' | 'legend_applicant' | 'legend' | 'admin';
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
}