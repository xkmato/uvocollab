import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { CreatePodcastGuestWishlistData, PodcastGuestWishlist } from '@/app/types/guest';

/**
 * POST /api/podcast/wishlist/add-guest
 * Adds a guest to a podcast's wishlist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      podcastId,
      guestId,
      guestName,
      guestEmail,
      budgetAmount,
      preferredTopics,
      notes,
      contactInfo,
      isRegistered,
    }: CreatePodcastGuestWishlistData = body;

    // Validate required fields
    if (!podcastId || !guestName || budgetAmount === undefined || !notes) {
      return NextResponse.json(
        { error: 'Missing required fields: podcastId, guestName, budgetAmount, notes' },
        { status: 400 }
      );
    }

    // Validate podcast exists
    const podcastRef = adminDb.collection('podcasts').doc(podcastId);
    const podcastDoc = await podcastRef.get();

    if (!podcastDoc.exists) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    const podcastData = podcastDoc.data();

    // If guest is registered, validate guest exists
    let guestProfileImageUrl: string | undefined;
    if (isRegistered && guestId) {
      const userRef = adminDb.collection('users').doc(guestId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return NextResponse.json({ error: 'Guest user not found' }, { status: 404 });
      }

      const userData = userDoc.data();
      if (!userData?.isGuest) {
        return NextResponse.json({ error: 'User is not a guest' }, { status: 403 });
      }

      guestProfileImageUrl = userData.profileImageUrl;

      // Check for duplicate wishlist entry for registered guest
      const existingWishlistQuery = await adminDb
        .collection('podcastGuestWishlists')
        .where('podcastId', '==', podcastId)
        .where('guestId', '==', guestId)
        .limit(1)
        .get();

      if (!existingWishlistQuery.empty) {
        return NextResponse.json(
          { error: 'This guest is already in your wishlist' },
          { status: 409 }
        );
      }
    }

    // Create wishlist entry
    const wishlistData: Omit<PodcastGuestWishlist, 'id'> = {
      podcastId,
      podcastName: podcastData?.title,
      guestId: isRegistered ? guestId : undefined,
      guestName,
      guestEmail,
      guestProfileImageUrl,
      budgetAmount,
      preferredTopics,
      notes,
      contactInfo,
      status: 'pending',
      isRegistered,
      inviteSent: false,
      createdAt: new Date(),
      viewedByGuest: false,
    };

    const wishlistRef = await adminDb.collection('podcastGuestWishlists').add(wishlistData);

    // If registered guest, notify them (future enhancement)
    // TODO: Send notification to guest

    return NextResponse.json(
      {
        success: true,
        wishlistId: wishlistRef.id,
        message: 'Guest added to your wishlist successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding guest to wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to add guest to wishlist' },
      { status: 500 }
    );
  }
}
