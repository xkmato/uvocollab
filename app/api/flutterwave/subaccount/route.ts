import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { createSubaccount, verifyBankAccount } from '@/lib/flutterwave';
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

    // Verify user is a legend
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'legend') {
      return NextResponse.json(
        { error: 'Only legends can create subaccounts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      accountBank,
      accountNumber,
      businessName,
      businessEmail,
      businessContact,
      businessMobile,
    } = body;

    // Validate required fields
    if (
      !accountBank ||
      !accountNumber ||
      !businessName ||
      !businessEmail ||
      !businessContact ||
      !businessMobile
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First, verify the bank account
    try {
      const verification = await verifyBankAccount({
        accountNumber,
        accountBank,
      });

      if (verification.status !== 'success') {
        return NextResponse.json(
          { error: 'Bank account verification failed' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Bank account verification error:', error);
      return NextResponse.json(
        { error: 'Failed to verify bank account' },
        { status: 400 }
      );
    }

    // Create the subaccount
    // Platform takes 20% commission
    const response = await createSubaccount({
      accountBank,
      accountNumber,
      businessName,
      businessEmail,
      businessContact,
      businessMobile,
      splitType: 'percentage',
      splitValue: 0.2, // 20% platform fee
    });

    if (response.status !== 'success') {
      return NextResponse.json(
        { error: 'Failed to create subaccount' },
        { status: 500 }
      );
    }

    // Save the subaccount ID to the user's document
    await adminDb.collection('users').doc(uid).update({
      flutterwaveSubaccountId: response.data.id,
      flutterwaveAccountBank: accountBank,
      flutterwaveAccountNumber: accountNumber,
      bankAccountVerified: true,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      subaccountId: response.data.id,
      message: 'Bank account connected successfully',
    });
  } catch (error) {
    console.error('Error creating Flutterwave subaccount:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get the current user's subaccount status
export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user document
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      hasSubaccount: !!userData.flutterwaveSubaccountId,
      bankAccountVerified: userData.bankAccountVerified || false,
      accountBank: userData.flutterwaveAccountBank || null,
      accountNumber: userData.flutterwaveAccountNumber
        ? `****${userData.flutterwaveAccountNumber.slice(-4)}`
        : null,
    });
  } catch (error) {
    console.error('Error fetching subaccount status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
