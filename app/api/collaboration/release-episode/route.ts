import { db } from '@/lib/firebase';
import { sendEmail } from '@/lib/mailgun';
import { initiateTransfer } from '@/lib/flutterwave';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, Timestamp, arrayUnion } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { collaborationId, userId, episodeUrl, episodeReleaseDate } = await request.json();

    if (!collaborationId || !userId || !episodeUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate episode URL format
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(episodeUrl)) {
      return NextResponse.json(
        { error: 'Invalid episode URL format' },
        { status: 400 }
      );
    }

    // Load collaboration
    const collabRef = doc(db, 'collaborations', collaborationId);
    const collabSnap = await getDoc(collabRef);

    if (!collabSnap.exists()) {
      return NextResponse.json(
        { error: 'Collaboration not found' },
        { status: 404 }
      );
    }

    const collaboration = collabSnap.data();

    // Verify it's a guest appearance
    if (collaboration.type !== 'guest_appearance') {
      return NextResponse.json(
        { error: 'This endpoint is only for guest appearance collaborations' },
        { status: 400 }
      );
    }

    // Verify user is the podcast owner (buyer)
    if (collaboration.buyerId !== userId) {
      return NextResponse.json(
        { error: 'Only the podcast owner can mark episode as released' },
        { status: 403 }
      );
    }

    // Verify collaboration is in post_production status
    if (collaboration.status !== 'post_production') {
      return NextResponse.json(
        { error: 'Episode can only be marked as released when status is post_production' },
        { status: 400 }
      );
    }

    // Update collaboration to completed status
    const updateData: any = {
      status: 'completed',
      updatedAt: Timestamp.now(),
      completedAt: Timestamp.now(),
      episodeUrl,
      episodeReleaseDate: episodeReleaseDate ? Timestamp.fromDate(new Date(episodeReleaseDate)) : Timestamp.now(),
    };

    await updateDoc(collabRef, updateData);

    // Get guest information
    let guestEmail = '';
    let guestName = '';
    let guestData: any = null;
    if (collaboration.guestId) {
      const guestQuery = query(collection(db, 'users'), where('uid', '==', collaboration.guestId));
      const guestSnap = await getDocs(guestQuery);
      if (!guestSnap.empty) {
        guestData = guestSnap.docs[0].data();
        guestEmail = guestData.email || '';
        guestName = guestData.displayName || guestData.email || 'Guest';
      }
    }

    // Get podcast information
    let podcastName = '';
    if (collaboration.podcastId) {
      const podcastDoc = await getDoc(doc(db, 'podcasts', collaboration.podcastId));
      if (podcastDoc.exists()) {
        podcastName = podcastDoc.data().title || 'the podcast';
      }
    }

    // Release escrow payment if applicable
    let paymentReleased = false;
    let paymentError = null;

    // Scenario 1: Podcast pays guest (guest is receiving payment)
    if (collaboration.price > 0 && 
        collaboration.escrowStatus === 'held' && 
        collaboration.legendAmount && 
        collaboration.guestId &&
        collaboration.buyerId !== collaboration.guestId) {
      
      // Get guest's bank account info
      if (guestData && guestData.bankAccountNumber && guestData.bankCode) {
        try {
          const transferRef = `RELEASE-${collaborationId}-${Date.now()}`;
          const transferResponse = await initiateTransfer({
            accountBank: guestData.bankCode,
            accountNumber: guestData.bankAccountNumber,
            amount: collaboration.legendAmount,
            narration: `Payment for guest appearance on ${podcastName}`,
            reference: transferRef,
            currency: 'NGN',
            beneficiaryName: guestName,
          });

          if (transferResponse.status === 'success') {
            await updateDoc(collabRef, {
              escrowStatus: 'released',
              payoutTransferId: transferResponse.data?.id,
              payoutReference: transferRef,
              payoutInitiatedAt: Timestamp.now().toDate().toISOString(),
            });
            paymentReleased = true;
          } else {
            paymentError = 'Payment transfer failed';
            await updateDoc(collabRef, {
              payoutError: {
                message: transferResponse.message || 'Transfer failed',
                timestamp: new Date().toISOString(),
              },
            });
          }
        } catch (error: any) {
          console.error('Error releasing payment to guest:', error);
          paymentError = error.message;
          await updateDoc(collabRef, {
            payoutError: {
              message: error.message || 'Transfer error',
              timestamp: new Date().toISOString(),
            },
          });
        }
      } else {
        paymentError = 'Guest bank account not configured';
        await updateDoc(collabRef, {
          payoutError: {
            message: 'Guest bank account information not available',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // Add episode to guest's profile (previousAppearances)
    if (collaboration.guestId && guestData) {
      const guestQuery = query(collection(db, 'users'), where('uid', '==', collaboration.guestId));
      const guestSnap = await getDocs(guestQuery);
      if (!guestSnap.empty) {
        const guestDocRef = guestSnap.docs[0].ref;
        await updateDoc(guestDocRef, {
          previousAppearances: arrayUnion(episodeUrl),
        });
      }
    }

    // Send notification email to guest
    if (guestEmail) {
      await sendEmail({
        to: guestEmail,
        subject: `Episode Released - ${podcastName}`,
        text: `Hi ${guestName},

Great news! Your episode on "${podcastName}" has been released!

Listen to it here: ${episodeUrl}

${paymentReleased ? 'Your payment has been processed and should arrive in your bank account within 1-2 business days.' : ''}
${paymentError ? `Note: There was an issue processing your payment: ${paymentError}. Our team will contact you to resolve this.` : ''}

We've added this episode to your profile's "Previous Appearances" section.

View Collaboration: ${process.env.NEXT_PUBLIC_BASE_URL}/collaboration/${collaborationId}

Thank you for being a guest!

Best regards,
The UvoCollab Team`,
        html: `
          <h2>Episode Released! 🎉</h2>
          <p>Hi ${guestName},</p>
          <p>Great news! Your episode on "<strong>${podcastName}</strong>" has been released!</p>
          <p><a href="${episodeUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">Listen to Episode</a></p>
          ${paymentReleased ? '<p style="color: green;"><strong>✓ Your payment has been processed and should arrive in your bank account within 1-2 business days.</strong></p>' : ''}
          ${paymentError ? `<p style="color: orange;"><strong>⚠️ Note: There was an issue processing your payment: ${paymentError}. Our team will contact you to resolve this.</strong></p>` : ''}
          <p>We've added this episode to your profile's "Previous Appearances" section.</p>
          <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/collaboration/${collaborationId}">View Collaboration</a></p>
          <p>Thank you for being a guest!</p>
          <p>Best regards,<br>The UvoCollab Team</p>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Episode released successfully',
      paymentReleased,
      paymentError,
    });
  } catch (error: any) {
    console.error('Error releasing episode:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to release episode' },
      { status: 500 }
    );
  }
}
