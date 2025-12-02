'use client';

import { useState } from 'react';
import { Podcast } from '@/app/types/podcast';

interface AddPodcastToWishlistModalProps {
  podcast: Podcast;
  guestId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPodcastToWishlistModal({
  podcast,
  guestId,
  onClose,
  onSuccess,
}: AddPodcastToWishlistModalProps) {
  const [offerAmount, setOfferAmount] = useState<number>(0);
  const [topics, setTopics] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Parse topics (comma-separated)
    const topicsArray = topics
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (topicsArray.length === 0) {
      setError('Please enter at least one topic');
      setLoading(false);
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message to the podcast owner');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/guest/wishlist/add-podcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestId,
          podcastId: podcast.id,
          offerAmount,
          topics: topicsArray,
          message: message.trim(),
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
          <h2 className="text-2xl font-bold text-gray-900">Add to Wishlist</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Podcast Info */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <h3 className="font-semibold text-gray-900 mb-1">{podcast.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{podcast.description}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Offer Amount */}
          <div>
            <label htmlFor="offerAmount" className="block text-sm font-semibold text-gray-700 mb-2">
              Your Offer Amount (USD)
              <span className="text-gray-500 font-normal ml-2">Optional - Leave at $0 for free appearance</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="offerAmount"
                min="0"
                step="0.01"
                value={offerAmount}
                onChange={(e) => setOfferAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {offerAmount > 0
                ? `You're offering to pay $${offerAmount.toFixed(2)} to appear on this podcast`
                : "You're offering a free guest appearance"}
            </p>
          </div>

          {/* Topics */}
          <div>
            <label htmlFor="topics" className="block text-sm font-semibold text-gray-700 mb-2">
              Topics You'd Like to Discuss <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="topics"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="e.g., Marketing, SEO, Content Strategy"
              required
            />
            <p className="mt-1 text-xs text-gray-500">Separate multiple topics with commas</p>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
              Your Message / Pitch <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
              placeholder="Introduce yourself and explain why you'd be a great guest for this podcast..."
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {message.length}/1000 characters
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
