'use client';

import { User } from '@/app/types/user';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import AddGuestToWishlistModal from '@/app/components/AddGuestToWishlistModal';

export default function PublicGuestProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { userData } = useAuth();
  const guestId = params.guestId as string;

  const [guest, setGuest] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [userPodcastId, setUserPodcastId] = useState<string | null>(null);

  useEffect(() => {
    if (guestId) {
      loadGuestProfile();
    }
  }, [guestId]);

  // Check if current user has a podcast
  useEffect(() => {
    if (userData?.uid) {
      checkUserPodcast();
    }
  }, [userData]);

  const checkUserPodcast = async () => {
    if (!userData?.uid) return;

    try {
      // Query podcasts collection for a podcast owned by this user
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const podcastsRef = collection(db, 'podcasts');
      const q = query(podcastsRef, where('ownerId', '==', userData.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setUserPodcastId(querySnapshot.docs[0].id);
      }
    } catch (err) {
      console.error('Error checking user podcast:', err);
    }
  };

  const loadGuestProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const userRef = doc(db, 'users', guestId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setError('Guest not found');
        setLoading(false);
        return;
      }

      const userData = {
        uid: userSnap.id,
        ...userSnap.data(),
      } as User;

      // Verify user is a guest
      if (!userData.isGuest) {
        setError('This user is not registered as a guest');
        setLoading(false);
        return;
      }

      setGuest(userData);
    } catch (err) {
      console.error('Error loading guest profile:', err);
      setError('Failed to load guest profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading guest profile...</p>
        </div>
      </div>
    );
  }

  if (error || !guest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Guest not found'}</p>
          <button
            onClick={() => router.push('/marketplace')}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header / Profile */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Profile Image */}
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg bg-gray-200">
                {guest.profileImageUrl ? (
                  <Image
                    src={guest.profileImageUrl}
                    alt={guest.displayName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-purple-100">
                    <span className="text-6xl">👤</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-grow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{guest.displayName}</h1>
                  {guest.isVerifiedGuest && (
                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Verified Guest
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600">
                    {guest.guestRate && guest.guestRate > 0 ? `$${guest.guestRate}` : 'Negotiable'}
                  </div>
                  <div className="text-sm text-gray-500">Guest Rate</div>
                </div>
              </div>

              {/* Bio */}
              {guest.guestBio && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
                  <p className="text-gray-700 leading-relaxed">{guest.guestBio}</p>
                </div>
              )}

              {/* Topics */}
              {guest.guestTopics && guest.guestTopics.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Expertise & Topics</h2>
                  <div className="flex flex-wrap gap-2">
                    {guest.guestTopics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability */}
              {guest.guestAvailability && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Availability</h2>
                  <p className="text-gray-700">{guest.guestAvailability}</p>
                </div>
              )}

              {/* Social Links */}
              {guest.socialLinks && guest.socialLinks.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Social Media</h2>
                  <div className="flex flex-wrap gap-3">
                    {guest.socialLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <span className="font-medium">{link.platform}</span>
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous Appearances */}
              {guest.previousAppearances && guest.previousAppearances.length > 0 && guest.previousAppearances[0] !== '' && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Previous Podcast Appearances</h2>
                  <ul className="space-y-2">
                    {guest.previousAppearances.map((appearance, idx) => (
                      <li key={idx}>
                        <a
                          href={appearance}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 hover:underline flex items-center"
                        >
                          {appearance}
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              {userPodcastId && (
                <div className="pt-6 border-t">
                  <button
                    onClick={() => setShowWishlistModal(true)}
                    className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Add to My Wishlist
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Wishlist Modal */}
      {showWishlistModal && userPodcastId && (
        <AddGuestToWishlistModal
          guest={guest}
          podcastId={userPodcastId}
          onClose={() => setShowWishlistModal(false)}
          onSuccess={() => {
            setShowWishlistModal(false);
            alert('Guest added to your wishlist successfully!');
          }}
        />
      )}
    </div>
  );
}
