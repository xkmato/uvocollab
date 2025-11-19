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
import ProfileWizard from './components/ProfileWizard';
import ServiceWizard from './components/ServiceWizard';

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
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState('');

    // Service editing state
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [savingService, setSavingService] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
        if (!loading && userData && userData.role !== 'legend') {
            router.push('/dashboard');
        }
    }, [user, userData, loading, router]);

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

    const handleSaveProfile = async (data: Partial<User>) => {
        if (!user) return;

        setSavingProfile(true);
        setProfileMessage('');

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                displayName: data.displayName,
                bio: data.bio,
                profileImageUrl: data.profileImageUrl,
                managementInfo: data.managementInfo,
                genre: data.genre || null,
                priceRange: data.priceRange || null,
            });
            setProfileMessage('Profile updated successfully!');
            // Show success message for 3 seconds then clear
            setTimeout(() => setProfileMessage(''), 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            setProfileMessage('Error updating profile. Please try again.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSaveService = async (serviceData: Partial<Service>) => {
        if (!user) return;
        setSavingService(true);

        try {
            const dataToSave = {
                title: serviceData.title,
                description: serviceData.description,
                price: serviceData.price,
                deliverable: serviceData.deliverable,
                serviceType: serviceData.serviceType || null,
                isActive: serviceData.isActive,
                updatedAt: new Date(),
            };

            if (editingService?.id) {
                // Update existing service
                const serviceRef = doc(db, 'users', user.uid, 'services', editingService.id);
                await updateDoc(serviceRef, dataToSave);
            } else {
                // Create new service
                const servicesRef = collection(db, 'users', user.uid, 'services');
                const newServiceRef = doc(servicesRef);
                await setDoc(newServiceRef, {
                    ...dataToSave,
                    legendUid: user.uid,
                    createdAt: new Date(),
                });
            }

            setShowServiceForm(false);
            setEditingService(null);
            loadServices();
        } catch (error) {
            console.error('Error saving service:', error);
            alert('Error saving service. Please try again.');
        } finally {
            setSavingService(false);
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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
        </div>
    );

    if (!user || !userData || userData.role !== 'legend') return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                {userData.displayName?.charAt(0).toUpperCase() || 'L'}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Legend Dashboard</h1>
                                <p className="text-xs text-gray-500">Welcome back, {userData.displayName}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <a
                                href={`/legend/${user.uid}`}
                                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                View Public Profile
                            </a>
                            <a
                                href="/"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Home
                            </a>
                            <button
                                onClick={logout}
                                className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Bank Account Warning */}
                {!checkingBankStatus && !bankAccountConnected && (
                    <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-6 rounded-r-lg shadow-sm animate-fadeIn">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-yellow-800">Action Required</h3>
                                <p className="mt-1 text-yellow-700">
                                    You need to connect your bank account to receive payments.
                                    Your services will not be visible in the marketplace until your bank account is connected.
                                </p>
                                <div className="mt-4">
                                    <button
                                        onClick={() => setActiveTab('payment')}
                                        className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium hover:bg-yellow-200 transition-colors"
                                    >
                                        Connect Bank Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm mb-8 overflow-x-auto">
                    {[
                        { id: 'profile', label: 'Profile & Settings' },
                        { id: 'services', label: 'My Services' },
                        { id: 'payment', label: 'Payment Settings', alert: !bankAccountConnected && !checkingBankStatus },
                        { id: 'requests', label: 'Collaboration Requests', count: collaborations.length }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                                flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center justify-center
                                ${activeTab === tab.id
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }
                            `}
                        >
                            {tab.label}
                            {tab.alert && (
                                <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                            {tab.count ? (
                                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                    activeTab === tab.id ? 'bg-white text-gray-900' : 'bg-gray-200 text-gray-600'
                                }`}>
                                    {tab.count}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="animate-fadeIn">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="max-w-3xl mx-auto">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Public Profile</h2>
                                <p className="text-gray-500">Manage how you appear to artists and fans.</p>
                            </div>
                            
                            {profileMessage && (
                                <div className={`mb-6 p-4 rounded-lg flex items-center ${
                                    profileMessage.includes('success') 
                                        ? 'bg-green-50 text-green-800 border border-green-100' 
                                        : 'bg-red-50 text-red-800 border border-red-100'
                                }`}>
                                    {profileMessage.includes('success') ? (
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                                    ) : (
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                                    )}
                                    {profileMessage}
                                </div>
                            )}

                            <ProfileWizard 
                                initialData={userData} 
                                onSave={handleSaveProfile}
                                isSaving={savingProfile}
                            />
                        </div>
                    )}

                    {/* Payment Settings Tab */}
                    {activeTab === 'payment' && (
                        <div className="max-w-3xl mx-auto">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Payment Settings</h2>
                                <p className="text-gray-500">Manage your bank account and payout preferences.</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden p-8">
                                <BankAccountForm onSuccess={() => {
                                    checkBankAccountStatus();
                                }} />
                            </div>
                        </div>
                    )}

                    {/* Services Tab */}
                    {activeTab === 'services' && (
                        <div>
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">My Services</h2>
                                    <p className="text-gray-500">Manage the services you offer to artists.</p>
                                </div>
                                <button
                                    onClick={handleAddNewService}
                                    className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add New Service
                                </button>
                            </div>

                            {loadingServices ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="bg-white rounded-xl shadow-sm p-6 h-64 animate-pulse">
                                            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                                            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                            <div className="h-4 bg-gray-200 rounded w-5/6 mb-6"></div>
                                            <div className="h-8 bg-gray-200 rounded w-1/3 mt-auto"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : services.length === 0 ? (
                                <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No services yet</h3>
                                    <p className="text-gray-500 mb-8 max-w-md mx-auto">Create your first service to start accepting collaboration requests from artists.</p>
                                    <button
                                        onClick={handleAddNewService}
                                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg transition-all"
                                    >
                                        Create Your First Service
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {services.map((service) => (
                                        <div key={service.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
                                            <div className="p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{service.title}</h3>
                                                    <span
                                                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${service.isActive
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        {service.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 text-sm mb-6 line-clamp-3 h-15">{service.description}</p>
                                                
                                                <div className="flex items-end justify-between mb-6">
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Price</p>
                                                        <p className="text-2xl font-bold text-gray-900">${service.price}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Deliverable</p>
                                                        <p className="text-sm text-gray-900 font-medium truncate max-w-[120px]">{service.deliverable}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => handleEditService(service)}
                                                        className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteService(service.id!)}
                                                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Service Form Modal */}
                            {showServiceForm && (
                                <ServiceWizard
                                    initialData={editingService}
                                    onSave={handleSaveService}
                                    onCancel={handleServiceFormClose}
                                    isSaving={savingService}
                                />
                            )}
                        </div>
                    )}

                    {/* Requests Tab */}
                    {activeTab === 'requests' && (
                        <div>
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900">Collaboration Requests</h2>
                                <p className="text-gray-500">Review and manage pitches from artists.</p>
                            </div>

                            {loadingCollaborations ? (
                                <div className="space-y-4">
                                    {[1, 2].map(i => (
                                        <div key={i} className="bg-white rounded-xl shadow-sm p-6 h-40 animate-pulse"></div>
                                    ))}
                                </div>
                            ) : collaborations.length === 0 ? (
                                <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                                    <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">No pending requests</h3>
                                    <p className="text-gray-600 max-w-md mx-auto">
                                        When artists submit collaboration requests, they&apos;ll appear here for you to review.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {collaborations.map((collab) => {
                                        const buyer = buyersInfo[collab.buyerId];
                                        const service = services.find(s => s.id === collab.serviceId);

                                        const getStatusBadge = (status: string) => {
                                            const badges: Record<string, { color: string; text: string; icon: string }> = {
                                                pending_review: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Pending Review', icon: '⏳' },
                                                pending_payment: { color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Awaiting Payment', icon: '💳' },
                                                awaiting_contract: { color: 'bg-purple-100 text-purple-800 border-purple-200', text: 'Awaiting Contract', icon: '📝' },
                                                in_progress: { color: 'bg-green-100 text-green-800 border-green-200', text: 'In Progress', icon: '▶️' },
                                                completed: { color: 'bg-gray-100 text-gray-800 border-gray-200', text: 'Completed', icon: '✅' },
                                                declined: { color: 'bg-red-100 text-red-800 border-red-200', text: 'Declined', icon: '❌' },
                                            };
                                            const badge = badges[status] || { color: 'bg-gray-100 text-gray-800', text: status, icon: '•' };
                                            return (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${badge.color}`}>
                                                    <span>{badge.icon}</span> {badge.text}
                                                </span>
                                            );
                                        };

                                        return (
                                            <div key={collab.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden">
                                                <div className="p-6">
                                                    {/* Header */}
                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-gray-100">
                                                        <div className="mb-4 md:mb-0">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h3 className="text-xl font-bold text-gray-900">
                                                                    {service?.title || 'Service Request'}
                                                                </h3>
                                                                {getStatusBadge(collab.status)}
                                                            </div>
                                                            <p className="text-sm text-gray-500 flex items-center">
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                Submitted {collab.createdAt?.toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-3xl font-bold text-gray-900">${collab.price}</p>
                                                            <p className="text-sm text-gray-500">{service?.deliverable}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                        {/* Left Column: Artist Info & Message */}
                                                        <div className="lg:col-span-2 space-y-6">
                                                            {/* Buyer Info */}
                                                            {buyer && (
                                                                <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                                                                    {buyer.profileImageUrl ? (
                                                                        <img
                                                                            src={buyer.profileImageUrl}
                                                                            alt={buyer.displayName}
                                                                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                                                                            {buyer.displayName.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="font-bold text-gray-900">{buyer.displayName}</p>
                                                                        <p className="text-sm text-gray-500">{buyer.email}</p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Message */}
                                                            <div>
                                                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">Creative Concept</h4>
                                                                <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-700 leading-relaxed">
                                                                    {collab.pitchMessage}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Right Column: Assets & Actions */}
                                                        <div className="space-y-6">
                                                            {/* Assets */}
                                                            <div className="bg-gray-50 rounded-lg p-5">
                                                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Project Assets</h4>
                                                                
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <p className="text-xs text-gray-500 mb-1">Best Previous Work</p>
                                                                        <a
                                                                            href={collab.pitchBestWorkUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                                        >
                                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                                            View Link
                                                                        </a>
                                                                    </div>

                                                                    {collab.pitchDemoUrl && (
                                                                        <div>
                                                                            <p className="text-xs text-gray-500 mb-1">Demo Track</p>
                                                                            <audio
                                                                                controls
                                                                                className="w-full h-8 mb-2"
                                                                                preload="metadata"
                                                                            >
                                                                                <source src={collab.pitchDemoUrl} type="audio/mpeg" />
                                                                                <source src={collab.pitchDemoUrl} type="audio/wav" />
                                                                            </audio>
                                                                            <a
                                                                                href={collab.pitchDemoUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                                            >
                                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                                                Download File
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="pt-2">
                                                                {collab.status === 'pending_review' && (
                                                                    <div className="grid grid-cols-1 gap-3">
                                                                        <button
                                                                            onClick={() => handleAcceptPitch(collab.id!)}
                                                                            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                                                                        >
                                                                            Accept Request
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeclinePitch(collab.id!)}
                                                                            className="w-full px-4 py-3 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium transition-colors"
                                                                        >
                                                                            Decline Request
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {collab.status === 'in_progress' && (
                                                                    <button
                                                                        onClick={() => router.push(`/collaboration/${collab.id}`)}
                                                                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                                                                    >
                                                                        Open Collaboration Hub
                                                                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                                                    </button>
                                                                )}
                                                                
                                                                {collab.status === 'completed' && (
                                                                    <button
                                                                        onClick={() => router.push(`/collaboration/${collab.id}`)}
                                                                        className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-bold shadow-md transition-all"
                                                                    >
                                                                        View Project
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Status Messages */}
                                                    {collab.status === 'pending_payment' && (
                                                        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
                                                            <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            <p className="text-blue-800 text-sm">
                                                                Request accepted! Waiting for the artist to complete payment. You'll be notified when funds are secured.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {collab.status === 'awaiting_contract' && (
                                                        <div className="mt-6 bg-purple-50 border border-purple-100 rounded-lg p-4 flex items-start">
                                                            <svg className="w-5 h-5 text-purple-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            <div>
                                                                <p className="text-purple-800 font-medium text-sm mb-1">
                                                                    Payment Received! Funds are held in escrow.
                                                                </p>
                                                                <p className="text-purple-700 text-sm">
                                                                    {collab.docusignEnvelopeId 
                                                                        ? "Contract sent for signature. Check your email to sign." 
                                                                        : "Contract will be sent to you shortly for signature."}
                                                                </p>
                                                            </div>
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
        </div>
    );
}
