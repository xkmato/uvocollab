'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { ReportReason } from '@/app/types/report';
import { useState } from 'react';

interface ReportPodcastModalProps {
    podcastId: string;
    podcastTitle: string;
    onClose: () => void;
    onSuccess: () => void;
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
    { value: 'inappropriate_content', label: 'Inappropriate Content' },
    { value: 'copyright_violation', label: 'Copyright Violation' },
    { value: 'spam', label: 'Spam or Misleading' },
    { value: 'misleading', label: 'Misleading Information' },
    { value: 'other', label: 'Other' },
];

export default function ReportPodcastModal({
    podcastId,
    podcastTitle,
    onClose,
    onSuccess,
}: ReportPodcastModalProps) {
    const { user } = useAuth();
    const [reason, setReason] = useState<ReportReason>('inappropriate_content');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setError('You must be logged in to report a podcast');
            return;
        }

        if (!description.trim()) {
            setError('Please provide a description');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/podcast/${podcastId}/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ reason, description }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit report');
            }

            onSuccess();
        } catch (err) {
            console.error('Error submitting report:', err);
            setError(err instanceof Error ? err.message : 'Failed to submit report');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Report Podcast</h2>
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

                <p className="text-sm text-gray-600 mb-4">
                    You are reporting: <span className="font-medium">{podcastTitle}</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for Report
                        </label>
                        <select
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value as ReportReason)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border"
                            disabled={submitting}
                        >
                            {REPORT_REASONS.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Please provide details about why you are reporting this podcast..."
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
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
