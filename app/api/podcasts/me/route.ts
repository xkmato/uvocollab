import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
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

    const ownerId = decodedToken.uid;

    const snapshot = await adminDb.collection('podcasts')
      .where('ownerId', '==', ownerId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ podcast: null });
    }

    const doc = snapshot.docs[0];
    const podcast = {
      id: doc.id,
      ...doc.data(),
      // Convert timestamps to ISO strings for JSON serialization
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    };

    return NextResponse.json({ podcast });
  } catch (error) {
    console.error('Error fetching podcast:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    const ownerId = decodedToken.uid;
    const body = await request.json();

    // Get the podcast to ensure ownership
    const snapshot = await adminDb.collection('podcasts')
      .where('ownerId', '==', ownerId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    const docRef = snapshot.docs[0].ref;
    
    // Fields allowed to be updated
    const { title, description, coverImageUrl, categories, avgListeners, rssFeedUrl, websiteUrl } = body;
    
        const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;
    if (categories !== undefined) updateData.categories = categories;
    if (avgListeners !== undefined) updateData.avgListeners = avgListeners;
    if (rssFeedUrl !== undefined) updateData.rssFeedUrl = rssFeedUrl;
    if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;

    await docRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating podcast:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
