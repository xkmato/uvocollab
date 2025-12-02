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

        // Parse the request body
        const guestData = await req.json();

        // Update user document with guest data
        const userRef = adminDb.collection('users').doc(uid);
        await userRef.set(
            {
                ...guestData,
                uid,
                updatedAt: new Date(),
            },
            { merge: true }
        );

        return NextResponse.json(
            { message: 'Guest profile created successfully', uid },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error creating guest profile:', error);
        return NextResponse.json(
            { message: 'Failed to create guest profile', error: String(error) },
            { status: 500 }
        );
    }
}
