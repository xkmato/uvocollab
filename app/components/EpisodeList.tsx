'use client';

import { useEffect, useState } from 'react';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

interface Episode {
    title: string;
    description: string;
    pubDate?: string;
    link: string;
    audioUrl?: string;
    duration?: string;
    imageUrl?: string;
}

interface EpisodeListProps {
    podcastId: string;
    podcastTitle?: string;
}

export default function EpisodeList({ podcastId, podcastTitle }: EpisodeListProps) {
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { playEpisode } = useAudioPlayer();

    useEffect(() => {
        const fetchEpisodes = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(`/api/podcast/${podcastId}/episodes`);

                if (!res.ok) {
                    const data = await res.json();
                    const errorMessage = data.error || 'Failed to fetch episodes';

                    // Silently handle missing RSS feed - don't throw or log
                    if (errorMessage.includes('No RSS feed')) {
                        setError(errorMessage);
                        setLoading(false);
                        return;
                    }

                    throw new Error(errorMessage);
                }

                const data = await res.json();
                setEpisodes(data.episodes || []);
            } catch (err) {
                console.error('Error fetching episodes:', err);
                setError(err instanceof Error ? err.message : 'Failed to load episodes');
            } finally {
                setLoading(false);
            }
        };

        if (podcastId) {
            fetchEpisodes();
        }
    }, [podcastId]);

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-3"></div>
                    <p className="text-gray-600">Loading episodes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        // Don't show error if it's just a missing RSS feed
        if (error.includes('No RSS feed')) {
            return null;
        }

        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                    <span className="font-medium">Note:</span> Unable to load episodes. {error}
                </p>
            </div>
        );
    }

    if (episodes.length === 0) {
        return null; // Don't show anything if no episodes
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-800">Recent Episodes</h2>
            </div>
            <div className="divide-y divide-gray-200">
                {episodes.map((episode, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex gap-4">
                            {episode.imageUrl && (
                                <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                                    <img
                                        src={episode.imageUrl}
                                        alt={episode.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="flex-grow min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {episode.title}
                                </h3>
                                {episode.pubDate && (
                                    <p className="text-sm text-gray-500 mb-2">
                                        {new Date(episode.pubDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                        {episode.duration && ` • ${episode.duration}`}
                                    </p>
                                )}
                                {episode.description && (
                                    <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                                        {episode.description}
                                    </p>
                                )}
                                <div className="flex gap-3">
                                    {episode.link && (
                                        <a
                                            href={episode.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 font-medium"
                                        >
                                            View Episode
                                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    )}
                                    {episode.audioUrl && (
                                        <button
                                            onClick={() => playEpisode({
                                                title: episode.title,
                                                audioUrl: episode.audioUrl,
                                                imageUrl: episode.imageUrl,
                                                podcastTitle: podcastTitle
                                            })}
                                            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-700 font-medium"
                                        >
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Listen
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
