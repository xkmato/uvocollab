'use client';

import PodcastServiceForm from '@/app/components/PodcastServiceForm';
import PodcastServiceList from '@/app/components/PodcastServiceList';
import { useAuth } from '@/app/contexts/AuthContext';
import { Collaboration } from '@/app/types/collaboration';
import { Podcast, PodcastService } from '@/app/types/podcast';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PodcastDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const podcastId = params.podcastId as string;

    const [podcast, setPodcast] = useState<Podcast | null>(null);
    const [services, setServices] = useState<PodcastService[]>([]);
    const [pitches, setPitches] = useState<(Collaboration & { buyerName?: string; serviceTitle?: string; serviceType?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isEditingPodcast, setIsEditingPodcast] = useState(false);
    const [isAddingService, setIsAddingService] = useState(false);
    const [editingService, setEditingService] = useState<PodcastService | null>(null);

    // Podcast Form State
    const [podcastForm, setPodcastForm] = useState({
        title: '',
        description: '',
        rssFeedUrl: '',
        websiteUrl: '',
        categories: [] as string[],
        avgListeners: 0,
        platformLinks: [] as Array<{ platform: string; url: string }>,
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        } else if (user && podcastId) {
            fetchPodcastData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading, podcastId, router]);

    const fetchPodcastData = async () => {
        if (!user || !podcastId) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();

            // Fetch specific podcast
            const podcastRes = await fetch(`/api/podcast/${podcastId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const podcastData = await podcastRes.json();

            if (podcastData.podcast) {
                // Verify ownership
                if (podcastData.podcast.ownerId !== user.uid) {
                    setError('Unauthorized: You do not own this podcast');
                    setLoading(false);
                    return;
                }

                setPodcast(podcastData.podcast);
                setPodcastForm({
                    title: podcastData.podcast.title,
                    description: podcastData.podcast.description,
                    rssFeedUrl: podcastData.podcast.rssFeedUrl || '',
                    websiteUrl: podcastData.podcast.websiteUrl || '',
                    categories: podcastData.podcast.categories,
                    avgListeners: podcastData.podcast.avgListeners || 0,
                    platformLinks: podcastData.podcast.platformLinks || [],
                });

                // Fetch Services for this podcast
                const servicesRes = await fetch(`/api/podcasts/services?podcastId=${podcastId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const servicesData = await servicesRes.json();
                setServices(servicesData.services || []);

                // Fetch Pitches for this podcast
                const pitchesRes = await fetch(`/api/podcasts/pitches?podcastId=${podcastId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const pitchesData = await pitchesRes.json();
                setPitches(pitchesData.pitches || []);
            } else {
                setError('Podcast not found');
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load podcast data');
        } finally {
            setLoading(false);
        }
    };

    const handlePodcastUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !podcastId) return;

        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/podcasts/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ ...podcastForm, podcastId }),
            });

            if (!res.ok) throw new Error('Failed to update podcast');

            setIsEditingPodcast(false);
            fetchPodcastData(); // Refresh data
        } catch (err) {
            console.error('Error updating podcast:', err);
            alert('Failed to update podcast details');
        }
    };

    const handleDeleteService = async (serviceId: string) => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/podcasts/services/${serviceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to delete service');

            // Optimistic update or refetch
            setServices(services.filter(s => s.id !== serviceId));
        } catch (err) {
            console.error('Error deleting service:', err);
            alert('Failed to delete service');
        }
    };

    const handlePitchAction = async (collaborationId: string, action: 'accept' | 'decline') => {
        if (!user) return;
        if (!confirm(`Are you sure you want to ${action} this pitch?`)) return;

        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/respond-to-pitch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ collaborationId, action }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Failed to ${action} pitch`);
            }

            // Refresh data
            fetchPodcastData();
            alert(`Pitch ${action}ed successfully`);
        } catch (err) {
            console.error(`Error ${action}ing pitch:`, err);
            alert(err instanceof Error ? err.message : `Failed to ${action} pitch`);
        }
    };

    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (error) {
        return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
    }

    if (!podcast) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/50 to-blue-50/50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <nav className="text-sm text-gray-500 mb-2">
                            <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
                            <span className="mx-2">›</span>
                            <Link href="/dashboard/podcast" className="hover:text-gray-700">Podcasts</Link>
                            <span className="mx-2">›</span>
                            <span className="text-gray-900">{podcast?.title}</span>
                        </nav>
                        <h1 className="text-3xl font-bold text-gray-900">Podcast Dashboard</h1>
                    </div>
                    <Link href="/dashboard/podcast" className="text-blue-600 hover:text-blue-800">← All Podcasts</Link>
                </div>

                {/* Podcast Details Section */}
                <div className="bg-white rounded-lg shadow mb-8 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h2 className="text-xl font-semibold text-gray-800">Podcast Details</h2>
                        {!isEditingPodcast && (
                            <button
                                onClick={() => setIsEditingPodcast(true)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Edit Details
                            </button>
                        )}
                    </div>

                    <div className="p-6">
                        {isEditingPodcast ? (
                            <form onSubmit={handlePodcastUpdate} className="space-y-4">
                                <div>
                                    <label htmlFor="podcast-title" className="block text-sm font-medium text-gray-700">Title</label>
                                    <input
                                        id="podcast-title"
                                        type="text"
                                        value={podcastForm.title}
                                        onChange={(e) => setPodcastForm({ ...podcastForm, title: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                        aria-label="Podcast title"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="podcast-description" className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        id="podcast-description"
                                        value={podcastForm.description}
                                        onChange={(e) => setPodcastForm({ ...podcastForm, description: e.target.value })}
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                        aria-label="Podcast description"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="podcast-rss-feed" className="block text-sm font-medium text-gray-700">RSS Feed URL (Optional)</label>
                                        <input
                                            id="podcast-rss-feed"
                                            type="url"
                                            value={podcastForm.rssFeedUrl}
                                            onChange={(e) => setPodcastForm({ ...podcastForm, rssFeedUrl: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                            aria-label="RSS Feed URL"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="podcast-website" className="block text-sm font-medium text-gray-700">Website URL</label>
                                        <input
                                            id="podcast-website"
                                            type="url"
                                            value={podcastForm.websiteUrl}
                                            onChange={(e) => setPodcastForm({ ...podcastForm, websiteUrl: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                            aria-label="Website URL"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Platform Links (Optional)</label>
                                    <div className="space-y-2">
                                        {podcastForm.platformLinks.map((link, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Platform (e.g., Spotify)"
                                                    value={link.platform}
                                                    onChange={(e) => {
                                                        const updated = [...podcastForm.platformLinks];
                                                        updated[index].platform = e.target.value;
                                                        setPodcastForm({ ...podcastForm, platformLinks: updated });
                                                    }}
                                                    className="w-1/3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                                />
                                                <input
                                                    type="url"
                                                    placeholder="URL"
                                                    value={link.url}
                                                    onChange={(e) => {
                                                        const updated = [...podcastForm.platformLinks];
                                                        updated[index].url = e.target.value;
                                                        setPodcastForm({ ...podcastForm, platformLinks: updated });
                                                    }}
                                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                                />
                                                {podcastForm.platformLinks.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = podcastForm.platformLinks.filter((_, i) => i !== index);
                                                            setPodcastForm({ ...podcastForm, platformLinks: updated });
                                                        }}
                                                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-sm"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPodcastForm({
                                                    ...podcastForm,
                                                    platformLinks: [...podcastForm.platformLinks, { platform: '', url: '' }]
                                                });
                                            }}
                                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm"
                                        >
                                            + Add Platform
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingPodcast(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{podcast.title}</h3>
                                    <p className="text-gray-600 mb-4">{podcast.description}</p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {podcast.categories.map(cat => (
                                            <span key={cat} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="text-sm text-gray-500 space-y-1">
                                        <p><strong>Status:</strong> <span className={`capitalize ${podcast.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>{podcast.status}</span></p>
                                        {podcast.rssFeedUrl && <p><strong>RSS:</strong> <a href={podcast.rssFeedUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate block max-w-md">{podcast.rssFeedUrl}</a></p>}
                                        {podcast.websiteUrl && <p><strong>Website:</strong> <a href={podcast.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{podcast.websiteUrl}</a></p>}
                                        {podcast.platformLinks && podcast.platformLinks.length > 0 && (
                                            <div>
                                                <strong>Platforms:</strong>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {podcast.platformLinks.map((link, index) => (
                                                        <a
                                                            key={index}
                                                            href={link.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs hover:bg-blue-100"
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
                                    </div>
                                </div>
                                <div>
                                    {podcast.coverImageUrl && (
                                        <Image src={podcast.coverImageUrl} alt={podcast.title} className="w-full h-auto rounded-lg shadow-md object-cover" width={400} height={400} />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Incoming Pitches Section */}
                <div className="bg-white rounded-lg shadow mb-8 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-xl font-semibold text-gray-800">Incoming Pitches</h2>
                    </div>
                    <div className="p-6">
                        {pitches.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No pending pitches yet.</p>
                        ) : (
                            <div className="space-y-6">
                                {pitches.map((pitch) => (
                                    <div key={pitch.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">{pitch.buyerName || 'Guest'}</h3>
                                                <p className="text-sm text-gray-600">Applying for: <span className="font-medium text-purple-600">{pitch.serviceTitle}</span></p>
                                                <p className="text-xs text-gray-500 mt-1">Submitted: {new Date(typeof pitch.createdAt === 'object' && pitch.createdAt !== null && 'seconds' in pitch.createdAt ? (pitch.createdAt as { seconds: number }).seconds * 1000 : pitch.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${pitch.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                                                    pitch.status === 'pending_payment' ? 'bg-blue-100 text-blue-800' :
                                                        pitch.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                                                            pitch.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                                                'bg-red-100 text-red-800'
                                                    }`}>
                                                    {pitch.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-md mb-4 space-y-3">
                                            {/* Guest Spot / Other Service Details */}
                                            {(pitch.serviceType === 'guest_spot' || pitch.serviceType === 'other' || !pitch.serviceType) && (
                                                <>
                                                    {pitch.topicProposal && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-700">Topic Proposal:</h4>
                                                            <p className="text-gray-800 mt-1">{pitch.topicProposal}</p>
                                                        </div>
                                                    )}
                                                    {pitch.guestBio && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-700">Guest Bio:</h4>
                                                            <p className="text-gray-800 mt-1 text-sm">{pitch.guestBio}</p>
                                                        </div>
                                                    )}
                                                    {pitch.pitchBestWorkUrl && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-700">Previous Work / Links:</h4>
                                                            <a href={pitch.pitchBestWorkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                                                                {pitch.pitchBestWorkUrl}
                                                            </a>
                                                        </div>
                                                    )}
                                                    {pitch.proposedDates && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-700">Proposed Dates:</h4>
                                                            <p className="text-gray-800 mt-1 text-sm">{pitch.proposedDates}</p>
                                                        </div>
                                                    )}
                                                    {pitch.pressKitUrl && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-700">Press Kit / Audio:</h4>
                                                            <a href={pitch.pressKitUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                View File
                                                            </a>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* Cross-Promotion Details */}
                                            {pitch.serviceType === 'cross_promotion' && (
                                                <>
                                                    {pitch.crossPromoPodcastId && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-700">Their Podcast ID:</h4>
                                                            <p className="text-gray-800 mt-1 text-sm font-mono">{pitch.crossPromoPodcastId}</p>
                                                        </div>
                                                    )}
                                                    {pitch.crossPromoMessage && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-700">Cross-Promotion Message:</h4>
                                                            <p className="text-gray-800 mt-1">{pitch.crossPromoMessage}</p>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* Ad Read Details */}
                                            {pitch.serviceType === 'ad_read' && (
                                                <>
                                                    {pitch.adProductName && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-700">Product/Service:</h4>
                                                            <p className="text-gray-800 mt-1 font-medium">{pitch.adProductName}</p>
                                                        </div>
                                                    )}
                                                    {pitch.adProductDescription && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-700">Description:</h4>
                                                            <p className="text-gray-800 mt-1">{pitch.adProductDescription}</p>
                                                        </div>
                                                    )}
                                                    {pitch.adTargetAudience && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-700">Target Audience:</h4>
                                                            <p className="text-gray-800 mt-1 text-sm">{pitch.adTargetAudience}</p>
                                                        </div>
                                                    )}
                                                    {pitch.adProductUrl && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-700">Product Website:</h4>
                                                            <a href={pitch.adProductUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                                                                {pitch.adProductUrl}
                                                            </a>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {pitch.status === 'pending_review' && (
                                            <div className="flex gap-3 justify-end">
                                                <button
                                                    onClick={() => handlePitchAction(pitch.id!, 'decline')}
                                                    className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 text-sm font-medium"
                                                >
                                                    Decline
                                                </button>
                                                <button
                                                    onClick={() => handlePitchAction(pitch.id!, 'accept')}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                                                >
                                                    Accept Pitch
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Link
                        href={`/dashboard/podcast/${podcastId}/matches`}
                        className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border border-gray-200 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">Guest Matches</h3>
                                <p className="text-sm text-gray-600">View guests interested in your podcast</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href={`/dashboard/podcast/${podcastId}/guests`}
                        className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border border-gray-200 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">Guest Wishlist</h3>
                                <p className="text-sm text-gray-600">Manage your guest wishlist & prospects</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Services Section */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h2 className="text-xl font-semibold text-gray-800">Collaboration Services</h2>
                        {!isAddingService && !editingService && (
                            <button
                                onClick={() => setIsAddingService(true)}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                            >
                                + Add Service
                            </button>
                        )}
                    </div>

                    <div className="p-6">
                        {(isAddingService || editingService) ? (
                            <PodcastServiceForm
                                podcastId={podcast.id}
                                service={editingService || undefined}
                                onSuccess={() => {
                                    setIsAddingService(false);
                                    setEditingService(null);
                                    fetchPodcastData();
                                }}
                                onCancel={() => {
                                    setIsAddingService(false);
                                    setEditingService(null);
                                }}
                            />
                        ) : (
                            <PodcastServiceList
                                services={services}
                                onEdit={(service) => setEditingService(service)}
                                onDelete={handleDeleteService}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
