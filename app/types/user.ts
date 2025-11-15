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
}