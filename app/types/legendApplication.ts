export interface LegendApplicationData {
  // Primary Contact Info
  artistName: string;
  email: string;
  phone: string;

  // Management/Agency Info
  managementName: string;
  managementEmail: string;

  // Proof of Status
  spotifyLink: string;
  instagramLink?: string;
  twitterLink?: string;
  pressLinks?: string;

  // Optional Referral
  referralFrom?: string;

  // Additional info
  bio: string;
}

export interface LegendApplication {
  id?: string;
  applicantUid: string;
  status: 'pending' | 'approved' | 'declined';
  applicationData: LegendApplicationData;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}
