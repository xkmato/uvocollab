'use client';

import { useState } from 'react';

interface MarkRecordingCompleteProps {
  collaborationId: string;
  userId: string;
  onComplete: () => void;
}

export default function MarkRecordingComplete({
  collaborationId,
  userId,
  onComplete,
}: MarkRecordingCompleteProps) {
  const [showModal, setShowModal] = useState(false);
  const [recordingNotes, setRecordingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/collaboration/recording-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collaborationId,
          userId,
          recordingNotes: recordingNotes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark recording as complete');
      }

      setShowModal(false);
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        Mark Recording Complete
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Mark Recording Complete</h2>

            <p className="text-gray-600 mb-4">
              Confirm that the recording session has been completed. The guest will be notified
              that the episode is now in post-production.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recording Notes (Optional)
              </label>
              <textarea
                value={recordingNotes}
                onChange={(e) => setRecordingNotes(e.target.value)}
                placeholder="Add any notes about the recording session, what went well, topics covered, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Confirm Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
