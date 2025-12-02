import { CreateCollaborationData } from '@/app/types/collaboration';
import { adminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/mailgun';
import { auth } from 'firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/collaboration/guest/initiate
 * 
 * Initiates a guest appearance collaboration between a guest and a podcast.
 * Supports three payment scenarios:
 * 1. Podcast pays guest (price > 0, podcast is buyer)
 * 2. Guest pays podcast (price > 0, guest is buyer)
 * 3. Free appearance (price = 0)
 * 
 * The endpoint determines payment direction based on the initiator and price.
 */
export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await auth().verifyIdToken(token);
        } catch (error) {
            console.error('Token verification failed:', error);
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const initiatorId = decodedToken.uid;

        // Parse request body
        const body = await request.json();
        const {
            guestId,
            podcastId,
            serviceId,
            price,
            agreedTopics,
            proposedTopics,
            proposedDates,
            message,
        } = body;

        // Validate required fields
        if (!guestId || !podcastId || !serviceId || price === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: guestId, podcastId, serviceId, and price are required' },
                { status: 400 }
            );
        }

        // Validate price
        if (price < 0) {
            return NextResponse.json(
                { error: 'Invalid price: price cannot be negative' },
                { status: 400 }
            );
        }

        // Validate topics
        const topics = agreedTopics || proposedTopics || [];
        if (topics.length === 0) {
            return NextResponse.json(
                { error: 'At least one topic must be provided' },
                { status: 400 }
            );
        }

        // Get guest information
        const guestDoc = await adminDb.collection('users').doc(guestId).get();
        if (!guestDoc.exists) {
            return NextResponse.json(
                { error: 'Guest not found' },
                { status: 404 }
            );
        }

        const guestData = guestDoc.data();
        if (!guestData?.isGuest) {
            return NextResponse.json(
                { error: 'User is not a registered guest' },
                { status: 400 }
            );
        }

        // Get podcast information
        const podcastDoc = await adminDb.collection('podcasts').doc(podcastId).get();
        if (!podcastDoc.exists) {
            return NextResponse.json(
                { error: 'Podcast not found' },
                { status: 404 }
            );
        }

        const podcastData = podcastDoc.data();
        const podcastOwnerId = podcastData?.userId;

        if (!podcastOwnerId) {
            return NextResponse.json(
                { error: 'Podcast owner not found' },
                { status: 404 }
            );
        }

        // Verify initiator is either the guest or the podcast owner
        if (initiatorId !== guestId && initiatorId !== podcastOwnerId) {
            return NextResponse.json(
                { error: 'You are not authorized to initiate this collaboration' },
                { status: 403 }
            );
        }

        // Verify the service exists
        const serviceDoc = await adminDb
            .collection('podcasts')
            .doc(podcastId)
            .collection('services')
            .doc(serviceId)
            .get();

        if (!serviceDoc.exists) {
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            );
        }

        const serviceData = serviceDoc.data();
        if (!serviceData?.isActive) {
            return NextResponse.json(
                { error: 'Service is not available' },
                { status: 400 }
            );
        }

        // Determine payment direction and buyer
        let buyerId: string;
        let paymentDirection: 'podcast_pays_guest' | 'guest_pays_podcast' | 'free';

        if (price === 0) {
            // Free appearance - set buyer as initiator for tracking
            buyerId = initiatorId;
            paymentDirection = 'free';
        } else {
            // Determine who is paying based on initiator and service type
            // If service has a price and guest is initiating, guest is paying
            // If podcast is initiating with a budget, podcast is paying
            if (initiatorId === guestId) {
                // Guest is initiating and offering to pay
                buyerId = guestId;
                paymentDirection = 'guest_pays_podcast';
            } else {
                // Podcast is initiating and offering to pay guest
                buyerId = podcastOwnerId;
                paymentDirection = 'podcast_pays_guest';
            }
        }

        // Check for existing pending collaborations between these parties
        const existingCollabsSnapshot = await adminDb
            .collection('collaborations')
            .where('type', '==', 'guest_appearance')
            .where('guestId', '==', guestId)
            .where('podcastId', '==', podcastId)
            .where('status', 'in', ['pending_agreement', 'pending_payment', 'scheduling', 'scheduled', 'in_progress'])
            .get();

        if (!existingCollabsSnapshot.empty) {
            return NextResponse.json(
                { error: 'An active collaboration already exists between this guest and podcast' },
                { status: 400 }
            );
        }

        // Create the collaboration document
        const collaborationData: CreateCollaborationData & {
            status: string;
            paymentDirection: string;
            initiatedBy: string;
            createdAt: Date;
            updatedAt: Date;
            negotiationHistory?: Array<{
                proposedBy: string;
                proposedPrice?: number;
                proposedTopics?: string[];
                proposedDates?: string;
                message?: string;
                timestamp: Date;
            }>;
        } = {
            type: 'guest_appearance',
            buyerId,
            guestId,
            podcastId,
            serviceId,
            price,
            status: 'pending_agreement',
            paymentDirection,
            initiatedBy: initiatorId,
            agreedTopics: agreedTopics || undefined,
            proposedTopics: proposedTopics || undefined,
            proposedDates: proposedDates || undefined,
            message: message || undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Add initial negotiation entry if there's a message
        if (message) {
            collaborationData.negotiationHistory = [{
                proposedBy: initiatorId,
                proposedPrice: price,
                proposedTopics: topics,
                proposedDates: proposedDates || undefined,
                message,
                timestamp: new Date(),
            }];
        }

        const collaborationRef = await adminDb
            .collection('collaborations')
            .add(collaborationData);

        // Get podcast owner information
        const podcastOwnerDoc = await adminDb.collection('users').doc(podcastOwnerId).get();
        const podcastOwnerData = podcastOwnerDoc.data();

        // Send notification emails to both parties
        try {
            // Email to the other party (not the initiator)
            const recipientId = initiatorId === guestId ? podcastOwnerId : guestId;
            const recipientDoc = await adminDb.collection('users').doc(recipientId).get();
            const recipientData = recipientDoc.data();

            if (recipientData?.email) {
                await sendCollaborationProposalEmail(
                    recipientData.email,
                    recipientData.displayName || 'there',
                    initiatorId === guestId ? guestData.displayName : podcastOwnerData?.displayName || 'A podcast',
                    podcastData.title,
                    price,
                    paymentDirection,
                    topics,
                    message || '',
                    collaborationRef.id
                );
            }
        } catch (emailError) {
            console.error('Error sending notification email:', emailError);
            // Don't fail the request if email fails
        }

        // Update match status if this collaboration was initiated from a match
        try {
            const matchesSnapshot = await adminDb
                .collection('matches')
                .where('guestId', '==', guestId)
                .where('podcastId', '==', podcastId)
                .where('status', '==', 'active')
                .get();

            if (!matchesSnapshot.empty) {
                const batch = adminDb.batch();
                matchesSnapshot.docs.forEach(doc => {
                    batch.update(doc.ref, {
                        status: 'collaboration_started',
                        collaborationId: collaborationRef.id,
                        updatedAt: new Date(),
                    });
                });
                await batch.commit();
            }
        } catch (matchError) {
            console.error('Error updating match status:', matchError);
            // Don't fail the request if match update fails
        }

        return NextResponse.json({
            success: true,
            collaborationId: collaborationRef.id,
            paymentDirection,
            message: 'Guest collaboration initiated successfully',
        });

    } catch (error) {
        console.error('Error initiating guest collaboration:', error);
        return NextResponse.json(
            { error: 'Failed to initiate collaboration. Please try again.' },
            { status: 500 }
        );
    }
}

