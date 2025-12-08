'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { Podcast, PodcastService } from '@/app/types/podcast';
import { storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import React, { useState } from 'react';

interface PodcastPitchFormProps {
    podcast: Podcast;
    service: PodcastService;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PodcastPitchForm({ podcast, service, onClose, onSuccess }: PodcastPitchFormProps) {
    const { user } = useAuth();

    // Guest spot fields
    const [topicProposal, setTopicProposal] = useState('');
    const [guestBio, setGuestBio] = useState('');
    const [previousMediaUrl, setPreviousMediaUrl] = useState('');
    const [proposedDates, setProposedDates] = useState('');
    const [pressKitFile, setPressKitFile] = useState<File | null>(null);

    // Cross-promotion fields
    const [userPodcast, setUserPodcast] = useState<Podcast | null>(null);
    const [crossPromoMessage, setCrossPromoMessage] = useState('');
    const [loadingUserPodcast, setLoadingUserPodcast] = useState(false);

    // Ad read fields
    const [adProductName, setAdProductName] = useState('');
    const [adProductDescription, setAdProductDescription] = useState('');
    const [adTargetAudience, setAdTargetAudience] = useState('');
    const [adProductUrl, setAdProductUrl] = useState('');

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const serviceType = service.type || 'guest_spot';

    const isFormValid = (() => {
        if (serviceType === 'guest_spot' || serviceType === 'other') {
            return topicProposal.trim() !== '' &&
                guestBio.trim() !== '' &&
                previousMediaUrl.trim() !== '' &&
                proposedDates.trim() !== '';
        } else if (serviceType === 'cross_promotion') {
            return userPodcast !== null && crossPromoMessage.trim() !== '';
        } else if (serviceType === 'ad_read') {
            return adProductName.trim() !== '' && adProductDescription.trim() !== '';
        }
        return false;
    })();

    // Fetch user's podcast for cross-promotion
    React.useEffect(() => {
        if (serviceType === 'cross_promotion' && user) {
            fetchUserPodcast();
        }
    }, [serviceType, user]);

    const fetchUserPodcast = async () => {
        if (!user) return;

        setLoadingUserPodcast(true);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/podcasts/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.podcast) {
                    setUserPodcast(data.podcast);
                }
            }
        } catch (err) {
            console.error('Error fetching user podcast:', err);
        } finally {
            setLoadingUserPodcast(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                setError('File size must be less than 50MB');
                return;
            }

            setPressKitFile(file);
            setError('');
        }
    };

    const uploadPressKitFile = async (): Promise<string | undefined> => {
        if (!pressKitFile || !user) return undefined;

        const timestamp = Date.now();
        const fileName = `${user.uid}_${timestamp}_${pressKitFile.name}`;
        const storageRef = ref(storage, `podcast-pitches/${podcast.id}/${fileName}`);

        return new Promise((resolve, reject) => {
            const uploadTask = uploadBytesResumable(storageRef, pressKitFile);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(Math.round(progress));
                },
                (error) => {
                    console.error('Upload error:', error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadURL);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isFormValid) {
            setError('Please fill in all required fields');
            return;
        }

        if (!user) {
            setError('You must be logged in to submit a pitch');
            return;
        }

        setSubmitting(true);
        setUploading(true);
        setError('');

        try {
            let pressKitUrl = '';
            if (pressKitFile) {
                const url = await uploadPressKitFile();
                if (url) pressKitUrl = url;
            }
            setUploading(false);

            // Get the authentication token
            const token = await user.getIdToken();

            // Build request body based on service type
            const requestBody: Record<string, unknown> = {
                podcastId: podcast.id,
                serviceId: service.id,
                price: service.price,
            };

            if (serviceType === 'guest_spot' || serviceType === 'other') {
                requestBody.topicProposal = topicProposal.trim();
                requestBody.guestBio = guestBio.trim();
                requestBody.previousMediaUrl = previousMediaUrl.trim();
                requestBody.proposedDates = proposedDates.trim();
                requestBody.pressKitUrl = pressKitUrl;
            } else if (serviceType === 'cross_promotion') {
                requestBody.crossPromoPodcastId = userPodcast?.id;
                requestBody.crossPromoMessage = crossPromoMessage.trim();
            } else if (serviceType === 'ad_read') {
                requestBody.adProductName = adProductName.trim();
                requestBody.adProductDescription = adProductDescription.trim();
                requestBody.adTargetAudience = adTargetAudience.trim();
                requestBody.adProductUrl = adProductUrl.trim();
            }

            // Submit pitch to backend
            const response = await fetch('/api/submit-podcast-pitch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to submit pitch');
            }

            // Success!
            onSuccess();
        } catch (err) {
            console.error('Error submitting pitch:', err);
            setError(err instanceof Error ? err.message : 'Failed to submit pitch. Please try again.');
            setSubmitting(false);
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Request Collaboration</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {podcast.title} - {service.title}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Service Info Display */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{service.title}</h3>
                        <p className="text-sm text-gray-700 mb-2">{service.description}</p>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-xs font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded uppercase">
                                {service.type.replace('_', ' ')}
                            </span>
                            <p className="text-xl font-bold text-purple-600">
                                {service.price > 0 ? `$${service.price}` : 'Free'}
                            </p>
                        </div>
                    </div>

                    {/* Guest Spot / Other Service Fields */}
                    {(serviceType === 'guest_spot' || serviceType === 'other') && (
                        <>
                            {/* Topic Proposal - REQUIRED */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Topic Proposal <span className="text-red-500">*</span>
                                </label>
                                <p className="text-sm text-gray-600 mb-3">
                                    What would you like to discuss on the podcast? Be specific about the value you bring to their audience.
                                </p>
                                <textarea
                                    value={topicProposal}
                                    onChange={(e) => setTopicProposal(e.target.value)}
                                    placeholder="I'd like to discuss..."
                                    disabled={submitting}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 resize-none"
                                    required
                                />
                            </div>

                            {/* Guest Bio - REQUIRED */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Guest Bio <span className="text-red-500">*</span>
                                </label>
                                <p className="text-sm text-gray-600 mb-3">
                                    A short bio introducing yourself to the host and their audience.
                                </p>
                                <textarea
                                    value={guestBio}
                                    onChange={(e) => setGuestBio(e.target.value)}
                                    placeholder="I am a..."
                                    disabled={submitting}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 resize-none"
                                    required
                                />
                            </div>

                            {/* Previous Media/Links - REQUIRED */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Previous Media / Links <span className="text-red-500">*</span>
                                </label>
                                <p className="text-sm text-gray-600 mb-3">
                                    Links to your website, social media, or previous interviews.
                                </p>
                                <input
                                    type="url"
                                    value={previousMediaUrl}
                                    onChange={(e) => setPreviousMediaUrl(e.target.value)}
                                    placeholder="https://..."
                                    disabled={submitting}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                                    required
                                />
                            </div>

                            {/* Proposed Dates - REQUIRED */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Proposed Date(s) <span className="text-red-500">*</span>
                                </label>
                                <p className="text-sm text-gray-600 mb-3">
                                    When are you available to record? (e.g., &quot;Weekdays after 5pm EST&quot;, &quot;Next Tuesday or Wednesday&quot;)
                                </p>
                                <input
                                    type="text"
                                    value={proposedDates}
                                    onChange={(e) => setProposedDates(e.target.value)}
                                    placeholder="e.g. Flexible on weekends"
                                    disabled={submitting}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                                    required
                                />
                            </div>

                            {/* Press Kit / Audio Sample - OPTIONAL */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Press Kit or Audio Sample (Optional)
                                </label>
                                <p className="text-sm text-gray-600 mb-3">
                                    Upload a press kit (PDF) or an audio sample if relevant.
                                </p>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1">
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            disabled={submitting}
                                            className="hidden"
                                        />
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-500 cursor-pointer transition-colors">
                                            <svg
                                                className="w-12 h-12 mx-auto text-gray-400 mb-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                />
                                            </svg>
                                            {pressKitFile ? (
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{pressKitFile.name}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {(pressKitFile.size / (1024 * 1024)).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">
                                                        Click to upload or drag and drop
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Max 50MB
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                </div>

                                {uploading && (
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                            <span>Uploading...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Cross-Promotion Fields */}
                    {serviceType === 'cross_promotion' && (
                        <>
                            {/* User's Podcast Info */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Your Podcast <span className="text-red-500">*</span>
                                </label>
                                {loadingUserPodcast ? (
                                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-center">
                                        <p className="text-sm text-gray-600">Loading your podcast...</p>
                                    </div>
                                ) : userPodcast ? (
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            {userPodcast.coverImageUrl && (
                                                <img
                                                    src={userPodcast.coverImageUrl}
                                                    alt={userPodcast.title}
                                                    className="w-16 h-16 rounded object-cover"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">{userPodcast.title}</h4>
                                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                    {userPodcast.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <p className="text-sm text-yellow-800">
                                            You need to register a podcast first to request cross-promotion.{' '}
                                            <a href="/podcasts/register" className="underline font-medium">
                                                Register here
                                            </a>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Cross-Promotion Message */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Cross-Promotion Message <span className="text-red-500">*</span>
                                </label>
                                <p className="text-sm text-gray-600 mb-3">
                                    Describe your cross-promotion idea and how both podcasts can benefit.
                                </p>
                                <textarea
                                    value={crossPromoMessage}
                                    onChange={(e) => setCrossPromoMessage(e.target.value)}
                                    placeholder="I think our audiences would benefit from..."
                                    disabled={submitting || !userPodcast}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 resize-none"
                                    required
                                />
                            </div>
                        </>
                    )}

                    {/* Ad Read Fields */}
                    {serviceType === 'ad_read' && (
                        <>
                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Product/Service Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={adProductName}
                                    onChange={(e) => setAdProductName(e.target.value)}
                                    placeholder="e.g., MyApp, Acme Software"
                                    disabled={submitting}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                                    required
                                />
                            </div>

                            {/* Product Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Product/Service Description <span className="text-red-500">*</span>
                                </label>
                                <p className="text-sm text-gray-600 mb-3">
                                    Describe what you want to advertise and key selling points.
                                </p>
                                <textarea
                                    value={adProductDescription}
                                    onChange={(e) => setAdProductDescription(e.target.value)}
                                    placeholder="Our product helps people..."
                                    disabled={submitting}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 resize-none"
                                    required
                                />
                            </div>

                            {/* Target Audience */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Target Audience (Optional)
                                </label>
                                <p className="text-sm text-gray-600 mb-3">
                                    Who is this product for?
                                </p>
                                <input
                                    type="text"
                                    value={adTargetAudience}
                                    onChange={(e) => setAdTargetAudience(e.target.value)}
                                    placeholder="e.g., Tech professionals, Fitness enthusiasts"
                                    disabled={submitting}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                                />
                            </div>

                            {/* Product URL */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Product Website (Optional)
                                </label>
                                <input
                                    type="url"
                                    value={adProductUrl}
                                    onChange={(e) => setAdProductUrl(e.target.value)}
                                    placeholder="https://..."
                                    disabled={submitting}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                                />
                            </div>
                        </>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex gap-3">
                                <svg
                                    className="w-5 h-5 text-red-600 flex-shrink-0"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isFormValid || submitting}
                            className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    {uploading ? 'Uploading...' : 'Submitting...'}
                                </>
                            ) : (
                                'Submit Request'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
