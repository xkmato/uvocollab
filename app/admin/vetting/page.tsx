'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { LegendApplication } from '@/app/types/legendApplication';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminVettingPage() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const [applications, setApplications] = useState<LegendApplication[]>([]);
    const [loadingApplications, setLoadingApplications] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('pending');

    useEffect(() => {
        if (!loading && (!user || userData?.role !== 'admin')) {
            router.push('/dashboard');
        }
    }, [user, userData, loading, router]);

    useEffect(() => {
        if (userData?.role === 'admin') {
            fetchApplications();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData, filter]);

    const fetchApplications = async () => {
        setLoadingApplications(true);
        try {
            const applicationsRef = collection(db, 'legend_applications');
            let q;

            if (filter === 'all') {
                q = query(applicationsRef, orderBy('submittedAt', 'desc'));
            } else {
                q = query(
                    applicationsRef,
                    where('status', '==', filter),
                    orderBy('submittedAt', 'desc')
                );
            }

            const querySnapshot = await getDocs(q);
            const apps: LegendApplication[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                apps.push({
                    id: doc.id,
                    applicantUid: data.applicantUid,
                    status: data.status,
                    applicationData: data.applicationData,
                    submittedAt: data.submittedAt.toDate(),
                    reviewedAt: data.reviewedAt?.toDate(),
                    reviewedBy: data.reviewedBy,
                    reviewNotes: data.reviewNotes,
                });
            });

            setApplications(apps);
        } catch (error) {
            console.error('Error fetching applications:', error);
            alert('Failed to fetch applications');
        } finally {
            setLoadingApplications(false);
        }
    };

    if (loading || loadingApplications) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    if (!user || userData?.role !== 'admin') {
        return null;
    }

    return (
        <div>
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Legend Applications</h1>
                        <p className="mt-2 text-gray-600">Review and approve or decline Legend applications</p>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {(['pending', 'all', 'approved', 'declined'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`
                                    whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                                    ${filter === tab
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }
                                `}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Applications List */}
                {applications.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No {filter !== 'all' ? filter : ''} applications found</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {applications.map((application) => (
                            <ApplicationCard
                                key={application.id}
                                application={application}
                                onUpdate={fetchApplications}
                            />
                        ))}
                    </div>
                )}
        </div>
    );
}

interface ApplicationCardProps {
    application: LegendApplication;
    onUpdate: () => void;
}

function ApplicationCard({ application, onUpdate }: ApplicationCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const { applicationData, status, submittedAt } = application;

    const handleApprove = async () => {
        if (!confirm(`Are you sure you want to approve ${applicationData.artistName}?`)) {
            return;
        }

        setIsProcessing(true);
        try {
            // Get the ID token from Firebase Auth
            const { auth } = await import('@/lib/firebase');
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('Not authenticated');
            }
            const token = await currentUser.getIdToken();

            const response = await fetch('/api/admin/review-application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    applicationId: application.id,
                    action: 'approve',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to approve application');
            }

            alert('Application approved successfully!');
            onUpdate();
        } catch (error) {
            console.error('Error approving application:', error);
            alert(error instanceof Error ? error.message : 'Failed to approve application');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDecline = async () => {
        const reason = prompt(`Please provide a reason for declining ${applicationData.artistName}:`);
        if (!reason) {
            return;
        }

        setIsProcessing(true);
        try {
            // Get the ID token from Firebase Auth
            const { auth } = await import('@/lib/firebase');
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('Not authenticated');
            }
            const token = await currentUser.getIdToken();

            const response = await fetch('/api/admin/review-application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    applicationId: application.id,
                    action: 'decline',
                    notes: reason,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to decline application');
            }

            alert('Application declined successfully!');
            onUpdate();
        } catch (error) {
            console.error('Error declining application:', error);
            alert(error instanceof Error ? error.message : 'Failed to decline application');
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusBadge = () => {
        const baseClasses = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium';
        switch (status) {
            case 'pending':
                return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>;
            case 'approved':
                return <span className={`${baseClasses} bg-green-100 text-green-800`}>Approved</span>;
            case 'declined':
                return <span className={`${baseClasses} bg-red-100 text-red-800`}>Declined</span>;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                                {applicationData.artistName}
                            </h3>
                            {getStatusBadge()}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p><span className="font-medium">Email:</span> {applicationData.email}</p>
                            <p><span className="font-medium">Phone:</span> {applicationData.phone}</p>
                            <p><span className="font-medium">Management:</span> {applicationData.managementName} ({applicationData.managementEmail})</p>
                            <p><span className="font-medium">Submitted:</span> {submittedAt.toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Links */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {applicationData.spotifyLink && (
                        <a
                            href={applicationData.spotifyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded-md bg-green-600 text-white text-sm hover:bg-green-700"
                        >
                            🎵 Spotify
                        </a>
                    )}
                    {applicationData.instagramLink && (
                        <a
                            href={applicationData.instagramLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded-md bg-pink-600 text-white text-sm hover:bg-pink-700"
                        >
                            📸 Instagram
                        </a>
                    )}
                    {applicationData.twitterLink && (
                        <a
                            href={applicationData.twitterLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded-md bg-blue-500 text-white text-sm hover:bg-blue-600"
                        >
                            🐦 Twitter
                        </a>
                    )}
                    {applicationData.pressLinks && (
                        <a
                            href={applicationData.pressLinks}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded-md bg-gray-600 text-white text-sm hover:bg-gray-700"
                        >
                            📰 Press
                        </a>
                    )}
                </div>

                {/* Expandable Bio */}
                <div className="mt-4">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        {isExpanded ? '▼ Hide Bio' : '▶ Show Bio'}
                    </button>
                    {isExpanded && (
                        <div className="mt-2 p-4 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{applicationData.bio}</p>
                            {applicationData.referralFrom && (
                                <p className="mt-3 text-sm text-gray-600">
                                    <span className="font-medium">Referred by:</span> {applicationData.referralFrom}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                {status === 'pending' && (
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={handleApprove}
                            disabled={isProcessing}
                            className="flex-1 rounded-md bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'Processing...' : '✓ Approve'}
                        </button>
                        <button
                            onClick={handleDecline}
                            disabled={isProcessing}
                            className="flex-1 rounded-md bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'Processing...' : '✗ Decline'}
                        </button>
                    </div>
                )}

                {status !== 'pending' && application.reviewNotes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Review Notes:</span> {application.reviewNotes}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
