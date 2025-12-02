'use client';

import { User } from '@/app/types/user';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import AddGuestToWishlistModal from '@/app/components/AddGuestToWishlistModal';

// Filter types
interface Filters {
    priceRange: string;
    topics: string;
    verified: string;
}

export default function GuestMarketplacePage() {
    const router = useRouter();
    const { userData } = useAuth();
    const [allGuests, setAllGuests] = useState<User[]>([]);
    const [filteredGuests, setFilteredGuests] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<Filters>({
        priceRange: 'all',
        topics: 'all',
        verified: 'all',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGuest, setSelectedGuest] = useState<User | null>(null);
    const [showWishlistModal, setShowWishlistModal] = useState(false);
    const [userPodcastId, setUserPodcastId] = useState<string | null>(null);

    // Extract unique topics from all guests
    const allTopics = Array.from(
        new Set(
            allGuests
                .flatMap(guest => guest.guestTopics || [])
                .filter(Boolean)
        )
    ).sort();

    useEffect(() => {
        loadGuests();
    }, []);

    useEffect(() => {
        if (userData?.uid && userData.hasPodcast) {
            checkUserPodcast();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData]);

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, allGuests, searchQuery]);

    const checkUserPodcast = async () => {
        if (!userData?.uid) return;

        try {
            const podcastsRef = collection(db, 'podcasts');
            const q = query(podcastsRef, where('ownerId', '==', userData.uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setUserPodcastId(querySnapshot.docs[0].id);
            }
        } catch (err) {
            console.error('Error checking user podcast:', err);
        }
    };

    const loadGuests = async () => {
        try {
            setLoading(true);
            setError('');

            // Query all users who are guests
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('isGuest', '==', true));
            const querySnapshot = await getDocs(q);

            const guestsData = querySnapshot.docs.map((doc) => ({
                ...doc.data(),
                uid: doc.id,
            })) as User[];

            setAllGuests(guestsData);
        } catch (err) {
            console.error('Error loading guests:', err);
            setError('Failed to load guests. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...allGuests];

        // Search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(guest =>
                guest.displayName.toLowerCase().includes(query) ||
                guest.guestBio?.toLowerCase().includes(query) ||
                guest.guestTopics?.some(topic => topic.toLowerCase().includes(query))
            );
        }

        // Filter by price range
        if (filters.priceRange !== 'all') {
            filtered = filtered.filter((guest) => {
                const rate = guest.guestRate || 0;
                switch (filters.priceRange) {
                    case 'free':
                        return rate === 0;
                    case 'under-500':
                        return rate > 0 && rate < 500;
                    case '500-1000':
                        return rate >= 500 && rate < 1000;
                    case 'over-1000':
                        return rate >= 1000;
                    default:
                        return true;
                }
            });
        }

        // Filter by topics
        if (filters.topics !== 'all') {
            filtered = filtered.filter((guest) =>
                guest.guestTopics?.includes(filters.topics)
            );
        }

        // Filter by verification status
        if (filters.verified !== 'all') {
            filtered = filtered.filter((guest) => {
                if (filters.verified === 'verified') {
                    return guest.isVerifiedGuest === true;
                } else if (filters.verified === 'unverified') {
                    return !guest.isVerifiedGuest;
                }
                return true;
            });
        }

        setFilteredGuests(filtered);
    };

    const handleFilterChange = (filterName: keyof Filters, value: string) => {
        setFilters((prev) => ({ ...prev, [filterName]: value }));
    };

    const handleAddToWishlist = (guest: User) => {
        if (!userData || !userPodcastId) {
            alert('You need to have a registered podcast to add guests to your wishlist.');
            return;
        }
        setSelectedGuest(guest);
        setShowWishlistModal(true);
    };

    const handleViewProfile = (guestId: string) => {
        router.push(`/guest/${guestId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading guests...</p>
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
                        onClick={loadGuests}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Discover Guests</h1>
                    <p className="mt-2 text-gray-600">
                        Find the perfect guest for your podcast
                    </p>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by name, bio, or topics..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </button>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Price Range Filter */}
                            <div>
                                <label htmlFor="price-range-filter" className="block text-sm font-medium text-gray-700 mb-2">
                                    Price Range
                                </label>
                                <select
                                    id="price-range-filter"
                                    value={filters.priceRange}
                                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Prices</option>
                                    <option value="free">Free</option>
                                    <option value="under-500">Under $500</option>
                                    <option value="500-1000">$500 - $1,000</option>
                                    <option value="over-1000">Over $1,000</option>
                                </select>
                            </div>

                            {/* Topics Filter */}
                            <div>
                                <label htmlFor="topics-filter" className="block text-sm font-medium text-gray-700 mb-2">
                                    Topics
                                </label>
                                <select
                                    id="topics-filter"
                                    value={filters.topics}
                                    onChange={(e) => handleFilterChange('topics', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Topics</option>
                                    {allTopics.map((topic) => (
                                        <option key={topic} value={topic}>
                                            {topic}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Verification Filter */}
                            <div>
                                <label htmlFor="verification-filter" className="block text-sm font-medium text-gray-700 mb-2">
                                    Verification Status
                                </label>
                                <select
                                    id="verification-filter"
                                    value={filters.verified}
                                    onChange={(e) => handleFilterChange('verified', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Guests</option>
                                    <option value="verified">Verified Only</option>
                                    <option value="unverified">Unverified</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Count */}
                <div className="mb-4 text-gray-600">
                    {filteredGuests.length} {filteredGuests.length === 1 ? 'guest' : 'guests'} found
                </div>

                {/* Guest Grid */}
                {filteredGuests.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <p className="text-gray-500">No guests found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredGuests.map((guest) => (
                            <div
                                key={guest.uid}
                                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                            >
                                {/* Guest Header */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="relative">
                                        {guest.profileImageUrl ? (
                                            <Image
                                                src={guest.profileImageUrl}
                                                alt={guest.displayName}
                                                width={64}
                                                height={64}
                                                className="rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                                <span className="text-2xl text-gray-500">
                                                    {guest.displayName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        {guest.isVerifiedGuest && (
                                            <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1">
                                                <svg
                                                    className="w-4 h-4 text-white"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                                            {guest.displayName}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {guest.guestRate && guest.guestRate > 0
                                                ? `$${guest.guestRate}`
                                                : 'Negotiable'}
                                        </p>
                                    </div>
                                </div>

                                {/* Guest Bio */}
                                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                    {guest.guestBio || guest.bio || 'No bio available'}
                                </p>

                                {/* Topics */}
                                {guest.guestTopics && guest.guestTopics.length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex flex-wrap gap-2">
                                            {guest.guestTopics.slice(0, 3).map((topic, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                                >
                                                    {topic}
                                                </span>
                                            ))}
                                            {guest.guestTopics.length > 3 && (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                    +{guest.guestTopics.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Availability */}
                                {guest.guestAvailability && (
                                    <p className="text-xs text-gray-500 mb-4">
                                        📅 {guest.guestAvailability}
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleViewProfile(guest.uid)}
                                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                    >
                                        View Profile
                                    </button>
                                    {userPodcastId && (
                                        <button
                                            onClick={() => handleAddToWishlist(guest)}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                        >
                                            Add to Wishlist
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add to Wishlist Modal */}
            {showWishlistModal && selectedGuest && userPodcastId && (
                <AddGuestToWishlistModal
                    guest={selectedGuest}
                    podcastId={userPodcastId}
                    onClose={() => {
                        setShowWishlistModal(false);
                        setSelectedGuest(null);
                    }}
                    onSuccess={() => {
                        setShowWishlistModal(false);
                        setSelectedGuest(null);
                    }}
                />
            )}
        </div>
    );
}
