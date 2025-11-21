'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { LegendApplication } from './types/legendApplication';

export default function Home() {
  const { user, userData, loading } = useAuth();
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
        {user ? (
          // Dashboard View for Logged-in Users
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
            {/* Header Zone */}
            <div className="flex items-center justify-between mb-8 animate-fadeIn">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  Welcome Back{userData?.displayName ? `, ${userData.displayName.split(' ')[0]}` : ''}!
                </h1>
                <p className="text-white/60 text-lg">What would you like to do today?</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <button className="relative p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {/* Notification Dot */}
                  <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
                </button>
                {/* Profile Avatar */}
                <Link
                  href="/dashboard"
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg hover:scale-110 transition-transform border-2 border-white/20"
                >
                  {userData?.displayName?.charAt(0).toUpperCase() || 'U'}
                </Link>
              </div>
            </div>

            {/* Legend Application Notification Banner */}
            {legendApplication && legendApplication.status === 'approved' && (
              <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md border border-green-500/30 animate-fadeIn">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">🎉 Congratulations!</h3>
                    <p className="text-white/80 mb-3">Your Legend Application has been approved! You can now offer your services to artists on the marketplace.</p>
                    <Link
                      href="/legend/dashboard"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full transition-all hover:scale-105"
                    >
                      View Legend Dashboard
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Action Center - Primary & Secondary Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Primary Action - Explore Marketplace (Spans 2 columns) */}
              <Link
                href="/marketplace"
                className="lg:col-span-2 group relative p-8 rounded-3xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20"
              >
                {/* Background Image Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/40 to-pink-600/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-5"></div>

                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3">Explore Marketplace</h3>
                  <p className="text-white/70 text-lg mb-6 max-w-lg">Connect with industry legends. Find the perfect collaborator to bring your musical vision to life.</p>
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 text-white font-semibold rounded-full transition-all group-hover:translate-x-2">
                    Browse Now
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>

              {/* Secondary Actions - Stacked */}
              <div className="flex flex-col gap-6">
                <Link
                  href="/dashboard"
                  className="group relative p-6 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/0 to-blue-600/0 group-hover:from-cyan-600/20 group-hover:to-blue-600/20 transition-all duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/20">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">My Dashboard</h3>
                    <p className="text-white/60 text-sm mb-3">Manage active collaborations</p>
                    <div className="inline-flex items-center gap-1 text-cyan-300 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                      View Projects
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>

                <Link
                  href={userData?.hasPodcast ? "/dashboard/podcast" : "/podcasts/register"}
                  className="group relative p-6 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-violet-600/0 group-hover:from-indigo-600/20 group-hover:to-violet-600/20 transition-all duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-violet-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {userData?.hasPodcast ? "Manage Podcast" : "List Your Podcast"}
                    </h3>
                    <p className="text-white/60 text-sm mb-3">
                      {userData?.hasPodcast ? "Update your details" : "Get sponsors & guests"}
                    </p>
                    <div className="inline-flex items-center gap-1 text-indigo-300 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                      {userData?.hasPodcast ? "Manage" : "Start Now"}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Additional Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link
                href="/marketplace/podcasts"
                className="group relative p-6 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-pink-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-600/0 to-rose-600/0 group-hover:from-pink-600/20 group-hover:to-rose-600/20 transition-all duration-300"></div>
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/20">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Explore Podcasts</h3>
                  <p className="text-white/60 text-sm mb-3">Find podcasts to collaborate with</p>
                  <div className="inline-flex items-center gap-1 text-pink-300 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                    Browse Podcasts
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>

              {!checkingApplication && !legendApplication && (
                <Link
                  href="/apply"
                  className="group relative p-6 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-600/0 to-orange-600/0 group-hover:from-amber-600/20 group-hover:to-orange-600/20 transition-all duration-300"></div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/20">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Become a Legend</h3>
                    <p className="text-white/60 text-sm mb-3">Share your expertise with the world</p>
                    <div className="inline-flex items-center gap-1 text-amber-300 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                      Apply Now
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              )}

              {legendApplication && legendApplication.status === 'pending' && (
                <div className="relative p-6 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-xl border border-amber-500/30">
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Legend Application</h3>
                    <p className="text-white/60 text-sm mb-3">Your application is under review</p>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-amber-500/20 text-amber-300">
                      Pending
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Trust Badges Footer Strip */}
            <div className="mt-16 pt-8 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ),
                    title: 'Verified Legends',
                    description: 'All professionals are vetted',
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ),
                    title: 'Secure Escrow',
                    description: 'Protected payments',
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ),
                    title: 'Automatic Contracts',
                    description: 'Legal protection built-in',
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 text-white/60"
                  >
                    <div className="text-purple-400">{feature.icon}</div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">{feature.title}</h4>
                      <p className="text-xs">{feature.description}</p>
                    </div>
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
                Where Rising Artists Meet Industry Legends
              </p>
              <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
                Connect, collaborate, and create magic with verified music industry professionals.
              </p>
            </div>

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
          </div>
        )}

        {/* How It Works Section */}
        <div className="py-20 bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-white text-center mb-16">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 -translate-y-1/2 opacity-30"></div>

              {[
                { step: '01', title: 'Discover', desc: 'Browse verified legends and podcasts.' },
                { step: '02', title: 'Connect', desc: 'Send a pitch or booking request.' },
                { step: '03', title: 'Collaborate', desc: 'Funds held securely in escrow.' },
                { step: '04', title: 'Release', desc: 'Get your completed project & rights.' }
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
