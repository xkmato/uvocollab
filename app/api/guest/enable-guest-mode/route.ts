import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

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
        const uid = decodedToken.uid;

        // Get user document
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        const userData = userDoc.data();

        // Check if already a guest
        if (userData?.isGuest) {
            return NextResponse.json(
                { message: 'User is already a guest' },
                { status: 400 }
            );
        }

        // Parse the request body
        const guestData = await req.json();

        // Update user document with guest data
        await adminDb.collection('users').doc(uid).update({
            ...guestData,
            updatedAt: new Date(),
        });

        return NextResponse.json(
            { message: 'Guest mode enabled successfully', uid },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error enabling guest mode:', error);
        return NextResponse.json(
            { message: 'Failed to enable guest mode', error: String(error) },
            { status: 500 }
        );
    }
}
