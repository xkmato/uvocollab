import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { collaborationId, buyerId } = await request.json();

        // Validate input
        if (!collaborationId || !buyerId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get the collaboration document
        const collabRef = doc(db, 'collaborations', collaborationId);
        const collabSnap = await getDoc(collabRef);

        if (!collabSnap.exists()) {
            return NextResponse.json(
                { error: 'Collaboration not found' },
                { status: 404 }
            );
        }

        const collaboration = collabSnap.data();

        // Verify the requester is the buyer
        if (collaboration.buyerId !== buyerId) {
            return NextResponse.json(
                { error: 'Unauthorized: Only the buyer can mark as complete' },
                { status: 403 }
            );
        }

        // Verify collaboration is in the correct status
        if (collaboration.status !== 'in_progress') {
            return NextResponse.json(
                { error: 'Collaboration must be in progress to mark as complete' },
                { status: 400 }
            );
        }

        // Check if at least one deliverable has been uploaded
        if (!collaboration.deliverables || collaboration.deliverables.length === 0) {
            return NextResponse.json(
                { error: 'Cannot mark as complete: No deliverables have been uploaded yet' },
                { status: 400 }
            );
        }

        // Call the trigger-payout API to process the payment
        // This will handle the Flutterwave transfer and update the collaboration status
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const payoutResponse = await fetch(`${baseUrl}/api/collaboration/trigger-payout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': request.headers.get('authorization') || '',
            },
            body: JSON.stringify({
                collaborationId,
            }),
        });

        const payoutData = await payoutResponse.json();

        if (!payoutResponse.ok) {
            return NextResponse.json(
                { error: payoutData.error || 'Failed to process payout' },
                { status: payoutResponse.status }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Project marked as complete and payout initiated successfully.',
            payout: payoutData.data,
        });
    } catch (error) {
        console.error('Error marking collaboration as complete:', error);
        return NextResponse.json(
            { error: 'Failed to mark collaboration as complete' },
            { status: 500 }
        );
    }
}
