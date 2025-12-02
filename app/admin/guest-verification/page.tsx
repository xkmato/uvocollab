'use client';

import { User } from '@/app/types/user';
import { useAuth } from '@/app/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function GuestVerificationPage() {
    const { user, userData, loading: authLoading } = useAuth();
    const router = useRouter();
    const [verificationRequests, setVerificationRequests] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && (!user || userData?.role !== 'admin')) {
            router.push('/dashboard');
        }
    }, [authLoading, user, userData, router]);

    useEffect(() => {
        if (user && userData?.role === 'admin') {
            loadVerificationRequests();
        }
    }, [user, userData]);

    const loadVerificationRequests = async () => {
        try {
            setLoading(true);
            const usersRef = collection(db, 'users');
            const q = query(
                usersRef,
                where('isGuest', '==', true),
                where('isVerifiedGuest', '==', false)
            );
            const snapshot = await getDocs(q);
            const requests = snapshot.docs.map((doc) => ({
                ...doc.data(),
                guestVerificationRequestedAt: doc.data().guestVerificationRequestedAt?.toDate(),
            })) as User[];

            // Filter to only those who have requested verification
            const filtered = requests.filter(r => r.guestVerificationRequestedAt);
            
            // Sort by request date
            filtered.sort((a, b) => {
                const dateA = a.guestVerificationRequestedAt?.getTime() || 0;
                const dateB = b.guestVerificationRequestedAt?.getTime() || 0;
                return dateB - dateA;
            });

            setVerificationRequests(filtered);
        } catch (error) {
            console.error('Error loading verification requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (guestId: string, approve: boolean, reason?: string, adminNotes?: string) => {
        if (!user) return;

        setProcessingId(guestId);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/admin/verify-guest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ guestId, approve, reason, adminNotes }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to process verification');
            }

            // Reload the list
            await loadVerificationRequests();
        } catch (error) {
            console.error('Error processing verification:', error);
            alert('Failed to process verification. Please try again.');
        } finally {
            setProcessingId(null);
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
        <div className="min-h-screen bg-slate-900 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Guest Verification Requests</h1>
                        <p className="text-white/70">Review and approve guest verification requests</p>
                    </div>
                    <Link
                        href="/admin/vetting"
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                    >
                        Back to Admin
                    </Link>
                </div>

                {/* Stats */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <div className="text-white/70 text-sm mb-1">Pending Requests</div>
                        <div className="text-3xl font-bold text-white">{verificationRequests.length}</div>
                    </div>
                </div>

                {/* Verification Requests List */}
                {verificationRequests.length === 0 ? (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-white/10 text-center">
                        <div className="text-white/50 mb-4">
                            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No Pending Requests</h3>
                        <p className="text-white/70">All verification requests have been processed</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {verificationRequests.map((guest) => (
                            <div
                                key={guest.uid}
                                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                            >
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Guest Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">
                                                    {guest.displayName}
                                                </h3>
                                                <p className="text-white/70 text-sm">{guest.email}</p>
                                                {guest.guestVerificationRequestedAt && (
                                                    <p className="text-white/50 text-xs mt-1">
                                                        Requested: {guest.guestVerificationRequestedAt.toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                            {guest.profileImageUrl && (
                                                <img
                                                    src={guest.profileImageUrl}
                                                    alt={guest.displayName}
                                                    className="w-16 h-16 rounded-full object-cover"
                                                />
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-white/70 text-sm font-semibold">Bio</label>
                                                <p className="text-white mt-1">{guest.guestBio || 'No bio provided'}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-white/70 text-sm font-semibold">Rate</label>
                                                    <p className="text-white mt-1">
                                                        ${guest.guestRate || 0} USD
                                                        {guest.guestRate === 0 && <span className="text-white/50"> (Free)</span>}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-white/70 text-sm font-semibold">Availability</label>
                                                    <p className="text-white mt-1">{guest.guestAvailability || 'Not specified'}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-white/70 text-sm font-semibold">Topics</label>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {guest.guestTopics && guest.guestTopics.length > 0 ? (
                                                        guest.guestTopics.map((topic, index) => (
                                                            <span
                                                                key={index}
                                                                className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
                                                            >
                                                                {topic}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-white/50 text-sm">No topics specified</span>
                                                    )}
                                                </div>
                                            </div>

                                            {guest.socialLinks && guest.socialLinks.length > 0 && (
                                                <div>
                                                    <label className="text-white/70 text-sm font-semibold">Social Links</label>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {guest.socialLinks.map((link, index) => (
                                                            <a
                                                                key={index}
                                                                href={link.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                                                            >
                                                                {link.platform}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {guest.previousAppearances && guest.previousAppearances.length > 0 && (
                                                <div>
                                                    <label className="text-white/70 text-sm font-semibold">Previous Appearances</label>
                                                    <div className="space-y-1 mt-1">
                                                        {guest.previousAppearances.map((appearance, index) => (
                                                            <a
                                                                key={index}
                                                                href={appearance}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block text-cyan-400 hover:text-cyan-300 text-sm underline"
                                                            >
                                                                {appearance}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="lg:w-48 flex flex-col gap-3">
                                        <button
                                            onClick={() => {
                                                const notes = prompt('Add admin notes (optional):');
                                                handleVerify(guest.uid, true, undefined, notes || undefined);
                                            }}
                                            disabled={processingId === guest.uid}
                                            className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {processingId === guest.uid ? 'Processing...' : 'Approve'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                const reason = prompt('Enter reason for decline (will be sent to guest):');
                                                if (reason === null) return; // User cancelled
                                                const notes = prompt('Add admin notes (internal only, optional):');
                                                handleVerify(guest.uid, false, reason || 'Not specified', notes || undefined);
                                            }}
                                            disabled={processingId === guest.uid}
                                            className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Decline
                                        </button>
                                        <Link
                                            href={`/guest/${guest.uid}`}
                                            target="_blank"
                                            className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors text-center"
                                        >
                                            View Profile
                                        </Link>
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
