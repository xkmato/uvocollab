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
        const { reason, description } = body;

        if (!podcastId || !reason || !description) {
            return NextResponse.json({
                error: 'Missing required fields: reason and description are required'
            }, { status: 400 });
        }

        // Validate reason
        const validReasons = ['inappropriate_content', 'copyright_violation', 'spam', 'misleading', 'other'];
        if (!validReasons.includes(reason)) {
            return NextResponse.json({ error: 'Invalid report reason' }, { status: 400 });
        }

        // Verify podcast exists
        const podcastRef = adminDb.collection('podcasts').doc(podcastId);
        const podcastDoc = await podcastRef.get();

        if (!podcastDoc.exists) {
            return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
        }

        // Create report document
        const reportData = {
            podcastId,
            podcastTitle: podcastDoc.data()?.title || '',
            reportedBy: decodedToken.uid,
            reporterEmail: decodedToken.email || '',
            reason,
            description,
            status: 'pending',
            createdAt: new Date(),
        };

        const reportRef = await adminDb.collection('reports').add(reportData);

        // TODO: Send notification email to admins
        // This can be implemented later using the existing email service

        return NextResponse.json({
            success: true,
            reportId: reportRef.id,
            message: 'Report submitted successfully. Our team will review it shortly.'
        });
    } catch (error) {
        console.error('Error submitting report:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
