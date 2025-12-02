'use client';

import { useState } from 'react';

interface ReleaseEpisodeProps {
  collaborationId: string;
  userId: string;
  onRelease: () => void;
}

export default function ReleaseEpisode({
  collaborationId,
  userId,
  onRelease,
}: ReleaseEpisodeProps) {
  const [showModal, setShowModal] = useState(false);
  const [episodeUrl, setEpisodeUrl] = useState('');
  const [episodeReleaseDate, setEpisodeReleaseDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (submitting) return;

    if (!episodeUrl.trim()) {
      setError('Episode URL is required');
      return;
    }

    // Validate URL format
    try {
      new URL(episodeUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/collaboration/release-episode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collaborationId,
          userId,
          episodeUrl: episodeUrl.trim(),
          episodeReleaseDate: episodeReleaseDate || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to release episode');
      }

      setResult(data);
      
      // Show result for 3 seconds before closing
      setTimeout(() => {
        setShowModal(false);
        onRelease();
      }, 3000);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Mark Episode Released
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Mark Episode Released</h2>

            {!result ? (
              <>
                <p className="text-gray-600 mb-4">
                  Provide the episode URL to notify the guest that the episode has been released.
                  If payment is held in escrow, it will be released to the guest.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Episode URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={episodeUrl}
                    onChange={(e) => setEpisodeUrl(e.target.value)}
                    placeholder="https://example.com/episode"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={submitting}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Release Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={episodeReleaseDate}
                    onChange={(e) => setEpisodeReleaseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={submitting}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Leave blank to use today's date
                  </p>
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'Confirm Release'}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">✓ Episode released successfully!</p>
                </div>

                {result.paymentReleased && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 font-medium">✓ Payment released to guest</p>
                    <p className="text-sm text-blue-600 mt-1">
                      The guest will receive their payment within 1-2 business days.
                    </p>
                  </div>
                )}

                {result.paymentError && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-orange-800 font-medium">⚠️ Payment issue</p>
                    <p className="text-sm text-orange-600 mt-1">
                      {result.paymentError}
                    </p>
                  </div>
                )}

                <p className="text-sm text-gray-500 text-center">
                  Closing automatically...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
