import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * DELETE /api/podcast/wishlist/remove
 * Removes a guest from podcast's wishlist
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { wishlistId, podcastId } = body;

    // Validate required fields
    if (!wishlistId || !podcastId) {
      return NextResponse.json(
        { error: 'Missing required fields: wishlistId, podcastId' },
        { status: 400 }
      );
    }

    // Fetch the wishlist entry
    const wishlistRef = adminDb.collection('podcastGuestWishlists').doc(wishlistId);
    const wishlistDoc = await wishlistRef.get();

    if (!wishlistDoc.exists) {
      return NextResponse.json({ error: 'Wishlist entry not found' }, { status: 404 });
    }

    const wishlistData = wishlistDoc.data();

    // Verify ownership
    if (wishlistData?.podcastId !== podcastId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the wishlist entry
    await wishlistRef.delete();

    return NextResponse.json(
      {
        success: true,
        message: 'Guest removed from wishlist',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}
