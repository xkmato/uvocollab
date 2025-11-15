export type CollaborationStatus =
  | 'pending_review'
  | 'pending_payment'
  | 'awaiting_contract'
  | 'in_progress'
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
  buyerId: string; // UID of the "New Artist" requesting the collaboration
  legendId: string; // UID of the "Legend" providing the service
  serviceId: string; // ID of the specific service being purchased
  price: number; // Price of the service (copied from service doc at time of request)
  status: CollaborationStatus; // Current state of the collaboration
  pitchDemoUrl?: string; // Firebase Storage URL to the demo track uploaded by buyer
  pitchMessage: string; // Message from the buyer about their creative concept
  pitchBestWorkUrl: string; // Link to buyer's best previous work
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
  buyerId: string;
  legendId: string;
  serviceId: string;
  price: number;
  pitchDemoUrl?: string;
  pitchMessage: string;
  pitchBestWorkUrl: string;
}

export interface UpdateCollaborationData {
  status?: CollaborationStatus;
  contractUrl?: string;
  acceptedAt?: Date;
  paidAt?: Date;
  completedAt?: Date;
  updatedAt?: Date;
}
