'use client';

import { Collaboration, Deliverable } from '@/app/types/collaboration';
import { db, storage } from '@/lib/firebase';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useState } from 'react';

interface FileSharingProps {
    collaboration: Collaboration;
    isLegend: boolean;
    onUpdate: () => void;
}

export default function FileSharing({ collaboration, isLegend, onUpdate }: FileSharingProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const isPodcast = collaboration.type === 'podcast';
    const providerLabel = isPodcast ? 'Podcaster' : 'Legend';
    const providerAction = isPodcast ? 'upload episode assets' : 'upload deliverables';

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !collaboration.id) return;

        // Validate file
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            setError('File size must be less than 100MB');
            return;
        }

        setUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            // Upload to Firebase Storage
            const storagePath = `collaborations/${collaboration.id}/deliverables/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, storagePath);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(Math.round(progress));
                },
                (error) => {
                    console.error('Upload error:', error);
                    setError('Failed to upload file. Please try again.');
                    setUploading(false);
                },
                async () => {
                    try {
                        // Get download URL
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                        // Create deliverable object
                        const deliverable: Deliverable = {
                            fileName: file.name,
                            fileUrl: downloadURL,
                            uploadedAt: new Date(),
                            uploadedBy: isLegend ? collaboration.legendId! : collaboration.buyerId,
                            fileSize: file.size,
                        };

                        // Update Firestore document
                        const collabRef = doc(db, 'collaborations', collaboration.id!);
                        await updateDoc(collabRef, {
                            deliverables: arrayUnion(deliverable),
                            updatedAt: new Date(),
                        });

                        setUploading(false);
                        setUploadProgress(0);
                        onUpdate();

                        // Reset file input
                        event.target.value = '';
                    } catch (err) {
                        console.error('Error saving deliverable:', err);
                        setError('Failed to save file information. Please try again.');
                        setUploading(false);
                    }
                }
            );
        } catch (err) {
            console.error('Error starting upload:', err);
            setError('Failed to start upload. Please try again.');
            setUploading(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (date: Date | undefined): string => {
        if (!date) return '';
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const deliverables = collaboration.deliverables || [];

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Project Deliverables</h2>
                {isLegend && collaboration.status === 'in_progress' && (
                    <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {uploading ? 'Uploading...' : 'Upload File'}
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                            accept="audio/*,video/*,.zip,.rar,.wav,.mp3,.flac,.aiff,.m4a"
                        />
                    </label>
                )}
            </div>

            {/* Upload Progress */}
            {uploading && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">Uploading...</span>
                        <span className="text-sm font-medium text-blue-900">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Info Message */}
            {!isLegend && deliverables.length === 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400 mb-3"
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
                    <p className="text-sm text-gray-600">
                        No files have been uploaded yet. The {providerLabel} will {providerAction} here when ready.
                    </p>
                </div>
            )}

            {isLegend && deliverables.length === 0 && collaboration.status === 'in_progress' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Upload Your Files:</strong> Upload the final files for this project.
                        Supported formats: audio files, videos, and compressed archives (.zip, .rar).
                    </p>
                </div>
            )}

            {/* Files List */}
            {deliverables.length > 0 && (
                <div className="space-y-3">
                    {deliverables.map((deliverable, index) => {
                        const uploadDate =
                            deliverable.uploadedAt instanceof Date
                                ? deliverable.uploadedAt
                                : new Date(deliverable.uploadedAt);

                        return (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    {/* File Icon */}
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="w-10 h-10 text-blue-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>

                                    {/* File Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {deliverable.fileName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatFileSize(deliverable.fileSize)} • Uploaded{' '}
                                            {formatDate(uploadDate)}
                                        </p>
                                    </div>
                                </div>

                                {/* Download Button */}
                                <a
                                    href={deliverable.fileUrl}
                                    download={deliverable.fileName}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-4 flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                                >
                                    Download
                                </a>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Upload Instructions for Legend */}
            {isLegend && collaboration.status === 'in_progress' && deliverables.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">
                        You can upload additional files if needed. All uploaded files will be accessible to the
                        buyer.
                    </p>
                </div>
            )}

            {/* Completion Note */}
            {collaboration.status === 'completed' && (
                <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">
                        This project is complete. All files remain accessible for download.
                    </p>
                </div>
            )}
        </div>
    );
}
