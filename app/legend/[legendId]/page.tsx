'use client';

import PitchForm from '@/app/components/PitchForm';
import { useAuth } from '@/app/contexts/AuthContext';
import { Service } from '@/app/types/service';
import { User } from '@/app/types/user';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LegendPublicProfile() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const legendId = params.legendId as string;

    const [legend, setLegend] = useState<User | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPitchForm, setShowPitchForm] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    useEffect(() => {
        loadLegendProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [legendId]);

    const loadLegendProfile = async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch legend user data
            const userRef = doc(db, 'users', legendId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                setError('Legend not found');
                return;
            }

            const userData = { uid: userSnap.id, ...userSnap.data() } as User;

            // Verify this user is actually a legend
            if (userData.role !== 'legend') {
                setError('This user is not a verified Legend');
                return;
            }

            setLegend(userData);

            // Fetch legend's active services
            const servicesRef = collection(db, 'users', legendId, 'services');
            const servicesQuery = query(servicesRef, where('isActive', '==', true));
            const servicesSnap = await getDocs(servicesQuery);

            const servicesData = servicesSnap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            })) as Service[];

            setServices(servicesData);
        } catch (err) {
            console.error('Error loading legend profile:', err);
            setError('Failed to load legend profile');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestCollaboration = (serviceId: string) => {
        // Check if user is logged in
        if (!user) {
            router.push('/auth/login');
            return;
        }

        // Check if user is trying to collaborate with themselves
        if (user.uid === legendId) {
            alert('You cannot request a collaboration with yourself!');
            return;
        }

        // Find the service
        const service = services.find((s) => s.id === serviceId);
        if (!service) {
            alert('Service not found');
            return;
        }

        // Open pitch form
        setSelectedService(service);
        setShowPitchForm(true);
    };

    const handlePitchSuccess = () => {
        setShowPitchForm(false);
        setSelectedService(null);

        // Show success message
        alert('Your pitch has been submitted successfully! The Legend will review it and respond soon.');

        // Optionally navigate to dashboard
        router.push('/dashboard');
    };

    const handleClosePitchForm = () => {
        setShowPitchForm(false);
        setSelectedService(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading Legend profile...</p>
                </div>
            </div>
        );
    }

    if (error || !legend) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
                    <p className="text-gray-600 mb-6">{error || 'Legend not found'}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            {/* Hero Section with Profile Info */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Profile Image */}
                        <div className="flex-shrink-0">
                            {legend.profileImageUrl ? (
                                <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden">
                                    <Image
                                        src={legend.profileImageUrl}
                                        alt={legend.displayName}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center">
                                    <span className="text-4xl text-gray-400">
                                        {legend.displayName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Profile Details */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl font-bold">{legend.displayName}</h1>
                                {/* Verified Legend Badge */}
                                <div className="flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                                    <svg
                                        className="w-5 h-5 text-yellow-300"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="text-sm font-semibold">Verified Legend</span>
                                </div>
                            </div>

                            {legend.bio && (
                                <p className="text-lg text-white/90 mb-4 max-w-3xl">{legend.bio}</p>
                            )}

                            {legend.managementInfo && (
                                <div className="text-sm text-white/80">
                                    <p className="font-semibold">Management:</p>
                                    <p className="whitespace-pre-line">{legend.managementInfo}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Services Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Available Services</h2>
                    <p className="text-gray-600">
                        Choose a service to collaborate with {legend.displayName}
                    </p>
                </div>

                {services.length === 0 ? (
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
                                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No Services Available Yet
                        </h3>
                        <p className="text-gray-600">
                            {legend.displayName} hasn&apos;t listed any services yet. Check back soon!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((service) => (
                            <div
                                key={service.id}
                                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                            >
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                                        {service.title}
                                    </h3>

                                    <p className="text-gray-600 mb-4 min-h-[60px]">
                                        {service.description}
                                    </p>

                                    <div className="mb-4 pb-4 border-b border-gray-200">
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-3xl font-bold text-blue-600">
                                                {service.price.toFixed(0)} UGX
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-2 text-sm text-gray-500">
                                            <svg
                                                className="w-5 h-5 flex-shrink-0 mt-0.5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                            <span>{service.deliverable}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleRequestCollaboration(service.id!)}
                                        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
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
                                                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                            />
                                        </svg>
                                        Request Collaboration
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Additional Info Section */}
            <div className="bg-white border-t">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            Ready to Work with {legend.displayName}?
                        </h3>
                        <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                            All UvoCollab Legends are verified professionals. When you request a
                            collaboration, you&apos;ll submit your project details and demo. If accepted,
                            your payment is held securely until the work is completed.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>Verified Professional</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>Secure Payments</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>Legal Contracts</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pitch Form Modal */}
            {showPitchForm && selectedService && legend && user && (
                <PitchForm
                    legend={legend}
                    service={selectedService}
                    buyerId={user.uid}
                    onClose={handleClosePitchForm}
                    onSuccess={handlePitchSuccess}
                />
            )}
        </div>
    );
}
