'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPodcast() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        rssFeedUrl: '',
        websiteUrl: '',
        category: '',
        avgListeners: '',
        platformLinks: [{ platform: '', url: '' }],
    });

    const categories = [
        'Music',
        'Technology',
        'Business',
        'Comedy',
        'Education',
        'Health & Fitness',
        'News',
        'Science',
        'Society & Culture',
        'Sports',
        'TV & Film',
        'True Crime',
        'Other'
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (!user) {
                throw new Error('You must be logged in to register a podcast');
            }

            // Basic validation
            if (!formData.title || !formData.description || !formData.category || !formData.rssFeedUrl) {
                throw new Error('Please fill in all required fields');
            }


            // Implement actual submission logic (Task 1.3)
            console.log('Submitting podcast data:', formData);

            const token = await user.getIdToken();

            const payload = {
                title: formData.title,
                description: formData.description,
                rssFeedUrl: formData.rssFeedUrl || null,
                categories: [formData.category],
                avgListeners: formData.avgListeners ? Number(formData.avgListeners) : null,
                websiteUrl: formData.websiteUrl || null,
                platformLinks: formData.platformLinks.filter(link => link.platform && link.url),
            };

            const response = await fetch('/api/submit-podcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                // Check if response is JSON before parsing
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const err = await response.json();
                    throw new Error(err?.error || 'Failed to submit podcast');
                } else {
                    // Server returned HTML or other non-JSON response (likely an error page)
                    const text = await response.text();
                    console.error('Non-JSON response from server:', text.substring(0, 200));
                    throw new Error(`Server error (${response.status}): Unable to submit podcast. Please try again.`);
                }
            }

            const result = await response.json();
            setSuccess(true);
            // Redirect after a delay? Or just show success message.
            // router.push('/dashboard'); 
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred while registering your podcast');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (!user) {
        router.push('/auth/login');
        return null;
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full glass-dark rounded-3xl p-12 text-center animate-fadeIn bg-white/10 backdrop-blur-lg border border-white/20">
                    <div className="mb-8">
                        <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-4">Podcast Submitted!</h2>
                        <p className="text-xl text-white/80 mb-2">
                            Thank you for registering &quot;{formData.title}&quot;.
                        </p>
                        <p className="text-white/60">
                            Your podcast is now pending approval. We&apos;ll notify you once it&apos;s live.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="max-w-3xl mx-auto relative z-10">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mb-4">
                        List Your Podcast
                    </h1>
                    <p className="text-xl text-white/80">
                        Connect with guests, sponsors, and other creators.
                    </p>
                </div>

                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-white font-semibold mb-2">Podcast Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:bg-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all"
                                placeholder="The Awesome Podcast"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-white font-semibold mb-2">Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:bg-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all resize-none"
                                placeholder="What is your podcast about?"
                                required
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-white font-semibold mb-2">Category *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:bg-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all [&>option]:bg-slate-800"
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* RSS Feed */}
                        <div>
                            <label className="block text-white font-semibold mb-2">RSS Feed URL *</label>
                            <input
                                type="url"
                                name="rssFeedUrl"
                                value={formData.rssFeedUrl}
                                onChange={handleChange}
                                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:bg-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all"
                                placeholder="https://feed.podbean.com/..."
                                required
                            />
                            <p className="mt-2 text-sm text-white/60">
                                Your podcast RSS feed URL is required. We&apos;ll use it to fetch your episodes and cover art.
                            </p>
                        </div>


                        {/* Website URL */}
                        <div>
                            <label className="block text-white font-semibold mb-2">Website URL (Optional)</label>
                            <input
                                type="url"
                                name="websiteUrl"
                                value={formData.websiteUrl}
                                onChange={handleChange}
                                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:bg-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all"
                                placeholder="https://mypodcast.com"
                            />
                        </div>

                        {/* Audience Size */}
                        <div>
                            <label className="block text-white font-semibold mb-2">Average Listeners per Episode</label>
                            <input
                                type="number"
                                name="avgListeners"
                                value={formData.avgListeners}
                                onChange={handleChange}
                                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:bg-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all"
                                placeholder="e.g. 5000"
                                min="0"
                            />
                        </div>

                        {/* Platform Links */}
                        <div>
                            <label className="block text-white font-semibold mb-2">Platform Links (Optional)</label>
                            <p className="text-sm text-white/60 mb-3">Add links to where people can find your podcast (Spotify, Apple Podcasts, YouTube, etc.)</p>
                            <div className="space-y-3">
                                {formData.platformLinks.map((link, index) => (
                                    <div key={index} className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="Platform name (e.g., Spotify)"
                                            value={link.platform}
                                            onChange={(e) => {
                                                const updated = [...formData.platformLinks];
                                                updated[index].platform = e.target.value;
                                                setFormData({ ...formData, platformLinks: updated });
                                            }}
                                            className="w-1/3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:bg-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all"
                                        />
                                        <input
                                            type="url"
                                            placeholder="URL"
                                            value={link.url}
                                            onChange={(e) => {
                                                const updated = [...formData.platformLinks];
                                                updated[index].url = e.target.value;
                                                setFormData({ ...formData, platformLinks: updated });
                                            }}
                                            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:bg-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all"
                                        />
                                        {formData.platformLinks.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = formData.platformLinks.filter((_, i) => i !== index);
                                                    setFormData({ ...formData, platformLinks: updated });
                                                }}
                                                className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition-all"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData({
                                            ...formData,
                                            platformLinks: [...formData.platformLinks, { platform: '', url: '' }]
                                        });
                                    }}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-sm"
                                >
                                    + Add Another Platform
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    'Register Podcast'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
