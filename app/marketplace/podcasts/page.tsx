'use client';

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
}

export default function PodcastMarketplacePage() {
    const router = useRouter();
    const [allPodcasts, setAllPodcasts] = useState<Podcast[]>([]);
    const [filteredPodcasts, setFilteredPodcasts] = useState<Podcast[]>([]);
    const [podcastServices, setPodcastServices] = useState<Record<string, PodcastService[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<Filters>({
        category: 'all',
        audienceSize: 'all',
        priceRange: 'all',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadPodcasts();
    }, []);

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

            setAllPodcasts(podcastsData);

            // Load services for each podcast to enable price filtering
            const servicesMap: Record<string, PodcastService[]> = {};
            for (const podcast of podcastsData) {
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
        });
        setSearchQuery('');
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
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <h1 className="text-5xl font-bold mb-4">Podcast Marketplace</h1>
                        <p className="text-xl text-white/90 max-w-2xl mx-auto">
                            Find the perfect podcast for your next collaboration, interview, or promotion.
                        </p>

                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto mt-8 relative">
                            <input
                                type="text"
                                placeholder="Search podcasts by title or keyword..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-6 py-4 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-lg"
                            />
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                            <svg
                                className="w-5 h-5"
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
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>

                    {showFilters && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Audience Size (Avg. Listeners)
                                </label>
                                <select
                                    value={filters.audienceSize}
                                    onChange={(e) => handleFilterChange('audienceSize', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price Range
                                </label>
                                <select
                                    value={filters.priceRange}
                                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Prices</option>
                                    <option value="free">Free / Cross-Promo</option>
                                    <option value="paid">Paid Opportunities</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Marketplace Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {filteredPodcasts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg
                                className="w-16 h-16 mx-auto"
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
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    No Podcasts Match Your Filters
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Try adjusting your filters to see more results.
                                </p>
                                <button
                                    onClick={resetFilters}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    No Podcasts Available Yet
                                </h3>
                                <p className="text-gray-600">
                                    Check back soon as we onboard more podcasts to the platform.
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="mb-8">
                            <p className="text-gray-600">
                                Showing {filteredPodcasts.length} {filteredPodcasts.length === 1 ? 'podcast' : 'podcasts'}
                                {activeFilterCount > 0 && (
                                    <span className="text-gray-500">
                                        {' '}(filtered from {allPodcasts.length} total)
                                    </span>
                                )}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredPodcasts.map((podcast) => (
                                <div
                                    key={podcast.id}
                                    onClick={() => handleCardClick(podcast.id)}
                                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden flex flex-col h-full"
                                >
                                    {/* Cover Image */}
                                    <div className="relative h-48 bg-gray-200">
                                        {podcast.coverImageUrl ? (
                                            <Image
                                                src={podcast.coverImageUrl}
                                                alt={podcast.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-purple-100">
                                                <span className="text-4xl">🎙️</span>
                                            </div>
                                        )}
                                        {/* Category Badge */}
                                        {podcast.categories && podcast.categories.length > 0 && (
                                            <div className="absolute top-3 right-3">
                                                <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full backdrop-blur-sm">
                                                    {podcast.categories[0]}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-5 flex-grow flex flex-col">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
                                            {podcast.title}
                                        </h3>

                                        <div className="flex items-center text-sm text-gray-500 mb-3">
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            {podcast.avgListeners ? podcast.avgListeners.toLocaleString() : 'N/A'} listeners
                                        </div>

                                        <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">
                                            {podcast.description}
                                        </p>

                                        <div className="mt-auto">
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {podcastServices[podcast.id]?.slice(0, 2).map(service => (
                                                    <span key={service.id} className="inline-block px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded border border-purple-100">
                                                        {service.title}
                                                    </span>
                                                ))}
                                                {podcastServices[podcast.id]?.length > 2 && (
                                                    <span className="inline-block px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded border border-gray-100">
                                                        +{podcastServices[podcast.id].length - 2} more
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                className="w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors duration-200"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCardClick(podcast.id);
                                                }}
                                            >
                                                View Podcast
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
