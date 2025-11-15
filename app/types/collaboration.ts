export type CollaborationStatus =
  | 'pending_review'
  | 'pending_payment'
  | 'awaiting_contract'
  | 'in_progress'
  | 'completed'
  | 'declined';

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
  createdAt: Date; // When the pitch was submitted
  updatedAt: Date; // Last update timestamp
  acceptedAt?: Date; // When the Legend accepted the pitch
  paidAt?: Date; // When payment was received
  completedAt?: Date; // When the buyer marked as complete
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
