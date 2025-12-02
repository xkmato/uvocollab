import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * PUT /api/podcast/wishlist/update
 * Updates a podcast guest wishlist entry
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { wishlistId, podcastId, budgetAmount, preferredTopics, notes, contactInfo } = body;

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

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (budgetAmount !== undefined) {
      updateData.budgetAmount = budgetAmount;
    }

    if (preferredTopics !== undefined) {
      updateData.preferredTopics = preferredTopics;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (contactInfo !== undefined) {
      updateData.contactInfo = contactInfo;
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
