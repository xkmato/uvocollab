import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { CreateGuestWishlistData, GuestWishlist } from '@/app/types/guest';

/**
 * POST /api/guest/wishlist/add-podcast
 * Adds a podcast to a guest's wishlist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guestId, podcastId, offerAmount, topics, message }: CreateGuestWishlistData = body;

    // Validate required fields
    if (!guestId || !podcastId || offerAmount === undefined || !topics || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: guestId, podcastId, offerAmount, topics, message' },
        { status: 400 }
      );
    }

    // Validate guest exists and is a guest
    const userRef = adminDb.collection('users').doc(guestId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Guest user not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData?.isGuest) {
      return NextResponse.json({ error: 'User is not a guest' }, { status: 403 });
    }

    // Validate podcast exists
    const podcastRef = adminDb.collection('podcasts').doc(podcastId);
    const podcastDoc = await podcastRef.get();

    if (!podcastDoc.exists) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    const podcastData = podcastDoc.data();

    // Check for duplicate wishlist entry
    const existingWishlistQuery = await adminDb
      .collection('guestWishlists')
      .where('guestId', '==', guestId)
      .where('podcastId', '==', podcastId)
      .limit(1)
      .get();

    if (!existingWishlistQuery.empty) {
      return NextResponse.json(
        { error: 'This podcast is already in your wishlist' },
        { status: 409 }
      );
    }

    // Create wishlist entry
    const wishlistData: Omit<GuestWishlist, 'id'> = {
      guestId,
      podcastId,
      podcastName: podcastData?.title,
      podcastImageUrl: podcastData?.coverImageUrl,
      offerAmount,
      topics,
      message,
      status: 'pending',
      createdAt: new Date(),
      viewedByPodcast: false,
    };

    const wishlistRef = await adminDb.collection('guestWishlists').add(wishlistData);

    // Return the created wishlist entry with ID
    return NextResponse.json(
      {
        success: true,
        wishlistId: wishlistRef.id,
        message: 'Podcast added to your wishlist successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding podcast to wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to add podcast to wishlist' },
      { status: 500 }
    );
  }
}
