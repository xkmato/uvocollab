import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { PodcastGuestWishlist } from '@/app/types/guest';

/**
 * GET /api/podcast/wishlist?podcastId=xxx
 * Retrieves all guest wishlist entries for a podcast
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const podcastId = searchParams.get('podcastId');

    if (!podcastId) {
      return NextResponse.json({ error: 'Missing podcastId parameter' }, { status: 400 });
    }

    // Fetch all wishlist entries for the podcast
    const wishlistQuery = await adminDb
      .collection('podcastGuestWishlists')
      .where('podcastId', '==', podcastId)
      .orderBy('createdAt', 'desc')
      .get();

    const wishlists: PodcastGuestWishlist[] = wishlistQuery.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      viewedAt: doc.data().viewedAt?.toDate(),
      inviteSentAt: doc.data().inviteSentAt?.toDate(),
    })) as PodcastGuestWishlist[];

    return NextResponse.json({ wishlists }, { status: 200 });
  } catch (error) {
    console.error('Error fetching podcast guest wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}
