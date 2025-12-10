'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { Match } from '@/app/types/match';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function PodcastMatchesPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const podcastId = params.podcastId as string;

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dismissingMatch, setDismissingMatch] = useState<string | null>(null);

  // Redirect if not a podcast owner
  useEffect(() => {
    if (!authLoading && (!userData || !userData.hasPodcast)) {
      router.push('/dashboard');
    }
  }, [userData, authLoading, router]);

  const loadMatches = useCallback(async () => {
    if (!userData?.uid || !user) return;

    try {
      setLoading(true);
      setError('');

      const token = await user.getIdToken();
      const response = await fetch(`/api/matching/my-matches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load matches');
      }

      setMatches(data.matches);
    } catch (err) {
      console.error('Error loading matches:', err);
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [userData, user]);

  useEffect(() => {
    if (userData?.uid && userData?.hasPodcast) {
      loadMatches();
    }
  }, [userData, loadMatches]);

  const handleDismiss = async (matchId: string) => {
    if (!confirm('Are you sure you want to dismiss this match? You can\'t undo this action.')) {
      return;
    }

    try {
      setDismissingMatch(matchId);
      if (!user) return;
      const token = await user.getIdToken();

      const response = await fetch('/api/matching/dismiss-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId,
          dismissedBy: 'podcast',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to dismiss match');
      }

      // Reload matches
      loadMatches();
    } catch (err) {
      console.error('Error dismissing match:', err);
      alert(err instanceof Error ? err.message : 'Failed to dismiss match');
    } finally {
      setDismissingMatch(null);
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getBudgetAlignmentBadge = (alignment: string) => {
    switch (alignment) {
      case 'perfect':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Perfect Match</span>;
      case 'close':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Close Match</span>;
      case 'negotiable':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">Negotiable</span>;
      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  if (!userData?.hasPodcast) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Guest Matches</h1>
              <p className="mt-2 text-gray-600">
                Guests who are interested in appearing on your podcast
              </p>
            </div>
            <Link
              href={`/dashboard/podcast/${podcastId}/guests`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              View Guest Wishlist
            </Link>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && matches.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No matches yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add guests to your wishlist to find matches!
            </p>
            <div className="mt-6">
              <Link
                href="/marketplace/guests"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Browse Guests
              </Link>
            </div>
          </div>
        )}

        {/* Matches Grid */}
        {matches.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Guest Image */}
                <div className="relative h-48 bg-gray-200">
                  {match.guestImageUrl ? (
                    <Image
                      src={match.guestImageUrl}
                      alt={match.guestName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg
                        className="h-16 w-16 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Match Details */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {match.guestName}
                  </h3>

                  {/* Guest Rate */}
                  {match.guestRate !== undefined && (
                    <p className="text-sm text-gray-600 mb-2">
                      Rate: {match.guestRate > 0 ? `$${match.guestRate.toLocaleString()}` : 'Free'}
                    </p>
                  )}

                  {/* Compatibility Score */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Compatibility</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCompatibilityColor(match.compatibilityScore)}`}>
                      {match.compatibilityScore}%
                    </span>
                  </div>

                  {/* Budget Alignment */}
                  <div className="mb-4">
                    {getBudgetAlignmentBadge(match.budgetAlignment)}
                  </div>

                  {/* Topic Overlap */}
                  {match.topicOverlap && match.topicOverlap.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-2">Shared Topics:</p>
                      <div className="flex flex-wrap gap-2">
                        {match.topicOverlap.slice(0, 3).map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {topic}
                          </span>
                        ))}
                        {match.topicOverlap.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            +{match.topicOverlap.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Offer Details */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm">
                      <p className="text-gray-600">Your Budget:</p>
                      <p className="font-semibold text-gray-900">
                        {match.podcastBudgetAmount > 0
                          ? `${match.podcastBudgetAmount.toFixed(0)} UGX`
                          : 'Free'}
                      </p>
                    </div>
                    <div className="text-sm mt-2">
                      <p className="text-gray-600">Guest Offer:</p>
                      <p className="font-semibold text-gray-900">
                        {match.guestOfferAmount > 0
                          ? `${match.guestOfferAmount.toFixed(0)} UGX`
                          : 'Free'}
                      </p>
                    </div>
                  </div>

                  {/* Guest Topics */}
                  {match.guestTopics && match.guestTopics.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-2">Guest Expertise:</p>
                      <div className="flex flex-wrap gap-2">
                        {match.guestTopics.slice(0, 3).map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded"
                          >
                            {topic}
                          </span>
                        ))}
                        {match.guestTopics.length > 3 && (
                          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded">
                            +{match.guestTopics.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Match Date */}
                  <p className="text-xs text-gray-500 mb-4">
                    Matched {new Date(match.matchedAt).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/guest/${match.guestId}`}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white text-center rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => handleDismiss(match.id)}
                      disabled={dismissingMatch === match.id}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {dismissingMatch === match.id ? 'Dismissing...' : 'Dismiss'}
                    </button>
                  </div>

                  {/* Coming Soon: Start Collaboration */}
                  <div className="mt-3">
                    <button
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                    >
                      Start Collaboration (Coming Soon)
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
