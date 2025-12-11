'use client';

import Link from 'next/link';
import { useAuth } from './contexts/AuthContext';

export default function Home() {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="music-wave bg-white"></div>
            <div className="music-wave bg-white"></div>
            <div className="music-wave bg-white"></div>
            <div className="music-wave bg-white"></div>
            <div className="music-wave bg-white"></div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">UvoCollab</h1>
          <p className="text-white/80">Loading your musical journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <main className="relative z-10">
        {user ? (
          // Dashboard View for Logged-in Users
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
            {/* Header Zone */}
            <div className="mb-12 animate-fadeIn">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Welcome Back{userData?.displayName ? `, ${userData.displayName.split(' ')[0]}` : ''}!
              </h1>
              <p className="text-white/70 text-xl">Connect podcasters with amazing guests</p>
            </div>

            {/* Main Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-5xl mx-auto">
              {/* Podcast Card */}
              <Link
                href={userData?.hasPodcast ? "/dashboard/podcast" : "/podcasts/register"}
                className="group relative p-8 rounded-3xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-indigo-600/0 group-hover:from-purple-600/20 group-hover:to-indigo-600/20 transition-all duration-300"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {userData?.hasPodcast ? "Manage Your Podcast" : "List Your Podcast"}
                  </h3>
                  <p className="text-white/70 mb-6">
                    {userData?.hasPodcast
                      ? "Update your podcast details, review guest applications, and schedule episodes"
                      : "Get your podcast listed and start receiving guest pitches and sponsorship opportunities"}
                  </p>
                  <div className="inline-flex items-center gap-2 text-purple-300 font-semibold group-hover:translate-x-2 transition-transform">
                    {userData?.hasPodcast ? "Go to Dashboard" : "Register Now"}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>

              {/* Guest Card */}
              <Link
                href="/guests"
                className="group relative p-8 rounded-3xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 hover:border-pink-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-600/0 to-rose-600/0 group-hover:from-pink-600/20 group-hover:to-rose-600/20 transition-all duration-300"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/30">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Become a Guest</h3>
                  <p className="text-white/70 mb-6">
                    Create your expert profile, browse podcast opportunities, and pitch yourself to shows looking for guests
                  </p>
                  <div className="inline-flex items-center gap-2 text-pink-300 font-semibold group-hover:translate-x-2 transition-transform">
                    Get Started
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            </div>

            {/* Browse Podcasts Section */}
            <div className="max-w-5xl mx-auto">
              <Link
                href="/marketplace/podcasts"
                className="group block p-6 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-cyan-500/20"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/20">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">Browse All Podcasts</h3>
                    <p className="text-white/60">Discover podcasts looking for guests like you</p>
                  </div>
                  <div className="text-cyan-300 group-hover:translate-x-2 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </div>

            {/* Features Footer */}
            <div className="mt-16 pt-8 border-t border-white/10 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                {[
                  {
                    icon: (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ),
                    title: 'Verified Profiles',
                    description: 'All podcasts and guests are verified',
                  },
                  {
                    icon: (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ),
                    title: 'Easy Scheduling',
                    description: 'Integrated calendar management',
                  },
                  {
                    icon: (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ),
                    title: 'Smart Matching',
                    description: 'AI-powered guest recommendations',
                  },
                ].map((feature, index) => (
                  <div key={index} className="animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex justify-center text-purple-400 mb-3">{feature.icon}</div>
                    <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                    <p className="text-white/60 text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Landing Page View for Non-authenticated Users
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
            <div className="text-center mb-16 animate-fadeIn">
              {/* Logo/Brand */}
              <div className="mb-8 flex items-center justify-center gap-3">
                <div className="flex items-center gap-1">
                  <div className="music-wave bg-gradient-to-t from-purple-400 to-pink-400"></div>
                  <div className="music-wave bg-gradient-to-t from-purple-400 to-pink-400"></div>
                  <div className="music-wave bg-gradient-to-t from-purple-400 to-pink-400"></div>
                  <div className="music-wave bg-gradient-to-t from-purple-400 to-pink-400"></div>
                  <div className="music-wave bg-gradient-to-t from-purple-400 to-pink-400"></div>
                </div>
              </div>

              <h1 className="text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mb-6 animate-gradientShift">
                UvoCollab
              </h1>
              <p className="text-2xl md:text-3xl text-white/90 mb-4 max-w-3xl mx-auto font-light">
                Where Podcasters Meet Expert Guests
              </p>
              <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
                Connect podcasters with verified expert guests. Streamline your booking process and grow your show.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-slideIn">
              <Link
                href="/auth/signup"
                className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                href="/auth/login"
                className="px-10 py-5 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white text-lg font-bold rounded-full hover:bg-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
              {[
                {
                  icon: (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  ),
                  title: 'For Podcasters',
                  description: 'List your podcast, receive guest pitches, and manage bookings all in one place.',
                },
                {
                  icon: (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ),
                  title: 'For Guests',
                  description: 'Create your expert profile and pitch yourself to podcasts in your niche.',
                },
                {
                  icon: (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                  title: 'Easy Scheduling',
                  description: 'Integrated calendar and scheduling tools make booking seamless.',
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="glass p-8 rounded-2xl hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-purple-300 mb-4">{feature.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-white/70 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How It Works Section */}
        <div className="py-20 bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-white text-center mb-4">How It Works</h2>
            <p className="text-xl text-white/70 text-center mb-16 max-w-2xl mx-auto">
              Simple and streamlined podcast guest booking
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative max-w-6xl mx-auto">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 -translate-y-1/2 opacity-30"></div>

              {[
                { step: '01', title: 'Create Profile', desc: 'Podcasters list shows, guests create expert profiles' },
                { step: '02', title: 'Discover & Pitch', desc: 'Browse opportunities and send pitches' },
                { step: '03', title: 'Schedule', desc: 'Easy calendar integration for booking episodes' },
                { step: '04', title: 'Record & Share', desc: 'Create great content together' }
              ].map((item, i) => (
                <div key={i} className="relative z-10 bg-slate-900/80 border border-white/10 p-6 rounded-2xl text-center hover:transform hover:-translate-y-2 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-purple-500/20">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-white/60">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="animate-fadeIn">
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">100%</div>
                <div className="text-white/70 text-lg">Verified Profiles</div>
              </div>
              <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2">Smart</div>
                <div className="text-white/70 text-lg">Guest Matching</div>
              </div>
              <div className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-2">Easy</div>
                <div className="text-white/70 text-lg">Scheduling Tools</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
