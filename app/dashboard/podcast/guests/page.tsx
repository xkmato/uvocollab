'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { PodcastGuestWishlist } from '@/app/types/guest';
import { Podcast } from '@/app/types/podcast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type TabType = 'registered' | 'prospects' | 'invited';

export default function PodcastGuestWishlistPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();

  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [wishlists, setWishlists] = useState<PodcastGuestWishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('registered');
  const [showAddProspectModal, setShowAddProspectModal] = useState(false);
  const [editingWishlist, setEditingWishlist] = useState<PodcastGuestWishlist | null>(null);

  // Redirect if user doesn't have a podcast
  useEffect(() => {
    if (!authLoading && userData?.uid) {
      loadPodcast();
    }
  }, [userData, authLoading]);

  const loadPodcast = async () => {
    if (!userData?.uid) return;

    try {
      // Find user's podcast
      const podcastsRef = collection(db, 'podcasts');
      const q = query(podcastsRef, where('ownerId', '==', userData.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        router.push('/dashboard');
        return;
      }

      const podcastData = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data(),
      } as Podcast;

      setPodcast(podcastData);
      loadWishlist(podcastData.id);
    } catch (err) {
      console.error('Error loading podcast:', err);
      setError('Failed to load podcast information');
      setLoading(false);
    }
  };

  const loadWishlist = async (podcastId: string) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/podcast/wishlist?podcastId=${podcastId}`);
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
  };

  const handleRemove = async (wishlistId: string) => {
    if (!confirm('Are you sure you want to remove this guest from your wishlist?')) {
      return;
    }

    if (!podcast) return;

    try {
      const response = await fetch('/api/podcast/wishlist/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wishlistId,
          podcastId: podcast.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove from wishlist');
      }

      loadWishlist(podcast.id);
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

  const filteredWishlists = wishlists.filter((wishlist) => {
    if (activeTab === 'registered') {
      return wishlist.isRegistered && !wishlist.inviteSent;
    } else if (activeTab === 'prospects') {
      return !wishlist.isRegistered;
    } else if (activeTab === 'invited') {
      return wishlist.inviteSent;
    }
    return false;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading guest wishlist...</p>
        </div>
      </div>
    );
  }

  if (!podcast) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Guest Wishlist</h1>
              <p className="mt-2 text-gray-600">
                Guests you want to host on {podcast.title}
              </p>
            </div>
            <button
              onClick={() => setShowAddProspectModal(true)}
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add Prospect Guest
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('registered')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'registered'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Registered Guests ({wishlists.filter((w) => w.isRegistered && !w.inviteSent).length})
              </button>
              <button
                onClick={() => setActiveTab('prospects')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'prospects'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Prospects ({wishlists.filter((w) => !w.isRegistered).length})
              </button>
              <button
                onClick={() => setActiveTab('invited')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'invited'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Invited ({wishlists.filter((w) => w.inviteSent).length})
              </button>
            </nav>
          </div>
        </div>

        {/* Wishlist Content */}
        {filteredWishlists.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🎤</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {activeTab === 'registered' && 'No registered guests yet'}
              {activeTab === 'prospects' && 'No prospect guests yet'}
              {activeTab === 'invited' && 'No invited guests yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'registered' && 'Browse registered guests and add them to your wishlist'}
              {activeTab === 'prospects' && 'Add prospect guests manually to track potential guests'}
              {activeTab === 'invited' && 'Invited guests will appear here'}
            </p>
            {activeTab === 'prospects' && (
              <button
                onClick={() => setShowAddProspectModal(true)}
                className="inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Prospect Guest
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredWishlists.map((wishlist) => (
              <div
                key={wishlist.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex gap-6">
                  {/* Guest Image */}
                  <div className="flex-shrink-0">
                    {wishlist.isRegistered && wishlist.guestId ? (
                      <Link href={`/guest/${wishlist.guestId}`}>
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-200 cursor-pointer hover:opacity-80 transition-opacity">
                          {wishlist.guestProfileImageUrl ? (
                            <Image
                              src={wishlist.guestProfileImageUrl}
                              alt={wishlist.guestName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-3xl">👤</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ) : (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-200">
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl">👤</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        {wishlist.isRegistered && wishlist.guestId ? (
                          <Link
                            href={`/guest/${wishlist.guestId}`}
                            className="text-xl font-bold text-gray-900 hover:text-purple-600 transition-colors"
                          >
                            {wishlist.guestName}
                          </Link>
                        ) : (
                          <h3 className="text-xl font-bold text-gray-900">{wishlist.guestName}</h3>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {getStatusBadge(wishlist.status)}
                          {!wishlist.isRegistered && (
                            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full font-semibold">
                              Prospect
                            </span>
                          )}
                          {wishlist.inviteSent && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                              Invited
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">
                          {wishlist.budgetAmount > 0 ? `$${wishlist.budgetAmount}` : 'Free'}
                        </div>
                        <div className="text-sm text-gray-500">Your budget</div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    {(wishlist.guestEmail || wishlist.contactInfo) && (
                      <div className="mb-3 text-sm text-gray-600">
                        {wishlist.guestEmail && (
                          <div>Email: {wishlist.guestEmail}</div>
                        )}
                        {wishlist.contactInfo && (
                          <div>Contact: {wishlist.contactInfo}</div>
                        )}
                      </div>
                    )}

                    {/* Topics */}
                    {wishlist.preferredTopics && wishlist.preferredTopics.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-semibold text-gray-700 mb-1">Preferred Topics:</div>
                        <div className="flex flex-wrap gap-2">
                          {wishlist.preferredTopics.map((topic, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-gray-700 mb-1">Notes:</div>
                      <p className="text-sm text-gray-600 line-clamp-2">{wishlist.notes}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      {wishlist.isRegistered && wishlist.guestId && (
                        <Link
                          href={`/guest/${wishlist.guestId}`}
                          className="px-4 py-2 text-sm font-semibold text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                        >
                          View Profile
                        </Link>
                      )}
                      {wishlist.guestEmail && !wishlist.inviteSent && (
                        <button
                          className="px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          disabled
                        >
                          Send Invite (Coming Soon)
                        </button>
                      )}
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

        {/* Add Prospect Modal */}
        {showAddProspectModal && podcast && (
          <AddProspectGuestModal
            podcastId={podcast.id}
            onClose={() => setShowAddProspectModal(false)}
            onSuccess={() => {
              setShowAddProspectModal(false);
              loadWishlist(podcast.id);
            }}
          />
        )}

        {/* Edit Modal */}
        {editingWishlist && podcast && (
          <EditGuestWishlistModal
            wishlist={editingWishlist}
            podcastId={podcast.id}
            onClose={() => setEditingWishlist(null)}
            onSuccess={() => {
              setEditingWishlist(null);
              loadWishlist(podcast.id);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Add Prospect Guest Modal Component
function AddProspectGuestModal({
  podcastId,
  onClose,
  onSuccess,
}: {
  podcastId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [budgetAmount, setBudgetAmount] = useState(0);
  const [preferredTopics, setPreferredTopics] = useState('');
  const [notes, setNotes] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!guestName.trim()) {
      setError('Guest name is required');
      setLoading(false);
      return;
    }

    if (!notes.trim()) {
      setError('Notes are required');
      setLoading(false);
      return;
    }

    const topicsArray = preferredTopics
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      const response = await fetch('/api/podcast/wishlist/add-guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          podcastId,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim() || undefined,
          budgetAmount,
          preferredTopics: topicsArray.length > 0 ? topicsArray : undefined,
          notes: notes.trim(),
          contactInfo: contactInfo.trim() || undefined,
          isRegistered: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add prospect guest');
      }

      onSuccess();
    } catch (err) {
      console.error('Error adding prospect guest:', err);
      setError(err instanceof Error ? err.message : 'Failed to add prospect guest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Add Prospect Guest</h2>
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
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="guestName" className="block text-sm font-semibold text-gray-700 mb-2">
              Guest Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="guestName"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label htmlFor="guestEmail" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
              <span className="text-gray-500 font-normal ml-2">Optional - for sending invites later</span>
            </label>
            <input
              type="email"
              id="guestEmail"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label htmlFor="contactInfo" className="block text-sm font-semibold text-gray-700 mb-2">
              Other Contact Info
              <span className="text-gray-500 font-normal ml-2">Optional - phone, social media, etc.</span>
            </label>
            <input
              type="text"
              id="contactInfo"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="Twitter: @johndoe or +1-555-0123"
            />
          </div>

          <div>
            <label htmlFor="budgetAmount" className="block text-sm font-semibold text-gray-700 mb-2">
              Budget Amount (USD)
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
          </div>

          <div>
            <label htmlFor="topics" className="block text-sm font-semibold text-gray-700 mb-2">
              Preferred Topics
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
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
              Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
              placeholder="Why do you want this guest? Any additional information..."
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
              {loading ? 'Adding...' : 'Add to Wishlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Guest Wishlist Modal Component
function EditGuestWishlistModal({
  wishlist,
  podcastId,
  onClose,
  onSuccess,
}: {
  wishlist: PodcastGuestWishlist;
  podcastId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [budgetAmount, setBudgetAmount] = useState(wishlist.budgetAmount);
  const [preferredTopics, setPreferredTopics] = useState(wishlist.preferredTopics?.join(', ') || '');
  const [notes, setNotes] = useState(wishlist.notes);
  const [contactInfo, setContactInfo] = useState(wishlist.contactInfo || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const topicsArray = preferredTopics
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      const response = await fetch('/api/podcast/wishlist/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wishlistId: wishlist.id,
          podcastId,
          budgetAmount,
          preferredTopics: topicsArray.length > 0 ? topicsArray : undefined,
          notes: notes.trim(),
          contactInfo: contactInfo.trim() || undefined,
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
          <h2 className="text-2xl font-bold text-gray-900">Edit Guest Entry</h2>
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
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="budgetAmount" className="block text-sm font-semibold text-gray-700 mb-2">
              Budget Amount (USD)
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
              />
            </div>
          </div>

          {!wishlist.isRegistered && (
            <div>
              <label htmlFor="contactInfo" className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Info
              </label>
              <input
                type="text"
                id="contactInfo"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label htmlFor="topics" className="block text-sm font-semibold text-gray-700 mb-2">
              Preferred Topics
            </label>
            <input
              type="text"
              id="topics"
              value={preferredTopics}
              onChange={(e) => setPreferredTopics(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
