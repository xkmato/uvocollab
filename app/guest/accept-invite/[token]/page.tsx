'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { GuestInvite } from '@/app/types/guest';

interface AcceptInvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function AcceptInvitePage({ params }: AcceptInvitePageProps) {
  const [token, setToken] = useState<string>('');
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<GuestInvite | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    // Unwrap params promise
    params.then((resolvedParams) => {
      setToken(resolvedParams.token);
    });
  }, [params]);

  useEffect(() => {
    if (!token) return;
    
    const fetchInvite = async () => {
      try {
        const response = await fetch(`/api/guest/invite/${token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Invalid or expired invitation link');
          } else if (response.status === 410) {
            setError('This invitation has already been accepted or declined');
          } else {
            setError('Failed to load invitation');
          }
          return;
        }

        const data = await response.json();
        setInvite(data.invite);
      } catch (err) {
        console.error('Error fetching invite:', err);
        setError('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  const handleAcceptInvite = async () => {
    if (!user) {
      // Store token in session storage for after login/signup
      sessionStorage.setItem('pendingInviteToken', token);
      router.push(`/auth/signup?invite=${token}`);
      return;
    }

    setAccepting(true);
    try {
      // Get Firebase auth token
      const idToken = await user.getIdToken();
      
      const response = await fetch(`/api/guest/accept-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to accept invitation');
        return;
      }

      const data = await response.json();
      
      // Redirect to collaboration or dashboard
      if (data.collaborationId) {
        router.push(`/collaboration/${data.collaborationId}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Error accepting invite:', err);
      setError('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-white text-xl">Loading invitation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invitation Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  const isExpired = new Date(invite.expiresAt) < new Date();

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invitation Expired</h1>
          <p className="text-gray-600 mb-6">
            This invitation expired on {new Date(invite.expiresAt).toLocaleDateString()}.
            Please contact the podcast owner for a new invitation.
          </p>
          <Link
            href="/"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white text-center">
            <div className="text-6xl mb-4">🎙️</div>
            <h1 className="text-3xl font-bold mb-2">Podcast Guest Invitation</h1>
            <p className="text-purple-100">You&apos;ve been invited to be a guest!</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Podcast Info */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{invite.podcastName}</h2>
              <p className="text-gray-600">Invited by the podcast team</p>
            </div>

            {/* Offer Details */}
            {invite.offeredAmount > 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💰</span>
                  <span className="font-semibold text-gray-900">Offered Amount:</span>
                </div>
                <p className="text-3xl font-bold text-green-600">${invite.offeredAmount}</p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  <span className="font-semibold text-gray-900">Free Collaboration Opportunity</span>
                </div>
              </div>
            )}

            {/* Topics */}
            {invite.preferredTopics && invite.preferredTopics.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>📋</span>
                  Proposed Topics:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {invite.preferredTopics.map((topic, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span>💬</span>
                Personal Message:
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700 italic">&quot;{invite.message}&quot;</p>
              </div>
            </div>

            {/* Expiration Notice */}
            <div className="mb-6 text-sm text-gray-500 text-center">
              This invitation expires on {new Date(invite.expiresAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {user ? (
                <button
                  onClick={handleAcceptInvite}
                  disabled={accepting}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {accepting ? 'Accepting...' : 'Accept Invitation'}
                </button>
              ) : (
                <>
                  <Link
                    href={`/auth/signup?invite=${token}`}
                    className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold text-center hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    Accept & Sign Up
                  </Link>
                  <Link
                    href={`/auth/login?invite=${token}`}
                    className="block w-full bg-white text-purple-600 border-2 border-purple-600 py-4 rounded-lg font-semibold text-center hover:bg-purple-50 transition-all"
                  >
                    Accept & Log In
                  </Link>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-500">
              Not interested? You can safely ignore this invitation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
