import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { adminAuth } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * POST /api/guest/accept-invite
 * Accept a guest invitation and update user profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Get the authenticated user from the session
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

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

    // Check if invitation is still valid
    if (inviteData.status !== 'sent') {
      return NextResponse.json(
        { error: 'This invitation has already been processed' },
        { status: 410 }
      );
    }

    // Check if invitation is expired
    const expiresAt = inviteData.expiresAt?.toDate();
    if (expiresAt && expiresAt < new Date()) {
      // Mark as expired
      await inviteDoc.ref.update({
        status: 'expired',
        updatedAt: Timestamp.now(),
      });
      
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // Update user profile to be a guest if not already
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const updates: { isGuest?: boolean; role?: string } = {};

    if (!userData?.isGuest) {
      updates.isGuest = true;
      updates.role = 'guest';
    }

    if (Object.keys(updates).length > 0) {
      await userRef.update(updates);
    }

    // Update invitation status
    await inviteDoc.ref.update({
      status: 'accepted',
      acceptedAt: Timestamp.now(),
      acceptedByUserId: userId,
      updatedAt: Timestamp.now(),
    });

    // Update wishlist entry if it exists
    if (inviteData.wishlistEntryId) {
      try {
        const wishlistRef = adminDb
          .collection('podcastGuestWishlists')
          .doc(inviteData.wishlistEntryId);
        
        const wishlistDoc = await wishlistRef.get();
        if (wishlistDoc.exists) {
          await wishlistRef.update({
            guestId: userId,
            isRegistered: true,
            status: 'matched',
            updatedAt: Timestamp.now(),
          });
        }
      } catch (error) {
        console.error('Error updating wishlist entry:', error);
      }
    }

    // TODO: Create a collaboration opportunity (future enhancement)
    // For now, just mark the invitation as accepted

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      userId,
      // collaborationId: null, // TODO: Create collaboration
    });
  } catch (error) {
    console.error('Error accepting guest invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
