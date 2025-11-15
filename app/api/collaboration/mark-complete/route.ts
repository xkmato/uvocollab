import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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

        // Update collaboration status to completed
        // Note: The actual payout logic (Task 8.1) will be implemented separately
        // For now, we're just updating the status
        await updateDoc(collabRef, {
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date(),
            escrowStatus: 'released', // This will trigger the payout in Task 8.1
        });

        // TODO: Task 8.1 - Implement actual Flutterwave payout
        // - Calculate platform commission (20%)
        // - Transfer (price - fee) to Legend's Flutterwave subaccount
        // - Send confirmation emails to both parties

        return NextResponse.json({
            success: true,
            message: 'Project marked as complete. Payout will be processed shortly.',
        });
    } catch (error) {
        console.error('Error marking collaboration as complete:', error);
        return NextResponse.json(
            { error: 'Failed to mark collaboration as complete' },
            { status: 500 }
        );
    }
}
