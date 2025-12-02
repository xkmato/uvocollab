export type CollaborationStatus =
  | 'pending_review'
  | 'pending_agreement' // For guest collaborations awaiting terms agreement
  | 'pending_payment'
  | 'awaiting_contract'
  | 'scheduling' // For guest collaborations after agreement, before recording
  | 'scheduled' // Recording date confirmed
  | 'in_progress'
  | 'post_production' // After recording, before release
  | 'completed'
  | 'declined';

export interface Deliverable {
  fileName: string; // Name of the uploaded file
  fileUrl: string; // Firebase Storage URL to the file
  uploadedAt: Date; // When the file was uploaded
  uploadedBy: string; // UID of the user who uploaded (should be Legend)
  fileSize: number; // File size in bytes
}

export interface Collaboration {
  id?: string;
  type?: 'legend' | 'podcast' | 'guest_appearance'; // Type of collaboration
  buyerId: string; // UID of the "New Artist" requesting the collaboration
  legendId?: string; // UID of the "Legend" providing the service (optional for podcasts)
  podcastId?: string; // ID of the Podcast (required for podcast collabs)
  serviceId: string; // ID of the specific service being purchased
  price: number; // Price of the service (copied from service doc at time of request)
  status: CollaborationStatus; // Current state of the collaboration
  
  // Legend Specific Fields
  pitchDemoUrl?: string; // Firebase Storage URL to the demo track uploaded by buyer
  pitchMessage?: string; // Message from the buyer about their creative concept
  pitchBestWorkUrl?: string; // Link to buyer's best previous work

  // Podcast Specific Fields
  topicProposal?: string; // Topic proposal for the podcast
  guestBio?: string; // Bio of the guest
  proposedDates?: string; // Proposed dates for recording
  pressKitUrl?: string; // URL to press kit or audio sample

  // Guest Appearance Specific Fields
  guestId?: string; // UID of the guest (for guest_appearance type)
  proposedTopics?: string[]; // Topics proposed during negotiation
  agreedTopics?: string[]; // Topics agreed upon for the appearance
  recordingDate?: Date; // Confirmed recording date
  schedulingDetails?: {
    date: Date; // Recording date
    time: string; // Recording time
    timezone: string; // Timezone for the recording
    duration: string; // Expected duration (e.g., "60 minutes")
  };
  recordingUrl?: string; // Zoom/Riverside/StreamYard link for recording
  prepNotes?: string; // Preparation notes for the guest
  episodeReleaseDate?: Date; // When the episode was released
  episodeUrl?: string; // URL to the released episode
  negotiationHistory?: Array<{
    proposedBy: string; // UID of user proposing changes
    proposedPrice?: number;
    proposedTopics?: string[];
    proposedDates?: string;
    message?: string;
    timestamp: Date;
  }>; // Track negotiation between parties

  contractUrl?: string; // Firebase Storage URL to the signed contract PDF
  deliverables?: Deliverable[]; // Files uploaded by Legend as project deliverables
  createdAt: Date; // When the pitch was submitted
  updatedAt: Date; // Last update timestamp
  acceptedAt?: Date; // When the Legend accepted the pitch
  paidAt?: Date; // When payment was received
  completedAt?: Date; // When the buyer marked as complete
  pendingTxRef?: string; // Flutterwave transaction reference for pending payment
  transactionId?: string; // Flutterwave transaction ID after successful payment
  txRef?: string; // Final transaction reference after verification
  platformCommission?: number; // Platform's 20% commission held in escrow
  legendAmount?: number; // Amount to be paid to Legend after completion
  escrowStatus?: 'held' | 'released'; // Status of funds in escrow
  docusignEnvelopeId?: string; // DocuSign envelope ID for tracking contract signatures
  contractSentAt?: Date; // When contract was sent for signature
  allPartiesSignedAt?: Date; // When all parties completed signing
  payoutTransferId?: string; // Flutterwave transfer ID for the payout to Legend
  payoutReference?: string; // Transfer reference for the payout
  payoutInitiatedAt?: string; // When the payout was initiated
  payoutError?: {
    message: string;
    timestamp: string;
  }; // Error details if payout failed
}

export interface CreateCollaborationData {
  type?: 'legend' | 'podcast' | 'guest_appearance';
  buyerId: string;
  legendId?: string;
  podcastId?: string;
  serviceId: string;
  price: number;
  
  // Legend
  pitchDemoUrl?: string;
  pitchMessage?: string;
  pitchBestWorkUrl?: string;

  // Podcast
  topicProposal?: string;
  guestBio?: string;
  proposedDates?: string;
  pressKitUrl?: string;

  // Guest Appearance
  guestId?: string;
  agreedTopics?: string[];
  proposedTopics?: string[];
  message?: string;
}

export interface UpdateCollaborationData {
  status?: CollaborationStatus;
  contractUrl?: string;
  acceptedAt?: Date;
  paidAt?: Date;
  completedAt?: Date;
  updatedAt?: Date;
}
