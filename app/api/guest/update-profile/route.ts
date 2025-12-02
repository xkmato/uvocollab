import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
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

        // Verify user is a guest
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists || !userDoc.data()?.isGuest) {
            return NextResponse.json(
                { message: 'User is not a guest' },
                { status: 403 }
            );
        }

        // Parse the request body
        const updateData = await req.json();

        // Update user document
        await adminDb.collection('users').doc(uid).update({
            ...updateData,
            updatedAt: new Date(),
        });

        return NextResponse.json(
            { message: 'Profile updated successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating guest profile:', error);
        return NextResponse.json(
            { message: 'Failed to update profile', error: String(error) },
            { status: 500 }
        );
    }
}
