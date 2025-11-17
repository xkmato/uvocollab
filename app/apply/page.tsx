'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type WizardStep = 1 | 2 | 3 | 4 | 5;

export default function ApplyAsLegend() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [currentStep, setCurrentStep] = useState<WizardStep>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        artistName: '',
        phone: '',
        managementName: '',
        managementEmail: '',
        spotifyLink: '',
        instagramLink: '',
        twitterLink: '',
        pressLinks: '',
        referralFrom: '',
        bio: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateStep = (step: WizardStep): boolean => {
        switch (step) {
            case 1:
                return !!(formData.artistName && formData.phone);
            case 2:
                return true;
            case 3:
                return !!formData.spotifyLink;
            case 4:
                return formData.bio.length >= 100;
            case 5:
                return true;
            default:
                return false;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep) && currentStep < 5) {
            setCurrentStep((currentStep + 1) as WizardStep);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep((currentStep - 1) as WizardStep);
        }
    };

    const handleSubmit = async () => {
        setError('');
        setIsSubmitting(true);

        try {
            if (!user) {
                throw new Error('You must be logged in to submit an application');
            }

            // Get the ID token for authentication
            const token = await user.getIdToken();

            const response = await fetch('/api/legend-application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit application');
            }

            setSuccess(true);
            setTimeout(() => router.push('/'), 3000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred while submitting your application');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 flex items-center justify-center p-4">
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
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full glass-dark rounded-3xl p-12 text-center animate-fadeIn">
                    <div className="mb-8">
                        <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-4">Application Submitted!</h2>
                        <p className="text-xl text-white/80 mb-2">
                            Thank you for applying to become a UvoCollab Legend.
                        </p>
                        <p className="text-white/60">
                            We'll review your application and get back to you soon.
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-white/50">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Redirecting to home page...</span>
                    </div>
                </div>
            </div>
        );
    }

    const steps = [
        { number: 1, title: 'Contact Info', icon: '👤' },
        { number: 2, title: 'Management', icon: '🤝' },
        { number: 3, title: 'Proof of Status', icon: '⭐' },
        { number: 4, title: 'About You', icon: '📝' },
        { number: 5, title: 'Review', icon: '✅' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Animations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-12 animate-fadeIn">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mb-4">
                        Become a Legend
                    </h1>
                    <p className="text-xl text-white/80">
                        Join an exclusive community of verified music industry professionals
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-12">
                    <div className="flex justify-between items-center relative">
                        {/* Progress Bar Background */}
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -translate-y-1/2"></div>
                        {/* Active Progress Bar */}
                        <div
                            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 -translate-y-1/2 transition-all duration-500"
                            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        ></div>

                        {steps.map((step) => (
                            <div key={step.number} className="relative z-10 flex flex-col items-center">
                                <div
                                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 ${currentStep >= step.number
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-110'
                                        : 'bg-white/10 text-white/40'
                                        }`}
                                >
                                    {step.icon}
                                </div>
                                <span className={`mt-2 text-sm font-medium transition-colors ${currentStep >= step.number ? 'text-white' : 'text-white/40'
                                    }`}>
                                    {step.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Card */}
                <div className="glass-dark rounded-3xl p-8 md:p-12 shadow-2xl animate-fadeIn">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 animate-slideIn">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Contact Info */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-3xl font-bold text-white mb-6">Let's start with your contact information</h2>

                            <div>
                                <label className="block text-white font-semibold mb-2">Artist/Professional Name *</label>
                                <input
                                    type="text"
                                    name="artistName"
                                    value={formData.artistName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all"
                                    placeholder="Your stage name or professional name"
                                />
                            </div>

                            <div>
                                <label className="block text-white font-semibold mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white/60 cursor-not-allowed"
                                />
                                <p className="mt-2 text-sm text-white/60">Using your logged-in email address</p>
                            </div>

                            <div>
                                <label className="block text-white font-semibold mb-2">Phone Number *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all"
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Management */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-3xl font-bold text-white mb-6">Tell us about your management</h2>
                            <p className="text-white/60 mb-6">If you manage yourself, you can skip this step</p>

                            <div>
                                <label className="block text-white font-semibold mb-2">Manager/Agency Name</label>
                                <input
                                    type="text"
                                    name="managementName"
                                    value={formData.managementName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all"
                                    placeholder="Management company or manager name"
                                />
                            </div>

                            <div>
                                <label className="block text-white font-semibold mb-2">Manager/Agency Email</label>
                                <input
                                    type="email"
                                    name="managementEmail"
                                    value={formData.managementEmail}
                                    onChange={handleChange}
                                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all"
                                    placeholder="manager@example.com"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Proof of Status */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-3xl font-bold text-white mb-2">Verify your professional status</h2>
                            <p className="text-white/60 mb-6">Share your profiles and achievements to help us verify your credentials</p>

                            <div>
                                <label className="block text-white font-semibold mb-2">Spotify Artist Profile *</label>
                                <input
                                    type="url"
                                    name="spotifyLink"
                                    value={formData.spotifyLink}
                                    onChange={handleChange}
                                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all"
                                    placeholder="https://open.spotify.com/artist/..."
                                />
                            </div>

                            <div>
                                <label className="block text-white font-semibold mb-2">Instagram Profile</label>
                                <input
                                    type="url"
                                    name="instagramLink"
                                    value={formData.instagramLink}
                                    onChange={handleChange}
                                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all"
                                    placeholder="https://instagram.com/..."
                                />
                            </div>

                            <div>
                                <label className="block text-white font-semibold mb-2">Twitter/X Profile</label>
                                <input
                                    type="url"
                                    name="twitterLink"
                                    value={formData.twitterLink}
                                    onChange={handleChange}
                                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all"
                                    placeholder="https://twitter.com/..."
                                />
                            </div>

                            <div>
                                <label className="block text-white font-semibold mb-2">Press Links or Notable Achievements</label>
                                <textarea
                                    name="pressLinks"
                                    value={formData.pressLinks}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all resize-none"
                                    placeholder="Links to press coverage, awards, notable collaborations, etc. (one per line)"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 4: About You */}
                    {currentStep === 4 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-3xl font-bold text-white mb-2">Tell your story</h2>
                            <p className="text-white/60 mb-6">Share your journey and what makes you a legend in your field</p>

                            <div>
                                <label className="block text-white font-semibold mb-2">Professional Bio *</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={8}
                                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all resize-none"
                                    placeholder="Tell us about your experience, expertise, and what makes you a legend in your field..."
                                />
                                <p className="mt-2 text-sm text-white/60">
                                    {formData.bio.length}/100 characters minimum (current: {formData.bio.length})
                                </p>
                            </div>

                            <div>
                                <label className="block text-white font-semibold mb-2">Referred by an existing Legend? (Optional)</label>
                                <input
                                    type="text"
                                    name="referralFrom"
                                    value={formData.referralFrom}
                                    onChange={handleChange}
                                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:bg-white/20 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all"
                                    placeholder="Name of the Legend who referred you"
                                />
                                <p className="mt-2 text-sm text-white/60">
                                    Referrals from existing Legends can expedite the review process
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Review */}
                    {currentStep === 5 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-3xl font-bold text-white mb-6">Review your application</h2>

                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <h3 className="text-purple-300 font-semibold mb-2">Contact Information</h3>
                                    <p className="text-white"><strong>Name:</strong> {formData.artistName}</p>
                                    <p className="text-white"><strong>Email:</strong> {user?.email}</p>
                                    <p className="text-white"><strong>Phone:</strong> {formData.phone}</p>
                                </div>

                                {(formData.managementName || formData.managementEmail) && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                        <h3 className="text-purple-300 font-semibold mb-2">Management</h3>
                                        {formData.managementName && <p className="text-white"><strong>Manager/Agency:</strong> {formData.managementName}</p>}
                                        {formData.managementEmail && <p className="text-white"><strong>Email:</strong> {formData.managementEmail}</p>}
                                    </div>
                                )}
                                {!formData.managementName && !formData.managementEmail && (
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                        <h3 className="text-purple-300 font-semibold mb-2">Management</h3>
                                        <p className="text-white/60">Self-managed</p>
                                    </div>
                                )}

                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <h3 className="text-purple-300 font-semibold mb-2">Verification</h3>
                                    {formData.spotifyLink && <p className="text-white text-sm">✓ Spotify Profile</p>}
                                    {formData.instagramLink && <p className="text-white text-sm">✓ Instagram Profile</p>}
                                    {formData.twitterLink && <p className="text-white text-sm">✓ Twitter Profile</p>}
                                </div>

                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <h3 className="text-purple-300 font-semibold mb-2">Bio</h3>
                                    <p className="text-white text-sm">{formData.bio.substring(0, 200)}{formData.bio.length > 200 ? '...' : ''}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/10">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            ← Previous
                        </button>

                        <div className="text-white/60 font-medium">
                            Step {currentStep} of {steps.length}
                        </div>

                        {currentStep < 5 ? (
                            <button
                                onClick={nextStep}
                                disabled={!validateStep(currentStep)}
                                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                            >
                                Next →
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-8 py-4 bg-gradient-to-r from-green-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    <>Submit Application ✓</>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-8 text-center text-white/60 text-sm">
                    Questions about the application process?{' '}
                    <a href="mailto:legends@uvocollab.com" className="text-purple-400 hover:text-purple-300 underline">
                        Contact our team
                    </a>
                </div>
            </div>
        </div>
    );
}
