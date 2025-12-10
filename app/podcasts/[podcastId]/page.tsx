'use client';

import AddPodcastToWishlistModal from '@/app/components/AddPodcastToWishlistModal';
import ClaimPodcastModal from '@/app/components/ClaimPodcastModal';
import EpisodeList from '@/app/components/EpisodeList';
import PodcastPitchForm from '@/app/components/PodcastPitchForm';
import ReportPodcastModal from '@/app/components/ReportPodcastModal';
import { useAuth } from '@/app/contexts/AuthContext';
import { Podcast, PodcastService } from '@/app/types/podcast';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function PodcastDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { userData } = useAuth();
    const podcastId = params.podcastId as string;

    const [podcast, setPodcast] = useState<Podcast | null>(null);
    const [services, setServices] = useState<PodcastService[]>([]);
    const [selectedService, setSelectedService] = useState<PodcastService | null>(null);
    const [showWishlistModal, setShowWishlistModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showClaimModal, setShowClaimModal] = useState(false);
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
        <div className="min-h-screen bg-gray-50 pb-12 pt-20">
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

                            <p className="text-gray-700 text-lg leading-relaxed max-w-3xl mb-6">
                                {podcast.description}
                            </p>

                            {/* Wishlist Button for Guests */}
                            {userData?.isGuest && (
                                <button
                                    onClick={() => setShowWishlistModal(true)}
                                    className="inline-flex items-center px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    Add to My Wishlist
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons: Report and Claim */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
                <div className="flex flex-wrap gap-3 justify-end">
                    {userData?.uid !== podcast?.ownerId && (
                        <button
                            onClick={() => setShowClaimModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Claim This Podcast
                        </button>
                    )}
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Report Podcast
                    </button>
                </div>
            </div>

            {/* Services Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Available Opportunities</h2>

                    {/* Add Service Button for Owners */}
                    {userData?.uid === podcast?.ownerId && (
                        <button
                            onClick={() => router.push('/dashboard/podcast')}
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Service
                        </button>
                    )}
                </div>

                {services.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <div className="mb-4">
                            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Services Available</h3>
                        <p className="text-gray-500 mb-6">This podcast hasn't listed any collaboration opportunities yet.</p>

                        {userData?.uid === podcast?.ownerId && (
                            <button
                                onClick={() => router.push('/dashboard/podcast')}
                                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Services to Your Podcast
                            </button>
                        )}
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
                                    disabled={userData?.uid === podcast?.ownerId}
                                    className={`w-full py-3 px-4 font-semibold rounded-md transition-colors flex items-center justify-center ${userData?.uid === podcast?.ownerId
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                                        }`}
                                >
                                    {userData?.uid === podcast?.ownerId ? 'Your Service' : 'Request Collab'}
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Episodes Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EpisodeList podcastId={podcastId} />
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

            {/* Add to Wishlist Modal */}
            {showWishlistModal && podcast && userData?.isGuest && (
                <AddPodcastToWishlistModal
                    podcast={podcast}
                    guestId={userData.uid}
                    onClose={() => setShowWishlistModal(false)}
                    onSuccess={() => {
                        setShowWishlistModal(false);
                        alert('Podcast added to your wishlist successfully!');
                    }}
                />
            )}

            {/* Report Modal */}
            {showReportModal && podcast && (
                <ReportPodcastModal
                    podcastId={podcastId}
                    podcastTitle={podcast.title}
                    onClose={() => setShowReportModal(false)}
                    onSuccess={() => {
                        setShowReportModal(false);
                        alert('Report submitted successfully. Our team will review it shortly.');
                    }}
                />
            )}

            {/* Claim Modal */}
            {showClaimModal && podcast && userData?.uid !== podcast.ownerId && (
                <ClaimPodcastModal
                    podcastId={podcastId}
                    podcastTitle={podcast.title}
                    onClose={() => setShowClaimModal(false)}
                    onSuccess={() => {
                        setShowClaimModal(false);
                        alert('Claim submitted successfully. Our team will review your request and contact you via email.');
                    }}
                />
            )}
        </div>
    );
}
