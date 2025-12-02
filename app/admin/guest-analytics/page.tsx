'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import ProgressBar from '@/app/components/ProgressBar';

interface AnalyticsData {
    totalGuests: number;
    verifiedGuests: number;
    unverifiedGuests: number;
    totalCollaborations: number;
    completedCollaborations: number;
    averageGuestRate: number;
    totalMatches: number;
    successfulMatches: number;
    matchSuccessRate: number;
    totalInvites: number;
    acceptedInvites: number;
    inviteConversionRate: number;
    guestsByMonth: { month: string; count: number }[];
    collaborationsByMonth: { month: string; count: number }[];
}

export default function GuestAnalyticsPage() {
    const { user, userData, loading: authLoading } = useAuth();
    const router = useRouter();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'all'>('30d');

    useEffect(() => {
        if (!authLoading && (!user || userData?.role !== 'admin')) {
            router.push('/dashboard');
        }
    }, [authLoading, user, userData, router]);

    const loadAnalytics = useCallback(async () => {
        try {
            setLoading(true);

            // Calculate date range
            const now = new Date();
            let startDate = new Date(0); // Beginning of time
            if (timeRange === '30d') {
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            } else if (timeRange === '90d') {
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            }

            // Fetch all guests
            const usersRef = collection(db, 'users');
            const guestsQuery = query(usersRef, where('isGuest', '==', true));
            const guestsSnapshot = await getDocs(guestsQuery);
            const guests = guestsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    guestVerificationRequestedAt: data.guestVerificationRequestedAt?.toDate(),
                    createdAt: data.createdAt?.toDate(),
                    isVerifiedGuest: data.isVerifiedGuest || false,
                    guestRate: data.guestRate || 0,
                };
            });

            const totalGuests = guests.length;
            const verifiedGuests = guests.filter(g => g.isVerifiedGuest).length;
            const unverifiedGuests = totalGuests - verifiedGuests;

            // Calculate average rate
            const guestsWithRate = guests.filter(g => g.guestRate && g.guestRate > 0);
            const averageGuestRate = guestsWithRate.length > 0
                ? guestsWithRate.reduce((sum, g) => sum + (g.guestRate || 0), 0) / guestsWithRate.length
                : 0;

            // Fetch guest collaborations
            const collaborationsRef = collection(db, 'collaborations');
            const guestCollabsQuery = query(
                collaborationsRef,
                where('type', '==', 'guest_appearance')
            );
            const collabsSnapshot = await getDocs(guestCollabsQuery);
            const collaborations = collabsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    createdAt: data.createdAt?.toDate(),
                    status: data.status || '',
                };
            });

            const recentCollaborations = collaborations.filter(c => {
                const createdAt = c.createdAt;
                return !createdAt || createdAt >= startDate;
            });

            const totalCollaborations = recentCollaborations.length;
            const completedCollaborations = recentCollaborations.filter(
                c => c.status === 'completed'
            ).length;

            // Fetch matches
            const matchesRef = collection(db, 'matches');
            const matchesSnapshot = await getDocs(matchesRef);
            const matches = matchesSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    matchedAt: data.matchedAt?.toDate(),
                    status: data.status || '',
                };
            });

            const recentMatches = matches.filter(m => {
                const matchedAt = m.matchedAt;
                return !matchedAt || matchedAt >= startDate;
            });

            const totalMatches = recentMatches.length;
            const successfulMatches = recentMatches.filter(
                m => m.status === 'collaboration_started' || m.status === 'completed'
            ).length;
            const matchSuccessRate = totalMatches > 0 ? (successfulMatches / totalMatches) * 100 : 0;

            // Fetch invites
            const invitesRef = collection(db, 'guestInvites');
            const invitesSnapshot = await getDocs(invitesRef);
            const invites = invitesSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    sentAt: data.sentAt?.toDate(),
                    status: data.status || '',
                };
            });

            const recentInvites = invites.filter(i => {
                const sentAt = i.sentAt;
                return !sentAt || sentAt >= startDate;
            });

            const totalInvites = recentInvites.length;
            const acceptedInvites = recentInvites.filter(i => i.status === 'accepted').length;
            const inviteConversionRate = totalInvites > 0 ? (acceptedInvites / totalInvites) * 100 : 0;

            // Calculate trends by month (last 12 months)
            const monthlyGuests = calculateMonthlyTrend(guests, 'createdAt');
            const monthlyCollaborations = calculateMonthlyTrend(collaborations, 'createdAt');

            setAnalytics({
                totalGuests,
                verifiedGuests,
                unverifiedGuests,
                totalCollaborations,
                completedCollaborations,
                averageGuestRate,
                totalMatches,
                successfulMatches,
                matchSuccessRate,
                totalInvites,
                acceptedInvites,
                inviteConversionRate,
                guestsByMonth: monthlyGuests,
                collaborationsByMonth: monthlyCollaborations,
            });
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [timeRange]);

    useEffect(() => {
        if (user && userData?.role === 'admin') {
            loadAnalytics();
        }
    }, [user, userData, loadAnalytics]);

    const calculateMonthlyTrend = (items: Record<string, unknown>[], dateField: string) => {
        const monthCounts: { [key: string]: number } = {};
        const now = new Date();
        
        // Initialize last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthCounts[key] = 0;
        }

        // Count items by month
        items.forEach(item => {
            const date = item[dateField];
            if (date instanceof Date) {
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (key in monthCounts) {
                    monthCounts[key]++;
                }
            }
        });

        return Object.entries(monthCounts).map(([month, count]) => ({ month, count }));
    };

    const exportToCSV = () => {
        if (!analytics) return;

        const data = [
            ['Metric', 'Value'],
            ['Total Guests', analytics.totalGuests],
            ['Verified Guests', analytics.verifiedGuests],
            ['Unverified Guests', analytics.unverifiedGuests],
            ['Total Collaborations', analytics.totalCollaborations],
            ['Completed Collaborations', analytics.completedCollaborations],
            ['Average Guest Rate', `$${analytics.averageGuestRate.toFixed(2)}`],
            ['Total Matches', analytics.totalMatches],
            ['Successful Matches', analytics.successfulMatches],
            ['Match Success Rate', `${analytics.matchSuccessRate.toFixed(1)}%`],
            ['Total Invites', analytics.totalInvites],
            ['Accepted Invites', analytics.acceptedInvites],
            ['Invite Conversion Rate', `${analytics.inviteConversionRate.toFixed(1)}%`],
        ];

        const csv = data.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guest-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading analytics...</div>
            </div>
        );
    }

    if (!user || userData?.role !== 'admin' || !analytics) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-900 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Guest Analytics</h1>
                        <p className="text-white/70">Track guest feature usage and performance</p>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as '30d' | '90d' | 'all')}
                            className="px-4 py-2 bg-slate-800 text-white rounded-xl border border-white/10"
                            aria-label="Time range filter"
                        >
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="all">All Time</option>
                        </select>
                        <button
                            onClick={exportToCSV}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                        >
                            Export CSV
                        </button>
                        <Link
                            href="/admin/vetting"
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                        >
                            Back to Admin
                        </Link>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <div className="text-white/70 text-sm mb-1">Total Guests</div>
                        <div className="text-3xl font-bold text-white mb-2">{analytics.totalGuests}</div>
                        <div className="flex gap-3 text-sm">
                            <span className="text-green-400">✓ {analytics.verifiedGuests} verified</span>
                            <span className="text-white/50">{analytics.unverifiedGuests} pending</span>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <div className="text-white/70 text-sm mb-1">Guest Collaborations</div>
                        <div className="text-3xl font-bold text-white mb-2">{analytics.totalCollaborations}</div>
                        <div className="text-sm text-white/70">
                            {analytics.completedCollaborations} completed
                        </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <div className="text-white/70 text-sm mb-1">Average Guest Rate</div>
                        <div className="text-3xl font-bold text-white mb-2">
                            ${analytics.averageGuestRate.toFixed(0)}
                        </div>
                        <div className="text-sm text-white/70">per appearance</div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <div className="text-white/70 text-sm mb-1">Match Success Rate</div>
                        <div className="text-3xl font-bold text-white mb-2">
                            {analytics.matchSuccessRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-white/70">
                            {analytics.successfulMatches} of {analytics.totalMatches} matches
                        </div>
                    </div>
                </div>

                {/* Additional Metrics */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-4">Invitation Statistics</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-white/70">Total Invites Sent</span>
                                <span className="text-white font-semibold">{analytics.totalInvites}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/70">Accepted Invites</span>
                                <span className="text-white font-semibold">{analytics.acceptedInvites}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/70">Conversion Rate</span>
                                <span className="text-green-400 font-semibold">
                                    {analytics.inviteConversionRate.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-4">Matching Performance</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-white/70">Total Matches</span>
                                <span className="text-white font-semibold">{analytics.totalMatches}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/70">Successful Matches</span>
                                <span className="text-white font-semibold">{analytics.successfulMatches}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/70">Success Rate</span>
                                <span className="text-green-400 font-semibold">
                                    {analytics.matchSuccessRate.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Guest Signups Trend */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-4">Guest Signups (Last 12 Months)</h3>
                        <div className="space-y-2">
                            {(() => {
                                const maxCount = Math.max(...analytics.guestsByMonth.map(g => g.count));
                                return analytics.guestsByMonth.map(({ month, count }) => {
                                    const widthPercent = Math.max((count / maxCount) * 100, 5);
                                    return (
                                        <div key={month} className="flex items-center gap-3">
                                            <div className="text-white/70 text-sm w-20">{month}</div>
                                            <ProgressBar percentage={widthPercent} color="purple" />
                                            <div className="text-white font-semibold w-8 text-right">{count}</div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    {/* Collaborations Trend */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-4">Guest Collaborations (Last 12 Months)</h3>
                        <div className="space-y-2">
                            {(() => {
                                const maxCount = Math.max(...analytics.collaborationsByMonth.map(c => c.count));
                                return analytics.collaborationsByMonth.map(({ month, count }) => {
                                    const widthPercent = Math.max((count / maxCount) * 100, 5);
                                    return (
                                        <div key={month} className="flex items-center gap-3">
                                            <div className="text-white/70 text-sm w-20">{month}</div>
                                            <ProgressBar percentage={widthPercent} color="cyan" />
                                            <div className="text-white font-semibold w-8 text-right">{count}</div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
