import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { sendPodcastApprovalEmail, sendPodcastDeclineEmail } from '@/lib/mailgun';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check admin role
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { podcastId, action, notes } = await request.json();
    if (!podcastId || !action) {
      return NextResponse.json({ error: 'Missing required fields: podcastId and action' }, { status: 400 });
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action. Must be "approve" or "reject"' }, { status: 400 });
    }

    const podcastRef = adminDb.collection('podcasts').doc(podcastId);
    const podcastDoc = await podcastRef.get();
    if (!podcastDoc.exists) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }
    const podcastData = podcastDoc.data();
    const ownerId = podcastData?.ownerId;
    if (!ownerId) {
      return NextResponse.json({ error: 'Invalid podcast data' }, { status: 400 });
    }

    // Update podcast status
    await podcastRef.update({
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewedAt: new Date(),
      reviewedBy: decodedToken.uid,
      reviewNotes: notes || null,
      updatedAt: new Date(),
    });

    // If approved, ensure user doc has hasPodcast true and notify owner
    const ownerDoc = await adminDb.collection('users').doc(ownerId).get();
    const ownerData = ownerDoc.data();
    const ownerEmail = ownerData?.email;

    if (action === 'approve') {
      try {
        await adminDb.collection('users').doc(ownerId).set({ hasPodcast: true, updatedAt: new Date() }, { merge: true });
      } catch (err) {
        console.error('Failed to update owner document for podcast approval', err);
      }

      try {
        await sendPodcastApprovalEmail(ownerEmail || '', podcastData.title || 'Your Podcast');
      } catch (emailErr) {
        console.error('Failed to send podcast approval email', emailErr);
      }
    } else {
      // rejection: optional set hasPodcast false? We'll keep it as-is but notify owner
      try {
        await sendPodcastDeclineEmail(ownerEmail || '', podcastData.title || 'Your Podcast', notes || '');
      } catch (emailErr) {
        console.error('Failed to send podcast rejection email', emailErr);
      }
    }

    return NextResponse.json({ success: true, message: `Podcast ${action === 'approve' ? 'approved' : 'rejected'} successfully` }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error reviewing podcast:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to review podcast', details: errorMessage }, { status: 500 });
  }
}
