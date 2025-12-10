import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ podcastId: string }> }
) {
  try {
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

    if (!podcastId) {
      return NextResponse.json({ error: 'Podcast ID is required' }, { status: 400 });
    }

    const docRef = adminDb.collection('podcasts').doc(podcastId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    const podcast = {
      id: doc.id,
      ...doc.data(),
      // Convert timestamps to ISO strings for JSON serialization
      createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || doc.data()?.createdAt,
      updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString() || doc.data()?.updatedAt,
    };

    return NextResponse.json({ podcast });
  } catch (error) {
    console.error('Error fetching podcast:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ podcastId: string }> }
) {
  try {
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

    if (!podcastId) {
      return NextResponse.json({ error: 'Podcast ID is required' }, { status: 400 });
    }

    const docRef = adminDb.collection('podcasts').doc(podcastId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    // Verify ownership
    if (doc.data()?.ownerId !== decodedToken.uid) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this podcast' }, { status: 403 });
    }

    // Soft delete: set isActive to false
    await docRef.update({
      isActive: false,
      deactivatedAt: FieldValue.serverTimestamp(),
      deactivatedBy: decodedToken.uid,
    });

    return NextResponse.json({ success: true, message: 'Podcast deleted successfully' });
  } catch (error) {
    console.error('Error deleting podcast:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ podcastId: string }> }
) {
  try {
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
    const { isActive } = body;

    if (!podcastId) {
      return NextResponse.json({ error: 'Podcast ID is required' }, { status: 400 });
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
    }

    const docRef = adminDb.collection('podcasts').doc(podcastId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    // Verify ownership
    if (doc.data()?.ownerId !== decodedToken.uid) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this podcast' }, { status: 403 });
    }

    // Update active status
    const updateData: any = {
      isActive,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!isActive) {
      updateData.deactivatedAt = FieldValue.serverTimestamp();
      updateData.deactivatedBy = decodedToken.uid;
    } else {
      // Reactivating - clear deactivation data
      updateData.deactivatedAt = null;
      updateData.deactivatedBy = null;
    }

    await docRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: `Podcast ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error updating podcast status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
