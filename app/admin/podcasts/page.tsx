'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Podcast {
    id: string;
    title: string;
    description: string;
    rssFeedUrl?: string;
    websiteUrl?: string;
    categories?: string[];
    avgListeners?: number;
    platformLinks?: Array<{ platform: string; url: string }>;
    createdAt: { seconds: number } | string;
    status: string;
    [key: string]: unknown;
}

export default function AdminPodcastVettingPage() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const [podcasts, setPodcasts] = useState<Podcast[]>([]);
    const [loadingPodcasts, setLoadingPodcasts] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

    useEffect(() => {
        if (!loading && (!user || userData?.role !== 'admin')) {
            router.push('/dashboard');
        }
    }, [user, userData, loading, router]);

    useEffect(() => {
        if (userData?.role === 'admin') fetchPodcasts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData, filter]);

    const fetchPodcasts = async () => {
        setLoadingPodcasts(true);
        try {
            const podcastsRef = collection(db, 'podcasts');
            let q;

            if (filter === 'all') {
                q = query(podcastsRef, orderBy('createdAt', 'desc'));
            } else {
                q = query(podcastsRef, where('status', '==', filter), orderBy('createdAt', 'desc'));
            }

            const querySnapshot = await getDocs(q);
            const items: Podcast[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                items.push({ id: doc.id, ...data } as Podcast);
            });

            setPodcasts(items);
        } catch (error) {
            console.error('Error fetching podcasts:', error);
            alert('Failed to fetch podcast submissions');
        } finally {
            setLoadingPodcasts(false);
        }
    };

    if (loading || loadingPodcasts) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    if (!user || userData?.role !== 'admin') {
        return null;
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Podcast Submissions</h1>
                <p className="mt-2 text-gray-600">Review and approve or reject Podcast listings</p>
            </div>

            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {(['pending', 'all', 'approved', 'rejected'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`
                                    whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                                    ${filter === tab
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }
                                `}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </nav>
            </div>

            {podcasts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">No {filter !== 'all' ? filter : ''} podcast submissions found</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {podcasts.map((podcast) => (
                        <PodcastCard key={podcast.id} podcast={podcast} onUpdate={fetchPodcasts} />
                    ))}
                </div>
            )}
        </div>
    );
}

function PodcastCard({ podcast, onUpdate }: { podcast: Podcast; onUpdate: () => void }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const { title, description, rssFeedUrl, websiteUrl, categories, avgListeners, platformLinks, createdAt, status } = podcast;

    const handleApprove = async () => {
        if (!confirm(`Are you sure you want to approve "${title}"?`)) return;
        setIsProcessing(true);
        try {
            const { auth } = await import('@/lib/firebase');
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error('Not authenticated');
            const token = await currentUser.getIdToken();

            const response = await fetch('/api/admin/review-podcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ podcastId: podcast.id, action: 'approve' }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to approve podcast');
            alert('Podcast approved successfully!');
            onUpdate();
        } catch (error) {
            console.error('Error approving podcast:', error);
            alert(error instanceof Error ? error.message : 'Failed to approve podcast');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        const reason = prompt(`Please provide a reason for rejecting "${title}":`);
        if (!reason) return;
        setIsProcessing(true);
        try {
            const { auth } = await import('@/lib/firebase');
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error('Not authenticated');
            const token = await currentUser.getIdToken();

            const response = await fetch('/api/admin/review-podcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ podcastId: podcast.id, action: 'reject', notes: reason }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to reject podcast');
            alert('Podcast rejected successfully!');
            onUpdate();
        } catch (error) {
            console.error('Error rejecting podcast:', error);
            alert(error instanceof Error ? error.message : 'Failed to reject podcast');
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = () => {
        const baseClasses = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium';
        switch (status) {
            case 'pending':
                return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>;
            case 'approved':
                return <span className={`${baseClasses} bg-green-100 text-green-800`}>Approved</span>;
            case 'rejected':
                return <span className={`${baseClasses} bg-red-100 text-red-800`}>Rejected</span>;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                            {getStatusBadge()}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                            {rssFeedUrl && <p><span className="font-medium">RSS:</span> <a href={rssFeedUrl} className="link" target="_blank" rel="noreferrer">{rssFeedUrl}</a></p>}
                            {websiteUrl && <p><span className="font-medium">Website:</span> <a href={websiteUrl} className="link" target="_blank" rel="noreferrer">{websiteUrl}</a></p>}
                            <p><span className="font-medium">Categories:</span> {(categories || []).join(', ')}</p>
                            {typeof avgListeners === 'number' && <p><span className="font-medium">Avg listeners:</span> {avgListeners}</p>}
                            {platformLinks && platformLinks.length > 0 && (
                                <div>
                                    <span className="font-medium">Platforms:</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {platformLinks.map((link, index) => (
                                            <a
                                                key={index}
                                                href={link.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs hover:bg-blue-100"
                                            >
                                                {link.platform}
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {createdAt && (
                                <p><span className="font-medium">Submitted:</span> {new Date(typeof createdAt === 'object' && 'seconds' in createdAt ? createdAt.seconds * 1000 : createdAt).toLocaleDateString()}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        {isExpanded ? '▼ Hide Details' : '▶ Show Details'}
                    </button>
                    {isExpanded && (
                        <div className="mt-2 p-4 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{description}</p>
                        </div>
                    )}
                </div>

                {status === 'pending' && (
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={handleApprove}
                            disabled={isProcessing}
                            className="flex-1 rounded-md bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'Processing...' : '✓ Approve'}
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={isProcessing}
                            className="flex-1 rounded-md bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'Processing...' : '✗ Reject'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
