'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { GuestSettings, DEFAULT_GUEST_SETTINGS } from '@/app/types/settings';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

export default function GuestSettingsPage() {
    const { user, userData, loading: authLoading } = useAuth();
    const router = useRouter();
    const [settings, setSettings] = useState<GuestSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (!authLoading && (!user || userData?.role !== 'admin')) {
            router.push('/dashboard');
        }
    }, [authLoading, user, userData, router]);

    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            if (!user) return;

            const idToken = await user.getIdToken();
            const response = await fetch('/api/admin/guest-settings', {
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to load settings');
            }

            const data = await response.json();
            setSettings(data.settings);
        } catch (error) {
            console.error('Error loading settings:', error);
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user && userData?.role === 'admin') {
            loadSettings();
        }
    }, [user, userData, loadSettings]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !settings) return;

        setSaving(true);
        setMessage(null);

        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/admin/guest-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to save settings');
            }

            setMessage({ type: 'success', text: 'Settings saved successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Failed to save settings',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm('Reset all settings to defaults?')) {
            setSettings({
                ...DEFAULT_GUEST_SETTINGS,
                updatedAt: new Date(),
                updatedBy: user?.uid || '',
            } as GuestSettings);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading settings...</div>
            </div>
        );
    }

    if (!user || userData?.role !== 'admin' || !settings) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-900 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Guest Feature Settings</h1>
                        <p className="text-white/70">Configure guest feature parameters</p>
                    </div>
                    <Link
                        href="/admin/vetting"
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                    >
                        Back to Admin
                    </Link>
                </div>

                {/* Message */}
                {message && (
                    <div
                        className={`mb-6 p-4 rounded-xl ${
                            message.type === 'success'
                                ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                                : 'bg-red-500/20 border border-red-500/50 text-red-300'
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Feature Flags */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4">Feature Flags</h2>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between">
                                <div>
                                    <div className="text-white font-semibold">Guest Feature Enabled</div>
                                    <div className="text-white/70 text-sm">Master switch for all guest features</div>
                                </div>
                                <input
                                    type="checkbox"
                                    id="guestFeatureEnabled"
                                    checked={settings.guestFeatureEnabled}
                                    onChange={(e) =>
                                        setSettings({ ...settings, guestFeatureEnabled: e.target.checked })
                                    }
                                    className="w-6 h-6 rounded bg-slate-700 border-white/20"
                                    aria-label="Guest Feature Enabled"
                                />
                            </label>
                            <label className="flex items-center justify-between">
                                <div>
                                    <div className="text-white font-semibold">Public Guest Discovery</div>
                                    <div className="text-white/70 text-sm">
                                        Allow guests to appear in public marketplace
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    id="publicGuestDiscoveryEnabled"
                                    checked={settings.publicGuestDiscoveryEnabled}
                                    onChange={(e) =>
                                        setSettings({ ...settings, publicGuestDiscoveryEnabled: e.target.checked })
                                    }
                                    className="w-6 h-6 rounded bg-slate-700 border-white/20"
                                    aria-label="Public Guest Discovery"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Rate Settings */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4">Rate Settings</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="minGuestRate" className="block text-white/70 text-sm mb-2">Minimum Guest Rate (USD)</label>
                                <input
                                    type="number"
                                    id="minGuestRate"
                                    min="0"
                                    value={settings.minGuestRate}
                                    onChange={(e) =>
                                        setSettings({ ...settings, minGuestRate: Number(e.target.value) })
                                    }
                                    className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-xl text-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="maxGuestRate" className="block text-white/70 text-sm mb-2">Maximum Guest Rate (USD)</label>
                                <input
                                    type="number"
                                    id="maxGuestRate"
                                    min="0"
                                    value={settings.maxGuestRate}
                                    onChange={(e) =>
                                        setSettings({ ...settings, maxGuestRate: Number(e.target.value) })
                                    }
                                    className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-xl text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Invite Settings */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4">Invitation Settings</h2>
                        <div>
                            <label htmlFor="inviteExpirationDays" className="block text-white/70 text-sm mb-2">
                                Invite Expiration (Days)
                            </label>
                            <input
                                type="number"
                                id="inviteExpirationDays"
                                min="1"
                                max="365"
                                value={settings.inviteExpirationDays}
                                onChange={(e) =>
                                    setSettings({ ...settings, inviteExpirationDays: Number(e.target.value) })
                                }
                                className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-xl text-white"
                            />
                            <p className="text-white/50 text-sm mt-1">
                                Number of days until guest invitations expire
                            </p>
                        </div>
                    </div>

                    {/* Matching Settings */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4">Matching Settings</h2>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between">
                                <div>
                                    <div className="text-white font-semibold">Auto-Matching Enabled</div>
                                    <div className="text-white/70 text-sm">
                                        Automatically create matches when criteria are met
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    id="autoMatchingEnabled"
                                    checked={settings.autoMatchingEnabled}
                                    onChange={(e) =>
                                        setSettings({ ...settings, autoMatchingEnabled: e.target.checked })
                                    }
                                    className="w-6 h-6 rounded bg-slate-700 border-white/20"
                                    aria-label="Auto-Matching Enabled"
                                />
                            </label>
                            <div>
                                <label htmlFor="minimumMatchScore" className="block text-white/70 text-sm mb-2">
                                    Minimum Match Score (0-100)
                                </label>
                                <input
                                    type="number"
                                    id="minimumMatchScore"
                                    min="0"
                                    max="100"
                                    value={settings.minimumMatchScore}
                                    onChange={(e) =>
                                        setSettings({ ...settings, minimumMatchScore: Number(e.target.value) })
                                    }
                                    className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-xl text-white"
                                />
                                <p className="text-white/50 text-sm mt-1">
                                    Minimum compatibility score required for auto-matching
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Verification Settings */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4">Verification Settings</h2>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between">
                                <div>
                                    <div className="text-white font-semibold">Verification Required</div>
                                    <div className="text-white/70 text-sm">
                                        Require verification to appear in premium listings
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    id="verificationRequired"
                                    checked={settings.verificationRequired}
                                    onChange={(e) =>
                                        setSettings({ ...settings, verificationRequired: e.target.checked })
                                    }
                                    className="w-6 h-6 rounded bg-slate-700 border-white/20"
                                    aria-label="Verification Required"
                                />
                            </label>
                            <div>
                                <label htmlFor="autoVerifyThreshold" className="block text-white/70 text-sm mb-2">
                                    Auto-Verify Threshold
                                </label>
                                <input
                                    type="number"
                                    id="autoVerifyThreshold"
                                    min="0"
                                    value={settings.autoVerifyThreshold}
                                    onChange={(e) =>
                                        setSettings({ ...settings, autoVerifyThreshold: Number(e.target.value) })
                                    }
                                    className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-xl text-white"
                                />
                                <p className="text-white/50 text-sm mt-1">
                                    Number of successful collaborations before automatic verification
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Email Templates */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4">Email Templates</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="inviteEmailTemplate" className="block text-white/70 text-sm mb-2">Invite Email Template</label>
                                <input
                                    type="text"
                                    id="inviteEmailTemplate"
                                    value={settings.inviteEmailTemplate}
                                    onChange={(e) =>
                                        setSettings({ ...settings, inviteEmailTemplate: e.target.value })
                                    }
                                    className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-xl text-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="matchNotificationTemplate" className="block text-white/70 text-sm mb-2">Match Notification Template</label>
                                <input
                                    type="text"
                                    id="matchNotificationTemplate"
                                    value={settings.matchNotificationTemplate}
                                    onChange={(e) =>
                                        setSettings({ ...settings, matchNotificationTemplate: e.target.value })
                                    }
                                    className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-xl text-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="verificationApprovalTemplate" className="block text-white/70 text-sm mb-2">Verification Approval Template</label>
                                <input
                                    type="text"
                                    id="verificationApprovalTemplate"
                                    value={settings.verificationApprovalTemplate}
                                    onChange={(e) =>
                                        setSettings({ ...settings, verificationApprovalTemplate: e.target.value })
                                    }
                                    className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-xl text-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="verificationDeclineTemplate" className="block text-white/70 text-sm mb-2">Verification Decline Template</label>
                                <input
                                    type="text"
                                    id="verificationDeclineTemplate"
                                    value={settings.verificationDeclineTemplate}
                                    onChange={(e) =>
                                        setSettings({ ...settings, verificationDeclineTemplate: e.target.value })
                                    }
                                    className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-xl text-white"
                                />
                            </div>
                        </div>
                        <p className="text-white/50 text-sm mt-2">
                            Template keys used by the email system (managed in Mailgun)
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={saving}
                            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Reset to Defaults
                        </button>
                    </div>
                </form>

                {/* Last Updated Info */}
                {settings.updatedAt && (
                    <div className="mt-6 text-center text-white/50 text-sm">
                        Last updated: {new Date(settings.updatedAt).toLocaleString()}
                    </div>
                )}
            </div>
        </div>
    );
}
