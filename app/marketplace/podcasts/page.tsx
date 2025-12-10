'use client';

import AddPodcastToWishlistModal from '@/app/components/AddPodcastToWishlistModal';
import { useAuth } from '@/app/contexts/AuthContext';
import { Podcast, PodcastService } from '@/app/types/podcast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Filter types
interface Filters {
    category: string;
    audienceSize: string;
    priceRange: string;
    seekingGuests: string;
}

export default function PodcastMarketplacePage() {
    const router = useRouter();
    const { user, userData, loading: authLoading } = useAuth();
    const [allPodcasts, setAllPodcasts] = useState<Podcast[]>([]);
    const [filteredPodcasts, setFilteredPodcasts] = useState<Podcast[]>([]);
    const [podcastServices, setPodcastServices] = useState<Record<string, PodcastService[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<Filters>({
        category: 'all',
        audienceSize: 'all',
        priceRange: 'all',
        seekingGuests: 'all',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
    const [showWishlistModal, setShowWishlistModal] = useState(false);

    useEffect(() => {
        // Load podcasts once auth state is determined (works for both authenticated and unauthenticated users)
        if (!authLoading) {
            loadPodcasts();
        }
    }, [authLoading]);

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, allPodcasts, podcastServices, searchQuery]);

    const loadPodcasts = async () => {
        try {
            setLoading(true);
            setError('');

            // Query all approved podcasts
            const podcastsRef = collection(db, 'podcasts');
            const q = query(podcastsRef, where('status', '==', 'approved'));
            const querySnapshot = await getDocs(q);

            const podcastsData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Podcast[];

            // Filter out deactivated podcasts
            const activePodcasts = podcastsData.filter(podcast => podcast.isActive !== false);

            setAllPodcasts(activePodcasts);

            // Load services for each podcast to enable price filtering
            const servicesMap: Record<string, PodcastService[]> = {};
            for (const podcast of activePodcasts) {
                const servicesRef = collection(db, 'podcasts', podcast.id, 'services');
                const servicesSnap = await getDocs(servicesRef);
                servicesMap[podcast.id] = servicesSnap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as PodcastService[];
            }
            setPodcastServices(servicesMap);
        } catch (err) {
            console.error('Error loading podcasts:', err);
            setError('Failed to load podcasts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...allPodcasts];

        // Search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(podcast =>
                podcast.title.toLowerCase().includes(query) ||
                podcast.description.toLowerCase().includes(query)
            );
        }

        // Filter by category
        if (filters.category !== 'all') {
            filtered = filtered.filter((podcast) =>
                podcast.categories && podcast.categories.includes(filters.category)
            );
        }

        // Filter by audience size
        if (filters.audienceSize !== 'all') {
            filtered = filtered.filter((podcast) => {
                const listeners = podcast.avgListeners || 0;
                switch (filters.audienceSize) {
                    case 'small': return listeners < 1000;
                    case 'medium': return listeners >= 1000 && listeners < 10000;
                    case 'large': return listeners >= 10000 && listeners < 50000;
                    case 'huge': return listeners >= 50000;
                    default: return true;
                }
            });
        }

        // Filter by price range
        if (filters.priceRange !== 'all') {
            filtered = filtered.filter((podcast) => {
                const services = podcastServices[podcast.id] || [];
                if (services.length === 0) return false;

                const hasFree = services.some(s => s.price === 0);
                const hasPaid = services.some(s => s.price > 0);

                if (filters.priceRange === 'free') return hasFree;
                if (filters.priceRange === 'paid') return hasPaid;
                return true;
            });
        }

        // Filter by seeking guests
        if (filters.seekingGuests !== 'all') {
            filtered = filtered.filter((podcast) => {
                const services = podcastServices[podcast.id] || [];
                const hasGuestService = services.some(
                    s => s.title.toLowerCase().includes('guest') ||
                        s.title.toLowerCase().includes('interview') ||
                        s.description.toLowerCase().includes('guest')
                );
                return hasGuestService;
            });
        }

        setFilteredPodcasts(filtered);
    };

    const handleFilterChange = (filterType: keyof Filters, value: string) => {
        setFilters((prev) => ({ ...prev, [filterType]: value }));
    };

    const resetFilters = () => {
        setFilters({
            category: 'all',
            audienceSize: 'all',
            priceRange: 'all',
            seekingGuests: 'all',
        });
        setSearchQuery('');
    };

    const handleAddToWishlist = (podcast: Podcast, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!userData || !userData.isGuest) {
            alert('You need to be registered as a guest to add podcasts to your wishlist.');
            return;
        }
        setSelectedPodcast(podcast);
        setShowWishlistModal(true);
    };

    const activeFilterCount = Object.values(filters).filter((v) => v !== 'all').length + (searchQuery ? 1 : 0);

    const handleCardClick = (podcastId: string) => {
        router.push(`/podcasts/${podcastId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading podcasts...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={loadPodcasts}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
                    <div className="text-center">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Podcast Marketplace</h1>
                        <p className="text-base sm:text-lg lg:text-xl text-white/90 max-w-2xl mx-auto px-2">
                            Find the perfect podcast for your next collaboration, interview, or promotion.
                        </p>

                        {/* Add Your Podcast Button */}
                        <div className="mt-6 sm:mt-8">
                            <button
                                onClick={() => router.push('/podcasts/register')}
                                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-purple-600 font-semibold rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>List Your Podcast</span>
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto mt-6 sm:mt-8 relative">
                            <input
                                type="text"
                                placeholder="Search podcasts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-full text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-lg"
                            />
                            <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                            <svg
                                className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                />
                            </svg>
                            <span className="font-medium">
                                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                            </span>
                        </button>

                        {activeFilterCount > 0 && (
                            <button
                                onClick={resetFilters}
                                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {showFilters && (
                        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                            {/* Category Filter */}
                            <div>
                                <label htmlFor="category-filter" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                    📁 Category
                                </label>
                                <select
                                    id="category-filter"
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Categories</option>
                                    <option value="Business">Business</option>
                                    <option value="Technology">Technology</option>
                                    <option value="Music">Music</option>
                                    <option value="Arts">Arts</option>
                                    <option value="Comedy">Comedy</option>
                                    <option value="Education">Education</option>
                                    <option value="Health">Health</option>
                                    <option value="Society">Society</option>
                                </select>
                            </div>

                            {/* Audience Size Filter */}
                            <div>
                                <label htmlFor="audience-size-filter" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                    👥 Audience Size
                                </label>
                                <select
                                    id="audience-size-filter"
                                    value={filters.audienceSize}
                                    onChange={(e) => handleFilterChange('audienceSize', e.target.value)}
                                    className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Any Size</option>
                                    <option value="small">&lt; 1,000</option>
                                    <option value="medium">1,000 - 10,000</option>
                                    <option value="large">10,000 - 50,000</option>
                                    <option value="huge">50,000+</option>
                                </select>
                            </div>

                            {/* Price Range Filter */}
                            <div>
                                <label htmlFor="price-range-filter" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                    💰 Price
                                </label>
                                <select
                                    id="price-range-filter"
                                    value={filters.priceRange}
                                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                                    className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Prices</option>
                                    <option value="free">Free / Cross-Promo</option>
                                    <option value="paid">Paid Opportunities</option>
                                </select>
                            </div>

                            {/* Seeking Guests Filter */}
                            <div>
                                <label htmlFor="seeking-guests-filter" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                    🎙️ Opportunities
                                </label>
                                <select
                                    id="seeking-guests-filter"
                                    value={filters.seekingGuests}
                                    onChange={(e) => handleFilterChange('seekingGuests', e.target.value)}
                                    className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Podcasts</option>
                                    <option value="seeking">Seeking Guests</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Marketplace Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
                {filteredPodcasts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg
                                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                                />
                            </svg>
                        </div>
                        {activeFilterCount > 0 ? (
                            <>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                                    No Podcasts Match Your Filters
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 mb-4">
                                    Try adjusting your filters to see more results.
                                </p>
                                <button
                                    onClick={resetFilters}
                                    className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                                    No Podcasts Available Yet
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600">
                                    Check back soon as we onboard more podcasts to the platform.
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="mb-4 sm:mb-6 lg:mb-8">
                            <p className="text-sm sm:text-base text-gray-600">
                                Showing {filteredPodcasts.length} {filteredPodcasts.length === 1 ? 'podcast' : 'podcasts'}
                                {activeFilterCount > 0 && (
                                    <span className="text-gray-500">
                                        {' '}(filtered from {allPodcasts.length} total)
                                    </span>
                                )}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {filteredPodcasts.map((podcast) => (
                                <div
                                    key={podcast.id}
                                    onClick={() => handleCardClick(podcast.id)}
                                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden flex flex-col h-full"
                                >
                                    {/* Cover Image */}
                                    <div className="relative h-40 sm:h-48 bg-gray-200">
                                        {podcast.coverImageUrl ? (
                                            <Image
                                                src={podcast.coverImageUrl}
                                                alt={podcast.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-purple-100">
                                                <span className="text-3xl sm:text-4xl">🎙️</span>
                                            </div>
                                        )}
                                        {/* Category Badge */}
                                        {podcast.categories && podcast.categories.length > 0 && (
                                            <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                                                <span className="px-2 py-0.5 sm:py-1 bg-black/70 text-white text-xs rounded-full backdrop-blur-sm">
                                                    {podcast.categories[0]}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-4 sm:p-5 flex-grow flex flex-col">
                                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                            {podcast.title}
                                        </h3>

                                        <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            {podcast.avgListeners ? podcast.avgListeners.toLocaleString() : 'N/A'} listeners
                                        </div>

                                        <p className="text-gray-700 text-xs sm:text-sm line-clamp-2 mb-3 sm:mb-4 flex-grow leading-relaxed">
                                            {podcast.description}
                                        </p>

                                        <div className="mt-auto">
                                            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                                                {podcastServices[podcast.id]?.slice(0, 2).map(service => (
                                                    <span key={service.id} className="inline-block px-2 py-0.5 sm:py-1 bg-purple-50 text-purple-800 text-xs rounded border border-purple-200 truncate max-w-full font-medium">
                                                        {service.title}
                                                    </span>
                                                ))}
                                                {podcastServices[podcast.id]?.length > 2 && (
                                                    <span className="inline-block px-2 py-0.5 sm:py-1 bg-gray-50 text-gray-500 text-xs rounded border border-gray-100">
                                                        +{podcastServices[podcast.id].length - 2}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            {userData?.isGuest ? (
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors duration-200"
                                                        onClick={(e) => handleAddToWishlist(podcast, e)}
                                                    >
                                                        Add to Wishlist
                                                    </button>
                                                    <button
                                                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-white text-purple-600 font-semibold rounded-md border border-purple-600 hover:bg-purple-50 transition-colors duration-200"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCardClick(podcast.id);
                                                        }}
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors duration-200"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCardClick(podcast.id);
                                                    }}
                                                >
                                                    View Podcast
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Add to Wishlist Modal */}
            {showWishlistModal && selectedPodcast && userData?.uid && (
                <AddPodcastToWishlistModal
                    podcast={selectedPodcast}
                    guestId={userData.uid}
                    onClose={() => {
                        setShowWishlistModal(false);
                        setSelectedPodcast(null);
                    }}
                    onSuccess={() => {
                        setShowWishlistModal(false);
                        setSelectedPodcast(null);
                    }}
                />
            )}
        </div>
    );
}
