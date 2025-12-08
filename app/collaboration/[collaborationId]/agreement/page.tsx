'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { Collaboration } from '@/app/types/collaboration';
import { User } from '@/app/types/user';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Podcast {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    userId: string;
}

export default function GuestCollaborationAgreement() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const collaborationId = params.collaborationId as string;

    const [collaboration, setCollaboration] = useState<Collaboration | null>(null);
    const [guest, setGuest] = useState<User | null>(null);
    const [podcastOwner, setPodcastOwner] = useState<User | null>(null);
    const [podcast, setPodcast] = useState<Podcast | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Negotiation form state
    const [showNegotiation, setShowNegotiation] = useState(false);
    const [counterPrice, setCounterPrice] = useState<number>(0);
    const [counterTopics, setCounterTopics] = useState<string[]>([]);
    const [counterDates, setCounterDates] = useState('');
    const [counterMessage, setCounterMessage] = useState('');

    const isGuest = user?.uid === collaboration?.guestId;
    const isPodcastOwner = user?.uid && podcast?.userId === user.uid;
    const canRespond = (isGuest || isPodcastOwner) && collaboration?.status === 'pending_agreement';

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && collaborationId) {
            loadCollaborationData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, collaborationId]);

    const loadCollaborationData = async () => {
        if (!user || !collaborationId) return;

        try {
            setLoadingData(true);

            // Load collaboration document
            const collabRef = doc(db, 'collaborations', collaborationId);
            const collabSnap = await getDoc(collabRef);

            if (!collabSnap.exists()) {
                setAccessDenied(true);
                setLoadingData(false);
                return;
            }

            const collabData = {
                id: collabSnap.id,
                ...collabSnap.data(),
                createdAt: collabSnap.data().createdAt?.toDate(),
                updatedAt: collabSnap.data().updatedAt?.toDate(),
                recordingDate: collabSnap.data().recordingDate?.toDate(),
                episodeReleaseDate: collabSnap.data().episodeReleaseDate?.toDate(),
                schedulingDetails: collabSnap.data().schedulingDetails ? {
                    ...collabSnap.data().schedulingDetails,
                    date: collabSnap.data().schedulingDetails.date?.toDate(),
                } : undefined,
                negotiationHistory: collabSnap.data().negotiationHistory?.map((entry: {
                    proposedBy: string;
                    proposedPrice?: number;
                    proposedTopics?: string[];
                    proposedDates?: string;
                    message?: string;
                    timestamp: { toDate: () => Date };
                }) => ({
                    ...entry,
                    timestamp: entry.timestamp?.toDate(),
                })),
            } as Collaboration;

            // Verify this is a guest appearance collaboration
            if (collabData.type !== 'guest_appearance') {
                setAccessDenied(true);
                setLoadingData(false);
                return;
            }

            // Load guest information
            if (collabData.guestId) {
                const guestQuery = query(collection(db, 'users'), where('uid', '==', collabData.guestId));
                const guestSnap = await getDocs(guestQuery);
                if (!guestSnap.empty) {
                    setGuest(guestSnap.docs[0].data() as User);
                }
            }

            // Load podcast information
            if (collabData.podcastId) {
                const podcastDoc = await getDoc(doc(db, 'podcasts', collabData.podcastId));
                if (podcastDoc.exists()) {
                    const podcastData = {
                        id: podcastDoc.id,
                        ...podcastDoc.data(),
                    } as Podcast;
                    setPodcast(podcastData);

                    // Load podcast owner
                    if (podcastData.userId) {
                        const ownerQuery = query(collection(db, 'users'), where('uid', '==', podcastData.userId));
                        const ownerSnap = await getDocs(ownerQuery);
                        if (!ownerSnap.empty) {
                            setPodcastOwner(ownerSnap.docs[0].data() as User);
                        }
                    }
                }
            }

            // Check access: only guest and podcast owner can view
            const hasAccess = collabData.guestId === user.uid ||
                (podcast && podcast.userId === user.uid);

            if (!hasAccess) {
                setAccessDenied(true);
                setLoadingData(false);
                return;
            }

            setCollaboration(collabData);

            // Initialize counter-offer form with current values
            setCounterPrice(collabData.price);
            setCounterTopics(collabData.proposedTopics || collabData.agreedTopics || []);
            setCounterDates(collabData.proposedDates || '');

        } catch (error) {
            console.error('Error loading collaboration:', error);
            setError('Failed to load collaboration details');
        } finally {
            setLoadingData(false);
        }
    };

    const handleAccept = async () => {
        if (!user || !collaboration) return;

        try {
            setSubmitting(true);
            setError(null);

            const collabRef = doc(db, 'collaborations', collaborationId);

            // Determine next status based on payment
            let nextStatus: string;
            if (collaboration.price === 0) {
                nextStatus = 'scheduling'; // Free appearance, go straight to scheduling
            } else {
                nextStatus = 'pending_payment'; // Paid appearance, need payment
            }

            await updateDoc(collabRef, {
                status: nextStatus,
                agreedTopics: collaboration.proposedTopics || collaboration.agreedTopics,
                updatedAt: new Date(),
            });

            // Redirect based on next step
            if (nextStatus === 'pending_payment') {
                router.push(`/collaboration/${collaborationId}`);
            } else {
                router.push(`/collaboration/${collaborationId}`);
            }

        } catch (error) {
            console.error('Error accepting agreement:', error);
            setError('Failed to accept agreement. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDecline = async () => {
        if (!user || !collaboration) return;

        const confirmed = window.confirm('Are you sure you want to decline this collaboration? This action cannot be undone.');
        if (!confirmed) return;

        try {
            setSubmitting(true);
            setError(null);

            const collabRef = doc(db, 'collaborations', collaborationId);
            await updateDoc(collabRef, {
                status: 'declined',
                updatedAt: new Date(),
            });

            router.push('/dashboard');

        } catch (error) {
            console.error('Error declining agreement:', error);
            setError('Failed to decline agreement. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCounterOffer = async () => {
        if (!user || !collaboration) return;

        if (counterTopics.length === 0) {
            setError('Please specify at least one topic');
            return;
        }

        if (!counterMessage.trim()) {
            setError('Please provide a message explaining your counter-offer');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const collabRef = doc(db, 'collaborations', collaborationId);

            // Create negotiation entry
            const negotiationEntry = {
                proposedBy: user.uid,
                proposedPrice: counterPrice,
                proposedTopics: counterTopics,
                proposedDates: counterDates || undefined,
                message: counterMessage,
                timestamp: new Date(),
            };

            // Update collaboration with new proposal
            await updateDoc(collabRef, {
                price: counterPrice,
                proposedTopics: counterTopics,
                proposedDates: counterDates || null,
                negotiationHistory: [...(collaboration.negotiationHistory || []), negotiationEntry],
                updatedAt: new Date(),
            });

            // Send notification to the other party
            const recipientId = isGuest ? podcast?.userId : collaboration.guestId;
            if (recipientId) {
                await addDoc(collection(db, 'notifications'), {
                    userId: recipientId,
                    type: 'collaboration_counter_offer',
                    title: 'New Counter-Offer Received',
                    message: `${user.displayName} has sent a counter-offer for the guest appearance collaboration.`,
                    collaborationId,
                    read: false,
                    createdAt: new Date(),
                });
            }

            // Reload data and hide form
            setShowNegotiation(false);
            setCounterMessage('');
            await loadCollaborationData();

        } catch (error) {
            console.error('Error submitting counter-offer:', error);
            setError('Failed to submit counter-offer. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || loadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading collaboration details...</p>
                </div>
            </div>
        );
    }

    if (accessDenied || !collaboration) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-gray-600 mb-6">
                        You don&apos;t have permission to view this collaboration.
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const paymentDirection = (collaboration as Collaboration & { paymentDirection?: string }).paymentDirection;

    return (
        <div className="min-h-screen bg-gray-50 py-12 pt-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Guest Appearance Agreement
                    </h1>
                    <p className="text-gray-600">
                        Review and negotiate the terms for this collaboration
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Collaboration Details */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Collaboration Details</h2>

                    <div className="space-y-4">
                        {/* Parties */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-700 mb-2">Guest</h3>
                                <div className="flex items-center space-x-3">
                                    {guest?.profileImageUrl && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={guest.profileImageUrl}
                                            alt={guest.displayName || 'Guest'}
                                            className="w-12 h-12 rounded-full"
                                        />
                                    )}
                                    <div>
                                        <p className="font-medium">{guest?.displayName}</p>
                                        {guest?.isVerifiedGuest && (
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                ✓ Verified
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-700 mb-2">Podcast</h3>
                                <div className="flex items-center space-x-3">
                                    {podcast?.imageUrl && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={podcast.imageUrl}
                                            alt={podcast.title}
                                            className="w-12 h-12 rounded-lg"
                                        />
                                    )}
                                    <div>
                                        <p className="font-medium">{podcast?.title}</p>
                                        <p className="text-sm text-gray-600">
                                            Host: {podcastOwner?.displayName}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-700 mb-2">Payment Terms</h3>
                            {paymentDirection === 'free' ? (
                                <p className="text-lg">
                                    <span className="font-bold text-green-600">Free Appearance</span>
                                    <span className="text-gray-600"> - No payment required</span>
                                </p>
                            ) : paymentDirection === 'podcast_pays_guest' ? (
                                <p className="text-lg">
                                    <span className="font-bold text-indigo-600">
                                        ${collaboration.price.toFixed(2)}
                                    </span>
                                    <span className="text-gray-600"> - Podcast pays guest</span>
                                </p>
                            ) : (
                                <p className="text-lg">
                                    <span className="font-bold text-indigo-600">
                                        ${collaboration.price.toFixed(2)}
                                    </span>
                                    <span className="text-gray-600"> - Guest pays podcast</span>
                                </p>
                            )}
                        </div>

                        {/* Topics */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-700 mb-2">Discussion Topics</h3>
                            <div className="flex flex-wrap gap-2">
                                {(collaboration.proposedTopics || collaboration.agreedTopics || []).map((topic: string, index: number) => (
                                    <span
                                        key={index}
                                        className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                                    >
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Proposed Dates */}
                        {collaboration.proposedDates && (
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-700 mb-2">Proposed Dates</h3>
                                <p className="text-gray-700">{collaboration.proposedDates}</p>
                            </div>
                        )}

                        {/* Message */}
                        {(collaboration as Collaboration & { message?: string }).message && (
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-700 mb-2">Message</h3>
                                <p className="text-gray-700">{(collaboration as Collaboration & { message?: string }).message}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Negotiation History */}
                {collaboration.negotiationHistory && collaboration.negotiationHistory.length > 1 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Negotiation History</h2>
                        <div className="space-y-4">
                            {collaboration.negotiationHistory.map((entry, index) => {
                                const isCurrentUser = entry.proposedBy === user?.uid;
                                return (
                                    <div
                                        key={index}
                                        className={`border-l-4 pl-4 ${isCurrentUser ? 'border-indigo-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-semibold">
                                                {isCurrentUser ? 'You' : (isGuest ? podcastOwner?.displayName : guest?.displayName)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {entry.timestamp?.toLocaleDateString()}
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Offered: ${entry.proposedPrice?.toFixed(2)}
                                        </p>
                                        {entry.proposedTopics && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {entry.proposedTopics.map((topic, i) => (
                                                    <span
                                                        key={i}
                                                        className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs"
                                                    >
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {entry.message && (
                                            <p className="text-gray-700 text-sm">{entry.message}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Counter Offer Form */}
                {showNegotiation && canRespond && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Submit Counter-Offer</h2>

                        <div className="space-y-4">
                            {/* Price */}
                            <div>
                                <label htmlFor="counter-price" className="block text-sm font-medium text-gray-700 mb-2">
                                    Proposed Price ($)
                                </label>
                                <input
                                    id="counter-price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={counterPrice}
                                    onChange={(e) => setCounterPrice(parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    title="Enter the proposed price in dollars"
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Topics */}
                            <div>
                                <label htmlFor="counter-topics" className="block text-sm font-medium text-gray-700 mb-2">
                                    Topics (comma-separated)
                                </label>
                                <input
                                    id="counter-topics"
                                    type="text"
                                    value={counterTopics.join(', ')}
                                    onChange={(e) => setCounterTopics(e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g., Marketing, Entrepreneurship, Tech"
                                    title="Enter discussion topics separated by commas"
                                />
                            </div>

                            {/* Dates */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Proposed Dates (optional)
                                </label>
                                <textarea
                                    value={counterDates}
                                    onChange={(e) => setCounterDates(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g., Available January 15-20 or February 1-5"
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={counterMessage}
                                    onChange={(e) => setCounterMessage(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Explain your counter-offer..."
                                    required
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex space-x-4">
                                <button
                                    onClick={handleCounterOffer}
                                    disabled={submitting}
                                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Counter-Offer'}
                                </button>
                                <button
                                    onClick={() => setShowNegotiation(false)}
                                    disabled={submitting}
                                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {canRespond && !showNegotiation && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Response</h2>
                        <p className="text-gray-600 mb-6">
                            You can accept these terms, negotiate different terms, or decline the collaboration.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleAccept}
                                disabled={submitting}
                                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                            >
                                {submitting ? 'Processing...' : '✓ Accept Terms'}
                            </button>
                            <button
                                onClick={() => setShowNegotiation(true)}
                                disabled={submitting}
                                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                            >
                                💬 Negotiate Terms
                            </button>
                            <button
                                onClick={handleDecline}
                                disabled={submitting}
                                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                            >
                                ✕ Decline
                            </button>
                        </div>
                    </div>
                )}

                {/* Waiting for other party */}
                {!canRespond && collaboration.status === 'pending_agreement' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Waiting for Response
                        </h2>
                        <p className="text-gray-700">
                            The other party is reviewing the proposal. You&apos;ll be notified when they respond.
                        </p>
                    </div>
                )}

                {/* Collaboration already progressed */}
                {collaboration.status !== 'pending_agreement' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Agreement Finalized
                        </h2>
                        <p className="text-gray-700 mb-4">
                            The terms have been agreed upon. Proceed to the collaboration hub to continue.
                        </p>
                        <button
                            onClick={() => router.push(`/collaboration/${collaborationId}`)}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                        >
                            Go to Collaboration Hub
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
