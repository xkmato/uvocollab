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
        const { guestId, approve, reason, adminNotes } = await req.json();

        if (!guestId) {
            return NextResponse.json(
                { message: 'Guest ID is required' },
                { status: 400 }
            );
        }

        // Get guest document
        const guestDoc = await adminDb.collection('users').doc(guestId).get();
        if (!guestDoc.exists) {
            return NextResponse.json(
                { message: 'Guest not found' },
                { status: 404 }
            );
        }

        const guestData = guestDoc.data();

        if (approve) {
            // Approve verification
            const updateData: any = {
                isVerifiedGuest: true,
                guestVerificationApprovedAt: new Date(),
                guestVerificationApprovedBy: adminUid,
                updatedAt: new Date(),
            };
            
            if (adminNotes) {
                updateData.guestVerificationNotes = adminNotes;
            }
            
            await adminDb.collection('users').doc(guestId).update(updateData);

            // Send approval email
            try {
                await sendEmail({
                    to: guestData?.email || '',
                    subject: 'Your Guest Profile Has Been Verified!',
                    text: 'Congratulations! Your guest profile on UvoCollab has been verified.',
                    html: `
                        <h2>Congratulations! Your Guest Profile is Verified</h2>
                        <p>Hi ${guestData?.displayName},</p>
                        <p>Great news! Your guest profile on UvoCollab has been verified.</p>
                        <p>Your verified status will help you:</p>
                        <ul>
                            <li>Build trust with podcast hosts</li>
                            <li>Increase your visibility in search results</li>
                            <li>Stand out in the marketplace</li>
                        </ul>
                        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/guest/profile">View Your Profile</a></p>
                        <p>Best regards,<br>The UvoCollab Team</p>
                    `,
                });
            } catch (emailError) {
                console.error('Failed to send approval email:', emailError);
            }

            return NextResponse.json(
                { message: 'Guest verified successfully' },
                { status: 200 }
            );
        } else {
            // Decline verification
            const updateData: any = {
                guestVerificationRequestedAt: null, // Allow them to request again
                guestVerificationDeclinedAt: new Date(),
                guestVerificationDeclinedBy: adminUid,
                guestVerificationDeclineReason: reason || 'Not specified',
                updatedAt: new Date(),
            };
            
            if (adminNotes) {
                updateData.guestVerificationNotes = adminNotes;
            }
            
            await adminDb.collection('users').doc(guestId).update(updateData);

            // Send decline email
            try {
                await sendEmail({
                    to: guestData?.email || '',
                    subject: 'Update on Your Guest Verification Request',
                    text: 'Thank you for your interest in becoming a verified guest on UvoCollab. We are unable to approve your verification request at this time.',
                    html: `
                        <h2>Guest Verification Request Update</h2>
                        <p>Hi ${guestData?.displayName},</p>
                        <p>Thank you for your interest in becoming a verified guest on UvoCollab.</p>
                        <p>After reviewing your profile, we're unable to approve your verification request at this time.</p>
                        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
                        <p>You can update your profile and resubmit your verification request when you're ready.</p>
                        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/guest/profile">Update Your Profile</a></p>
                        <p>Best regards,<br>The UvoCollab Team</p>
                    `,
                });
            } catch (emailError) {
                console.error('Failed to send decline email:', emailError);
            }

            return NextResponse.json(
                { message: 'Verification request declined' },
                { status: 200 }
            );
        }
    } catch (error) {
        console.error('Error processing guest verification:', error);
        return NextResponse.json(
            { message: 'Failed to process verification', error: String(error) },
            { status: 500 }
        );
    }
}
