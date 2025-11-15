import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { initiateTransfer } from '@/lib/flutterwave';
import { sendEmail } from '@/lib/mailgun';
import { NextRequest, NextResponse } from 'next/server';

const PLATFORM_COMMISSION_RATE = 0.2; // 20% platform fee

export async function POST(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const body = await request.json();
    const { collaborationId } = body;

    if (!collaborationId) {
      return NextResponse.json(
        { error: 'Missing collaboration ID' },
        { status: 400 }
      );
    }

    // Get collaboration details
    const collabDoc = await adminDb
      .collection('collaborations')
      .doc(collaborationId)
      .get();

    if (!collabDoc.exists) {
      return NextResponse.json(
        { error: 'Collaboration not found' },
        { status: 404 }
      );
    }

    const collabData = collabDoc.data();

    // Verify the user is the buyer
    if (collabData?.buyerId !== uid) {
      return NextResponse.json(
        { error: 'Unauthorized - only the buyer can trigger payout' },
        { status: 403 }
      );
    }

    // Verify collaboration is in progress and has deliverables
    if (collabData?.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Collaboration must be in progress to trigger payout' },
        { status: 400 }
      );
    }

    if (!collabData?.deliverables || collabData.deliverables.length === 0) {
      return NextResponse.json(
        { error: 'Cannot trigger payout: No deliverables have been uploaded yet' },
        { status: 400 }
      );
    }

    // Check if payout has already been triggered
    if (collabData?.escrowStatus === 'released') {
      return NextResponse.json(
        { error: 'Payout has already been processed for this collaboration' },
        { status: 400 }
      );
    }

    // Get legend details
    const legendDoc = await adminDb
      .collection('users')
      .doc(collabData.legendId)
      .get();

    const legendData = legendDoc.data();

    if (!legendData) {
      return NextResponse.json(
        { error: 'Legend not found' },
        { status: 404 }
      );
    }

    // Verify legend has bank account connected
    if (!legendData.flutterwaveSubaccountId || !legendData.flutterwaveAccountBank || !legendData.flutterwaveAccountNumber) {
      return NextResponse.json(
        { error: 'Legend has not connected their bank account' },
        { status: 400 }
      );
    }

    // Get buyer details for email notification
    const buyerDoc = await adminDb
      .collection('users')
      .doc(collabData.buyerId)
      .get();

    const buyerData = buyerDoc.data();

    // Calculate platform commission (20%) and legend payout
    const platformCommission = collabData.price * PLATFORM_COMMISSION_RATE;
    const legendAmount = collabData.price - platformCommission;

    // Generate unique transfer reference
    const transferReference = `PAYOUT-${collaborationId}-${Date.now()}`;

    try {
      // Initiate transfer to Legend's bank account via Flutterwave
      const transferResponse = await initiateTransfer({
        accountBank: legendData.flutterwaveAccountBank,
        accountNumber: legendData.flutterwaveAccountNumber,
        amount: legendAmount,
        narration: `UvoCollab payout for collaboration ${collaborationId}`,
        reference: transferReference,
        currency: 'NGN',
        beneficiaryName: legendData.displayName || legendData.businessName,
      });

      if (transferResponse.status !== 'success') {
        console.error('Transfer failed:', transferResponse);
        return NextResponse.json(
          { error: 'Failed to initiate transfer to Legend' },
          { status: 500 }
        );
      }

      // Update collaboration document with payout details
      await adminDb
        .collection('collaborations')
        .doc(collaborationId)
        .update({
          status: 'completed',
          escrowStatus: 'released',
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          platformCommission,
          legendAmount,
          payoutTransferId: transferResponse.data?.id,
          payoutReference: transferReference,
          payoutInitiatedAt: new Date().toISOString(),
        });

      // Send confirmation emails to both parties
      try {
        // Email to Legend
        if (legendData.email) {
          await sendEmail({
            to: legendData.email,
            subject: 'Payment Released - Project Completed on UvoCollab',
            text: `Congratulations! The project has been marked as complete and your payment of ₦${legendAmount.toLocaleString()} has been released to your bank account.

Project Details:
- Collaboration ID: ${collaborationId}
- Amount: ₦${legendAmount.toLocaleString()}
- Transfer Reference: ${transferReference}

The funds should arrive in your bank account within 1-2 business days.

Thank you for being part of UvoCollab!`,
            html: `
              <h2>Payment Released - Project Completed</h2>
              <p>Congratulations! The project has been marked as complete and your payment has been released to your bank account.</p>
              <h3>Project Details:</h3>
              <ul>
                <li><strong>Collaboration ID:</strong> ${collaborationId}</li>
                <li><strong>Amount:</strong> ₦${legendAmount.toLocaleString()}</li>
                <li><strong>Transfer Reference:</strong> ${transferReference}</li>
              </ul>
              <p>The funds should arrive in your bank account within 1-2 business days.</p>
              <p>Thank you for being part of UvoCollab!</p>
            `,
          });
        }

        // Email to Buyer
        if (buyerData?.email) {
          await sendEmail({
            to: buyerData.email,
            subject: 'Project Completed - Payment Released on UvoCollab',
            text: `Your project has been marked as complete and the payment has been released to the Legend.

Project Details:
- Collaboration ID: ${collaborationId}
- Total Amount: ₦${collabData.price.toLocaleString()}
- Legend Payment: ₦${legendAmount.toLocaleString()}
- Platform Fee: ₦${platformCommission.toLocaleString()}

Thank you for using UvoCollab! We hope to see you again for your next collaboration.`,
            html: `
              <h2>Project Completed - Payment Released</h2>
              <p>Your project has been marked as complete and the payment has been released to the Legend.</p>
              <h3>Project Details:</h3>
              <ul>
                <li><strong>Collaboration ID:</strong> ${collaborationId}</li>
                <li><strong>Total Amount:</strong> ₦${collabData.price.toLocaleString()}</li>
                <li><strong>Legend Payment:</strong> ₦${legendAmount.toLocaleString()}</li>
                <li><strong>Platform Fee:</strong> ₦${platformCommission.toLocaleString()}</li>
              </ul>
              <p>Thank you for using UvoCollab! We hope to see you again for your next collaboration.</p>
            `,
          });
        }
      } catch (emailError) {
        // Log email errors but don't fail the payout
        console.error('Error sending confirmation emails:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: 'Payout initiated successfully',
        data: {
          transferId: transferResponse.data?.id,
          reference: transferReference,
          legendAmount,
          platformCommission,
          status: transferResponse.data?.status,
        },
      });
    } catch (transferError) {
      console.error('Error initiating transfer:', transferError);
      
      // Log the failed payout attempt
      await adminDb
        .collection('collaborations')
        .doc(collaborationId)
        .update({
          payoutError: {
            message: transferError instanceof Error ? transferError.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          },
          updatedAt: new Date().toISOString(),
        });

      return NextResponse.json(
        { error: 'Failed to initiate payout. Please contact support.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing payout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
