'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { GuestWishlist } from '@/app/types/guest';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function GuestWishlistPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();

  const [wishlists, setWishlists] = useState<GuestWishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingWishlist, setEditingWishlist] = useState<GuestWishlist | null>(null);

  // Redirect if not a guest
  useEffect(() => {
    if (!authLoading && (!userData || !userData.isGuest)) {
      router.push('/dashboard');
    }
  }, [userData, authLoading, router]);

  const loadWishlist = useCallback(async () => {
    if (!userData?.uid) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/guest/wishlist?guestId=${userData.uid}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load wishlist');
      }

      setWishlists(data.wishlists);
    } catch (err) {
      console.error('Error loading wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, [userData?.uid]);

  // Load wishlist
  useEffect(() => {
    if (userData?.uid && userData?.isGuest) {
      loadWishlist();
    }
  }, [userData, loadWishlist]);

  const handleRemove = async (wishlistId: string) => {
    if (!confirm('Are you sure you want to remove this podcast from your wishlist?')) {
      return;
    }

    try {
      const response = await fetch('/api/guest/wishlist/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wishlistId,
          guestId: userData?.uid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove from wishlist');
      }

      // Reload wishlist
      loadWishlist();
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      alert(err instanceof Error ? err.message : 'Failed to remove from wishlist');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      contacted: 'bg-blue-100 text-blue-800',
      matched: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  if (!userData?.isGuest) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Podcast Wishlist</h1>
              <p className="mt-2 text-gray-600">
                Podcasts you want to appear on
              </p>
            </div>
            <Link
              href="/marketplace/podcasts"
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Browse Podcasts
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Wishlist Grid */}
        {wishlists.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🎙️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-gray-600 mb-6">
              Browse podcasts and add the ones you&apos;d like to appear on
            </p>
            <Link
              href="/marketplace/podcasts"
              className="inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Explore Podcasts
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {wishlists.map((wishlist) => (
              <div
                key={wishlist.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex gap-6">
                  {/* Podcast Cover */}
                  <Link href={`/podcasts/${wishlist.podcastId}`} className="flex-shrink-0">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-200">
                      {wishlist.podcastImageUrl ? (
                        <Image
                          src={wishlist.podcastImageUrl}
                          alt={wishlist.podcastName || 'Podcast'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl">🎙️</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Link
                          href={`/podcasts/${wishlist.podcastId}`}
                          className="text-xl font-bold text-gray-900 hover:text-purple-600 transition-colors"
                        >
                          {wishlist.podcastName || 'Unknown Podcast'}
                        </Link>
                        <div className="flex items-center gap-3 mt-2">
                          {getStatusBadge(wishlist.status)}
                          {wishlist.viewedByPodcast && (
                            <span className="text-sm text-green-600 flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              Viewed by podcast
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">
                          {wishlist.offerAmount > 0 ? `${wishlist.offerAmount.toFixed(0)} UGX` : 'Free'}
                        </div>
                        <div className="text-sm text-gray-500">Your offer</div>
                      </div>
                    </div>

                    {/* Topics */}
                    <div className="mb-3">
                      <div className="text-sm font-semibold text-gray-700 mb-1">Topics:</div>
                      <div className="flex flex-wrap gap-2">
                        {wishlist.topics.map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-gray-700 mb-1">Your message:</div>
                      <p className="text-sm text-gray-600 line-clamp-2">{wishlist.message}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Link
                        href={`/podcasts/${wishlist.podcastId}`}
                        className="px-4 py-2 text-sm font-semibold text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        View Podcast
                      </Link>
                      <button
                        onClick={() => setEditingWishlist(wishlist)}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemove(wishlist.id)}
                        className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Timestamp */}
                    <div className="mt-3 text-xs text-gray-500">
                      Added {new Date(wishlist.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingWishlist && (
          <EditWishlistModal
            wishlist={editingWishlist}
            guestId={userData.uid}
            onClose={() => setEditingWishlist(null)}
            onSuccess={() => {
              setEditingWishlist(null);
              loadWishlist();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Edit Wishlist Modal Component
function EditWishlistModal({
  wishlist,
  guestId,
  onClose,
  onSuccess,
}: {
  wishlist: GuestWishlist;
  guestId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [offerAmount, setOfferAmount] = useState(wishlist.offerAmount);
  const [topics, setTopics] = useState(wishlist.topics.join(', '));
  const [message, setMessage] = useState(wishlist.message);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const topicsArray = topics
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (topicsArray.length === 0) {
      setError('Please enter at least one topic');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/guest/wishlist/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wishlistId: wishlist.id,
          guestId,
          offerAmount,
          topics: topicsArray,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update wishlist');
      }

      onSuccess();
    } catch (err) {
      console.error('Error updating wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to update wishlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Edit Wishlist Entry</h2>
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
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="offerAmount" className="block text-sm font-semibold text-gray-700 mb-2">
              Your Offer Amount (USD)
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
              />
            </div>
          </div>

          <div>
            <label htmlFor="topics" className="block text-sm font-semibold text-gray-700 mb-2">
              Topics
            </label>
            <input
              type="text"
              id="topics"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
              Your Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
              required
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
