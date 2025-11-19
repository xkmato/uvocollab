'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { PodcastService, PodcastServiceType } from '@/app/types/podcast';
import { useState } from 'react';

interface PodcastServiceFormProps {
    podcastId: string;
    service?: PodcastService;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function PodcastServiceForm({ podcastId, service, onSuccess, onCancel }: PodcastServiceFormProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: service?.title || '',
        description: service?.description || '',
        price: service?.price || 0,
        duration: service?.duration || '',
        type: service?.type || 'guest_spot' as PodcastServiceType,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const token = await user.getIdToken();
            const url = service
                ? `/api/podcasts/services/${service.id}`
                : '/api/podcasts/services';

            const method = service ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    podcastId,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save service');
            }

            onSuccess();
        } catch (err) {
            console.error('Error saving service:', err);
            setError(err instanceof Error ? err.message : 'Failed to save service');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">
                {service ? 'Edit Service' : 'Add New Service'}
            </h3>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700">Service Title</label>
                <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    placeholder="e.g., 30-Minute Guest Spot"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    placeholder="Describe what the buyer gets..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                    <input
                        type="number"
                        min="0"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    />
                    <p className="text-xs text-gray-500 mt-1">Set to 0 for free/cross-promotion</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <input
                        type="text"
                        required
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        placeholder="e.g., 30 mins, 1 hour"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PodcastServiceType })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                    <option value="guest_spot">Guest Spot</option>
                    <option value="ad_read">Ad Read</option>
                    <option value="cross_promotion">Cross Promotion</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                    {loading ? 'Saving...' : 'Save Service'}
                </button>
            </div>
        </form>
    );
}
