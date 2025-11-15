import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

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
        { error: 'Unauthorized - not the buyer' },
        { status: 403 }
      );
    }

    // Verify collaboration is in pending_payment status
    if (collabData?.status !== 'pending_payment') {
      return NextResponse.json(
        { error: 'Collaboration is not awaiting payment' },
        { status: 400 }
      );
    }

    // Get legend details to verify they have a subaccount
    const legendDoc = await adminDb
      .collection('users')
      .doc(collabData.legendId)
      .get();

    const legendData = legendDoc.data();

    if (!legendData?.flutterwaveSubaccountId) {
      return NextResponse.json(
        { error: 'Legend has not connected their bank account' },
        { status: 400 }
      );
    }

    // Generate unique transaction reference
    const txRef = `UVOC-${collaborationId}-${uuidv4()}`;

    // Store transaction reference in collaboration doc
    await adminDb
      .collection('collaborations')
      .doc(collaborationId)
      .update({
        pendingTxRef: txRef,
        updatedAt: new Date().toISOString(),
      });

    // Calculate platform commission (20%)
    const platformCommission = collabData.price * 0.2;
    const legendAmount = collabData.price - platformCommission;

    // Return payment configuration with split payment setup
    // The payment will be held in escrow until the project is completed
    return NextResponse.json({
      success: true,
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
      txRef,
      amount: collabData.price,
      legendSubaccountId: legendData.flutterwaveSubaccountId,
      splitPayment: {
        // Split payment configuration for escrow
        // This holds the funds until manual payout is triggered
        subaccountId: legendData.flutterwaveSubaccountId,
        platformAmount: platformCommission,
        legendAmount: legendAmount,
      },
    });
  } catch (error) {
    console.error('Error initializing payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
