import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { verifyTransaction } from '@/lib/flutterwave';
import { NextRequest, NextResponse } from 'next/server';

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
    const { transactionId, txRef, collaborationId } = body;

    if (!transactionId || !txRef || !collaborationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        { error: 'Unauthorized - not the buyer' },
        { status: 403 }
      );
    }

    // Verify the transaction reference matches
    if (collabData?.pendingTxRef !== txRef) {
      return NextResponse.json(
        { error: 'Transaction reference mismatch' },
        { status: 400 }
      );
    }

    // Verify payment with Flutterwave
    const verifyResponse = await verifyTransaction(transactionId);

    if (verifyResponse.status !== 'success') {
      return NextResponse.json(
        { error: 'Payment verification failed with Flutterwave' },
        { status: 400 }
      );
    }

    const transactionData = verifyResponse.data;

    // Verify transaction details
    if (
      transactionData.status !== 'successful' ||
      parseFloat(transactionData.amount) !== collabData.price ||
      transactionData.tx_ref !== txRef
    ) {
      return NextResponse.json(
        { error: 'Payment verification failed - details mismatch' },
        { status: 400 }
      );
    }

    // Payment is successful and captured
    // Funds are held in the platform's Flutterwave account (acting as escrow)
    // They will NOT be paid out to the Legend until the buyer marks the project as complete
    
    // Calculate amounts for record keeping
    const platformCommission = collabData.price * 0.2;
    const legendAmount = collabData.price - platformCommission;

    // Update collaboration status to awaiting_contract
    await adminDb
      .collection('collaborations')
      .doc(collaborationId)
      .update({
        status: 'awaiting_contract',
        paidAt: new Date().toISOString(),
        transactionId,
        txRef,
        platformCommission,
        legendAmount,
        escrowStatus: 'held', // Funds are held in escrow
        updatedAt: new Date().toISOString(),
      });

    // TODO: Send notification emails to both parties
    // - Buyer: Payment successful, awaiting contract
    // - Legend: Payment received (in escrow), contract will be sent soon
    // const buyerDoc = await adminDb.collection('users').doc(collabData.buyerId).get();
    // const legendDoc = await adminDb.collection('users').doc(collabData.legendId).get();
    // const buyerData = buyerDoc.data();
    // const legendData = legendDoc.data();

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      collaborationId,
      status: 'awaiting_contract',
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
