import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  try {
    const { serviceId } = await params;
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

    const ownerId = decodedToken.uid;
    const body = await request.json();

    // Verify ownership via podcast
    const podcastSnapshot = await adminDb.collection('podcasts')
      .where('ownerId', '==', ownerId)
      .limit(1)
      .get();

    if (podcastSnapshot.empty) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    const podcastId = podcastSnapshot.docs[0].id;
    const serviceRef = adminDb.collection('podcasts').doc(podcastId).collection('services').doc(serviceId);
    const serviceDoc = await serviceRef.get();

    if (!serviceDoc.exists) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const { title, description, price, duration, type } = body;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (duration) updateData.duration = duration;
    if (type) updateData.type = type;

    await serviceRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  try {
    const { serviceId } = await params;
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

    const ownerId = decodedToken.uid;

    // Verify ownership via podcast
    const podcastSnapshot = await adminDb.collection('podcasts')
      .where('ownerId', '==', ownerId)
      .limit(1)
      .get();

    if (podcastSnapshot.empty) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    const podcastId = podcastSnapshot.docs[0].id;
    const serviceRef = adminDb.collection('podcasts').doc(podcastId).collection('services').doc(serviceId);
    const serviceDoc = await serviceRef.get();

    if (!serviceDoc.exists) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    await serviceRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
