import { getBanks } from '@/lib/flutterwave';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get country from query params, default to Nigeria (NG)
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'NG';

    const response = await getBanks(country);

    if (response.status !== 'success') {
      return NextResponse.json(
        { error: 'Failed to fetch banks' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      banks: response.data,
    });
  } catch (error) {
    console.error('Error fetching banks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
