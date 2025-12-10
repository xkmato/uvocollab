import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ podcastId: string }> }
) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { podcastId } = await params;
        const body = await request.json();
        const { evidence, email } = body;

        if (!podcastId || !evidence || !email) {
            return NextResponse.json({
                error: 'Missing required fields: evidence and email are required'
            }, { status: 400 });
        }

        // Verify podcast exists
        const podcastRef = adminDb.collection('podcasts').doc(podcastId);
        const podcastDoc = await podcastRef.get();

        if (!podcastDoc.exists) {
            return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
        }

        const podcastData = podcastDoc.data();

        // Prevent claiming own podcast
        if (podcastData?.ownerId === decodedToken.uid) {
            return NextResponse.json({
                error: 'You cannot claim a podcast you already own'
            }, { status: 400 });
        }

        // Check if user has already submitted a claim for this podcast
        const existingClaimsSnap = await adminDb.collection('claims')
            .where('podcastId', '==', podcastId)
            .where('claimantId', '==', decodedToken.uid)
            .where('status', '==', 'pending')
            .get();

        if (!existingClaimsSnap.empty) {
            return NextResponse.json({
                error: 'You have already submitted a claim for this podcast. Please wait for review.'
            }, { status: 400 });
        }

        // Create claim document
        const claimData = {
            podcastId,
            podcastTitle: podcastData?.title || '',
            claimantId: decodedToken.uid,
            claimantEmail: email,
            evidence,
            status: 'pending',
            createdAt: new Date(),
        };

        const claimRef = await adminDb.collection('claims').add(claimData);

        // TODO: Send notification emails to:
        // 1. Current podcast owner
        // 2. Admins for review
        // This can be implemented later using the existing email service

        return NextResponse.json({
            success: true,
            claimId: claimRef.id,
            message: 'Claim submitted successfully. Our team will review your request and contact you via email.'
        });
    } catch (error) {
        console.error('Error submitting claim:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
