import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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

    const ownerId = decodedToken.uid;

    // Get podcast ID
    const podcastSnapshot = await adminDb.collection('podcasts')
      .where('ownerId', '==', ownerId)
      .limit(1)
      .get();

    if (podcastSnapshot.empty) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    const podcastId = podcastSnapshot.docs[0].id;

    const servicesSnapshot = await adminDb.collection('podcasts')
      .doc(podcastId)
      .collection('services')
      .orderBy('createdAt', 'desc')
      .get();

    const services = servicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    }));

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const ownerId = decodedToken.uid;
    const body = await request.json();
    const { title, description, price, duration, type } = body;

    if (!title || !description || price === undefined || !duration || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get podcast ID
    const podcastSnapshot = await adminDb.collection('podcasts')
      .where('ownerId', '==', ownerId)
      .limit(1)
      .get();

    if (podcastSnapshot.empty) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    const podcastId = podcastSnapshot.docs[0].id;

    const newService = {
      podcastId,
      title,
      description,
      price: Number(price),
      duration,
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection('podcasts')
      .doc(podcastId)
      .collection('services')
      .add(newService);

    return NextResponse.json({ success: true, serviceId: docRef.id });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
