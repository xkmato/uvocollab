'use client';

import PodcastPitchForm from '@/app/components/PodcastPitchForm';
import { Podcast, PodcastService } from '@/app/types/podcast';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function PodcastDetailPage() {
    const params = useParams();
    const router = useRouter();
    const podcastId = params.podcastId as string;

    const [podcast, setPodcast] = useState<Podcast | null>(null);
    const [services, setServices] = useState<PodcastService[]>([]);
    const [selectedService, setSelectedService] = useState<PodcastService | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (podcastId) {
            loadPodcastData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [podcastId]);

    const loadPodcastData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch Podcast Details
            const podcastRef = doc(db, 'podcasts', podcastId);
            const podcastSnap = await getDoc(podcastRef);

            if (!podcastSnap.exists()) {
                setError('Podcast not found');
                setLoading(false);
                return;
            }

            const podcastData = {
                id: podcastSnap.id,
                ...podcastSnap.data(),
            } as Podcast;

            setPodcast(podcastData);

            // Fetch Podcast Services
            const servicesRef = collection(db, 'podcasts', podcastId, 'services');
            const servicesSnap = await getDocs(servicesRef);
            const servicesData = servicesSnap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as PodcastService[];

            setServices(servicesData);
        } catch (err) {
            console.error('Error loading podcast:', err);
            setError('Failed to load podcast details.');
        } finally {
            setLoading(false);
        }
    }, [podcastId]);

    useEffect(() => {
        if (podcastId) {
            loadPodcastData();
        }
    }, [podcastId, loadPodcastData]);

    const handleRequestCollab = (serviceId: string) => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
            setSelectedService(service);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading podcast details...</p>
                </div>
            </div>
        );
    }

    if (error || !podcast) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
                    <p className="text-gray-600 mb-6">{error || 'Podcast not found'}</p>
                    <button
                        onClick={() => router.push('/marketplace/podcasts')}
                        className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                        Back to Marketplace
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header / Cover */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Cover Image */}
                        <div className="w-full md:w-64 flex-shrink-0">
                            <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg bg-gray-200">
                                {podcast.coverImageUrl ? (
                                    <Image
                                        src={podcast.coverImageUrl}
                                        alt={podcast.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-purple-100">
                                        <span className="text-6xl">🎙️</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-grow">
                            <div className="flex flex-wrap gap-2 mb-3">
                                {podcast.categories?.map((cat) => (
                                    <span key={cat} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                                        {cat}
                                    </span>
                                ))}
                            </div>

                            <h1 className="text-4xl font-bold text-gray-900 mb-4">{podcast.title}</h1>

                            <div className="flex flex-wrap gap-6 text-gray-600 mb-6">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="font-semibold mr-1">{podcast.avgListeners?.toLocaleString() || 'N/A'}</span> Avg. Listeners
                                </div>
                                {podcast.websiteUrl && (
                                    <a href={podcast.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-purple-600 transition-colors">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                        Website
                                    </a>
                                )}
                                {podcast.rssFeedUrl && (
                                    <a href={podcast.rssFeedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-orange-600 transition-colors">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                        </svg>
                                        RSS Feed
                                    </a>
                                )}
                            </div>

                            <p className="text-gray-700 text-lg leading-relaxed max-w-3xl">
                                {podcast.description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Services Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Opportunities</h2>

                {services.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500">This podcast has not listed any collaboration opportunities yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((service) => (
                            <div key={service.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{service.title}</h3>
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded uppercase tracking-wide">
                                            {service.type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-2xl font-bold text-purple-600">
                                            {service.price > 0 ? `$${service.price}` : 'Free'}
                                        </span>
                                        <span className="text-sm text-gray-500">{service.duration}</span>
                                    </div>
                                </div>

                                <p className="text-gray-600 mb-6 min-h-[3rem]">
                                    {service.description}
                                </p>

                                <button
                                    onClick={() => handleRequestCollab(service.id)}
                                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md transition-colors flex items-center justify-center"
                                >
                                    Request Collab
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pitch Form Modal */}
            {selectedService && podcast && (
                <PodcastPitchForm
                    podcast={podcast}
                    service={selectedService}
                    onClose={() => setSelectedService(null)}
                    onSuccess={() => {
                        setSelectedService(null);
                        alert('Your pitch has been submitted successfully!');
                    }}
                />
            )}
        </div>
    );
}
