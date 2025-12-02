import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { GuestInvite } from '@/app/types/guest';

/**
 * GET /api/guest/invite/[token]
 * Fetch guest invitation details by token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find invitation by token
    const inviteQuery = await adminDb
      .collection('guestInvites')
      .where('inviteToken', '==', token)
      .limit(1)
      .get();

    if (inviteQuery.empty) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    const inviteDoc = inviteQuery.docs[0];
    const inviteData = inviteDoc.data();

    // Check if invitation is already accepted or declined
    if (inviteData.status !== 'sent') {
      return NextResponse.json(
        { error: 'This invitation has already been processed' },
        { status: 410 }
      );
    }

    // Convert Firestore timestamps to ISO strings
    const invite: GuestInvite = {
      id: inviteDoc.id,
      inviteToken: inviteData.inviteToken,
      podcastId: inviteData.podcastId,
      podcastName: inviteData.podcastName,
      podcastImageUrl: inviteData.podcastImageUrl,
      podcastOwnerId: inviteData.podcastOwnerId,
      guestEmail: inviteData.guestEmail,
      guestName: inviteData.guestName,
      offeredAmount: inviteData.offeredAmount,
      message: inviteData.message,
      preferredTopics: inviteData.preferredTopics || [],
      status: inviteData.status,
      sentAt: inviteData.sentAt?.toDate() || new Date(),
      expiresAt: inviteData.expiresAt?.toDate() || new Date(),
      acceptedAt: inviteData.acceptedAt?.toDate(),
      declinedAt: inviteData.declinedAt?.toDate(),
      acceptedByUserId: inviteData.acceptedByUserId,
      wishlistEntryId: inviteData.wishlistEntryId,
    };

    return NextResponse.json({ invite });
  } catch (error) {
    console.error('Error fetching guest invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
}
