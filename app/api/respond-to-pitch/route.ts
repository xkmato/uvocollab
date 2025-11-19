import { adminDb } from '@/lib/firebase-admin';
import { sendPitchAcceptedEmail, sendPitchDeclinedEmail } from '@/lib/mailgun';
import { auth } from 'firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

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

        const legendId = decodedToken.uid;

        // Parse request body
        const body = await request.json();
        const { collaborationId, action } = body;

        // Validate required fields
        if (!collaborationId || !action) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate action
        if (action !== 'accept' && action !== 'decline') {
            return NextResponse.json(
                { error: 'Invalid action. Must be "accept" or "decline"' },
                { status: 400 }
            );
        }

        // Get the collaboration document
        const collaborationRef = adminDb.collection('collaborations').doc(collaborationId);
        const collaborationDoc = await collaborationRef.get();

        if (!collaborationDoc.exists) {
            return NextResponse.json(
                { error: 'Collaboration not found' },
                { status: 404 }
            );
        }

        const collaborationData = collaborationDoc.data();

        // Check if this is a podcast collaboration
        if (collaborationData?.type === 'podcast') {
            const podcastId = collaborationData.podcastId;
            const podcastDoc = await adminDb.collection('podcasts').doc(podcastId).get();
            
            if (!podcastDoc.exists) {
                return NextResponse.json(
                    { error: 'Podcast not found' },
                    { status: 404 }
                );
            }

            const podcastData = podcastDoc.data();
            
            // Verify the user owns this podcast
            if (podcastData?.ownerId !== legendId) { // legendId here is actually the authenticated user ID
                return NextResponse.json(
                    { error: 'You do not have permission to respond to this pitch' },
                    { status: 403 }
                );
            }

            // Verify the collaboration is in pending_review status
            if (collaborationData.status !== 'pending_review') {
                return NextResponse.json(
                    { error: `Cannot respond to pitch with status: ${collaborationData.status}` },
                    { status: 400 }
                );
            }

            // Get buyer information
            const buyerDoc = await adminDb.collection('users').doc(collaborationData.buyerId).get();
            if (!buyerDoc.exists) {
                return NextResponse.json(
                    { error: 'Buyer not found' },
                    { status: 404 }
                );
            }
            const buyerData = buyerDoc.data();

            // Get service information
            const serviceDoc = await adminDb
                .collection('podcasts')
                .doc(podcastId)
                .collection('services')
                .doc(collaborationData.serviceId)
                .get();
            const serviceData = serviceDoc.data();

            if (action === 'decline') {
                // Update collaboration status to declined
                await collaborationRef.update({
                    status: 'declined',
                    updatedAt: new Date(),
                });

                // Send decline email to buyer
                try {
                    await sendPitchDeclinedEmail(
                        buyerData?.email || '',
                        buyerData?.displayName || 'Guest',
                        podcastData?.title || 'Podcast',
                        serviceData?.title || 'Service'
                    );
                } catch (emailError) {
                    console.error('Failed to send decline email:', emailError);
                }

                return NextResponse.json({
                    success: true,
                    message: 'Pitch declined successfully',
                });
            } else {
                // action === 'accept'
                // Update collaboration status to pending_payment
                await collaborationRef.update({
                    status: 'pending_payment',
                    acceptedAt: new Date(),
                    updatedAt: new Date(),
                });

                // Send acceptance email to buyer
                try {
                    await sendPitchAcceptedEmail(
                        buyerData?.email || '',
                        buyerData?.displayName || 'Guest',
                        podcastData?.title || 'Podcast',
                        serviceData?.title || 'Service',
                        collaborationData.price,
                        collaborationId
                    );
                } catch (emailError) {
                    console.error('Failed to send acceptance email:', emailError);
                }

                return NextResponse.json({
                    success: true,
                    message: 'Pitch accepted successfully',
                });
            }
        }

        // Verify the legend owns this collaboration (Legacy/Legend Logic)
        if (collaborationData?.legendId !== legendId) {
            return NextResponse.json(
                { error: 'You do not have permission to respond to this pitch' },
                { status: 403 }
            );
        }

        // Verify the collaboration is in pending_review status
        if (collaborationData.status !== 'pending_review') {
            return NextResponse.json(
                { error: `Cannot respond to pitch with status: ${collaborationData.status}` },
                { status: 400 }
            );
        }

        // Get buyer information
        const buyerDoc = await adminDb.collection('users').doc(collaborationData.buyerId).get();
        if (!buyerDoc.exists) {
            return NextResponse.json(
                { error: 'Buyer not found' },
                { status: 404 }
            );
        }
        const buyerData = buyerDoc.data();

        // Get legend information
        const legendDoc = await adminDb.collection('users').doc(legendId).get();
        const legendData = legendDoc.data();

        // Get service information
        const serviceDoc = await adminDb
            .collection('users')
            .doc(legendId)
            .collection('services')
            .doc(collaborationData.serviceId)
            .get();
        const serviceData = serviceDoc.data();

        if (action === 'decline') {
            // Update collaboration status to declined
            await collaborationRef.update({
                status: 'declined',
                updatedAt: new Date(),
            });

            // Send decline email to buyer
            try {
                await sendPitchDeclinedEmail(
                    buyerData?.email || '',
                    buyerData?.displayName || 'Artist',
                    legendData?.displayName || 'Legend',
                    serviceData?.title || 'Service'
                );
            } catch (emailError) {
                console.error('Failed to send decline email:', emailError);
            }

            return NextResponse.json({
                success: true,
                message: 'Pitch declined successfully',
            });
        } else {
            // action === 'accept'
            // Update collaboration status to pending_payment
            await collaborationRef.update({
                status: 'pending_payment',
                acceptedAt: new Date(),
                updatedAt: new Date(),
            });

            // Send acceptance email to buyer
            try {
                await sendPitchAcceptedEmail(
                    buyerData?.email || '',
                    buyerData?.displayName || 'Artist',
                    legendData?.displayName || 'Legend',
                    serviceData?.title || 'Service',
                    collaborationData.price,
                    collaborationId
                );
            } catch (emailError) {
                console.error('Failed to send acceptance email:', emailError);
            }

            return NextResponse.json({
                success: true,
                message: 'Pitch accepted successfully',
            });
        }
    } catch (error) {
        console.error('Error responding to pitch:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
