// Types for scheduling podcast recordings
export interface TimeSlot {
  date: Date; // Proposed recording date
  time: string; // Time in HH:MM format
  timezone: string; // IANA timezone identifier (e.g., "America/New_York")
  duration?: string; // Expected duration (e.g., "60 minutes")
}

export interface ProposedSchedule {
  id?: string;
  collaborationId: string; // Reference to parent collaboration
  proposedBy: string; // UID of user proposing the slot
  proposedByRole: 'guest' | 'podcast_owner'; // Role of proposer
  slots: TimeSlot[]; // Array of proposed time slots
  message?: string; // Optional message with proposal
  status: 'proposed' | 'accepted' | 'declined' | 'superseded'; // Status of the proposal
  acceptedSlotIndex?: number; // Index of accepted slot if status is 'accepted'
  declineReason?: string; // Reason if declined
  createdAt: Date;
  respondedAt?: Date; // When the other party responded
}

export interface RescheduleRequest {
  id?: string;
  collaborationId: string;
  requestedBy: string; // UID of user requesting reschedule
  requestedByRole: 'guest' | 'podcast_owner';
  reason: string; // Required reason for rescheduling
  previousSchedule: TimeSlot; // The original schedule being changed
  proposedSlots: TimeSlot[]; // New proposed time slots
  status: 'pending' | 'accepted' | 'declined';
  acceptedSlotIndex?: number;
  declineReason?: string;
  createdAt: Date;
  respondedAt?: Date;
}

export interface ScheduleHistory {
  collaborationId: string;
  rescheduleCount: number; // Track number of reschedules
  maxReschedules: number; // Maximum allowed (default: 2)
  schedules: Array<{
    slot: TimeSlot;
    scheduledAt: Date;
    rescheduledAt?: Date;
    rescheduleReason?: string;
  }>;
}
