'use client';

import { User } from '@/app/types/user';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MarketplacePage() {
    const router = useRouter();
    const [legends, setLegends] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadLegends();
    }, []);

    const loadLegends = async () => {
        try {
            setLoading(true);
            setError('');

            // Query all users with role 'legend'
            const usersRef = collection(db, 'users');
            const legendsQuery = query(usersRef, where('role', '==', 'legend'));
            const querySnapshot = await getDocs(legendsQuery);

            const legendsData = querySnapshot.docs.map((doc) => ({
                uid: doc.id,
                ...doc.data(),
            })) as User[];

            setLegends(legendsData);
        } catch (err) {
            console.error('Error loading legends:', err);
            setError('Failed to load marketplace. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (legendId: string) => {
        router.push(`/legend/${legendId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading marketplace...</p>
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
                        onClick={loadLegends}
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
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center">
                        <h1 className="text-5xl font-bold mb-4">Marketplace</h1>
                        <p className="text-xl text-white/90 max-w-2xl mx-auto">
                            Discover and collaborate with verified music industry legends
                        </p>
                    </div>
                </div>
            </div>

            {/* Marketplace Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {legends.length === 0 ? (
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
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No Legends Available Yet
                        </h3>
                        <p className="text-gray-600">
                            Check back soon as we onboard more verified professionals to the platform.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-8">
                            <p className="text-gray-600">
                                Showing {legends.length} verified {legends.length === 1 ? 'legend' : 'legends'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {legends.map((legend) => (
                                <div
                                    key={legend.uid}
                                    onClick={() => handleCardClick(legend.uid)}
                                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden"
                                >
                                    {/* Profile Image */}
                                    <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100">
                                        {legend.profileImageUrl ? (
                                            <Image
                                                src={legend.profileImageUrl}
                                                alt={legend.displayName}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-6xl text-gray-400">
                                                    {legend.displayName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                        {/* Verified Badge Overlay */}
                                        <div className="absolute top-3 right-3">
                                            <div className="flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-md">
                                                <svg
                                                    className="w-4 h-4 text-blue-600"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                <span className="text-xs font-semibold text-gray-700">Verified</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-5">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
                                            {legend.displayName}
                                        </h3>

                                        {legend.bio ? (
                                            <p className="text-gray-600 text-sm line-clamp-3 mb-4 min-h-[60px]">
                                                {legend.bio}
                                            </p>
                                        ) : (
                                            <p className="text-gray-400 text-sm italic mb-4 min-h-[60px]">
                                                Music industry professional
                                            </p>
                                        )}

                                        <button
                                            className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-200"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCardClick(legend.uid);
                                            }}
                                        >
                                            View Profile
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Info Section */}
            <div className="bg-white border-t mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            How UvoCollab Works
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg
                                        className="w-8 h-8 text-blue-600"
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
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    1. Browse Legends
                                </h3>
                                <p className="text-gray-600">
                                    Discover verified industry professionals and explore their services
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg
                                        className="w-8 h-8 text-purple-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    2. Submit Your Pitch
                                </h3>
                                <p className="text-gray-600">
                                    Share your project vision and demo with your chosen Legend
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg
                                        className="w-8 h-8 text-green-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    3. Collaborate Securely
                                </h3>
                                <p className="text-gray-600">
                                    Work together with secure payments and legal protection
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
