import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { sendApprovalEmail, sendDeclineEmail } from '@/lib/mailgun';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the user's token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user is an admin
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const { applicationId, action, notes } = await request.json();

    if (!applicationId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: applicationId and action' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'decline') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "decline"' },
        { status: 400 }
      );
    }

    // Get the application document
    const applicationRef = adminDb.collection('legend_applications').doc(applicationId);
    const applicationDoc = await applicationRef.get();

    if (!applicationDoc.exists) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const applicationData = applicationDoc.data();
    const applicantUid = applicationData?.applicantUid;

    if (!applicantUid) {
      return NextResponse.json(
        { error: 'Invalid application data' },
        { status: 400 }
      );
    }

    // Update the application status
    await applicationRef.update({
      status: action === 'approve' ? 'approved' : 'declined',
      reviewedAt: new Date(),
      reviewedBy: decodedToken.uid,
      reviewNotes: notes || null,
    });

    if (action === 'approve') {
      // Update the user's role to 'legend'
      await adminDb.collection('users').doc(applicantUid).update({
        role: 'legend',
        updatedAt: new Date(),
      });

      // Set custom claim on Firebase Auth
      await adminAuth.setCustomUserClaims(applicantUid, { role: 'legend' });

      // Send approval email to applicant (and manager if provided)
      try {
        await sendApprovalEmail(
          applicationData.applicationData?.email || '',
          applicationData.applicationData?.artistName || 'Artist',
          applicationData.applicationData?.managementEmail
        );
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
        // Don't fail the entire operation if email fails
      }
    } else {
      // Declined - update role back to 'new_artist'
      await adminDb.collection('users').doc(applicantUid).update({
        role: 'new_artist',
        updatedAt: new Date(),
      });

      // Send decline email to applicant (and manager if provided)
      try {
        await sendDeclineEmail(
          applicationData.applicationData?.email || '',
          applicationData.applicationData?.artistName || 'Artist',
          notes,
          applicationData.applicationData?.managementEmail
        );
      } catch (emailError) {
        console.error('Failed to send decline email:', emailError);
        // Don't fail the entire operation if email fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Application ${action === 'approve' ? 'approved' : 'declined'} successfully`,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error reviewing application:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to review application',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
