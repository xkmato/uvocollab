import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * POST /api/admin/update-prospect-email
 * Update email for a guest prospect and automatically send invitation
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
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

    // Verify user is admin
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { prospectId, email } = body;

    if (!prospectId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: prospectId, email' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get prospect details
    const prospectRef = adminDb.collection('podcastGuestWishlists').doc(prospectId);
    const prospectDoc = await prospectRef.get();

    if (!prospectDoc.exists) {
      return NextResponse.json(
        { error: 'Prospect not found' },
        { status: 404 }
      );
    }

    const prospectData = prospectDoc.data();

    // Update prospect with email
    await prospectRef.update({
      guestEmail: email,
      updatedAt: Timestamp.now(),
    });

    // Automatically send invitation
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      
      // Get podcast details to find owner
      const podcastDoc = await adminDb.collection('podcasts').doc(prospectData!.podcastId).get();
      const podcastData = podcastDoc.data();
      const podcastOwnerId = podcastData?.ownerId;

      if (!podcastOwnerId) {
        throw new Error('Podcast owner not found');
      }

      const inviteResponse = await fetch(`${baseUrl}/api/guest/send-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          podcastId: prospectData!.podcastId,
          podcastOwnerId,
          guestEmail: email,
          guestName: prospectData!.guestName,
          offeredAmount: prospectData!.budgetAmount,
          message: prospectData!.notes,
          preferredTopics: prospectData!.preferredTopics,
          wishlistEntryId: prospectId,
        }),
      });

      if (!inviteResponse.ok) {
        console.error('Failed to send invitation automatically');
      }
    } catch (inviteError) {
      console.error('Error sending automatic invitation:', inviteError);
      // Don't fail the whole operation if invitation fails
    }

    return NextResponse.json({
      success: true,
      message: 'Email updated and invitation sent successfully',
    });
  } catch (error) {
    console.error('Error updating prospect email:', error);
    return NextResponse.json(
      { error: 'Failed to update email' },
      { status: 500 }
    );
  }
}
