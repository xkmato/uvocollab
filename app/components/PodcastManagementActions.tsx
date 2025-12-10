'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useState } from 'react';

interface PodcastManagementActionsProps {
    podcastId: string;
    isActive?: boolean;
    onStatusChange: () => void;
}

export default function PodcastManagementActions({
    podcastId,
    isActive = true,
    onStatusChange,
}: PodcastManagementActionsProps) {
    const { user } = useAuth();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleDelete = async () => {
        if (!user) return;

        setProcessing(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/podcast/${podcastId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete podcast');
            }

            alert('Podcast deleted successfully');
            onStatusChange();
        } catch (err) {
            console.error('Error deleting podcast:', err);
            alert(err instanceof Error ? err.message : 'Failed to delete podcast');
        } finally {
            setProcessing(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleToggleActive = async () => {
        if (!user) return;

        setProcessing(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/podcast/${podcastId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !isActive }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update podcast status');
            }

            alert(`Podcast ${!isActive ? 'activated' : 'deactivated'} successfully`);
            onStatusChange();
        } catch (err) {
            console.error('Error updating podcast status:', err);
            alert(err instanceof Error ? err.message : 'Failed to update podcast status');
        } finally {
            setProcessing(false);
            setShowDeactivateConfirm(false);
        }
    };

    return (
        <>
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => setShowDeactivateConfirm(true)}
                    className={`px-4 py-2 text-sm font-medium rounded-md border ${isActive
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100'
                            : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                        }`}
                    disabled={processing}
                >
                    {isActive ? 'Deactivate Podcast' : 'Reactivate Podcast'}
                </button>

                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100"
                    disabled={processing}
                >
                    Delete Podcast
                </button>
            </div>

            {/* Deactivate Confirmation Modal */}
            {showDeactivateConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            {isActive ? 'Deactivate' : 'Reactivate'} Podcast?
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {isActive
                                ? 'Deactivating this podcast will hide it from the marketplace. You can reactivate it later.'
                                : 'Reactivating this podcast will make it visible in the marketplace again.'}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeactivateConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                disabled={processing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleToggleActive}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${isActive
                                        ? 'bg-yellow-600 hover:bg-yellow-700'
                                        : 'bg-green-600 hover:bg-green-700'
                                    } disabled:opacity-50`}
                                disabled={processing}
                            >
                                {processing ? 'Processing...' : isActive ? 'Deactivate' : 'Reactivate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-red-900 mb-4">Delete Podcast?</h3>
                        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                            <p className="text-sm text-red-800">
                                <strong>Warning:</strong> This action will permanently remove your podcast from the platform.
                                All associated services and pitches will remain, but the podcast will no longer be visible to users.
                            </p>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this podcast? This action cannot be easily undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                disabled={processing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                                disabled={processing}
                            >
                                {processing ? 'Deleting...' : 'Delete Podcast'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
