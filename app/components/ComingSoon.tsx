'use client';

import Link from 'next/link';

export default function ComingSoon({ feature = "This feature" }: { feature?: string }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
            <div className="text-center max-w-2xl mx-auto">
                {/* Animated Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 animate-pulse">
                            <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-2xl opacity-30 animate-float"></div>
                    </div>
                </div>

                {/* Message */}
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                    Coming Soon
                </h1>
                <p className="text-xl text-white/70 mb-8">
                    {feature} is currently under development. We&apos;re focusing on our podcast and guest booking platform for now.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300"
                    >
                        Back to Home
                    </Link>
                    <Link
                        href="/podcasts"
                        className="px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-semibold rounded-full hover:bg-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                        Browse Podcasts
                    </Link>
                </div>

                {/* Available Features */}
                <div className="mt-16 pt-8 border-t border-white/10">
                    <p className="text-white/50 text-sm mb-4">Currently Available:</p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/70 text-sm">
                            Podcast Listings
                        </span>
                        <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/70 text-sm">
                            Guest Profiles
                        </span>
                        <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/70 text-sm">
                            Booking System
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
