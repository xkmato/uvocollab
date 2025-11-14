export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'new_artist' | 'legend_applicant' | 'legend' | 'admin';
  profileImageUrl?: string;
  bio?: string;
  managementInfo?: string;
}