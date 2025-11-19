'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { LegendApplication } from './types/legendApplication';

export default function Home() {
  const { user, loading } = useAuth();
  const [legendApplication, setLegendApplication] = useState<LegendApplication | null>(null);
  const [checkingApplication, setCheckingApplication] = useState(true);

  useEffect(() => {
    async function checkLegendApplication() {
      if (!user) {
        setCheckingApplication(false);
        return;
      }

      try {
        const applicationsRef = collection(db, 'legend_applications');
        const q = query(applicationsRef, where('applicantUid', '==', user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const appData = querySnapshot.docs[0].data() as LegendApplication;
          setLegendApplication({ ...appData, id: querySnapshot.docs[0].id });
        }
      } catch (error) {
        console.error('Error checking legend application:', error);
      } finally {
        setCheckingApplication(false);
      }
    }

    checkLegendApplication();
  }, [user]);

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
        {/* Hero Section */}
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
              Where Rising Artists Meet Industry Legends
            </p>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Connect, collaborate, and create magic with verified music industry professionals.
            </p>
          </div>

          {!user && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20 animate-slideIn">
              <Link
                href="/auth/signup"
                className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10">Start Your Journey</span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                href="/auth/login"
                className="px-10 py-5 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white text-lg font-bold rounded-full hover:bg-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Sign In
              </Link>
              <Link
                href="/apply"
                className="group relative px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                Become a Legend
              </Link>
            </div>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
            {[
              {
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Verified Legends',
                description: 'Work with verified industry professionals who have proven track records.',
              },
              {
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'Secure Escrow',
                description: 'Your payments are protected until work is delivered and approved.',
              },
              {
                icon: (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: 'Legal Protection',
                description: 'Every collaboration includes automatic contract generation and e-signing.',
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

          {user && (
            <div className="max-w-6xl mx-auto animate-fadeIn">
              <h2 className="text-4xl font-bold text-white text-center mb-12">Welcome Back!</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Link
                  href="/marketplace"
                  className="group relative p-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md border border-white/20 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/20 group-hover:to-pink-600/20 transition-all duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Explore Marketplace</h3>
                    <p className="text-white/70 mb-4">Discover and connect with industry legends</p>
                    <div className="text-purple-300 font-semibold group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
                      Browse Now
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/marketplace/podcasts"
                  className="group relative p-8 bg-gradient-to-br from-pink-500/20 to-rose-500/20 backdrop-blur-md border border-white/20 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-600/0 to-rose-600/0 group-hover:from-pink-600/20 group-hover:to-rose-600/20 transition-all duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Explore Podcasts</h3>
                    <p className="text-white/70 mb-4">Find podcasts to collaborate with</p>
                    <div className="text-pink-300 font-semibold group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
                      Browse Podcasts
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/dashboard"
                  className="group relative p-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-md border border-white/20 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/0 to-blue-600/0 group-hover:from-cyan-600/20 group-hover:to-blue-600/20 transition-all duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">My Dashboard</h3>
                    <p className="text-white/70 mb-4">Manage your active collaborations</p>
                    <div className="text-cyan-300 font-semibold group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
                      View Projects
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </Link>

                {checkingApplication ? (
                  <div className="relative p-8 bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-md border border-white/20 rounded-2xl">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
                    </div>
                  </div>
                ) : legendApplication ? (
                  <div className="relative p-8 bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
                    <div className="relative z-10">
                      <div className={`w-16 h-16 ${legendApplication.status === 'approved'
                          ? 'bg-gradient-to-br from-green-400 to-emerald-400'
                          : legendApplication.status === 'declined'
                            ? 'bg-gradient-to-br from-red-400 to-rose-400'
                            : 'bg-gradient-to-br from-amber-400 to-orange-400'
                        } rounded-2xl flex items-center justify-center mb-6`}>
                        {legendApplication.status === 'approved' ? (
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : legendApplication.status === 'declined' ? (
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">Legend Application</h3>
                      <p className="text-white/70 mb-2">
                        {legendApplication.status === 'approved'
                          ? 'Your application has been approved!'
                          : legendApplication.status === 'declined'
                            ? 'Your application was declined'
                            : 'Your application is under review'}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${legendApplication.status === 'approved'
                            ? 'bg-green-500/20 text-green-300'
                            : legendApplication.status === 'declined'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                          {legendApplication.status.charAt(0).toUpperCase() + legendApplication.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/apply"
                    className="group relative p-8 bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-md border border-white/20 rounded-2xl hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-600/0 to-orange-600/0 group-hover:from-amber-600/20 group-hover:to-orange-600/20 transition-all duration-300"></div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">Become a Legend</h3>
                      <p className="text-white/70 mb-4">Share your expertise with the world</p>
                      <div className="text-amber-300 font-semibold group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
                        Apply Now
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="animate-fadeIn">
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">100%</div>
                <div className="text-white/70 text-lg">Verified Legends</div>
              </div>
              <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2">Secure</div>
                <div className="text-white/70 text-lg">Escrow Payments</div>
              </div>
              <div className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-2">24/7</div>
                <div className="text-white/70 text-lg">Platform Support</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
