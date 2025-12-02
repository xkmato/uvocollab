'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function GuestSignUp() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUpWithEmail } = useAuth();
    const router = useRouter();

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
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
            // Create the user account
            await signUpWithEmail(formData.email, formData.password);

            // Wait a bit for auth to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

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

            // Create guest profile data
            const guestData = {
                email: formData.email,
                displayName: formData.displayName,
                role: 'guest',
                isGuest: true,
                guestBio: formData.guestBio,
                guestRate: formData.guestRate ? parseFloat(formData.guestRate) : 0,
                guestAvailability: formData.guestAvailability,
                guestTopics: topics,
                socialLinks: socialLinks.length > 0 ? socialLinks : undefined,
                previousAppearances: previousAppearances.length > 0 ? previousAppearances : undefined,
                isVerifiedGuest: false,
            };

            // Call API to update user profile with guest data
            const response = await fetch('/api/guest/create-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify(guestData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create guest profile');
            }

            // Redirect to guest dashboard
            router.push('/dashboard');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden py-12 px-4">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10 max-w-3xl mx-auto">
                {/* Logo/Brand Section */}
                <div className="text-center mb-8 animate-fadeIn">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mb-2">
                        Join as a Guest
                    </h1>
                    <p className="text-white/80 text-lg">Share your expertise with podcast audiences</p>
                </div>

                {/* Signup Form */}
                <div className="glass-dark rounded-3xl p-8 shadow-2xl animate-slideIn">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-center animate-fadeIn">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info Section */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">Basic Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Display Name *</label>
                                    <input
                                        type="text"
                                        value={formData.displayName}
                                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Password *</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Guest Info Section */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">Guest Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Bio / Expertise *</label>
                                    <textarea
                                        value={formData.guestBio}
                                        onChange={(e) => handleInputChange('guestBio', e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px]"
                                        placeholder="Tell podcasts about your expertise and what you bring to conversations..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Guest Rate (USD) *</label>
                                    <input
                                        type="number"
                                        value={formData.guestRate}
                                        onChange={(e) => handleInputChange('guestRate', e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="0 for free, or your fixed rate"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                    <p className="text-white/50 text-xs mt-1">Enter 0 if you appear for free, or your rate per appearance</p>
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Topics / Expertise Areas *</label>
                                    <input
                                        type="text"
                                        value={formData.guestTopics}
                                        onChange={(e) => handleInputChange('guestTopics', e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Technology, Entrepreneurship, Marketing, etc. (comma-separated)"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/70 text-sm mb-2">Availability *</label>
                                    <input
                                        type="text"
                                        value={formData.guestAvailability}
                                        onChange={(e) => handleInputChange('guestAvailability', e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="e.g., Weekday mornings, Flexible, 2 weeks notice required"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Social Links Section */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">Social Links (Optional)</h3>
                            <div className="space-y-3">
                                {formData.socialLinks.map((link, index) => (
                                    <div key={index} className="flex gap-3">
                                        <input
                                            type="text"
                                            value={link.platform}
                                            onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                                            className="w-1/3 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="Platform (e.g., Twitter)"
                                        />
                                        <input
                                            type="url"
                                            value={link.url}
                                            onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                                            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
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

                        {/* Previous Appearances Section */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">Previous Podcast Appearances (Optional)</h3>
                            <div className="space-y-3">
                                {formData.previousAppearances.map((appearance, index) => (
                                    <div key={index} className="flex gap-3">
                                        <input
                                            type="url"
                                            value={appearance}
                                            onChange={(e) => handleAppearanceChange(index, e.target.value)}
                                            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? 'Creating Account...' : 'Sign Up as Guest'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-white/60 text-sm">
                            Already have an account?{' '}
                            <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 font-semibold underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back Link */}
                <div className="mt-8 text-center">
                    <Link href="/auth/signup" className="text-white/70 hover:text-white text-sm inline-flex items-center gap-2 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Regular Sign Up
                    </Link>
                </div>
            </div>
        </div>
    );
}
