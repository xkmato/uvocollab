'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useState } from 'react';

interface ClaimPodcastModalProps {
    podcastId: string;
    podcastTitle: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ClaimPodcastModal({
    podcastId,
    podcastTitle,
    onClose,
    onSuccess,
}: ClaimPodcastModalProps) {
    const { user } = useAuth();
    const [email, setEmail] = useState(user?.email || '');
    const [evidence, setEvidence] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setError('You must be logged in to claim a podcast');
            return;
        }

        if (!email.trim() || !evidence.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/podcast/${podcastId}/claim`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ email, evidence }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit claim');
            }

            onSuccess();
        } catch (err) {
            console.error('Error submitting claim:', err);
            setError(err instanceof Error ? err.message : 'Failed to submit claim');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Claim Podcast Ownership</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={submitting}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                    <p className="text-sm text-blue-800">
                        <span className="font-medium">Claiming:</span> {podcastTitle}
                    </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                        <strong>Important:</strong> You are claiming that this podcast was listed without your permission.
                        Our team will review your claim, verify ownership, and contact you via email. This process may take 3-5 business days.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border"
                            disabled={submitting}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            We'll use this email to contact you regarding your claim
                        </p>
                    </div>

                    <div>
                        <label htmlFor="evidence" className="block text-sm font-medium text-gray-700 mb-2">
                            Proof of Ownership <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="evidence"
                            value={evidence}
                            onChange={(e) => setEvidence(e.target.value)}
                            rows={5}
                            placeholder="Please provide evidence that you own this podcast. This could include:&#10;- Links to your podcast on hosting platforms&#10;- RSS feed ownership verification&#10;- Social media accounts associated with the podcast&#10;- Any other proof of ownership"
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border"
                            disabled={submitting}
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Claim'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
