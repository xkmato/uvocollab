import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { GuestWishlist } from '@/app/types/guest';

/**
 * GET /api/guest/wishlist?guestId=xxx
 * Retrieves all wishlist entries for a guest
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guestId');

    if (!guestId) {
      return NextResponse.json({ error: 'Missing guestId parameter' }, { status: 400 });
    }

    // Fetch all wishlist entries for the guest
    const wishlistQuery = await adminDb
      .collection('guestWishlists')
      .where('guestId', '==', guestId)
      .orderBy('createdAt', 'desc')
      .get();

    const wishlists: GuestWishlist[] = wishlistQuery.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      viewedAt: doc.data().viewedAt?.toDate(),
    })) as GuestWishlist[];

    return NextResponse.json({ wishlists }, { status: 200 });
  } catch (error) {
    console.error('Error fetching guest wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}
