'use client';

import { useState } from 'react';
import { User } from '@/app/types/user';

interface AddGuestToWishlistModalProps {
  guest: User;
  podcastId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddGuestToWishlistModal({
  guest,
  podcastId,
  onClose,
  onSuccess,
}: AddGuestToWishlistModalProps) {
  const [budgetAmount, setBudgetAmount] = useState<number>(guest.guestRate || 0);
  const [preferredTopics, setPreferredTopics] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Parse topics (comma-separated)
    const topicsArray = preferredTopics
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (!notes.trim()) {
      setError('Please enter notes about why you want this guest');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/podcast/wishlist/add-guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          podcastId,
          guestId: guest.uid,
          guestName: guest.displayName,
          guestEmail: guest.email,
          budgetAmount,
          preferredTopics: topicsArray.length > 0 ? topicsArray : undefined,
          notes: notes.trim(),
          isRegistered: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add to wishlist');
      }

      onSuccess();
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to add to wishlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Add Guest to Wishlist</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Guest Info */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <h3 className="font-semibold text-gray-900 mb-1">{guest.displayName}</h3>
            {guest.guestBio && (
              <p className="text-sm text-gray-600 line-clamp-2">{guest.guestBio}</p>
            )}
            {guest.guestRate && guest.guestRate > 0 && (
              <p className="text-sm text-purple-600 font-semibold mt-2">
                Guest Rate: ${guest.guestRate}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Budget Amount */}
          <div>
            <label htmlFor="budgetAmount" className="block text-sm font-semibold text-gray-700 mb-2">
              Your Budget Amount (USD)
              <span className="text-gray-500 font-normal ml-2">What you&apos;re willing to pay</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="budgetAmount"
                min="0"
                step="0.01"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {budgetAmount > 0
                ? `You're offering to pay $${budgetAmount.toFixed(2)} for this guest appearance`
                : "You're requesting a free guest appearance"}
            </p>
            {guest.guestRate && budgetAmount < guest.guestRate && (
              <p className="mt-1 text-xs text-orange-600">
                ⚠️ Your budget is below the guest&apos;s listed rate
              </p>
            )}
          </div>

          {/* Preferred Topics */}
          <div>
            <label htmlFor="topics" className="block text-sm font-semibold text-gray-700 mb-2">
              Preferred Topics
              <span className="text-gray-500 font-normal ml-2">Optional</span>
            </label>
            <input
              type="text"
              id="topics"
              value={preferredTopics}
              onChange={(e) => setPreferredTopics(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="e.g., Marketing, SEO, Content Strategy"
            />
            <p className="mt-1 text-xs text-gray-500">Separate multiple topics with commas</p>
            {guest.guestTopics && guest.guestTopics.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-600 mb-1">Guest&apos;s expertise:</p>
                <div className="flex flex-wrap gap-1">
                  {guest.guestTopics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded cursor-pointer hover:bg-purple-200"
                      onClick={() => {
                        const current = preferredTopics ? preferredTopics + ', ' : '';
                        setPreferredTopics(current + topic);
                      }}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
              Notes / Why This Guest? <span className="text-red-500">*</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
              placeholder="Explain why you'd like to have this guest on your podcast..."
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {notes.length}/1000 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                'Add to Wishlist'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
