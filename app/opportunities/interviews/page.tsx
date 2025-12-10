'use client';

import AddPodcastToWishlistModal from '@/app/components/AddPodcastToWishlistModal';
import { useAuth } from '@/app/contexts/AuthContext';
import { Podcast, PodcastService } from '@/app/types/podcast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface OpportunityWithPodcast {
    podcast: Podcast;
    service: PodcastService;
}

export default function InterviewOpportunitiesPage() {
    const router = useRouter();
    const { userData } = useAuth();
    const [opportunities, setOpportunities] = useState<OpportunityWithPodcast[]>([]);
    const [filteredOpportunities, setFilteredOpportunities] = useState<OpportunityWithPodcast[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
    const [showWishlistModal, setShowWishlistModal] = useState(false);
    const [filters, setFilters] = useState({
        paymentType: 'all', // all, paid, free, pay-to-play
        category: 'all',
        audienceSize: 'all',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadOpportunities();
    }, []);

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, opportunities, searchQuery]);

    const loadOpportunities = async () => {
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

            // Load services and filter for guest-related opportunities
            const opportunitiesList: OpportunityWithPodcast[] = [];
            for (const podcast of podcastsData) {
                const servicesRef = collection(db, 'podcasts', podcast.id, 'services');
                const servicesSnap = await getDocs(servicesRef);
                const services = servicesSnap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as PodcastService[];

                // Filter services that are guest/interview related
                const guestServices = services.filter(
                    (service) =>
                        service.title.toLowerCase().includes('guest') ||
                        service.title.toLowerCase().includes('interview') ||
                        service.description.toLowerCase().includes('guest') ||
                        service.description.toLowerCase().includes('interview')
                );

                // Add each guest service as an opportunity
                guestServices.forEach((service) => {
                    opportunitiesList.push({
                        podcast,
                        service,
                    });
                });
            }

            setOpportunities(opportunitiesList);
        } catch (err) {
            console.error('Error loading opportunities:', err);
            setError('Failed to load opportunities. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...opportunities];

        // Search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (opp) =>
                    opp.podcast.title.toLowerCase().includes(query) ||
                    opp.podcast.description.toLowerCase().includes(query) ||
                    opp.service.title.toLowerCase().includes(query) ||
                    opp.service.description.toLowerCase().includes(query)
            );
        }

        // Filter by payment type
        if (filters.paymentType !== 'all') {
            filtered = filtered.filter((opp) => {
                const price = opp.service.price;
                switch (filters.paymentType) {
                    case 'free':
                        return price === 0;
                    case 'paid':
                        // Podcast pays guest (would need to check service details or assume paid means podcast pays)
                        return price > 0;
                    case 'pay-to-play':
                        // Guest pays podcast (would need to check service type or pricing structure)
                        return price > 0; // Simplified - in real implementation, check service type
                    default:
                        return true;
                }
            });
        }

        // Filter by category
        if (filters.category !== 'all') {
            filtered = filtered.filter((opp) =>
                opp.podcast.categories && opp.podcast.categories.includes(filters.category)
            );
        }

        // Filter by audience size
        if (filters.audienceSize !== 'all') {
            filtered = filtered.filter((opp) => {
                const listeners = opp.podcast.avgListeners || 0;
                switch (filters.audienceSize) {
                    case 'small':
                        return listeners < 1000;
                    case 'medium':
                        return listeners >= 1000 && listeners < 10000;
                    case 'large':
                        return listeners >= 10000 && listeners < 50000;
                    case 'huge':
                        return listeners >= 50000;
                    default:
                        return true;
                }
            });
        }

        setFilteredOpportunities(filtered);
    };

    const handleFilterChange = (filterName: string, value: string) => {
        setFilters((prev) => ({ ...prev, [filterName]: value }));
    };

    const resetFilters = () => {
        setFilters({
            paymentType: 'all',
            category: 'all',
            audienceSize: 'all',
        });
        setSearchQuery('');
    };

    const handleAddToWishlist = (podcast: Podcast) => {
        if (!userData || !userData.isGuest) {
            alert('You need to be registered as a guest to add podcasts to your wishlist.');
            return;
        }
        setSelectedPodcast(podcast);
        setShowWishlistModal(true);
    };

    const handleApplyNow = (podcastId: string, serviceId: string) => {
        // Navigate to podcast detail page with service highlighted
        router.push(`/podcasts/${podcastId}?service=${serviceId}`);
    };

    const activeFilterCount =
        Object.values(filters).filter((v) => v !== 'all').length + (searchQuery ? 1 : 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading opportunities...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={loadOpportunities}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <h1 className="text-5xl font-bold mb-4">Guest Interview Opportunities</h1>
                        <p className="text-xl text-white/90 max-w-2xl mx-auto">
                            Discover podcasts looking for guests like you. Share your expertise and grow
                            your audience.
                        </p>

                        {/* Search Bar */}
                        <div className="max-w-2xl mx-auto mt-8 relative">
                            <input
                                type="text"
                                placeholder="Search opportunities by podcast or topic..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-6 py-4 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-lg"
                            />
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
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
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            {/* Payment Type Filter */}
                            <div>
                                <label htmlFor="payment-type-filter" className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Type
                                </label>
                                <select
                                    id="payment-type-filter"
                                    value={filters.paymentType}
                                    onChange={(e) => handleFilterChange('paymentType', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Types</option>
                                    <option value="paid">Paid (Podcast Pays)</option>
                                    <option value="free">Free Exchange</option>
                                    <option value="pay-to-play">Pay to Appear</option>
                                </select>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    id="category-filter"
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
                                <label htmlFor="audience-size-filter" className="block text-sm font-medium text-gray-700 mb-2">
                                    Podcast Reach
                                </label>
                                <select
                                    id="audience-size-filter"
                                    value={filters.audienceSize}
                                    onChange={(e) => handleFilterChange('audienceSize', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Any Size</option>
                                    <option value="small">&lt; 1,000 listeners</option>
                                    <option value="medium">1K - 10K listeners</option>
                                    <option value="large">10K - 50K listeners</option>
                                    <option value="huge">50K+ listeners</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Opportunities List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Results Count */}
                <div className="mb-6 text-gray-600">
                    {filteredOpportunities.length}{' '}
                    {filteredOpportunities.length === 1 ? 'opportunity' : 'opportunities'} found
                </div>

                {filteredOpportunities.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
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
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No Opportunities Found
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {activeFilterCount > 0
                                ? 'Try adjusting your filters to see more results.'
                                : 'Check back soon as we add more podcasts to the platform.'}
                        </p>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={resetFilters}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredOpportunities.map((opportunity, index) => (
                            <div
                                key={`${opportunity.podcast.id}-${opportunity.service.id}-${index}`}
                                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Podcast Image */}
                                    <div className="flex-shrink-0">
                                        <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                                            {opportunity.podcast.coverImageUrl ? (
                                                <Image
                                                    src={opportunity.podcast.coverImageUrl}
                                                    alt={opportunity.podcast.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-purple-100 flex items-center justify-center">
                                                    <span className="text-4xl">🎙️</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Opportunity Details */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                                                    {opportunity.service.title}
                                                </h3>
                                                <p className="text-gray-600">
                                                    {opportunity.podcast.title}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-purple-600">
                                                    {opportunity.service.price === 0
                                                        ? 'Free'
                                                        : `${opportunity.service.price.toFixed(0)} UGX`}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {opportunity.service.price === 0
                                                        ? 'Exchange'
                                                        : 'per spot'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Podcast Stats */}
                                        <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                    />
                                                </svg>
                                                {opportunity.podcast.avgListeners
                                                    ? `${opportunity.podcast.avgListeners.toLocaleString()} listeners`
                                                    : 'N/A'}
                                            </span>
                                            {opportunity.podcast.categories &&
                                                opportunity.podcast.categories.length > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                                            />
                                                        </svg>
                                                        {opportunity.podcast.categories[0]}
                                                    </span>
                                                )}
                                        </div>

                                        {/* Service Description */}
                                        <p className="text-gray-700 mb-4 line-clamp-2">
                                            {opportunity.service.description}
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={() =>
                                                    handleApplyNow(
                                                        opportunity.podcast.id,
                                                        opportunity.service.id
                                                    )
                                                }
                                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                                            >
                                                Apply Now
                                            </button>
                                            {userData?.isGuest && (
                                                <button
                                                    onClick={() => handleAddToWishlist(opportunity.podcast)}
                                                    className="px-6 py-2 bg-white text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
                                                >
                                                    Add to Wishlist
                                                </button>
                                            )}
                                            <button
                                                onClick={() =>
                                                    router.push(`/podcasts/${opportunity.podcast.id}`)
                                                }
                                                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                            >
                                                View Podcast
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
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
