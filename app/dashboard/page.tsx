'use client';

import PaymentCheckout from '@/app/components/PaymentCheckout';
import { useAuth } from '@/app/contexts/AuthContext';
import { Collaboration } from '@/app/types/collaboration';
import { Service } from '@/app/types/service';
import { User } from '@/app/types/user';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Dashboard() {
    const { user, userData, logout, loading } = useAuth();
    const router = useRouter();
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [loadingCollabs, setLoadingCollabs] = useState(true);
    const [legendsInfo, setLegendsInfo] = useState<Record<string, User>>({});
    const [servicesInfo, setServicesInfo] = useState<Record<string, Service>>({});
    const [selectedCollab, setSelectedCollab] = useState<string | null>(null);
    const [generatingContract, setGeneratingContract] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
        if (!loading && userData && userData.role === 'legend') {
            router.push('/legend/dashboard');
        }
    }, [user, userData, loading, router]);

    useEffect(() => {
        if (user && userData?.role !== 'legend') {
            loadCollaborations();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, userData]);

    const loadCollaborations = async () => {
        if (!user) return;

        try {
            setLoadingCollabs(true);
            const collabsRef = collection(db, 'collaborations');
            const q = query(
                collabsRef,
                where('buyerId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            const collabsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
                acceptedAt: doc.data().acceptedAt?.toDate(),
                paidAt: doc.data().paidAt?.toDate(),
                completedAt: doc.data().completedAt?.toDate(),
            })) as Collaboration[];
            setCollaborations(collabsData);

            // Load legend and service information
            const legendIds = [...new Set(collabsData.map(c => c.legendId))];
            const legendsData: Record<string, User> = {};
            const servicesData: Record<string, Service> = {};

            for (const legendId of legendIds) {
                const legendDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', legendId)));
                if (!legendDoc.empty) {
                    const legend = legendDoc.docs[0].data() as User;
                    legendsData[legendId] = legend;

                    // Load services for this legend
                    const collabsForLegend = collabsData.filter(c => c.legendId === legendId);
                    for (const collab of collabsForLegend) {
                        const serviceDoc = await getDocs(query(collection(db, 'users', legendId, 'services'), where('__name__', '==', collab.serviceId)));
                        if (!serviceDoc.empty) {
                            servicesData[collab.serviceId] = serviceDoc.docs[0].data() as Service;
                        }
                    }
                }
            }

            setLegendsInfo(legendsData);
            setServicesInfo(servicesData);
        } catch (error) {
            console.error('Error loading collaborations:', error);
        } finally {
            setLoadingCollabs(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { color: string; text: string }> = {
            pending_review: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Review' },
            pending_payment: { color: 'bg-blue-100 text-blue-800', text: 'Payment Required' },
            awaiting_contract: { color: 'bg-purple-100 text-purple-800', text: 'Awaiting Contract' },
            in_progress: { color: 'bg-green-100 text-green-800', text: 'In Progress' },
            completed: { color: 'bg-gray-100 text-gray-800', text: 'Completed' },
            declined: { color: 'bg-red-100 text-red-800', text: 'Declined' },
        };

        const badge = badges[status] || { color: 'bg-gray-100 text-gray-800', text: status };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                {badge.text}
            </span>
        );
    };

    const handleGenerateContract = async (collaborationId: string) => {
        if (!user) return;

        try {
            setGeneratingContract(collaborationId);
            const token = await user.getIdToken();

            const response = await fetch('/api/contract/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ collaborationId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate contract');
            }

            const data = await response.json();
            console.log('Contract generated:', data);

            alert('Contract generated and sent for signature! Check your email.');
            await loadCollaborations();
        } catch (error) {
            console.error('Error generating contract:', error);
            alert(error instanceof Error ? error.message : 'Failed to generate contract');
        } finally {
            setGeneratingContract(null);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
                            <p className="text-gray-600">Welcome back, {userData?.displayName || user.email}!</p>
                        </div>
                        <div className="flex gap-4">
                            {userData?.role === 'admin' && (
                                <a
                                    href="/admin/vetting"
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                                >
                                    Admin Panel
                                </a>
                            )}
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Quick Actions */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="/marketplace"
                        className="flex items-center gap-4 p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
                    >
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Browse Marketplace</h3>
                            <p className="text-sm text-gray-600">Find industry legends</p>
                        </div>
                    </a>

                    <a
                        href="/apply"
                        className="flex items-center gap-4 p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
                    >
                        <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Become a Legend</h3>
                            <p className="text-sm text-gray-600">Apply to offer services</p>
                        </div>
                    </a>

                    <a
                        href="/"
                        className="flex items-center gap-4 p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
                    >
                        <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Home</h3>
                            <p className="text-sm text-gray-600">Back to main page</p>
                        </div>
                    </a>
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">My Collaborations</h2>
                    <p className="text-gray-600">Track your collaboration requests and active projects</p>
                </div>

                {loadingCollabs ? (
                    <div className="text-center py-12">Loading collaborations...</div>
                ) : collaborations.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <div className="text-gray-400 mb-4">
                            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No collaborations yet</h3>
                        <p className="text-gray-600 mb-6">
                            Browse the marketplace to find and collaborate with verified legends.
                        </p>
                        <a
                            href="/marketplace"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Browse Marketplace
                        </a>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {collaborations.map((collab) => {
                            const legend = legendsInfo[collab.legendId];
                            const service = servicesInfo[collab.serviceId];

                            return (
                                <div key={collab.id} className="bg-white rounded-lg shadow overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                    {service?.title || 'Service Request'}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    with {legend?.displayName || 'Legend'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Submitted {collab.createdAt?.toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {getStatusBadge(collab.status)}
                                                <p className="text-2xl font-bold text-blue-600 mt-2">${collab.price}</p>
                                            </div>
                                        </div>

                                        {collab.status === 'pending_payment' && (
                                            <div className="mt-4">
                                                {selectedCollab === collab.id ? (
                                                    <div className="border-t pt-4">
                                                        <PaymentCheckout
                                                            collaboration={collab}
                                                            legend={legend}
                                                            service={service}
                                                            onSuccess={() => {
                                                                loadCollaborations();
                                                                setSelectedCollab(null);
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setSelectedCollab(collab.id!)}
                                                        className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
                                                    >
                                                        Pay Now - ${collab.price}
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {collab.status === 'awaiting_contract' && (
                                            <div className="mt-4 space-y-3">
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                    <p className="text-blue-800 mb-3">
                                                        <strong>Payment Received!</strong> The funds are now held in escrow.
                                                    </p>
                                                    {collab.docusignEnvelopeId ? (
                                                        <p className="text-blue-700 text-sm">
                                                            ✅ Contract sent for signature. Check your email to sign.
                                                        </p>
                                                    ) : (
                                                        <p className="text-blue-700 text-sm">
                                                            Next: Generate and sign the collaboration contract.
                                                        </p>
                                                    )}
                                                </div>
                                                {!collab.docusignEnvelopeId && (
                                                    <button
                                                        onClick={() => handleGenerateContract(collab.id!)}
                                                        disabled={generatingContract === collab.id}
                                                        className="w-full px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                    >
                                                        {generatingContract === collab.id ? 'Generating Contract...' : 'Generate & Sign Contract'}
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {collab.status === 'in_progress' && (
                                            <div className="mt-4 space-y-3">
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                    <p className="text-green-800">
                                                        <strong>✓ Contract Signed!</strong> Your collaboration is now in progress.
                                                    </p>
                                                    {collab.contractUrl && (
                                                        <a
                                                            href={collab.contractUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-green-700 underline text-sm mt-2 inline-block"
                                                        >
                                                            View Signed Contract
                                                        </a>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/collaboration/${collab.id}`)}
                                                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                                                >
                                                    Open Collaboration Hub
                                                </button>
                                            </div>
                                        )}

                                        {collab.status === 'completed' && (
                                            <div className="mt-4 space-y-3">
                                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                    <p className="text-gray-800">
                                                        <strong>✓ Project Complete!</strong> Payment has been released from escrow.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/collaboration/${collab.id}`)}
                                                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                                                >
                                                    View Collaboration Hub
                                                </button>
                                            </div>
                                        )}                                        {collab.status === 'declined' && (
                                            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                                                <p className="text-red-800">
                                                    This collaboration request was declined by the artist.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}