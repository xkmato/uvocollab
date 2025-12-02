import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * PUT /api/guest/wishlist/update
 * Updates a guest wishlist entry (offer amount, topics, message)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { wishlistId, guestId, offerAmount, topics, message } = body;

    // Validate required fields
    if (!wishlistId || !guestId) {
      return NextResponse.json(
        { error: 'Missing required fields: wishlistId, guestId' },
        { status: 400 }
      );
    }

    // Fetch the wishlist entry
    const wishlistRef = adminDb.collection('guestWishlists').doc(wishlistId);
    const wishlistDoc = await wishlistRef.get();

    if (!wishlistDoc.exists) {
      return NextResponse.json({ error: 'Wishlist entry not found' }, { status: 404 });
    }

    const wishlistData = wishlistDoc.data();

    // Verify ownership
    if (wishlistData?.guestId !== guestId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (offerAmount !== undefined) {
      updateData.offerAmount = offerAmount;
    }

    if (topics) {
      updateData.topics = topics;
    }

    if (message) {
      updateData.message = message;
    }

    // Update the wishlist entry
    await wishlistRef.update(updateData);

    return NextResponse.json(
      {
        success: true,
        message: 'Wishlist entry updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating wishlist entry:', error);
    return NextResponse.json(
      { error: 'Failed to update wishlist entry' },
      { status: 500 }
    );
  }
}
