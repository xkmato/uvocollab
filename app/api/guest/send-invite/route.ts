import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { sendGuestInvitationEmail } from '@/lib/mailgun';
import { CreateGuestInviteData, GuestInvite } from '@/app/types/guest';
import { Timestamp } from 'firebase-admin/firestore';
import crypto from 'crypto';

/**
 * POST /api/guest/send-invite
 * Send an invitation to a potential guest to join the platform
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      podcastId,
      podcastOwnerId,
      guestEmail,
      guestName,
      offeredAmount,
      message,
      preferredTopics,
      wishlistEntryId,
      expirationDays = 30,
    } = body as CreateGuestInviteData;

    // Validate required fields
    if (!podcastId || !podcastOwnerId || !guestEmail || !guestName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if user already exists with this email
    const existingUser = await adminDb
      .collection('users')
      .where('email', '==', guestEmail)
      .limit(1)
      .get();

    if (!existingUser.empty) {
      return NextResponse.json(
        { error: 'A user with this email already exists on the platform. Please add them directly from their profile.' },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation for this email from this podcast
    const existingInvite = await adminDb
      .collection('guestInvites')
      .where('podcastId', '==', podcastId)
      .where('guestEmail', '==', guestEmail)
      .where('status', '==', 'sent')
      .limit(1)
      .get();

    if (!existingInvite.empty) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email address' },
        { status: 400 }
      );
    }

    // Get podcast details
    const podcastDoc = await adminDb.collection('podcasts').doc(podcastId).get();
    if (!podcastDoc.exists) {
      return NextResponse.json(
        { error: 'Podcast not found' },
        { status: 404 }
      );
    }

    const podcastData = podcastDoc.data();
    const podcastName = podcastData?.title || 'Unknown Podcast';
    const podcastImageUrl = podcastData?.imageUrl;

    // Get podcast owner details
    const ownerDoc = await adminDb.collection('users').doc(podcastOwnerId).get();
    const ownerData = ownerDoc.data();
    const ownerName = ownerData?.name || ownerData?.displayName || 'Podcast Owner';

    // Generate unique invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // Create invite document
    const inviteRef = adminDb.collection('guestInvites').doc();
    const inviteData: Omit<GuestInvite, 'id'> = {
      inviteToken,
      podcastId,
      podcastName,
      podcastImageUrl,
      podcastOwnerId,
      guestEmail,
      guestName,
      offeredAmount: offeredAmount || 0,
      message: message || `I'd love to have you as a guest on ${podcastName}!`,
      preferredTopics: preferredTopics || [],
      status: 'sent',
      sentAt: new Date(),
      expiresAt,
      wishlistEntryId,
    };

    await inviteRef.set({
      ...inviteData,
      sentAt: Timestamp.fromDate(inviteData.sentAt),
      expiresAt: Timestamp.fromDate(inviteData.expiresAt),
    });

    // Generate invite link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/guest/accept-invite/${inviteToken}`;

    // Send invitation email
    try {
      await sendGuestInvitationEmail(
        guestEmail,
        guestName,
        podcastName,
        ownerName,
        offeredAmount || 0,
        message || `I'd love to have you as a guest on ${podcastName}!`,
        preferredTopics || [],
        inviteLink,
        expiresAt
      );
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the whole operation if email fails
      // The invite is still created and can be resent
    }

    // If this was triggered by a wishlist entry, update it
    if (wishlistEntryId) {
      try {
        await adminDb
          .collection('podcastGuestWishlists')
          .doc(wishlistEntryId)
          .update({
            inviteSent: true,
            inviteSentAt: Timestamp.now(),
            status: 'contacted',
          });
      } catch (updateError) {
        console.error('Failed to update wishlist entry:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      inviteId: inviteRef.id,
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    console.error('Error sending guest invitation:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
