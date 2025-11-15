'use client';

import BankAccountForm from '@/app/components/BankAccountForm';
import { useAuth } from '@/app/contexts/AuthContext';
import { Collaboration } from '@/app/types/collaboration';
import { Service } from '@/app/types/service';
import { User } from '@/app/types/user';
import { db } from '@/lib/firebase';
import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LegendDashboard() {
    const { user, userData, logout, loading } = useAuth();
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'services' | 'requests' | 'payment'>('profile');
    const [bankAccountConnected, setBankAccountConnected] = useState(false);
    const [checkingBankStatus, setCheckingBankStatus] = useState(true);

    // Collaboration requests state
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [loadingCollaborations, setLoadingCollaborations] = useState(true);
    const [buyersInfo, setBuyersInfo] = useState<Record<string, User>>({});

    // Profile editing state
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [managementInfo, setManagementInfo] = useState('');
    const [genre, setGenre] = useState('');
    const [priceRange, setPriceRange] = useState<'budget' | 'mid' | 'premium' | ''>('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState('');

    // Service editing state
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [showServiceForm, setShowServiceForm] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
        if (!loading && userData && userData.role !== 'legend') {
            router.push('/dashboard');
        }
    }, [user, userData, loading, router]);

    useEffect(() => {
        if (userData) {
            setDisplayName(userData.displayName || '');
            setBio(userData.bio || '');
            setProfileImageUrl(userData.profileImageUrl || '');
            setManagementInfo(userData.managementInfo || '');
            setGenre(userData.genre || '');
            setPriceRange(userData.priceRange || '');
        }
    }, [userData]);

    useEffect(() => {
        if (user && userData?.role === 'legend') {
            loadServices();
            loadCollaborations();
            checkBankAccountStatus();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, userData]);

    const checkBankAccountStatus = async () => {
        if (!user) return;

        try {
            setCheckingBankStatus(true);
            const token = await user.getIdToken();
            const response = await fetch('/api/flutterwave/subaccount', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setBankAccountConnected(data.hasSubaccount && data.bankAccountVerified);
        } catch (error) {
            console.error('Error checking bank account status:', error);
        } finally {
            setCheckingBankStatus(false);
        }
    };

    const loadServices = async () => {
        if (!user) return;

        try {
            setLoadingServices(true);
            const servicesRef = collection(db, 'users', user.uid, 'services');
            const snapshot = await getDocs(servicesRef);
            const servicesData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
            })) as Service[];
            setServices(servicesData);
        } catch (error) {
            console.error('Error loading services:', error);
        } finally {
            setLoadingServices(false);
        }
    };

    const loadCollaborations = async () => {
        if (!user) return;

        try {
            setLoadingCollaborations(true);
            const collabsRef = collection(db, 'collaborations');
            // Load all collaborations for the legend, not just pending_review
            const q = query(
                collabsRef,
                where('legendId', '==', user.uid),
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

            // Load buyer information for each collaboration
            const buyerIds = [...new Set(collabsData.map(c => c.buyerId))];
            const buyersData: Record<string, User> = {};
            for (const buyerId of buyerIds) {
                const buyerDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', buyerId)));
                if (!buyerDoc.empty) {
                    const buyerData = buyerDoc.docs[0].data() as User;
                    buyersData[buyerId] = buyerData;
                }
            }
            setBuyersInfo(buyersData);
        } catch (error) {
            console.error('Error loading collaborations:', error);
        } finally {
            setLoadingCollaborations(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSavingProfile(true);
        setProfileMessage('');

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                displayName,
                bio,
                profileImageUrl,
                managementInfo,
                genre: genre || null,
                priceRange: priceRange || null,
            });
            setProfileMessage('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            setProfileMessage('Error updating profile. Please try again.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleDeleteService = async (serviceId: string) => {
        if (!user || !confirm('Are you sure you want to delete this service?')) return;

        try {
            const serviceRef = doc(db, 'users', user.uid, 'services', serviceId);
            await deleteDoc(serviceRef);
            await loadServices();
        } catch (error) {
            console.error('Error deleting service:', error);
            alert('Error deleting service. Please try again.');
        }
    };

    const handleEditService = (service: Service) => {
        setEditingService(service);
        setShowServiceForm(true);
    };

    const handleAddNewService = () => {
        setEditingService(null);
        setShowServiceForm(true);
    };

    const handleServiceFormClose = () => {
        setShowServiceForm(false);
        setEditingService(null);
        loadServices();
    };

    const handleAcceptPitch = async (collaborationId: string) => {
        if (!confirm('Are you sure you want to accept this collaboration request? The artist will be notified to proceed with payment.')) {
            return;
        }

        try {
            const idToken = await user?.getIdToken();
            if (!idToken) {
                alert('Authentication error. Please log in again.');
                return;
            }

            const response = await fetch('/api/respond-to-pitch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ collaborationId, action: 'accept' })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to accept pitch');
            }

            alert('Collaboration request accepted! The artist has been notified to proceed with payment.');
            await loadCollaborations();
        } catch (error) {
            console.error('Error accepting pitch:', error);
            alert('Error accepting request. Please try again.');
        }
    };

    const handleDeclinePitch = async (collaborationId: string) => {
        if (!confirm('Are you sure you want to decline this collaboration request? The artist will be notified.')) {
            return;
        }

        try {
            const idToken = await user?.getIdToken();
            if (!idToken) {
                alert('Authentication error. Please log in again.');
                return;
            }

            const response = await fetch('/api/respond-to-pitch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ collaborationId, action: 'decline' })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to decline pitch');
            }

            alert('Collaboration request declined. The artist has been notified.');
            await loadCollaborations();
        } catch (error) {
            console.error('Error declining pitch:', error);
            alert('Error declining request. Please try again.');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!user || !userData || userData.role !== 'legend') return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Legend Dashboard</h1>
                            <p className="text-gray-600">Welcome back, {userData.displayName}!</p>
                        </div>
                        <button
                            onClick={logout}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Bank Account Warning */}
                {!checkingBankStatus && !bankAccountConnected && (
                    <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    <strong>Action Required:</strong> You need to connect your bank account to receive payments.
                                    Your services will not be visible in the marketplace until your bank account is connected.
                                    {' '}
                                    <button
                                        onClick={() => setActiveTab('payment')}
                                        className="font-medium underline hover:text-yellow-600"
                                    >
                                        Connect now
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-8">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`${activeTab === 'profile'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Profile & Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('services')}
                            className={`${activeTab === 'services'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            My Services
                        </button>
                        <button
                            onClick={() => setActiveTab('payment')}
                            className={`${activeTab === 'payment'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm relative`}
                        >
                            Payment Settings
                            {!bankAccountConnected && !checkingBankStatus && (
                                <span className="ml-1 inline-flex items-center justify-center w-2 h-2 bg-red-600 rounded-full"></span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`${activeTab === 'requests'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm relative`}
                        >
                            Collaboration Requests
                            {collaborations.length > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                    {collaborations.length}
                                </span>
                            )}
                        </button>
                    </nav>
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-2xl font-bold mb-6">Public Profile</h2>
                        <form onSubmit={handleSaveProfile} className="space-y-6">
                            <div>
                                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                                    Display Name *
                                </label>
                                <input
                                    type="text"
                                    id="displayName"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                />
                            </div>

                            <div>
                                <label htmlFor="profileImageUrl" className="block text-sm font-medium text-gray-700">
                                    Profile Image URL
                                </label>
                                <input
                                    type="url"
                                    id="profileImageUrl"
                                    value={profileImageUrl}
                                    onChange={(e) => setProfileImageUrl(e.target.value)}
                                    placeholder="https://example.com/your-image.jpg"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                />
                                <p className="mt-1 text-sm text-gray-500">Enter a URL to your profile image</p>
                            </div>

                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                                    Bio
                                </label>
                                <textarea
                                    id="bio"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={6}
                                    placeholder="Tell your story. What makes you unique? What are your notable achievements?"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    This will be visible on your public profile page
                                </p>
                            </div>

                            <div>
                                <label htmlFor="managementInfo" className="block text-sm font-medium text-gray-700">
                                    Management/Contact Info
                                </label>
                                <textarea
                                    id="managementInfo"
                                    value={managementInfo}
                                    onChange={(e) => setManagementInfo(e.target.value)}
                                    rows={3}
                                    placeholder="Management contact, booking info, or other professional details"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="genre" className="block text-sm font-medium text-gray-700">
                                        Primary Genre
                                    </label>
                                    <select
                                        id="genre"
                                        value={genre}
                                        onChange={(e) => setGenre(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                    >
                                        <option value="">Select a genre</option>
                                        <option value="Hip Hop">Hip Hop</option>
                                        <option value="R&B">R&B</option>
                                        <option value="Pop">Pop</option>
                                        <option value="Rock">Rock</option>
                                        <option value="Electronic">Electronic</option>
                                        <option value="Jazz">Jazz</option>
                                        <option value="Country">Country</option>
                                        <option value="Latin">Latin</option>
                                        <option value="Gospel">Gospel</option>
                                        <option value="Alternative">Alternative</option>
                                    </select>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Helps buyers find you in the marketplace
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="priceRange" className="block text-sm font-medium text-gray-700">
                                        Price Range
                                    </label>
                                    <select
                                        id="priceRange"
                                        value={priceRange}
                                        onChange={(e) => setPriceRange(e.target.value as 'budget' | 'mid' | 'premium')}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                    >
                                        <option value="">Select a price range</option>
                                        <option value="budget">Budget ($0 - $500)</option>
                                        <option value="mid">Mid-Range ($500 - $2000)</option>
                                        <option value="premium">Premium ($2000+)</option>
                                    </select>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Based on your typical service prices
                                    </p>
                                </div>
                            </div>

                            {profileMessage && (
                                <div
                                    className={`p-3 rounded-md ${profileMessage.includes('success')
                                        ? 'bg-green-50 text-green-800'
                                        : 'bg-red-50 text-red-800'
                                        }`}
                                >
                                    {profileMessage}
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {savingProfile ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Payment Settings Tab */}
                {activeTab === 'payment' && (
                    <div>
                        <BankAccountForm onSuccess={() => {
                            checkBankAccountStatus();
                        }} />
                    </div>
                )}

                {/* Services Tab */}
                {activeTab === 'services' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">My Services</h2>
                            <button
                                onClick={handleAddNewService}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Add New Service
                            </button>
                        </div>

                        {loadingServices ? (
                            <div className="text-center py-12">Loading services...</div>
                        ) : services.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-8 text-center">
                                <p className="text-gray-600 mb-4">You haven&apos;t created any services yet.</p>
                                <button
                                    onClick={handleAddNewService}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Create Your First Service
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {services.map((service) => (
                                    <div key={service.id} className="bg-white rounded-lg shadow p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-lg font-bold text-gray-900">{service.title}</h3>
                                            <span
                                                className={`px-2 py-1 text-xs rounded ${service.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                {service.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>
                                        <div className="mb-4">
                                            <p className="text-2xl font-bold text-blue-600">${service.price}</p>
                                            <p className="text-sm text-gray-500">{service.deliverable}</p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEditService(service)}
                                                className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteService(service.id!)}
                                                className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Service Form Modal */}
                        {showServiceForm && (
                            <ServiceFormModal
                                service={editingService}
                                userId={user.uid}
                                onClose={handleServiceFormClose}
                            />
                        )}
                    </div>
                )}

                {/* Requests Tab */}
                {activeTab === 'requests' && (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Collaboration Requests</h2>

                        {loadingCollaborations ? (
                            <div className="text-center py-12">Loading requests...</div>
                        ) : collaborations.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-8 text-center">
                                <div className="text-gray-400 mb-4">
                                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                                <p className="text-gray-600">
                                    When artists submit collaboration requests, they&apos;ll appear here for you to review.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {collaborations.map((collab) => {
                                    const buyer = buyersInfo[collab.buyerId];
                                    const service = services.find(s => s.id === collab.serviceId);

                                    const getStatusBadge = (status: string) => {
                                        const badges: Record<string, { color: string; text: string }> = {
                                            pending_review: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Review' },
                                            pending_payment: { color: 'bg-blue-100 text-blue-800', text: 'Awaiting Payment' },
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

                                    return (
                                        <div key={collab.id} className="bg-white rounded-lg shadow overflow-hidden">
                                            <div className="p-6">
                                                {/* Header */}
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                            {service?.title || 'Service Request'}
                                                        </h3>
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
                                                        <p className="text-sm text-gray-500">{service?.deliverable}</p>
                                                    </div>
                                                </div>

                                                {/* Buyer Info */}
                                                {buyer && (
                                                    <div className="mb-4 pb-4 border-b">
                                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Artist Information</h4>
                                                        <div className="flex items-center space-x-3">
                                                            {buyer.profileImageUrl ? (
                                                                <img
                                                                    src={buyer.profileImageUrl}
                                                                    alt={buyer.displayName}
                                                                    className="w-12 h-12 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                                                    <span className="text-gray-600 font-medium">
                                                                        {buyer.displayName.charAt(0).toUpperCase()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-medium text-gray-900">{buyer.displayName}</p>
                                                                <p className="text-sm text-gray-500">{buyer.email}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Pitch Details */}
                                                <div className="space-y-4">
                                                    {/* Best Work */}
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Best Previous Work</h4>
                                                        <a
                                                            href={collab.pitchBestWorkUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 underline break-all"
                                                        >
                                                            {collab.pitchBestWorkUrl}
                                                        </a>
                                                    </div>

                                                    {/* Demo Track */}
                                                    {collab.pitchDemoUrl && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Demo Track</h4>
                                                            <audio
                                                                controls
                                                                className="w-full"
                                                                preload="metadata"
                                                            >
                                                                <source src={collab.pitchDemoUrl} type="audio/mpeg" />
                                                                <source src={collab.pitchDemoUrl} type="audio/wav" />
                                                                Your browser does not support the audio element.
                                                            </audio>
                                                            <a
                                                                href={collab.pitchDemoUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
                                                            >
                                                                Download Demo
                                                            </a>
                                                        </div>
                                                    )}

                                                    {/* Message */}
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Creative Concept</h4>
                                                        <div className="bg-gray-50 rounded-lg p-4">
                                                            <p className="text-gray-800 whitespace-pre-wrap">{collab.pitchMessage}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status-specific Actions/Info */}
                                                {collab.status === 'pending_review' && (
                                                    <div className="flex space-x-3 mt-6">
                                                        <button
                                                            onClick={() => handleAcceptPitch(collab.id!)}
                                                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors"
                                                        >
                                                            Accept Request
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeclinePitch(collab.id!)}
                                                            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors"
                                                        >
                                                            Decline Request
                                                        </button>
                                                    </div>
                                                )}

                                                {collab.status === 'pending_payment' && (
                                                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                        <p className="text-blue-800">
                                                            ✓ Request accepted! Waiting for the artist to complete payment.
                                                        </p>
                                                    </div>
                                                )}

                                                {collab.status === 'awaiting_contract' && (
                                                    <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                                                        <p className="text-purple-800 mb-2">
                                                            <strong>✓ Payment Received!</strong> Funds are held in escrow.
                                                        </p>
                                                        {collab.docusignEnvelopeId ? (
                                                            <p className="text-purple-700 text-sm">
                                                                Contract sent for signature. Check your email to sign.
                                                            </p>
                                                        ) : (
                                                            <p className="text-purple-700 text-sm">
                                                                Contract will be sent to you shortly for signature.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {collab.status === 'in_progress' && (
                                                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                                                        <p className="text-green-800 mb-2">
                                                            <strong>✓ Contract Signed!</strong> You can now begin working on the project.
                                                        </p>
                                                        {collab.contractUrl && (
                                                            <a
                                                                href={collab.contractUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-green-700 underline text-sm"
                                                            >
                                                                View Signed Contract
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                {collab.status === 'completed' && (
                                                    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                        <p className="text-gray-800">
                                                            ✓ Project completed. Payment released from escrow.
                                                        </p>
                                                    </div>
                                                )}

                                                {collab.status === 'declined' && (
                                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                                                        <p className="text-red-800">
                                                            This request was declined.
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
                )}
            </div>
        </div>
    );
}

interface ServiceFormModalProps {
    service: Service | null;
    userId: string;
    onClose: () => void;
}

function ServiceFormModal({ service, userId, onClose }: ServiceFormModalProps) {
    const [title, setTitle] = useState(service?.title || '');
    const [description, setDescription] = useState(service?.description || '');
    const [price, setPrice] = useState(service?.price?.toString() || '');
    const [deliverable, setDeliverable] = useState(service?.deliverable || '');
    const [serviceType, setServiceType] = useState(service?.serviceType || '');
    const [isActive, setIsActive] = useState(service?.isActive ?? true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            setError('Price must be greater than $0');
            return;
        }

        setSaving(true);

        try {
            const serviceData = {
                title,
                description,
                price: priceNum,
                deliverable,
                serviceType: serviceType || null,
                isActive,
                updatedAt: new Date(),
            };

            if (service?.id) {
                // Update existing service
                const serviceRef = doc(db, 'users', userId, 'services', service.id);
                await updateDoc(serviceRef, serviceData);
            } else {
                // Create new service
                const servicesRef = collection(db, 'users', userId, 'services');
                const newServiceRef = doc(servicesRef);
                await setDoc(newServiceRef, {
                    ...serviceData,
                    legendUid: userId,
                    createdAt: new Date(),
                });
            }

            onClose();
        } catch (error) {
            console.error('Error saving service:', error);
            setError('Error saving service. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">
                            {service ? 'Edit Service' : 'Create New Service'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                Service Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                placeholder="e.g., 16-bar verse, Full song production"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Description *
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows={4}
                                placeholder="Describe what's included in this service..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                            />
                        </div>

                        <div>
                            <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700">
                                Service Type
                            </label>
                            <select
                                id="serviceType"
                                value={serviceType}
                                onChange={(e) => setServiceType(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                            >
                                <option value="">Select a service type</option>
                                <option value="Verse">Verse</option>
                                <option value="Feature">Feature</option>
                                <option value="Hook/Chorus">Hook/Chorus</option>
                                <option value="Full Song">Full Song</option>
                                <option value="Production">Production</option>
                                <option value="Mixing">Mixing</option>
                                <option value="Mastering">Mastering</option>
                                <option value="Songwriting">Songwriting</option>
                                <option value="Recording">Recording</option>
                            </select>
                            <p className="mt-1 text-sm text-gray-500">
                                Helps buyers find your service in the marketplace
                            </p>
                        </div>

                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                                Price (USD) *
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                                <input
                                    type="number"
                                    id="price"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    required
                                    min="0.01"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                />
                            </div>
                            <p className="mt-1 text-sm text-gray-500">Price must be greater than $0</p>
                        </div>

                        <div>
                            <label htmlFor="deliverable" className="block text-sm font-medium text-gray-700">
                                Deliverable *
                            </label>
                            <input
                                type="text"
                                id="deliverable"
                                value={deliverable}
                                onChange={(e) => setDeliverable(e.target.value)}
                                required
                                placeholder="e.g., 1 WAV file, Stems + Mixed Master, 2 revisions included"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                                Active (visible to buyers)
                            </label>
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-red-50 text-red-800">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : service ? 'Update Service' : 'Create Service'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
