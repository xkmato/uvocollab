'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { Service } from '@/app/types/service';
import { User } from '@/app/types/user';
import { storage } from '@/lib/firebase';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useState } from 'react';

interface PitchFormProps {
    legend: User;
    service: Service;
    buyerId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PitchForm({ legend, service, buyerId, onClose, onSuccess }: PitchFormProps) {
    const { user } = useAuth();
    const [pitchMessage, setPitchMessage] = useState('');
    const [pitchBestWorkUrl, setPitchBestWorkUrl] = useState('');
    const [demoFile, setDemoFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isFormValid = pitchMessage.trim() !== '' && pitchBestWorkUrl.trim() !== '' && demoFile !== null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate file type (audio files only)
            const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav', 'audio/aac', 'audio/m4a', 'audio/mp4'];
            if (!validTypes.includes(file.type)) {
                setError('Please upload a valid audio file (MP3, WAV, AAC, or M4A)');
                return;
            }

            // Validate file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                setError('File size must be less than 50MB');
                return;
            }

            setDemoFile(file);
            setError('');
        }
    };

    const uploadDemoFile = async (): Promise<string> => {
        if (!demoFile) throw new Error('No file selected');

        const timestamp = Date.now();
        const fileName = `${buyerId}_${timestamp}_${demoFile.name}`;
        const storageRef = ref(storage, `pitch-demos/${buyerId}/${fileName}`);

        return new Promise((resolve, reject) => {
            const uploadTask = uploadBytesResumable(storageRef, demoFile);

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
            // Upload demo file first
            const pitchDemoUrl = await uploadDemoFile();
            setUploading(false);

            // Get the authentication token
            const token = await user.getIdToken();

            // Submit pitch to backend
            const response = await fetch('/api/submit-pitch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    buyerId,
                    legendId: legend.uid,
                    serviceId: service.id,
                    price: service.price,
                    pitchDemoUrl,
                    pitchMessage: pitchMessage.trim(),
                    pitchBestWorkUrl: pitchBestWorkUrl.trim(),
                }),
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
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Submit Your Pitch</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Collaboration with {legend.displayName} - {service.title}
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{service.title}</h3>
                        <p className="text-sm text-gray-700 mb-2">{service.description}</p>
                        <p className="text-sm text-gray-600">Deliverable: {service.deliverable}</p>
                        <p className="text-2xl font-bold text-blue-600 mt-2">${service.price}</p>
                    </div>

                    {/* Important Notice */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex gap-3">
                            <svg
                                className="w-6 h-6 text-yellow-600 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-1">
                                    Quality is Key
                                </h4>
                                <p className="text-sm text-gray-700">
                                    {legend.displayName} reviews all pitches carefully to protect their brand.
                                    Make sure your demo and project concept are professional and align with
                                    their style.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Demo Track Upload - REQUIRED */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Upload Your Demo Track <span className="text-red-500">*</span>
                        </label>
                        <p className="text-sm text-gray-600 mb-3">
                            Upload the track you want {legend.displayName} to work on. This helps them
                            understand your vision.
                        </p>
                        <div className="flex items-center gap-4">
                            <label className="flex-1">
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={handleFileChange}
                                    disabled={submitting}
                                    className="hidden"
                                />
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 cursor-pointer transition-colors">
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
                                    {demoFile ? (
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{demoFile.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {(demoFile.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                MP3, WAV, AAC, or M4A (max 50MB)
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
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Link to Best Previous Work - REQUIRED */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Link to Your Best Previous Work <span className="text-red-500">*</span>
                        </label>
                        <p className="text-sm text-gray-600 mb-3">
                            Share a link to your best song, music video, or project (Spotify, SoundCloud,
                            YouTube, etc.)
                        </p>
                        <input
                            type="url"
                            value={pitchBestWorkUrl}
                            onChange={(e) => setPitchBestWorkUrl(e.target.value)}
                            placeholder="https://open.spotify.com/track/..."
                            disabled={submitting}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                            required
                        />
                    </div>

                    {/* Pitch Message - REQUIRED */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Your Creative Concept <span className="text-red-500">*</span>
                        </label>
                        <p className="text-sm text-gray-600 mb-3">
                            Describe your vision for this project. What&apos;s the vibe? Who&apos;s your
                            target audience? What makes this project special?
                        </p>
                        <textarea
                            value={pitchMessage}
                            onChange={(e) => setPitchMessage(e.target.value)}
                            placeholder="Example: I'm working on a melodic trap project targeting fans of Lil Baby and Gunna. This track is about overcoming struggle and celebrating success. I need a hard-hitting 16-bar verse that matches the energy..."
                            disabled={submitting}
                            rows={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 resize-none"
                            required
                            minLength={50}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Minimum 50 characters ({pitchMessage.length}/50)
                        </p>
                    </div>

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
                            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
                                'Submit Pitch'
                            )}
                        </button>
                    </div>

                    {/* Helper Text */}
                    <p className="text-xs text-gray-500 text-center">
                        By submitting, you agree that {legend.displayName} will review your pitch. If
                        accepted, you&apos;ll be prompted to complete payment, which will be held securely
                        until the work is delivered.
                    </p>
                </form>
            </div>
        </div>
    );
}
