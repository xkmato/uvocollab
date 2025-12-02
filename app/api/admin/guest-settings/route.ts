import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { GuestSettings, DEFAULT_GUEST_SETTINGS } from '@/app/types/settings';

export async function GET(req: NextRequest) {
    try {
        // Get the auth token from the request
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Unauthorized: No token provided' },
                { status: 401 }
            );
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const adminUid = decodedToken.uid;

        // Verify admin role
        const adminDoc = await adminDb.collection('users').doc(adminUid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
            return NextResponse.json(
                { message: 'Forbidden: Admin access required' },
                { status: 403 }
            );
        }

        // Get settings document
        const settingsDoc = await adminDb.collection('platformSettings').doc('guestSettings').get();
        
        if (!settingsDoc.exists) {
            // Return default settings if none exist
            return NextResponse.json({
                settings: {
                    ...DEFAULT_GUEST_SETTINGS,
                    updatedAt: new Date(),
                    updatedBy: '',
                },
            });
        }

        const settings = settingsDoc.data() as GuestSettings;
        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Error fetching guest settings:', error);
        return NextResponse.json(
            { message: 'Failed to fetch settings', error: String(error) },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        // Get the auth token from the request
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { message: 'Unauthorized: No token provided' },
                { status: 401 }
            );
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const adminUid = decodedToken.uid;

        // Verify admin role
        const adminDoc = await adminDb.collection('users').doc(adminUid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
            return NextResponse.json(
                { message: 'Forbidden: Admin access required' },
                { status: 403 }
            );
        }

        // Parse request body
        const settings = await req.json();

        // Validate settings
        if (settings.minGuestRate < 0 || settings.maxGuestRate < settings.minGuestRate) {
            return NextResponse.json(
                { message: 'Invalid rate settings' },
                { status: 400 }
            );
        }

        if (settings.inviteExpirationDays < 1 || settings.inviteExpirationDays > 365) {
            return NextResponse.json(
                { message: 'Invite expiration must be between 1 and 365 days' },
                { status: 400 }
            );
        }

        if (settings.minimumMatchScore < 0 || settings.minimumMatchScore > 100) {
            return NextResponse.json(
                { message: 'Match score must be between 0 and 100' },
                { status: 400 }
            );
        }

        if (settings.autoVerifyThreshold < 0) {
            return NextResponse.json(
                { message: 'Auto-verify threshold must be non-negative' },
                { status: 400 }
            );
        }

        // Update settings
        const updatedSettings: GuestSettings = {
            ...settings,
            updatedAt: new Date(),
            updatedBy: adminUid,
        };

        await adminDb.collection('platformSettings').doc('guestSettings').set(updatedSettings);

        return NextResponse.json(
            { message: 'Settings updated successfully', settings: updatedSettings },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating guest settings:', error);
        return NextResponse.json(
            { message: 'Failed to update settings', error: String(error) },
            { status: 500 }
        );
    }
}
