'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { Service } from '@/app/types/service';
import { db } from '@/lib/firebase';
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LegendDashboard() {
    const { user, userData, logout, loading } = useAuth();
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'services'>('profile');

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
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, userData]);

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
