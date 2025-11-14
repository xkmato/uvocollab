'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ApplyAsLegend() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        // Primary Contact Info
        artistName: '',
        email: '',
        phone: '',

        // Management/Agency Info
        managementName: '',
        managementEmail: '',

        // Proof of Status
        spotifyLink: '',
        instagramLink: '',
        twitterLink: '',
        pressLinks: '',

        // Optional Referral
        referralFrom: '',

        // Additional info
        bio: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // TODO: Will be implemented in Task 2.2
            // This will call the submitLegendApplication Firebase Function
            console.log('Form data:', formData);

            // Simulate API call for now
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSuccess(true);
            setTimeout(() => {
                router.push('/');
            }, 3000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred while submitting your application');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="w-full max-w-2xl space-y-8 rounded-lg bg-white p-8 shadow text-center">
                    <div className="text-green-600 text-6xl mb-4">✓</div>
                    <h2 className="text-3xl font-bold text-gray-900">Application Submitted!</h2>
                    <p className="text-gray-600">
                        Thank you for applying to become a UvoCollab Legend.
                        We&apos;ll review your application and get back to you soon.
                    </p>
                    <p className="text-sm text-gray-500">Redirecting to home page...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Become a UvoCollab Legend
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Join an exclusive community of verified music industry professionals.
                        Share your expertise, build your brand, and collaborate with emerging artists on your terms.
                    </p>
                </div>

                {/* Value Proposition Section */}
                <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Join as a Legend?</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mt-1">
                                    <span className="text-indigo-600 font-bold">✓</span>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-semibold text-gray-900">Verified Status</h3>
                                    <p className="text-gray-600">Stand out with our &quot;Verified Legend&quot; badge that establishes your credibility.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mt-1">
                                    <span className="text-indigo-600 font-bold">✓</span>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-semibold text-gray-900">Set Your Own Rates</h3>
                                    <p className="text-gray-600">Complete control over your pricing and services.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mt-1">
                                    <span className="text-indigo-600 font-bold">✓</span>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-semibold text-gray-900">Brand Protection</h3>
                                    <p className="text-gray-600">Review every collaboration request before committing.</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mt-1">
                                    <span className="text-indigo-600 font-bold">✓</span>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-semibold text-gray-900">Secure Payments</h3>
                                    <p className="text-gray-600">Protected escrow system ensures you get paid for your work.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mt-1">
                                    <span className="text-indigo-600 font-bold">✓</span>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-semibold text-gray-900">Legal Protection</h3>
                                    <p className="text-gray-600">Automatic contract generation for every collaboration.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mt-1">
                                    <span className="text-indigo-600 font-bold">✓</span>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-lg font-semibold text-gray-900">Curated Community</h3>
                                    <p className="text-gray-600">Work with vetted, serious artists who value your expertise.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Application Form */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Legend Application</h2>
                    <p className="text-gray-600 mb-8">
                        Complete this application to join our exclusive community. All fields marked with * are required.
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Primary Contact Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                                Primary Contact Information
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="artistName" className="block text-sm font-medium text-gray-700">
                                        Artist/Professional Name *
                                    </label>
                                    <input
                                        id="artistName"
                                        name="artistName"
                                        type="text"
                                        required
                                        value={formData.artistName}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-gray-900"
                                        placeholder="Your stage name or professional name"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email Address *
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-gray-900"
                                        placeholder="your.email@example.com"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                        Phone Number *
                                    </label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-gray-900"
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Management/Agency Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                                Management/Agency Information
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="managementName" className="block text-sm font-medium text-gray-700">
                                        Manager/Agency Name *
                                    </label>
                                    <input
                                        id="managementName"
                                        name="managementName"
                                        type="text"
                                        required
                                        value={formData.managementName}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-gray-900"
                                        placeholder="Management company or manager name"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="managementEmail" className="block text-sm font-medium text-gray-700">
                                        Manager/Agency Email *
                                    </label>
                                    <input
                                        id="managementEmail"
                                        name="managementEmail"
                                        type="email"
                                        required
                                        value={formData.managementEmail}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-gray-900"
                                        placeholder="manager@example.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Proof of Status */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                                Proof of Status
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Provide links to verify your professional standing in the music industry. At least one link is required.
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="spotifyLink" className="block text-sm font-medium text-gray-700">
                                        Spotify Artist Profile *
                                    </label>
                                    <input
                                        id="spotifyLink"
                                        name="spotifyLink"
                                        type="url"
                                        required
                                        value={formData.spotifyLink}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-gray-900"
                                        placeholder="https://open.spotify.com/artist/..."
                                    />
                                </div>
                                <div>
                                    <label htmlFor="instagramLink" className="block text-sm font-medium text-gray-700">
                                        Instagram Profile
                                    </label>
                                    <input
                                        id="instagramLink"
                                        name="instagramLink"
                                        type="url"
                                        value={formData.instagramLink}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-gray-900"
                                        placeholder="https://instagram.com/..."
                                    />
                                </div>
                                <div>
                                    <label htmlFor="twitterLink" className="block text-sm font-medium text-gray-700">
                                        Twitter/X Profile
                                    </label>
                                    <input
                                        id="twitterLink"
                                        name="twitterLink"
                                        type="url"
                                        value={formData.twitterLink}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-gray-900"
                                        placeholder="https://twitter.com/..."
                                    />
                                </div>
                                <div>
                                    <label htmlFor="pressLinks" className="block text-sm font-medium text-gray-700">
                                        Press Links or Notable Achievements
                                    </label>
                                    <textarea
                                        id="pressLinks"
                                        name="pressLinks"
                                        rows={3}
                                        value={formData.pressLinks}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-gray-900"
                                        placeholder="Links to press coverage, awards, notable collaborations, etc. (one per line)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                                About You
                            </h3>
                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                                    Professional Bio *
                                </label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    rows={5}
                                    required
                                    value={formData.bio}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-gray-900"
                                    placeholder="Tell us about your experience, expertise, and what makes you a legend in your field..."
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Minimum 100 characters. This will be visible on your public profile if approved.
                                </p>
                            </div>
                        </div>

                        {/* Optional Referral */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                                Referral (Optional)
                            </h3>
                            <div>
                                <label htmlFor="referralFrom" className="block text-sm font-medium text-gray-700">
                                    Referred by an existing Legend?
                                </label>
                                <input
                                    id="referralFrom"
                                    name="referralFrom"
                                    type="text"
                                    value={formData.referralFrom}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-gray-900"
                                    placeholder="Name of the Legend who referred you (if applicable)"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Referrals from existing Legends can expedite the review process.
                                </p>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-md bg-indigo-600 px-4 py-3 text-white font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                            </button>
                            <p className="mt-3 text-sm text-center text-gray-500">
                                By submitting this application, you agree to our terms of service and privacy policy.
                            </p>
                        </div>
                    </form>
                </div>

                {/* Additional Info */}
                <div className="mt-8 text-center text-sm text-gray-600">
                    <p>
                        Questions about the application process?{' '}
                        <a href="mailto:legends@uvocollab.com" className="text-indigo-600 hover:text-indigo-500">
                            Contact our team
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
