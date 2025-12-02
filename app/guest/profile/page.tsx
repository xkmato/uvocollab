'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function GuestProfile() {
    const { user, userData, loading: authLoading } = useAuth();
    const router = useRouter();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        displayName: '',
        guestBio: '',
        guestRate: '',
        guestAvailability: '',
        guestTopics: '',
        socialLinks: [{ platform: '', url: '' }],
        previousAppearances: [''],
        profileImageUrl: '',
    });

    // Load user data when available
    useEffect(() => {
        if (userData && userData.isGuest) {
            setFormData({
                displayName: userData.displayName || '',
                guestBio: userData.guestBio || '',
                guestRate: userData.guestRate?.toString() || '0',
                guestAvailability: userData.guestAvailability || '',
                guestTopics: userData.guestTopics?.join(', ') || '',
                socialLinks: userData.socialLinks && userData.socialLinks.length > 0
                    ? userData.socialLinks
                    : [{ platform: '', url: '' }],
                previousAppearances: userData.previousAppearances && userData.previousAppearances.length > 0
                    ? userData.previousAppearances
                    : [''],
                profileImageUrl: userData.profileImageUrl || '',
            });
        }
    }, [userData]);

    // Redirect if not a guest or not authenticated
    useEffect(() => {
        if (!authLoading && (!user || !userData?.isGuest)) {
            router.push('/dashboard');
        }
    }, [authLoading, user, userData, router]);

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

    const handleRequestVerification = async () => {
        if (!user) return;

        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/guest/request-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to request verification');
            }

            setSuccess('Verification request submitted successfully!');
            setTimeout(() => setSuccess(''), 5000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        try {
            if (!user) {
                throw new Error('User not authenticated');
            }

            const idToken = await user.getIdToken();

            // Parse topics
            const topics = formData.guestTopics.split(',').map(t => t.trim()).filter(t => t);

            // Filter out empty social links and appearances
            const socialLinks = formData.socialLinks.filter(link => link.platform && link.url);
            const previousAppearances = formData.previousAppearances.filter(app => app.trim());

            // Create update data
            const updateData = {
                displayName: formData.displayName,
                guestBio: formData.guestBio,
                guestRate: formData.guestRate ? parseFloat(formData.guestRate) : 0,
                guestAvailability: formData.guestAvailability,
                guestTopics: topics,
                socialLinks: socialLinks.length > 0 ? socialLinks : [],
                previousAppearances: previousAppearances.length > 0 ? previousAppearances : [],
                profileImageUrl: formData.profileImageUrl,
            };

            // Call API to update profile
            const response = await fetch('/api/guest/update-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to update profile');
            }

            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 5000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setTimeout(() => setError(''), 5000);
        } finally {
            setSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (!user || !userData?.isGuest) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-900 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Guest Profile</h1>
                    <p className="text-white/70">Manage your guest information and visibility</p>
                </div>

                {/* Verification Status */}
                <div className="mb-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">Verification Status</h3>
                            {userData.isVerifiedGuest ? (
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                                        ✓ Verified Guest
                                    </span>
                                    <p className="text-white/60 text-sm">Your profile is verified and trusted by podcasts</p>
                                </div>
                            ) : userData.guestVerificationRequestedAt ? (
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                        ⏳ Verification Pending
                                    </span>
                                    <p className="text-white/60 text-sm">We're reviewing your verification request</p>
                                </div>
                            ) : (
                                <div>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-500/20 text-slate-300 border border-slate-500/30">
                                        Unverified
                                    </span>
                                    <p className="text-white/60 text-sm mt-2">Get verified to increase your credibility with podcasts</p>
                                </div>
                            )}
                        </div>
                        {!userData.isVerifiedGuest && !userData.guestVerificationRequestedAt && (
                            <button
                                onClick={handleRequestVerification}
                                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-6 rounded-xl transition-colors"
                            >
                                Request Verification
                            </button>
                        )}
                    </div>
                </div>

                {/* Success/Error Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200">
                        {success}
                    </div>
                )}

                {/* Profile Form */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">Basic Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        value={formData.displayName}
                                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                                        className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Profile Image URL</label>
                                    <input
                                        type="url"
                                        value={formData.profileImageUrl}
                                        onChange={(e) => handleInputChange('profileImageUrl', e.target.value)}
                                        className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Guest Info */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">Guest Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Bio / Expertise</label>
                                    <textarea
                                        value={formData.guestBio}
                                        onChange={(e) => handleInputChange('guestBio', e.target.value)}
                                        className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Guest Rate (USD)</label>
                                    <input
                                        type="number"
                                        value={formData.guestRate}
                                        onChange={(e) => handleInputChange('guestRate', e.target.value)}
                                        className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Topics / Expertise Areas</label>
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
                                    <label className="block text-white/70 text-sm mb-2">Availability</label>
                                    <input
                                        type="text"
                                        value={formData.guestAvailability}
                                        onChange={(e) => handleInputChange('guestAvailability', e.target.value)}
                                        className="w-full bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">Social Links</h3>
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
                                                Remove
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

                        {/* Previous Appearances */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">Previous Podcast Appearances</h3>
                            <div className="space-y-3">
                                {formData.previousAppearances.map((appearance, index) => (
                                    <div key={index} className="flex gap-3">
                                        <input
                                            type="url"
                                            value={appearance}
                                            onChange={(e) => handleAppearanceChange(index, e.target.value)}
                                            className="flex-1 bg-slate-700/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="https://link-to-episode.com"
                                        />
                                        {formData.previousAppearances.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeAppearance(index)}
                                                className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl transition-colors"
                                            >
                                                Remove
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

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