/**
 * Send email notification about new collaboration proposal
 */
async function sendCollaborationProposalEmail(
    recipientEmail: string,
    recipientName: string,
    proposerName: string,
    podcastName: string,
    price: number,
    paymentDirection: string,
    topics: string[],
    message: string,
    collaborationId: string
): Promise<void> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const collaborationUrl = `${baseUrl}/collaboration/${collaborationId}/agreement`;

    let paymentText = '';
    if (paymentDirection === 'free') {
        paymentText = 'This will be a free appearance with no payment.';
    } else if (paymentDirection === 'podcast_pays_guest') {
        paymentText = `The podcast is offering to pay $${price.toFixed(2)} for this appearance.`;
    } else {
        paymentText = `The guest is offering to pay $${price.toFixed(2)} to appear on this podcast.`;
    }

    const subject = `New Guest Appearance Proposal for ${podcastName}`;
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
                .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
                .details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .cta-button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎤 New Guest Appearance Proposal</h1>
                </div>
                <div class="content">
                    <p>Hi ${recipientName},</p>
                    <p><strong>${proposerName}</strong> has proposed a guest appearance collaboration for <strong>${podcastName}</strong>!</p>
                    
                    <div class="details">
                        <h3>Proposal Details:</h3>
                        <p><strong>Payment:</strong> ${paymentText}</p>
                        <p><strong>Topics:</strong> ${topics.join(', ')}</p>
                        ${message ? `<p><strong>Message:</strong></p><p>${message}</p>` : ''}
                    </div>

                    <p>Review the proposal and negotiate terms if needed. Once you both agree, you can proceed with payment and scheduling.</p>
                    
                    <div style="text-align: center;">
                        <a href="${collaborationUrl}" class="cta-button">Review Proposal</a>
                    </div>
                </div>
                <div class="footer">
                    <p>UvoCollab - Connecting Podcasts with Amazing Guests</p>
                    <p>If you have any questions, please contact our support team.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    await sendEmail({
        to: recipientEmail,
        subject,
        text: `New Guest Appearance Proposal for ${podcastName}`,
        html,
    });
}
