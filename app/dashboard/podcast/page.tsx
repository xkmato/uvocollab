'use client';

import PodcastServiceForm from '@/app/components/PodcastServiceForm';
import PodcastServiceList from '@/app/components/PodcastServiceList';
import { useAuth } from '@/app/contexts/AuthContext';
import { Podcast, PodcastService } from '@/app/types/podcast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PodcastDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [podcast, setPodcast] = useState<Podcast | null>(null);
    const [services, setServices] = useState<PodcastService[]>([]);
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
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        } else if (user) {
            fetchPodcastData();
        }
    }, [user, authLoading, router]);

    const fetchPodcastData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();

            // Fetch Podcast
            const podcastRes = await fetch('/api/podcasts/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const podcastData = await podcastRes.json();

            if (podcastData.podcast) {
                setPodcast(podcastData.podcast);
                setPodcastForm({
                    title: podcastData.podcast.title,
                    description: podcastData.podcast.description,
                    rssFeedUrl: podcastData.podcast.rssFeedUrl,
                    websiteUrl: podcastData.podcast.websiteUrl || '',
                    categories: podcastData.podcast.categories,
                    avgListeners: podcastData.podcast.avgListeners || 0,
                });

                // Fetch Services
                const servicesRes = await fetch('/api/podcasts/services', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const servicesData = await servicesRes.json();
                setServices(servicesData.services || []);
            } else {
                // No podcast found, redirect to register
                router.push('/podcasts/register');
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
        if (!user) return;

        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/podcasts/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(podcastForm),
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

    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (error) {
        return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
    }

    if (!podcast) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Podcast Dashboard</h1>
                    <a href="/dashboard" className="text-blue-600 hover:text-blue-800">Back to Dashboard</a>
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
                                    <label className="block text-sm font-medium text-gray-700">Title</label>
                                    <input
                                        type="text"
                                        value={podcastForm.title}
                                        onChange={(e) => setPodcastForm({ ...podcastForm, title: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={podcastForm.description}
                                        onChange={(e) => setPodcastForm({ ...podcastForm, description: e.target.value })}
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">RSS Feed URL</label>
                                        <input
                                            type="url"
                                            value={podcastForm.rssFeedUrl}
                                            onChange={(e) => setPodcastForm({ ...podcastForm, rssFeedUrl: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Website URL</label>
                                        <input
                                            type="url"
                                            value={podcastForm.websiteUrl}
                                            onChange={(e) => setPodcastForm({ ...podcastForm, websiteUrl: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                        />
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
                                        <p><strong>RSS:</strong> <a href={podcast.rssFeedUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate block max-w-md">{podcast.rssFeedUrl}</a></p>
                                        {podcast.websiteUrl && <p><strong>Website:</strong> <a href={podcast.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{podcast.websiteUrl}</a></p>}
                                    </div>
                                </div>
                                <div>
                                    {podcast.coverImageUrl && (
                                        <img src={podcast.coverImageUrl} alt={podcast.title} className="w-full h-auto rounded-lg shadow-md object-cover" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
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
