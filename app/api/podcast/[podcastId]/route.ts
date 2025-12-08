import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { podcastId: string } }
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

    const { podcastId } = params;

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
