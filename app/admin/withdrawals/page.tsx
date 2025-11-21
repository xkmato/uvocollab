'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { User } from '@/app/types/user';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

interface WithdrawalRequest {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    status: 'pending' | 'completed' | 'rejected';
    createdAt: Date;
    completedAt?: Date;
}

interface WithdrawalWithUser extends WithdrawalRequest {
    userDetails?: User;
}

export default function AdminWithdrawalsPage() {
    const { userData } = useAuth();
    const [withdrawals, setWithdrawals] = useState<WithdrawalWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('pending');

    useEffect(() => {
        if (userData?.role === 'admin') {
            fetchWithdrawals();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData, filter]);

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const withdrawalsRef = collection(db, 'withdrawal_requests');
            let q;

            if (filter === 'all') {
                q = query(withdrawalsRef, orderBy('createdAt', 'desc'));
            } else {
                q = query(
                    withdrawalsRef,
                    where('status', '==', filter),
                    orderBy('createdAt', 'desc')
                );
            }

            const querySnapshot = await getDocs(q);
            const withdrawalData: WithdrawalRequest[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                completedAt: doc.data().completedAt?.toDate(),
            })) as WithdrawalRequest[];

            // Fetch user details for each withdrawal
            const withdrawalsWithUser: WithdrawalWithUser[] = await Promise.all(
                withdrawalData.map(async (withdrawal) => {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', withdrawal.userId));
                        if (userDoc.exists()) {
                            return {
                                ...withdrawal,
                                userDetails: userDoc.data() as User,
                            };
                        }
                    } catch (error) {
                        console.error(`Error fetching user for withdrawal ${withdrawal.id}:`, error);
                    }
                    return withdrawal;
                })
            );

            setWithdrawals(withdrawalsWithUser);
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
            alert('Failed to fetch withdrawal requests');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (withdrawalId: string, newStatus: 'completed' | 'rejected') => {
        if (!confirm(`Are you sure you want to mark this request as ${newStatus}?`)) return;

        try {
            await updateDoc(doc(db, 'withdrawal_requests', withdrawalId), {
                status: newStatus,
                completedAt: new Date(),
            });

            // Update local state
            setWithdrawals(prev => 
                prev.map(w => 
                    w.id === withdrawalId 
                        ? { ...w, status: newStatus, completedAt: new Date() } 
                        : w
                ).filter(() => filter === 'all' || filter === newStatus)
            );

            alert(`Withdrawal request marked as ${newStatus}`);
        } catch (error) {
            console.error('Error updating withdrawal status:', error);
            alert('Failed to update status');
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div>
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
                    <p className="text-gray-600">Manage payout requests from legends</p>
                </div>
                <div className="flex gap-2">
                    {(['pending', 'completed', 'rejected', 'all'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                filter === status
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading requests...</div>
            ) : withdrawals.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-500">No withdrawal requests found.</p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden rounded-lg">
                    <ul className="divide-y divide-gray-200">
                        {withdrawals.map((withdrawal) => (
                            <li key={withdrawal.id} className="p-6 hover:bg-gray-50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {withdrawal.userName}
                                            </h3>
                                            <p className="text-sm text-gray-500">{withdrawal.userEmail}</p>
                                        </div>
                                        {getStatusBadge(withdrawal.status)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Requested: {withdrawal.createdAt?.toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-md p-4 mb-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Payment Details</h4>
                                    {withdrawal.userDetails ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500 block">Method:</span>
                                                <span className="font-medium">
                                                    {withdrawal.userDetails.paymentMethod === 'mobile_money' 
                                                        ? 'Mobile Money' 
                                                        : 'Bank Account'}
                                                </span>
                                            </div>
                                            {withdrawal.userDetails.paymentMethod === 'mobile_money' ? (
                                                <>
                                                    <div>
                                                        <span className="text-gray-500 block">Provider:</span>
                                                        <span className="font-medium">{withdrawal.userDetails.mobileMoneyProvider}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block">Number:</span>
                                                        <span className="font-medium">{withdrawal.userDetails.flutterwaveAccountNumber}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div>
                                                        <span className="text-gray-500 block">Bank:</span>
                                                        <span className="font-medium">{withdrawal.userDetails.flutterwaveAccountBank}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block">Account Number:</span>
                                                        <span className="font-medium">{withdrawal.userDetails.flutterwaveAccountNumber}</span>
                                                    </div>
                                                </>
                                            )}
                                            <div>
                                                <span className="text-gray-500 block">Business Name:</span>
                                                <span className="font-medium">{withdrawal.userDetails.businessName}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">Contact:</span>
                                                <span className="font-medium">{withdrawal.userDetails.businessContact} ({withdrawal.userDetails.businessMobile})</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-red-500">User details not found</p>
                                    )}
                                </div>

                                {withdrawal.status === 'pending' && (
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => handleStatusUpdate(withdrawal.id, 'rejected')}
                                            className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 text-sm font-medium"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(withdrawal.id, 'completed')}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                                        >
                                            Mark as Completed
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
