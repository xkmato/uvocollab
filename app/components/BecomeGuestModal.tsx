'use client';

import { useState } from 'react';

interface BecomeGuestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
}

export default function BecomeGuestModal({ isOpen, onClose, onSuccess, userId }: BecomeGuestModalProps) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        guestBio: '',
        guestRate: '',
        guestAvailability: '',
        guestTopics: '',
        socialLinks: [{ platform: '', url: '' }],
        previousAppearances: [''],
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSocialLinkChange = (index: number, field: 'platform' | 'url', value: string) => {
        const newSocialLinks = [...formData.socialLinks];
        newSocialLinks[index][field] = value;
        setFormData(prev => ({ ...prev, socialLinks: newSocialLinks }));
    };

    const addSocialLink = () => {
        setFormData(prev => ({
            ...prev,
            socialLinks: [...prev.socialLinks, { platform: '', url: '' }]
        }));
    };

    const removeSocialLink = (index: number) => {
        setFormData(prev => ({
            ...prev,
            socialLinks: prev.socialLinks.filter((_, i) => i !== index)
        }));
    };

    const handleAppearanceChange = (index: number, value: string) => {
        const newAppearances = [...formData.previousAppearances];
        newAppearances[index] = value;
        setFormData(prev => ({ ...prev, previousAppearances: newAppearances }));
    };

    const addAppearance = () => {
        setFormData(prev => ({
            ...prev,
            previousAppearances: [...prev.previousAppearances, '']
        }));
    };

    const removeAppearance = (index: number) => {
        setFormData(prev => ({
            ...prev,
            previousAppearances: prev.previousAppearances.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Get the current user's ID token
            const { auth: firebaseAuth } = await import('@/lib/firebase');
            const currentUser = firebaseAuth.currentUser;
            if (!currentUser) {
                throw new Error('User not authenticated');
            }
            const idToken = await currentUser.getIdToken();

            // Parse topics
            const topics = formData.guestTopics.split(',').map(t => t.trim()).filter(t => t);

            // Filter out empty social links and appearances
            const socialLinks = formData.socialLinks.filter(link => link.platform && link.url);
            const previousAppearances = formData.previousAppearances.filter(app => app.trim());

            // Create guest data
            const guestData = {
                isGuest: true,
                guestBio: formData.guestBio,
                guestRate: formData.guestRate ? parseFloat(formData.guestRate) : 0,
                guestAvailability: formData.guestAvailability,
                guestTopics: topics,
                socialLinks: socialLinks.length > 0 ? socialLinks : undefined,
                previousAppearances: previousAppearances.length > 0 ? previousAppearances : undefined,
                isVerifiedGuest: false,
            };

            // Call API to enable guest features
            const response = await fetch('/api/guest/enable-guest-mode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify(guestData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to enable guest mode');
            }

            onSuccess();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
                <div className="sticky top-0 bg-slate-800 border-b border-white/10 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Become a Guest</h2>
                        <p className="text-white/70 text-sm mt-1">Enable guest features on your account</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-white/70 hover:text-white transition-colors"
                        aria-label="Close modal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Guest Info Section */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4">Guest Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Bio / Expertise *</label>
                                    <textarea
                                        value={formData.guestBio}
                                        onChange={(e) => handleInputChange('guestBio', e.target.value)}
                                        className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                                        placeholder="Tell podcasts about your expertise..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Guest Rate (USD) *</label>
                                    <input
                                        type="number"
                                        value={formData.guestRate}
                                        onChange={(e) => handleInputChange('guestRate', e.target.value)}
                                        className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="0 for free"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Topics / Expertise Areas *</label>
                                    <input
                                        type="text"
                                        value={formData.guestTopics}
                                        onChange={(e) => handleInputChange('guestTopics', e.target.value)}
                                        className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Comma-separated topics"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Availability *</label>
                                    <input
                                        type="text"
                                        value={formData.guestAvailability}
                                        onChange={(e) => handleInputChange('guestAvailability', e.target.value)}
                                        className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="e.g., Weekday mornings"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Social Links Section */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4">Social Links (Optional)</h3>
                            <div className="space-y-3">
                                {formData.socialLinks.map((link, index) => (
                                    <div key={index} className="flex gap-3">
                                        <input
                                            type="text"
                                            value={link.platform}
                                            onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                                            className="w-1/3 bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="Platform"
                                        />
                                        <input
                                            type="url"
                                            value={link.url}
                                            onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                                            className="flex-1 bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="https://..."
                                        />
                                        {formData.socialLinks.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeSocialLink(index)}
                                                className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl transition-colors"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addSocialLink}
                                    className="text-purple-400 hover:text-purple-300 text-sm font-semibold"
                                >
                                    + Add Social Link
                                </button>
                            </div>
                        </div>

                        {/* Previous Appearances Section */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4">Previous Appearances (Optional)</h3>
                            <div className="space-y-3">
                                {formData.previousAppearances.map((appearance, index) => (
                                    <div key={index} className="flex gap-3">
                                        <input
                                            type="url"
                                            value={appearance}
                                            onChange={(e) => handleAppearanceChange(index, e.target.value)}
                                            className="flex-1 bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="https://..."
                                        />
                                        {formData.previousAppearances.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeAppearance(index)}
                                                className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl transition-colors"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addAppearance}
                                    className="text-purple-400 hover:text-purple-300 text-sm font-semibold"
                                >
                                    + Add Another Link
                                </button>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Enabling...' : 'Enable Guest Mode'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
