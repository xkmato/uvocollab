import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/matching/dismiss-match
 * Dismiss a match (guest or podcast can dismiss)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const body = await req.json();
    const { matchId, dismissedBy } = body;

    if (!matchId || !dismissedBy) {
      return NextResponse.json(
        { message: 'Missing required fields: matchId, dismissedBy' },
        { status: 400 }
      );
    }

    if (dismissedBy !== 'guest' && dismissedBy !== 'podcast') {
      return NextResponse.json(
        { message: 'Invalid dismissedBy value. Must be "guest" or "podcast"' },
        { status: 400 }
      );
    }

    // Get match document
    const matchDoc = await adminDb.collection('matches').doc(matchId).get();
    if (!matchDoc.exists) {
      return NextResponse.json(
        { message: 'Match not found' },
        { status: 404 }
      );
    }

    const matchData = matchDoc.data();

    // Verify user has permission to dismiss
    if (dismissedBy === 'guest' && matchData?.guestId !== uid) {
      return NextResponse.json(
        { message: 'Unauthorized: You are not the guest in this match' },
        { status: 403 }
      );
    }

    if (dismissedBy === 'podcast' && matchData?.podcastOwnerId !== uid) {
      return NextResponse.json(
        { message: 'Unauthorized: You are not the podcast owner in this match' },
        { status: 403 }
      );
    }

    // Update match status
    await adminDb.collection('matches').doc(matchId).update({
      status: dismissedBy === 'guest' ? 'dismissed_by_guest' : 'dismissed_by_podcast',
      dismissedAt: new Date(),
      dismissedBy,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Match dismissed successfully'
    });

  } catch (error) {
    console.error('Error dismissing match:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to dismiss match',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
