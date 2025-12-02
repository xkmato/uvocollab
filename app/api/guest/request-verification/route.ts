import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/mailgun';
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
        if (!userDoc.exists || !userDoc.data()?.isGuest) {
            return NextResponse.json(
                { message: 'User is not a guest' },
                { status: 403 }
            );
        }

        const userData = userDoc.data();

        // Check if already verified or request pending
        if (userData?.isVerifiedGuest) {
            return NextResponse.json(
                { message: 'User is already verified' },
                { status: 400 }
            );
        }

        if (userData?.guestVerificationRequestedAt) {
            return NextResponse.json(
                { message: 'Verification already requested' },
                { status: 400 }
            );
        }

        // Update user document with verification request timestamp
        await adminDb.collection('users').doc(uid).update({
            guestVerificationRequestedAt: new Date(),
            updatedAt: new Date(),
        });

        // Send notification email to admin team
        try {
            await sendEmail({
                to: process.env.ADMIN_EMAIL || 'admin@uvocollab.com',
                subject: 'New Guest Verification Request',
                text: `New Guest Verification Request from ${userData?.displayName} (${userData?.email})`,
                html: `
                    <h2>New Guest Verification Request</h2>
                    <p>A guest has requested verification on UvoCollab.</p>
                    <p><strong>Guest Details:</strong></p>
                    <ul>
                        <li>Name: ${userData?.displayName}</li>
                        <li>Email: ${userData?.email}</li>
                        <li>Bio: ${userData?.guestBio}</li>
                        <li>Topics: ${userData?.guestTopics?.join(', ')}</li>
                        <li>Rate: $${userData?.guestRate || 0}</li>
                    </ul>
                    <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/guest-verification">Review in Admin Panel</a></p>
                `,
            });
        } catch (emailError) {
            console.error('Failed to send notification email:', emailError);
            // Don't fail the request if email fails
        }

        return NextResponse.json(
            { message: 'Verification request submitted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error requesting verification:', error);
        return NextResponse.json(
            { message: 'Failed to request verification', error: String(error) },
            { status: 500 }
        );
    }
}
