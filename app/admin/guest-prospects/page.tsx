'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PodcastGuestWishlist } from '@/app/types/guest';

interface ProspectWithPodcast extends PodcastGuestWishlist {
  podcastOwnerName?: string;
}

export default function GuestProspectsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [prospects, setProspects] = useState<ProspectWithPodcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    withEmail: 0,
    withoutEmail: 0,
    inviteSent: 0,
  });

  useEffect(() => {
    if (!authLoading && (!user || userData?.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [authLoading, user, userData, router]);

  useEffect(() => {
    if (user && userData?.role === 'admin') {
      loadProspects();
    }
  }, [user, userData]);

  const loadProspects = async () => {
    try {
      setLoading(true);
      const wishlistRef = collection(db, 'podcastGuestWishlists');
      
      // Get all unregistered guests
      const q = query(
        wishlistRef,
        where('isRegistered', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const prospectList = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as ProspectWithPodcast;
      });

      // Get podcast owner names
      const enrichedProspects = await Promise.all(
        prospectList.map(async (prospect) => {
          try {
            // Get podcast to find owner
            const podcastDoc = await getDocs(
              query(collection(db, 'podcasts'), where('__name__', '==', prospect.podcastId))
            );
            
            if (!podcastDoc.empty) {
              const podcastData = podcastDoc.docs[0].data();
              const ownerId = podcastData.ownerId;
              
              if (ownerId) {
                const ownerDoc = await getDocs(
                  query(collection(db, 'users'), where('__name__', '==', ownerId))
                );
                
                if (!ownerDoc.empty) {
                  prospect.podcastOwnerName = ownerDoc.docs[0].data().displayName || 'Unknown';
                }
              }
            }
          } catch (error) {
            console.error('Error enriching prospect:', error);
          }
          return prospect;
        })
      );

      setProspects(enrichedProspects);

      // Calculate stats
      const totalCount = enrichedProspects.length;
      const withEmailCount = enrichedProspects.filter(p => p.guestEmail).length;
      const withoutEmailCount = totalCount - withEmailCount;
      const inviteSentCount = enrichedProspects.filter(p => p.inviteSent).length;

      setStats({
        total: totalCount,
        withEmail: withEmailCount,
        withoutEmail: withoutEmailCount,
        inviteSent: inviteSentCount,
      });
    } catch (error) {
      console.error('Error loading prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async (prospectId: string) => {
    if (!user || !editEmail) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/admin/update-prospect-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ prospectId, email: editEmail }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update email');
      }

      // Reload prospects
      await loadProspects();
      setEditingId(null);
      setEditEmail('');
    } catch (error) {
      console.error('Error updating email:', error);
      alert('Failed to update email. Please try again.');
    }
  };

  const handleSendInvite = async (prospect: ProspectWithPodcast) => {
    if (!user || !prospect.guestEmail) return;

    setSendingInvite(prospect.id);
    try {
      // Get podcast details
      const podcastDoc = await getDocs(
        query(collection(db, 'podcasts'), where('__name__', '==', prospect.podcastId))
      );
      
      if (podcastDoc.empty) {
        throw new Error('Podcast not found');
      }

      const podcastData = podcastDoc.docs[0].data();
      const podcastOwnerId = podcastData.ownerId;

      const response = await fetch('/api/guest/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          podcastId: prospect.podcastId,
          podcastOwnerId,
          guestEmail: prospect.guestEmail,
          guestName: prospect.guestName,
          offeredAmount: prospect.budgetAmount,
          message: prospect.notes,
          preferredTopics: prospect.preferredTopics,
          wishlistEntryId: prospect.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invitation');
      }

      alert('Invitation sent successfully!');
      await loadProspects();
    } catch (error) {
      console.error('Error sending invite:', error);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setSendingInvite(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || userData?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">Guest Prospects</h1>
          <p className="text-gray-400">
            Manage potential guests without contact information
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-purple-400 mb-2">{stats.total}</div>
            <div className="text-sm text-gray-400">Total Prospects</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-green-400 mb-2">{stats.withEmail}</div>
            <div className="text-sm text-gray-400">With Email</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-red-400 mb-2">{stats.withoutEmail}</div>
            <div className="text-sm text-gray-400">Without Email</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="text-3xl font-bold text-blue-400 mb-2">{stats.inviteSent}</div>
            <div className="text-sm text-gray-400">Invitations Sent</div>
          </div>
        </div>

        {/* Prospects List */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">All Prospects</h2>
          
          {prospects.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-xl mb-2">No prospects found</p>
              <p className="text-sm">All guest wishlist entries have contact information.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prospects.map((prospect) => (
                <div
                  key={prospect.id}
                  className="bg-slate-700 rounded-lg p-6 border border-slate-600"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{prospect.guestName}</h3>
                      <p className="text-sm text-gray-400">
                        Requested by: {prospect.podcastOwnerName || 'Unknown'} ({prospect.podcastName || 'Unknown Podcast'})
                      </p>
                      <p className="text-sm text-gray-400">
                        Added: {prospect.createdAt?.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">
                        ${prospect.budgetAmount}
                      </div>
                      <div className="text-xs text-gray-400">Budget</div>
                    </div>
                  </div>

                  {/* Email Section */}
                  <div className="mb-4">
                    {prospect.guestEmail ? (
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span className="font-mono">{prospect.guestEmail}</span>
                        {prospect.inviteSent ? (
                          <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded text-xs">
                            Invite Sent {prospect.inviteSentAt ? new Date(prospect.inviteSentAt).toLocaleDateString() : ''}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendInvite(prospect)}
                            disabled={sendingInvite === prospect.id}
                            className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm disabled:opacity-50"
                          >
                            {sendingInvite === prospect.id ? 'Sending...' : 'Send Invite'}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div>
                        {editingId === prospect.id ? (
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              placeholder="Enter email address"
                              className="flex-1 bg-slate-600 text-white px-3 py-2 rounded border border-slate-500 focus:outline-none focus:border-purple-500"
                            />
                            <button
                              onClick={() => handleAddEmail(prospect.id)}
                              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                            >
                              Save & Send Invite
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditEmail('');
                              }}
                              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-red-400">✗ No email address</span>
                            <button
                              onClick={() => setEditingId(prospect.id)}
                              className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
                            >
                              Add Email
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Topics */}
                  {prospect.preferredTopics && prospect.preferredTopics.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-400 mb-2">Topics:</div>
                      <div className="flex flex-wrap gap-2">
                        {prospect.preferredTopics.map((topic, idx) => (
                          <span
                            key={idx}
                            className="bg-purple-900 text-purple-300 px-2 py-1 rounded text-xs"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Notes:</div>
                    <div className="bg-slate-600 rounded p-3 text-sm">
                      {prospect.notes}
                    </div>
                  </div>

                  {/* Additional Contact Info */}
                  {prospect.contactInfo && (
                    <div className="mt-4">
                      <div className="text-sm text-gray-400 mb-2">Additional Contact:</div>
                      <div className="bg-slate-600 rounded p-3 text-sm">
                        {prospect.contactInfo}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
