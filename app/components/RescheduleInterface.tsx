'use client';

import { Collaboration } from '@/app/types/collaboration';
import { RescheduleRequest } from '@/app/types/schedule';
import { User } from '@/app/types/user';
import React, { useState, useEffect } from 'react';

interface RescheduleInterfaceProps {
  collaboration: Collaboration;
  currentUser: User;
  isGuest: boolean;
  onRescheduleConfirmed: () => void;
}

export default function RescheduleInterface({
  collaboration,
  currentUser,
  isGuest,
  onRescheduleConfirmed,
}: RescheduleInterfaceProps) {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reschedules, setReschedules] = useState<RescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [reason, setReason] = useState('');
  const [slots, setSlots] = useState([
    { date: '', time: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, duration: '60 minutes' }
  ]);

  const rescheduleCount = collaboration.rescheduleCount || 0;
  const maxReschedules = collaboration.maxReschedules || 2;
  const canReschedule = rescheduleCount < maxReschedules;

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

  const loadReschedules = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/collaboration/schedule/reschedule?collaborationId=${collaboration.id}`);
      const data = await response.json();

      if (response.ok) {
        setReschedules(data.reschedules || []);
      }
    } catch (err) {
      console.error('Error loading reschedules:', err);
    } finally {
      setLoading(false);
    }
  }, [collaboration.id]);

  useEffect(() => {
    loadReschedules();
  }, [loadReschedules]);

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

  const handleRequestReschedule = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for rescheduling');
      return;
    }

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
      const response = await fetch('/api/collaboration/schedule/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collaborationId: collaboration.id,
          requestedBy: currentUser.uid,
          requestedByRole: isGuest ? 'guest' : 'podcast_owner',
          reason: reason.trim(),
          proposedSlots: slots,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request reschedule');
      }

      // Reset form
      setReason('');
      setSlots([{ date: '', time: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, duration: '60 minutes' }]);
      setShowRequestForm(false);

      // Reload reschedules
      await loadReschedules();

      alert('Reschedule request sent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request reschedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondToReschedule = async (
    rescheduleId: string,
    action: 'accept' | 'decline',
    acceptedSlotIndex?: number,
    declineReason?: string
  ) => {
    if (action === 'accept' && acceptedSlotIndex === undefined) {
      alert('Please select a time slot');
      return;
    }

    try {
      const response = await fetch('/api/collaboration/schedule/reschedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collaborationId: collaboration.id,
          rescheduleId,
          userId: currentUser.uid,
          action,
          acceptedSlotIndex,
          declineReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to respond to reschedule');
      }

      if (action === 'accept') {
        alert('Reschedule confirmed! Both parties will receive updated confirmation emails.');
        onRescheduleConfirmed();
      } else {
        alert('Reschedule request declined.');
        await loadReschedules();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to respond to reschedule');
    }
  };

  const formatDate = (date: Date | { toDate: () => Date } | string) => {
    try {
      const d = typeof date === 'object' && date !== null && 'toDate' in date ? date.toDate() : new Date(date);
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

  const pendingReschedules = reschedules.filter(r => r.status === 'pending');
  const hasPendingRequest = pendingReschedules.some(r => r.requestedBy === currentUser.uid);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">🔄 Reschedule Recording</h2>

      {/* Reschedule Limit Info */}
      <div className={`p-4 rounded-lg mb-6 ${canReschedule ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
        <p className={`text-sm ${canReschedule ? 'text-blue-800' : 'text-red-800'}`}>
          <strong>Reschedules:</strong> {rescheduleCount} of {maxReschedules} used
        </p>
        {!canReschedule && (
          <p className="text-sm text-red-700 mt-1">
            Maximum reschedules reached. Please contact support if you need to make changes.
          </p>
        )}
      </div>

      {/* Pending Reschedule Requests */}
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <>
          {pendingReschedules.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Reschedule Requests</h3>
              {pendingReschedules.map((request) => {
                const isMyRequest = request.requestedBy === currentUser.uid;

                return (
                  <div
                    key={request.id}
                    className={`border rounded-lg p-4 mb-4 ${isMyRequest ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-900">
                        {isMyRequest ? 'Your Reschedule Request' : `Reschedule Request from ${request.requestedByRole === 'guest' ? 'Guest' : 'Podcast Owner'}`}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </span>
                    </div>

                    <div className="bg-white rounded p-3 mb-3">
                      <p className="text-sm text-gray-600 mb-1"><strong>Previous Schedule:</strong></p>
                      <p className="text-gray-800">
                        {formatDate(request.previousSchedule?.date)} at {request.previousSchedule?.time} {request.previousSchedule?.timezone}
                      </p>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Reason:</p>
                      <p className="text-gray-800 italic">&ldquo;{request.reason}&rdquo;</p>
                    </div>

                    <div className="space-y-2 mb-3">
                      <p className="text-sm font-semibold text-gray-700">Proposed New Times:</p>
                      {request.proposedSlots?.map((slot: { date: Date | string; time: string; timezone: string; duration?: string }, index: number) => (
                        <div key={index} className="flex items-center gap-2 bg-white rounded p-2">
                          <span className="font-semibold">Option {index + 1}:</span>
                          <span>{formatDate(slot.date)}</span>
                          <span>at {slot.time} {slot.timezone}</span>
                          {!isMyRequest && (
                            <button
                              onClick={() => handleRespondToReschedule(request.id!, 'accept', index)}
                              className="ml-auto px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              Accept This Time
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {!isMyRequest && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for declining (optional):');
                            handleRespondToReschedule(request.id!, 'decline', undefined, reason || undefined);
                          }}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Decline All
                        </button>
                      </div>
                    )}

                    {isMyRequest && (
                      <p className="text-sm text-blue-700">Waiting for response...</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Request Reschedule Form */}
          {collaboration.status === 'scheduled' && (
            <>
              {!showRequestForm ? (
                <button
                  onClick={() => setShowRequestForm(true)}
                  disabled={!canReschedule || hasPendingRequest}
                  className={`w-full py-3 rounded-lg font-medium ${canReschedule && !hasPendingRequest
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {!canReschedule
                    ? 'Maximum Reschedules Reached'
                    : hasPendingRequest
                      ? 'You Have a Pending Reschedule Request'
                      : 'Request Reschedule'}
                </button>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Reschedule</h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Rescheduling <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      placeholder="Please explain why you need to reschedule..."
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div className="space-y-4 mb-4">
                    <p className="font-medium text-gray-900">Proposed New Times:</p>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                              type="date"
                              value={slot.date}
                              onChange={(e) => updateSlot(index, 'date', e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              aria-label="Recording date"
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <input
                              type="time"
                              value={slot.time}
                              onChange={(e) => updateSlot(index, 'time', e.target.value)}
                              aria-label="Recording time"
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                            <select
                              value={slot.timezone}
                              onChange={(e) => updateSlot(index, 'timezone', e.target.value)}
                              aria-label="Timezone"
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                            >
                              {commonTimezones.map((tz) => (
                                <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                            <select
                              value={slot.duration}
                              onChange={(e) => updateSlot(index, 'duration', e.target.value)}
                              aria-label="Duration"
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
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
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium mb-4"
                  >
                    + Add Another Time Option
                  </button>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleRequestReschedule}
                      disabled={submitting}
                      className="flex-1 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400"
                    >
                      {submitting ? 'Sending...' : 'Send Reschedule Request'}
                    </button>
                    <button
                      onClick={() => {
                        setShowRequestForm(false);
                        setError(null);
                        setReason('');
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
