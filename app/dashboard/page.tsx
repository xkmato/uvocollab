'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
    const { user, userData, logout, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
        if (!loading && userData && userData.role === 'legend') {
            router.push('/legend/dashboard');
        }
    }, [user, userData, loading, router]);

    if (loading) return <div>Loading...</div>;

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-2xl">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p>Welcome, {userData?.displayName || user.email}!</p>
                <p>Role: {userData?.role}</p>

                {userData?.role === 'admin' && (
                    <div className="mt-6">
                        <a
                            href="/admin/vetting"
                            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        >
                            Admin: Review Legend Applications
                        </a>
                    </div>
                )}

                <button
                    onClick={logout}
                    className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}