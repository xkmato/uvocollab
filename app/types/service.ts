export interface Service {
  id?: string;
  legendUid: string;
  title: string; // e.g., "16-bar verse", "Full song production", "Mix & Master"
  description: string; // Detailed description of what's included
  price: number; // Price in dollars (must be > 0)
  deliverable: string; // e.g., "1 WAV file", "Stems + Mixed Master", "2 revisions included"
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean; // Allow legends to unpublish services without deleting
}

export interface CreateServiceData {
  title: string;
  description: string;
  price: number;
  deliverable: string;
}

export interface UpdateServiceData {
  title?: string;
  description?: string;
  price?: number;
  deliverable?: string;
  isActive?: boolean;
}
