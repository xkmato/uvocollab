'use client';

import { Collaboration } from '@/app/types/collaboration';
import { ProposedSchedule } from '@/app/types/schedule';
import { User } from '@/app/types/user';
import { useState, useEffect } from 'react';

interface SchedulingInterfaceProps {
  collaboration: Collaboration;
  currentUser: User;
  isGuest: boolean; // Whether current user is the guest
  onScheduleConfirmed: () => void;
}

export default function SchedulingInterface({
  collaboration,
  currentUser,
  isGuest,
  onScheduleConfirmed,
}: SchedulingInterfaceProps) {
  const [showProposeForm, setShowProposeForm] = useState(false);
  const [proposals, setProposals] = useState<ProposedSchedule[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for proposing times
  const [slots, setSlots] = useState([
    { date: '', time: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, duration: '60 minutes' }
  ]);
  const [message, setMessage] = useState('');

  // Common timezones
  const commonTimezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Australia/Sydney',
    'Pacific/Auckland',
  ];

  useEffect(() => {
    loadProposals();
  }, [collaboration.id]);

  const loadProposals = async () => {
    try {
      setLoadingProposals(true);
      const response = await fetch(`/api/collaboration/schedule/propose?collaborationId=${collaboration.id}`);
      const data = await response.json();

      if (response.ok) {
        setProposals(data.schedules || []);
      }
    } catch (err) {
      console.error('Error loading proposals:', err);
    } finally {
      setLoadingProposals(false);
    }
  };

  const addSlot = () => {
    setSlots([
      ...slots,
      { date: '', time: '', timezone: slots[0]?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone, duration: '60 minutes' }
    ]);
  };

  const removeSlot = (index: number) => {
    if (slots.length > 1) {
      setSlots(slots.filter((_, i) => i !== index));
    }
  };

  const updateSlot = (index: number, field: string, value: string) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  const handleProposeSchedule = async () => {
    // Validate all slots
    for (const slot of slots) {
      if (!slot.date || !slot.time || !slot.timezone) {
        setError('Please fill in all time slot fields');
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/collaboration/schedule/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collaborationId: collaboration.id,
          proposedBy: currentUser.uid,
          proposedByRole: isGuest ? 'guest' : 'podcast_owner',
          slots,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to propose schedule');
      }

      // Reset form
      setSlots([{ date: '', time: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, duration: '60 minutes' }]);
      setMessage('');
      setShowProposeForm(false);

      // Reload proposals
      await loadProposals();

      alert('Schedule proposal sent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to propose schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondToProposal = async (
    proposalId: string,
    action: 'accept' | 'decline',
    acceptedSlotIndex?: number,
    declineReason?: string
  ) => {
    if (action === 'accept' && acceptedSlotIndex === undefined) {
      alert('Please select a time slot');
      return;
    }

    try {
      const response = await fetch('/api/collaboration/schedule/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collaborationId: collaboration.id,
          proposalId,
          userId: currentUser.uid,
          action,
          acceptedSlotIndex,
          declineReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to respond to proposal');
      }

      if (action === 'accept') {
        alert('Schedule confirmed! Both parties will receive confirmation emails.');
        onScheduleConfirmed();
      } else {
        alert('Proposal declined.');
        await loadProposals();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to respond to proposal');
    }
  };

  const formatDate = (date: any) => {
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const convertTime = (time: string, fromTz: string, toTz: string) => {
    // Simple time conversion placeholder
    // In production, use a library like date-fns-tz or moment-timezone
    if (fromTz === toTz) return time;
    return `${time} (${fromTz})`;
  };

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const pendingProposals = proposals.filter(p => p.status === 'proposed');
  const canProposeNew = !pendingProposals.some(p => p.proposedBy === currentUser.uid);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📅 Schedule Recording</h2>

      {/* Current Schedule (if confirmed) */}
      {collaboration.status === 'scheduled' && collaboration.schedulingDetails && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">✅ Recording Scheduled</h3>
          <div className="text-green-800">
            <p><strong>Date:</strong> {formatDate(collaboration.schedulingDetails.date)}</p>
            <p><strong>Time:</strong> {collaboration.schedulingDetails.time} {collaboration.schedulingDetails.timezone}</p>
            <p><strong>Duration:</strong> {collaboration.schedulingDetails.duration || '60 minutes'}</p>
            {userTimezone !== collaboration.schedulingDetails.timezone && (
              <p className="text-sm mt-2 text-green-700">
                Your timezone: {userTimezone}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Pending Proposals */}
      {loadingProposals ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <>
          {pendingProposals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Proposals</h3>
              {pendingProposals.map((proposal) => {
                const isMyProposal = proposal.proposedBy === currentUser.uid;

                return (
                  <div
                    key={proposal.id}
                    className={`border rounded-lg p-4 mb-4 ${isMyProposal ? 'border-blue-200 bg-blue-50' : 'border-yellow-200 bg-yellow-50'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-900">
                        {isMyProposal ? 'Your Proposal' : `Proposal from ${proposal.proposedByRole === 'guest' ? 'Guest' : 'Podcast Owner'}`}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {formatDate(proposal.createdAt)}
                      </span>
                    </div>

                    {proposal.message && (
                      <p className="text-gray-700 mb-3 italic">"{proposal.message}"</p>
                    )}

                    <div className="space-y-2 mb-3">
                      {proposal.slots?.map((slot: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="font-semibold">Option {index + 1}:</span>
                          <span>{formatDate(slot.date)}</span>
                          <span>at {slot.time} {slot.timezone}</span>
                          {!isMyProposal && (
                            <button
                              onClick={() => handleRespondToProposal(proposal.id!, 'accept', index)}
                              className="ml-auto px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              Select This Time
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {!isMyProposal && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for declining (optional):');
                            handleRespondToProposal(proposal.id!, 'decline', undefined, reason || undefined);
                          }}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Decline All
                        </button>
                      </div>
                    )}

                    {isMyProposal && (
                      <p className="text-sm text-blue-700">Waiting for response...</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Propose New Times */}
          {collaboration.status === 'scheduling' && (
            <>
              {!showProposeForm ? (
                <button
                  onClick={() => setShowProposeForm(true)}
                  disabled={!canProposeNew}
                  className={`w-full py-3 rounded-lg font-medium ${canProposeNew
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {canProposeNew ? '+ Propose Recording Times' : 'You have a pending proposal'}
                </button>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Propose Recording Times</h3>

                  <div className="space-y-4 mb-4">
                    {slots.map((slot, index) => (
                      <div key={index} className="border border-gray-200 rounded p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Option {index + 1}</span>
                          {slots.length > 1 && (
                            <button
                              onClick={() => removeSlot(index)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Date
                            </label>
                            <input
                              type="date"
                              value={slot.date}
                              onChange={(e) => updateSlot(index, 'date', e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Time
                            </label>
                            <input
                              type="time"
                              value={slot.time}
                              onChange={(e) => updateSlot(index, 'time', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Timezone
                            </label>
                            <select
                              value={slot.timezone}
                              onChange={(e) => updateSlot(index, 'timezone', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            >
                              {commonTimezones.map((tz) => (
                                <option key={tz} value={tz}>
                                  {tz.replace(/_/g, ' ')}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Duration
                            </label>
                            <select
                              value={slot.duration}
                              onChange={(e) => updateSlot(index, 'duration', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="30 minutes">30 minutes</option>
                              <option value="45 minutes">45 minutes</option>
                              <option value="60 minutes">60 minutes</option>
                              <option value="90 minutes">90 minutes</option>
                              <option value="120 minutes">2 hours</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addSlot}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4"
                  >
                    + Add Another Time Option
                  </button>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message (Optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      placeholder="Add a message with your proposal..."
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleProposeSchedule}
                      disabled={submitting}
                      className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {submitting ? 'Sending...' : 'Send Proposal'}
                    </button>
                    <button
                      onClick={() => {
                        setShowProposeForm(false);
                        setError(null);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
