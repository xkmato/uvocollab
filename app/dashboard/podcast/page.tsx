'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { Podcast } from '@/app/types/podcast';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PodcastDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [podcasts, setPodcasts] = useState<Podcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        } else if (user) {
            fetchPodcasts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading, router]);

    const fetchPodcasts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();

            const podcastRes = await fetch('/api/podcasts/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const podcastData = await podcastRes.json();

            if (podcastData.podcasts && podcastData.podcasts.length > 0) {
                setPodcasts(podcastData.podcasts);

                // If user has only one podcast, redirect to its specific page
                if (podcastData.podcasts.length === 1) {
                    router.push(`/dashboard/podcast/${podcastData.podcasts[0].id}`);
                }
            } else {
                // No podcast found, redirect to register
                router.push('/podcasts/register');
            }
        } catch (err) {
            console.error('Error fetching podcasts:', err);
            setError('Failed to load podcasts');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (error) {
        return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
    }

    if (podcasts.length === 0) return null;

    // If we reach here, user has multiple podcasts - show selector
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/50 to-blue-50/50 pt-24 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Your Podcasts</h1>
                    <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">Back to Dashboard</Link>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-gray-600">Select a podcast to manage:</p>
                        <Link
                            href="/podcasts/register"
                            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
                        >
                            + Add Another Podcast
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {podcasts.map((podcast) => (
                            <Link
                                key={podcast.id}
                                href={`/dashboard/podcast/${podcast.id}`}
                                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white group"
                            >
                                <div className="relative h-48 bg-gray-100">
                                    {podcast.coverImageUrl ? (
                                        <Image
                                            src={podcast.coverImageUrl}
                                            alt={podcast.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                                        {podcast.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                        {podcast.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {podcast.categories.slice(0, 3).map(cat => (
                                            <span key={cat} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                                                {cat}
                                            </span>
                                        ))}
                                        {podcast.categories.length > 3 && (
                                            <span className="text-gray-500 text-xs px-2 py-1">
                                                +{podcast.categories.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${podcast.status === 'approved'
                                            ? 'bg-green-100 text-green-800'
                                            : podcast.status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {podcast.status}
                                        </span>
                                        <span className="text-purple-600 text-sm font-medium group-hover:underline">
                                            Manage →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
