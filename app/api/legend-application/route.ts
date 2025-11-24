import { LegendApplicationData } from '@/app/types/legendApplication';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No authentication token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid authentication token' },
        { status: 401 }
      );
    }

    const userEmail = decodedToken.email;
    const userUid = decodedToken.uid;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found in authentication token' },
        { status: 400 }
      );
    }

    const applicationData: LegendApplicationData = await request.json();

    // Validate required fields (excluding email since it comes from auth)
    if (
      !applicationData.artistName ||
      !applicationData.phone ||
      !applicationData.spotifyLink ||
      !applicationData.bio
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate bio length (minimum 100 characters)
    if (applicationData.bio.length < 100) {
      return NextResponse.json(
        { error: 'Bio must be at least 100 characters long' },
        { status: 400 }
      );
    }

    // Update authenticated user's role to 'legend_applicant'
    // Use set with merge to create the document if it doesn't exist
    const updateData: Record<string, unknown> = {
      role: 'legend_applicant',
      displayName: applicationData.artistName,
      bio: applicationData.bio,
      email: userEmail,
      uid: userUid,
      updatedAt: new Date(),
    };

    // Only add management info if provided
    if (applicationData.managementName || applicationData.managementEmail) {
      updateData.managementInfo = `${applicationData.managementName || 'N/A'} - ${applicationData.managementEmail || 'N/A'}`;
    }

    // Use set with merge instead of update to handle new users
    try {
      await adminDb.collection('users').doc(userUid).set(updateData, { merge: true });
    } catch (dbError: unknown) {
      console.error('Firestore user update error:', dbError);
      console.error('User UID:', userUid);
      console.error('Update data:', updateData);
      throw dbError;
    }

    // Create the legend application document
    const applicationDoc = await adminDb.collection('legend_applications').add({
      applicantUid: userUid,
      status: 'pending',
      applicationData: {
        artistName: applicationData.artistName,
        email: userEmail,
        phone: applicationData.phone,
        managementName: applicationData.managementName,
        managementEmail: applicationData.managementEmail,
        spotifyLink: applicationData.spotifyLink,
        instagramLink: applicationData.instagramLink || null,
        twitterLink: applicationData.twitterLink || null,
        pressLinks: applicationData.pressLinks || null,
        referralFrom: applicationData.referralFrom || null,
        bio: applicationData.bio,
      },
      submittedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Application submitted successfully',
        applicationId: applicationDoc.id,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error submitting legend application:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to submit application',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
