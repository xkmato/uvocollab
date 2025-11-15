'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useEffect, useState } from 'react';

interface Bank {
    id: number;
    code: string;
    name: string;
}

interface BankAccountFormProps {
    onSuccess?: () => void;
}

export default function BankAccountForm({ onSuccess }: BankAccountFormProps) {
    const { user } = useAuth();
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingBanks, setLoadingBanks] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [accountConnected, setAccountConnected] = useState(false);
    const [maskedAccountNumber, setMaskedAccountNumber] = useState('');

    const [formData, setFormData] = useState({
        accountBank: '',
        accountNumber: '',
        businessName: '',
        businessEmail: '',
        businessContact: '',
        businessMobile: '',
    });

    useEffect(() => {
        fetchBanks();
        checkSubaccountStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchBanks = async () => {
        try {
            const response = await fetch('/api/flutterwave/banks');
            const data = await response.json();
            if (data.success) {
                setBanks(data.banks);
            }
        } catch (err) {
            console.error('Error fetching banks:', err);
        } finally {
            setLoadingBanks(false);
        }
    };

    const checkSubaccountStatus = async () => {
        if (!user) return;

        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/flutterwave/subaccount', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (data.hasSubaccount) {
                setAccountConnected(true);
                setMaskedAccountNumber(data.accountNumber);
            }
        } catch (err) {
            console.error('Error checking subaccount status:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/flutterwave/subaccount', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to connect bank account');
            }

            setSuccess('Bank account connected successfully!');
            setAccountConnected(true);
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    if (accountConnected) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-green-900">
                            Bank Account Connected
                        </h3>
                        <p className="text-green-700">
                            Account ending in {maskedAccountNumber}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                            You&apos;re all set to receive payments!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Connect Your Bank Account
                </h2>
                <p className="text-gray-600">
                    Connect your bank account to receive payments from collaborations.
                    This is required before your services can be published.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="businessName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Business/Artist Name *
                    </label>
                    <input
                        type="text"
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your stage or business name"
                    />
                </div>

                <div>
                    <label
                        htmlFor="businessEmail"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Business Email *
                    </label>
                    <input
                        type="email"
                        id="businessEmail"
                        name="businessEmail"
                        value={formData.businessEmail}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="business@example.com"
                    />
                </div>

                <div>
                    <label
                        htmlFor="businessContact"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Contact Name *
                    </label>
                    <input
                        type="text"
                        id="businessContact"
                        name="businessContact"
                        value={formData.businessContact}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Full name"
                    />
                </div>

                <div>
                    <label
                        htmlFor="businessMobile"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Mobile Number *
                    </label>
                    <input
                        type="tel"
                        id="businessMobile"
                        name="businessMobile"
                        value={formData.businessMobile}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+234 XXX XXX XXXX"
                    />
                </div>

                <div>
                    <label
                        htmlFor="accountBank"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Bank *
                    </label>
                    <select
                        id="accountBank"
                        name="accountBank"
                        value={formData.accountBank}
                        onChange={handleChange}
                        required
                        disabled={loadingBanks}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">
                            {loadingBanks ? 'Loading banks...' : 'Select your bank'}
                        </option>
                        {banks.map((bank) => (
                            <option key={bank.id} value={bank.code}>
                                {bank.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="accountNumber"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Account Number *
                    </label>
                    <input
                        type="text"
                        id="accountNumber"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        required
                        maxLength={10}
                        pattern="[0-9]{10}"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="10-digit account number"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Enter your 10-digit account number
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Platform commission is 20%. You will receive
                        80% of each collaboration payment.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading || loadingBanks}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Connecting...' : 'Connect Bank Account'}
                </button>
            </form>
        </div>
    );
}
