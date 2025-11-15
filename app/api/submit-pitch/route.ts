import { CreateCollaborationData } from '@/app/types/collaboration';
import { adminDb } from '@/lib/firebase-admin';
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

        const buyerId = decodedToken.uid;

        // Parse request body
        const body = await request.json();
        const {
            legendId,
            serviceId,
            price,
            pitchDemoUrl,
            pitchMessage,
            pitchBestWorkUrl,
        }: CreateCollaborationData = body;

        // Validate required fields
        if (!legendId || !serviceId || !price || !pitchMessage || !pitchBestWorkUrl) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate pitch message length
        if (pitchMessage.trim().length < 50) {
            return NextResponse.json(
                { error: 'Pitch message must be at least 50 characters' },
                { status: 400 }
            );
        }

        // Validate price
        if (price <= 0) {
            return NextResponse.json(
                { error: 'Invalid price' },
                { status: 400 }
            );
        }

        // Verify buyer cannot pitch to themselves
        if (buyerId === legendId) {
            return NextResponse.json(
                { error: 'You cannot request a collaboration with yourself' },
                { status: 400 }
            );
        }

        // Verify the legend exists and has the 'legend' role
        const legendDoc = await adminDb.collection('users').doc(legendId).get();
        if (!legendDoc.exists) {
            return NextResponse.json(
                { error: 'Legend not found' },
                { status: 404 }
            );
        }

        const legendData = legendDoc.data();
        if (legendData?.role !== 'legend') {
            return NextResponse.json(
                { error: 'User is not a verified Legend' },
                { status: 400 }
            );
        }

        // Verify the service exists and belongs to the legend
        const serviceDoc = await adminDb
            .collection('users')
            .doc(legendId)
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

        // Verify the price matches
        if (serviceData.price !== price) {
            return NextResponse.json(
                { error: 'Service price has changed. Please refresh and try again.' },
                { status: 400 }
            );
        }

        // Create the collaboration document
        const collaborationData = {
            buyerId,
            legendId,
            serviceId,
            price,
            status: 'pending_review',
            pitchDemoUrl: pitchDemoUrl || null,
            pitchMessage: pitchMessage.trim(),
            pitchBestWorkUrl: pitchBestWorkUrl.trim(),
            contractUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const collaborationRef = await adminDb
            .collection('collaborations')
            .add(collaborationData);

        // TODO (Epic 5.3): Send notification email to legend/manager about new pitch
        // This will be implemented in Task 5.3

        return NextResponse.json({
            success: true,
            collaborationId: collaborationRef.id,
            message: 'Pitch submitted successfully',
        });
    } catch (error) {
        console.error('Error submitting pitch:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
