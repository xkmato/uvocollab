'use client';

import CommunicationThread from '@/app/components/CommunicationThread';
import FileSharing from '@/app/components/FileSharing';
import SchedulingInterface from '@/app/components/SchedulingInterface';
import RescheduleInterface from '@/app/components/RescheduleInterface';
import RecordingLinkManager from '@/app/components/RecordingLinkManager';
import MarkRecordingComplete from '@/app/components/MarkRecordingComplete';
import ReleaseEpisode from '@/app/components/ReleaseEpisode';
import CollaborationFeedbackForm from '@/app/components/CollaborationFeedbackForm';
import { useAuth } from '@/app/contexts/AuthContext';
import { Collaboration } from '@/app/types/collaboration';
import { Service } from '@/app/types/service';
import { User } from '@/app/types/user';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CollaborationHub() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const collaborationId = params.collaborationId as string;

    const [collaboration, setCollaboration] = useState<Collaboration | null>(null);
    const [legend, setLegend] = useState<User | null>(null);
    const [buyer, setBuyer] = useState<User | null>(null);
    const [service, setService] = useState<Service | null>(null);
    const [guest, setGuest] = useState<User | null>(null);
    const [podcastOwner, setPodcastOwner] = useState<User | null>(null);
    const [podcast, setPodcast] = useState<any | null>(null);
    const [loadingCollab, setLoadingCollab] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [markingComplete, setMarkingComplete] = useState(false);
    const [completeError, setCompleteError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && collaborationId) {
            loadCollaboration();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, collaborationId]);

    const loadCollaboration = async () => {
        if (!user || !collaborationId) return;

        try {
            setLoadingCollab(true);

            // Load collaboration document
            const collabRef = doc(db, 'collaborations', collaborationId);
            const collabSnap = await getDoc(collabRef);

            if (!collabSnap.exists()) {
                console.error('Collaboration not found');
                setAccessDenied(true);
                setLoadingCollab(false);
                return;
            }

            const collabData = {
                id: collabSnap.id,
                ...collabSnap.data(),
                createdAt: collabSnap.data().createdAt?.toDate(),
                updatedAt: collabSnap.data().updatedAt?.toDate(),
                acceptedAt: collabSnap.data().acceptedAt?.toDate(),
                paidAt: collabSnap.data().paidAt?.toDate(),
                completedAt: collabSnap.data().completedAt?.toDate(),
                contractSentAt: collabSnap.data().contractSentAt?.toDate(),
                allPartiesSignedAt: collabSnap.data().allPartiesSignedAt?.toDate(),
                recordingDate: collabSnap.data().recordingDate?.toDate(),
                episodeReleaseDate: collabSnap.data().episodeReleaseDate?.toDate(),
                schedulingDetails: collabSnap.data().schedulingDetails ? {
                    ...collabSnap.data().schedulingDetails,
                    date: collabSnap.data().schedulingDetails.date?.toDate(),
                } : undefined,
            } as Collaboration;

            // Check access based on collaboration type
            let hasAccess = false;
            if (collabData.type === 'guest_appearance') {
                // For guest appearances, check if user is guest or podcast owner
                hasAccess = collabData.guestId === user.uid || collabData.buyerId === user.uid;
                
                // Load guest and podcast data
                if (collabData.guestId) {
                    const guestQuery = query(collection(db, 'users'), where('uid', '==', collabData.guestId));
                    const guestSnap = await getDocs(guestQuery);
                    if (!guestSnap.empty) {
                        setGuest(guestSnap.docs[0].data() as User);
                    }
                }
                
                if (collabData.podcastId) {
                    const podcastDoc = await getDoc(doc(db, 'podcasts', collabData.podcastId));
                    if (podcastDoc.exists()) {
                        const podcastData = { id: podcastDoc.id, ...podcastDoc.data() };
                        setPodcast(podcastData);
                        
                        if ((podcastData as any).userId) {
                            const ownerQuery = query(collection(db, 'users'), where('uid', '==', (podcastData as any).userId));
                            const ownerSnap = await getDocs(ownerQuery);
                            if (!ownerSnap.empty) {
                                setPodcastOwner(ownerSnap.docs[0].data() as User);
                                if ((podcastData as any).userId === user.uid) {
                                    hasAccess = true;
                                }
                            }
                        }
                    }
                }
            } else {
                // For legend/podcast types, check buyer and legend
                hasAccess = collabData.buyerId === user.uid || collabData.legendId === user.uid;
            }

            if (!hasAccess) {
                console.error('Access denied: User not associated with this collaboration');
                setAccessDenied(true);
                setLoadingCollab(false);
                return;
            }

            setCollaboration(collabData);

            // Load legend information
            const legendQuery = query(collection(db, 'users'), where('uid', '==', collabData.legendId));
            const legendSnap = await getDocs(legendQuery);
            if (!legendSnap.empty) {
                setLegend(legendSnap.docs[0].data() as User);
            }

            // Load buyer information
            const buyerQuery = query(collection(db, 'users'), where('uid', '==', collabData.buyerId));
            const buyerSnap = await getDocs(buyerQuery);
            if (!buyerSnap.empty) {
                setBuyer(buyerSnap.docs[0].data() as User);
            }

            // Load service information (only if legendId is present)
            if (collabData.legendId) {
                const serviceRef = doc(db, 'users', collabData.legendId, 'services', collabData.serviceId);
                const serviceSnap = await getDoc(serviceRef);
                if (serviceSnap.exists()) {
                    setService({
                        id: serviceSnap.id,
                        ...serviceSnap.data(),
                        createdAt: serviceSnap.data().createdAt?.toDate(),
                        updatedAt: serviceSnap.data().updatedAt?.toDate(),
                    } as Service);
                }
            }
        } catch (error) {
            console.error('Error loading collaboration:', error);
            setAccessDenied(true);
        } finally {
            setLoadingCollab(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { color: string; text: string }> = {
            pending_review: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Review' },
            pending_agreement: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Agreement' },
            pending_payment: { color: 'bg-blue-100 text-blue-800', text: 'Payment Required' },
            awaiting_contract: { color: 'bg-purple-100 text-purple-800', text: 'Awaiting Contract' },
            scheduling: { color: 'bg-indigo-100 text-indigo-800', text: 'Scheduling' },
            scheduled: { color: 'bg-blue-100 text-blue-800', text: 'Scheduled' },
            in_progress: { color: 'bg-green-100 text-green-800', text: 'In Progress' },
            post_production: { color: 'bg-purple-100 text-purple-800', text: 'Post-Production' },
            completed: { color: 'bg-gray-100 text-gray-800', text: 'Completed' },
            declined: { color: 'bg-red-100 text-red-800', text: 'Declined' },
        };
        const badge = badges[status] || { color: 'bg-gray-100 text-gray-800', text: status };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                {badge.text}
            </span>
        );
    };

    const getMilestoneStatus = (collab: Collaboration): {
        icon: string;
        label: string;
        completed: boolean;
    }[] => {
        if (collab.type === 'guest_appearance') {
            return [
                {
                    icon: '🤝',
                    label: 'Terms Agreed',
                    completed: collab.status !== 'pending_agreement' && collab.status !== 'declined'
                },
                {
                    icon: '💰',
                    label: 'Payment Processed',
                    completed: collab.price === 0 || (collab.status !== 'pending_agreement' && collab.status !== 'pending_payment' && collab.status !== 'declined')
                },
                {
                    icon: '📅',
                    label: 'Recording Scheduled',
                    completed: collab.status === 'scheduled' || collab.status === 'in_progress' || collab.status === 'post_production' || collab.status === 'completed'
                },
                {
                    icon: '🎙️',
                    label: 'Recording Complete',
                    completed: collab.status === 'post_production' || collab.status === 'completed'
                },
                {
                    icon: '📻',
                    label: 'Episode Released',
                    completed: collab.status === 'completed'
                }
            ];
        }
        
        if (collab.type === 'podcast') {
            return [
                {
                    icon: '🎙️',
                    label: 'Pitch Accepted',
                    completed: collab.status !== 'pending_review' && collab.status !== 'declined'
                },
                {
                    icon: '📝',
                    label: 'Guest Release Signed',
                    completed: collab.status === 'in_progress' || collab.status === 'completed'
                },
                {
                    icon: '🎧',
                    label: 'Production',
                    completed: collab.status === 'in_progress' || collab.status === 'completed'
                },
                {
                    icon: '✅',
                    label: 'Published',
                    completed: collab.status === 'completed'
                }
            ];
        }

        return [
            {
                icon: '💰',
                label: 'Project Funded',
                completed: collab.status !== 'pending_review' && collab.status !== 'pending_payment' && collab.status !== 'declined'
            },
            {
                icon: '📝',
                label: 'Contract Signed',
                completed: collab.status === 'in_progress' || collab.status === 'completed'
            },
            {
                icon: '🎵',
                label: 'In Progress',
                completed: collab.status === 'in_progress' || collab.status === 'completed'
            },
            {
                icon: '✅',
                label: 'Completed',
                completed: collab.status === 'completed'
            }
        ];
    };

    // Show loading state
    if (loading || loadingCollab) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading collaboration hub...</p>
                </div>
            </div>
        );
    }

    // Show access denied
    if (accessDenied || !collaboration) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="text-red-600 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-6">
                        You don&apos;t have permission to view this collaboration hub.
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Determine user role in this collaboration
    const isBuyer = user?.uid === collaboration.buyerId;
    const isLegend = user?.uid === collaboration.legendId;
    const isGuest = collaboration.type === 'guest_appearance' && user?.uid === collaboration.guestId;
    const isPodcastOwner = collaboration.type === 'guest_appearance' && podcast && user?.uid === podcast.userId;
    
    // Determine the other party based on collaboration type
    let otherParty;
    if (collaboration.type === 'guest_appearance') {
        otherParty = isGuest ? podcastOwner : guest;
    } else {
        otherParty = isBuyer ? legend : buyer;
    }

    // Check if the buyer can mark as complete
    const canMarkComplete = isBuyer &&
        collaboration.status === 'in_progress' &&
        collaboration.deliverables &&
        collaboration.deliverables.length > 0;

    const handleMarkComplete = async () => {
        if (!canMarkComplete || !user) return;

        setCompleteError(null);
        setMarkingComplete(true);

        try {
            const response = await fetch('/api/collaboration/mark-complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    collaborationId: collaboration.id,
                    buyerId: user.uid,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to mark as complete');
            }

            // Reload collaboration to show updated status
            await loadCollaboration();
        } catch (error) {
            console.error('Error marking complete:', error);
            setCompleteError(error instanceof Error ? error.message : 'Failed to mark project as complete');
        } finally {
            setMarkingComplete(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Collaboration Hub</h1>
                            <p className="text-gray-600">{service?.title || 'Collaboration Project'}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            {getStatusBadge(collaboration.status)}
                            <button
                                onClick={() => router.push(isBuyer ? '/dashboard' : '/legend/dashboard')}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Project Details Card */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Project Details</h2>

                            <div className="space-y-4">
                                <div className="flex justify-between items-start pb-4 border-b">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{service?.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{service?.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-blue-600">${collaboration.price}</p>
                                        <p className="text-sm text-gray-500">{service?.deliverable}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Started</p>
                                        <p className="text-sm text-gray-900">
                                            {collaboration.createdAt?.toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    {collaboration.paidAt && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Payment Received</p>
                                            <p className="text-sm text-gray-900">
                                                {collaboration.paidAt?.toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                    {collaboration.allPartiesSignedAt && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Contract Signed</p>
                                            <p className="text-sm text-gray-900">
                                                {collaboration.allPartiesSignedAt?.toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                    {collaboration.completedAt && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Completed</p>
                                            <p className="text-sm text-gray-900">
                                                {collaboration.completedAt?.toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Contract Link */}
                                {collaboration.contractUrl && (
                                    <div className="pt-4 border-t">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Legal Agreement</p>
                                        <a
                                            href={collaboration.contractUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm font-medium"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            View Signed Contract
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Guest Appearance Specific Details */}
                        {collaboration.type === 'guest_appearance' && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Guest Appearance Details</h2>
                                
                                <div className="space-y-4">
                                    {/* Topics */}
                                    {collaboration.agreedTopics && collaboration.agreedTopics.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Discussion Topics</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {collaboration.agreedTopics.map((topic, index) => (
                                                    <span
                                                        key={index}
                                                        className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                                                    >
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Recording Schedule */}
                                    {collaboration.schedulingDetails && (
                                        <div className="border-t pt-4">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Recording Schedule</h3>
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <p className="text-sm">
                                                    <span className="font-medium">Date:</span>{' '}
                                                    {collaboration.schedulingDetails.date?.toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                <p className="text-sm mt-1">
                                                    <span className="font-medium">Time:</span>{' '}
                                                    {collaboration.schedulingDetails.time} ({collaboration.schedulingDetails.timezone})
                                                </p>
                                                <p className="text-sm mt-1">
                                                    <span className="font-medium">Duration:</span> {collaboration.schedulingDetails.duration}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Recording Link */}
                                    {collaboration.recordingUrl && (
                                        <div className="border-t pt-4">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Recording Link</h3>
                                            <a
                                                href={collaboration.recordingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                            >
                                                🎙️ Join Recording Session
                                            </a>
                                        </div>
                                    )}
                                    
                                    {/* Prep Notes */}
                                    {collaboration.prepNotes && (
                                        <div className="border-t pt-4">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Preparation Notes</h3>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{collaboration.prepNotes}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Episode Release */}
                                    {collaboration.episodeUrl && (
                                        <div className="border-t pt-4">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Published Episode</h3>
                                            <a
                                                href={collaboration.episodeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                                            >
                                                📻 Listen to Episode
                                            </a>
                                            {collaboration.episodeReleaseDate && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Released on {collaboration.episodeReleaseDate.toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Next Steps based on status */}
                                    {collaboration.status === 'pending_agreement' && (
                                        <div className="border-t pt-4">
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <p className="text-sm text-yellow-800">
                                                    ⏳ Waiting for both parties to agree on terms.{' '}
                                                    <a
                                                        href={`/collaboration/${collaborationId}/agreement`}
                                                        className="font-medium underline hover:text-yellow-900"
                                                    >
                                                        Review Agreement
                                                    </a>
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    
                                </div>
                            </div>
                        )}

                        {/* Scheduling Interface - For guest_appearance type */}
                        {collaboration.type === 'guest_appearance' && (collaboration.status === 'scheduling' || collaboration.status === 'scheduled') && userData && (
                            <SchedulingInterface
                                collaboration={collaboration}
                                currentUser={userData}
                                isGuest={collaboration.guestId === userData.uid}
                                onScheduleConfirmed={loadCollaboration}
                            />
                        )}

                        {/* Rescheduling Interface - For scheduled guest appearances */}
                        {collaboration.type === 'guest_appearance' && collaboration.status === 'scheduled' && userData && (
                            <RescheduleInterface
                                collaboration={collaboration}
                                currentUser={userData}
                                isGuest={collaboration.guestId === userData.uid}
                                onRescheduleConfirmed={loadCollaboration}
                            />
                        )}

                        {/* Recording Link Manager - For guest appearances */}
                        {collaboration.type === 'guest_appearance' && userData && (
                            <RecordingLinkManager
                                collaboration={collaboration}
                                currentUser={userData}
                                isPodcastOwner={collaboration.buyerId === userData.uid}
                                onLinkUpdated={loadCollaboration}
                            />
                        )}

                        {/* Post-Recording Actions - For guest appearances */}
                        {collaboration.type === 'guest_appearance' && userData && collaboration.buyerId === userData.uid && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Post-Recording Actions</h2>
                                
                                {/* Mark Recording Complete */}
                                {(collaboration.status === 'scheduled' || collaboration.status === 'in_progress') && (
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Recording Completed?</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Mark the recording as complete to move to post-production phase.
                                        </p>
                                        <MarkRecordingComplete
                                            collaborationId={collaborationId}
                                            userId={userData.uid}
                                            onComplete={loadCollaboration}
                                        />
                                    </div>
                                )}

                                {/* Release Episode */}
                                {collaboration.status === 'post_production' && (
                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Episode Released?</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Mark the episode as released to notify the guest and release payment (if applicable).
                                        </p>
                                        <ReleaseEpisode
                                            collaborationId={collaborationId}
                                            userId={userData.uid}
                                            onRelease={loadCollaboration}
                                        />
                                    </div>
                                )}

                                {collaboration.recordingNotes && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-700 mb-1">Recording Notes</h4>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{collaboration.recordingNotes}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Feedback Section - For completed collaborations */}
                        {collaboration.status === 'completed' && userData && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Feedback & Rating</h2>
                                
                                <p className="text-sm text-gray-600 mb-4">
                                    Share your experience working with{' '}
                                    {collaboration.type === 'guest_appearance' 
                                        ? (collaboration.guestId === userData.uid ? podcastOwner?.displayName : guest?.displayName)
                                        : (isBuyer ? legend?.displayName : buyer?.displayName)
                                    }
                                </p>

                                <CollaborationFeedbackForm
                                    collaborationId={collaborationId}
                                    userId={userData.uid}
                                    recipientName={
                                        collaboration.type === 'guest_appearance'
                                            ? (collaboration.guestId === userData.uid ? podcastOwner?.displayName || 'the podcast owner' : guest?.displayName || 'the guest')
                                            : (isBuyer ? legend?.displayName || 'the legend' : buyer?.displayName || 'the buyer')
                                    }
                                    onSubmit={loadCollaboration}
                                />
                            </div>
                        )}

                        {/* Milestone Checklist Card */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Project Milestones</h2>

                            <div className="space-y-3">
                                {getMilestoneStatus(collaboration).map((milestone, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center p-3 rounded-lg ${milestone.completed ? 'bg-green-50' : 'bg-gray-50'
                                            }`}
                                    >
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${milestone.completed ? 'bg-green-500' : 'bg-gray-300'
                                            }`}>
                                            {milestone.completed ? (
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <div className="w-3 h-3 rounded-full bg-white"></div>
                                            )}
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <p className={`text-sm font-medium ${milestone.completed ? 'text-green-900' : 'text-gray-900'
                                                }`}>
                                                <span className="mr-2">{milestone.icon}</span>
                                                {milestone.label}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Status-specific messages */}
                            {collaboration.status === 'pending_payment' && isBuyer && (
                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>Action Required:</strong> Please complete your payment to start this project.
                                    </p>
                                </div>
                            )}

                            {collaboration.status === 'awaiting_contract' && (
                                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                    <p className="text-sm text-purple-800">
                                        <strong>Contract in Progress:</strong> {collaboration.docusignEnvelopeId
                                            ? 'A contract has been sent to both parties for signature. Check your email.'
                                            : 'Your contract is being prepared and will be sent shortly for signature.'}
                                    </p>
                                </div>
                            )}

                            {collaboration.status === 'in_progress' && (
                                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800">
                                        <strong>{collaboration.type === 'podcast' ? 'Production Active!' : 'Project Active!'}</strong> {
                                            collaboration.type === 'podcast'
                                                ? (isLegend
                                                    ? 'You can now schedule recording or work on the episode.'
                                                    : 'The Podcaster is working on the episode. Stay tuned for updates.')
                                                : (isLegend
                                                    ? 'You can now begin working on this project. Upload deliverables when ready.'
                                                    : 'The Legend is working on your project. Files will appear here when delivered.')
                                        }
                                    </p>
                                </div>
                            )}

                            {collaboration.status === 'completed' && (
                                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                    <p className="text-sm text-gray-800">
                                        <strong>{collaboration.type === 'podcast' ? 'Episode Published!' : 'Project Complete!'}</strong> {
                                            collaboration.type === 'podcast'
                                                ? 'The episode has been marked as completed/published.'
                                                : 'Payment has been released from escrow. Thank you for using UvoCollab!'
                                        }
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pitch/Project Brief Card */}
                        {(collaboration.pitchMessage || collaboration.topicProposal) && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">
                                    {collaboration.type === 'podcast' ? 'Pitch Details' : 'Project Brief'}
                                </h2>

                                <div className="space-y-4">
                                    {collaboration.type === 'podcast' ? (
                                        <>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Topic Proposal</h4>
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <p className="text-gray-800 whitespace-pre-wrap">{collaboration.topicProposal}</p>
                                                </div>
                                            </div>
                                            {collaboration.guestBio && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Guest Bio</h4>
                                                    <div className="bg-gray-50 rounded-lg p-4">
                                                        <p className="text-gray-800 whitespace-pre-wrap">{collaboration.guestBio}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {collaboration.proposedDates && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Proposed Dates</h4>
                                                    <p className="text-gray-800">{collaboration.proposedDates}</p>
                                                </div>
                                            )}
                                            {collaboration.pressKitUrl && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Press Kit / Audio Sample</h4>
                                                    <a
                                                        href={collaboration.pressKitUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                                                    >
                                                        {collaboration.pressKitUrl}
                                                    </a>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Creative Concept</h4>
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <p className="text-gray-800 whitespace-pre-wrap">{collaboration.pitchMessage}</p>
                                                </div>
                                            </div>

                                            {collaboration.pitchBestWorkUrl && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Reference Work</h4>
                                                    <a
                                                        href={collaboration.pitchBestWorkUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                                                    >
                                                        {collaboration.pitchBestWorkUrl}
                                                    </a>
                                                </div>
                                            )}

                                            {collaboration.pitchDemoUrl && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Demo Track</h4>
                                                    <audio
                                                        controls
                                                        className="w-full"
                                                        preload="metadata"
                                                    >
                                                        <source src={collaboration.pitchDemoUrl} type="audio/mpeg" />
                                                        <source src={collaboration.pitchDemoUrl} type="audio/wav" />
                                                        Your browser does not support the audio element.
                                                    </audio>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* File Sharing Card - Show when project is in progress or completed */}
                        {(collaboration.status === 'in_progress' || collaboration.status === 'completed') && (
                            <FileSharing
                                collaboration={collaboration}
                                isLegend={isLegend}
                                onUpdate={loadCollaboration}
                            />
                        )}

                        {/* Mark as Complete Button - Only visible to Buyer */}
                        {isBuyer && collaboration.status === 'in_progress' && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Complete Project</h2>

                                {completeError && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-800">{completeError}</p>
                                    </div>
                                )}

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Before marking as complete:</h3>
                                    <ul className="space-y-2 text-sm text-blue-800">
                                        <li className="flex items-start">
                                            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Review all deliverables to ensure they meet your requirements</span>
                                        </li>
                                        <li className="flex items-start">
                                            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Download and save all files for your records</span>
                                        </li>
                                        <li className="flex items-start">
                                            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Marking complete will release payment to the Legend</span>
                                        </li>
                                    </ul>
                                </div>

                                <button
                                    onClick={handleMarkComplete}
                                    disabled={!canMarkComplete || markingComplete}
                                    className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {markingComplete ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : (
                                        '✓ Mark as Complete & Release Payment'
                                    )}
                                </button>

                                {!canMarkComplete && collaboration.deliverables?.length === 0 && (
                                    <p className="mt-3 text-sm text-gray-500 text-center">
                                        Button will be enabled once the Legend uploads deliverables
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Communication Thread */}
                        {otherParty && (
                            <CommunicationThread
                                collaborationId={collaborationId}
                                otherPartyName={otherParty.displayName}
                                isCompleted={collaboration.status === 'completed'}
                            />
                        )}
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="space-y-6">
                        {/* Collaborator Info Card */}
                        {otherParty && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">
                                    {isBuyer
                                        ? (collaboration.type === 'podcast' ? 'Podcaster' : 'Your Legend')
                                        : (collaboration.type === 'podcast' ? 'Guest' : 'Artist')
                                    }
                                </h2>

                                <div className="flex items-center space-x-3 mb-4">
                                    {otherParty.profileImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={otherParty.profileImageUrl}
                                            alt={otherParty.displayName}
                                            className="w-16 h-16 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-gray-600 text-xl font-medium">
                                                {otherParty.displayName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-gray-900">{otherParty.displayName}</h3>
                                        {isLegend && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {collaboration.type === 'podcast' ? '✓ Verified Podcaster' : '✓ Verified Legend'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {otherParty.bio && (
                                    <div className="pt-4 border-t">
                                        <p className="text-sm text-gray-600">{otherParty.bio}</p>
                                    </div>
                                )}

                                {isBuyer && legend && (
                                    <div className="mt-4">
                                        <button
                                            onClick={() => router.push(collaboration.type === 'podcast' ? `/podcasts/${collaboration.podcastId}` : `/legend/${legend.uid}`)}
                                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                                        >
                                            {collaboration.type === 'podcast' ? 'View Podcast' : 'View Public Profile'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Escrow Info Card */}
                        {(collaboration.status === 'awaiting_contract' || collaboration.status === 'in_progress') && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Protection</h2>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        <p className="text-gray-700">
                                            <strong>Funds Secured:</strong> ${collaboration.price} held in escrow
                                        </p>
                                    </div>
                                    {collaboration.platformCommission && collaboration.legendAmount && (
                                        <>
                                            <div className="flex items-start">
                                                <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-gray-700">
                                                    <strong>Legend receives:</strong> ${collaboration.legendAmount.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="flex items-start">
                                                <svg className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                                <p className="text-gray-700">
                                                    <strong>Platform fee:</strong> ${collaboration.platformCommission.toFixed(2)} (20%)
                                                </p>
                                            </div>
                                        </>
                                    )}
                                    <div className="pt-3 border-t">
                                        <p className="text-xs text-gray-500">
                                            {isBuyer
                                                ? 'Payment is released to the Legend only after you mark the project as complete.'
                                                : 'You will receive payment after the buyer confirms project completion.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Help Card */}
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="text-lg font-bold text-blue-900 mb-2">Need Help?</h3>
                            <p className="text-sm text-blue-800 mb-4">
                                Have questions or issues with this collaboration? Our support team is here to help.
                            </p>
                            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                                Contact Support
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
