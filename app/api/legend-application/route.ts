import { LegendApplicationData } from '@/app/types/legendApplication';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const applicationData: LegendApplicationData = await request.json();

    // Validate required fields
    if (
      !applicationData.artistName ||
      !applicationData.email ||
      !applicationData.phone ||
      !applicationData.managementName ||
      !applicationData.managementEmail ||
      !applicationData.spotifyLink ||
      !applicationData.bio
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(applicationData.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
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

    let userUid: string;
    let isNewUser = false;

    try {
      // Check if user already exists
      const existingUser = await adminAuth.getUserByEmail(applicationData.email);
      userUid = existingUser.uid;

      // Update existing user's role to 'legend_applicant'
      await adminDb.collection('users').doc(userUid).update({
        role: 'legend_applicant',
        displayName: applicationData.artistName,
        bio: applicationData.bio,
        managementInfo: `${applicationData.managementName} - ${applicationData.managementEmail}`,
        updatedAt: new Date(),
      });
    } catch (error: unknown) {
      // User doesn't exist, create a new one
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/user-not-found') {
        isNewUser = true;

        // Generate a random temporary password
        const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';

        // Create new Firebase Auth user
        const newUser = await adminAuth.createUser({
          email: applicationData.email,
          password: tempPassword,
          displayName: applicationData.artistName,
        });

        userUid = newUser.uid;

        // Create user document in Firestore
        await adminDb.collection('users').doc(userUid).set({
          uid: userUid,
          email: applicationData.email,
          displayName: applicationData.artistName,
          role: 'legend_applicant',
          bio: applicationData.bio,
          managementInfo: `${applicationData.managementName} - ${applicationData.managementEmail}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Send password reset email so user can set their own password
        await adminAuth.generatePasswordResetLink(applicationData.email);
      } else {
        throw error;
      }
    }

    // Create the legend application document
    const applicationDoc = await adminDb.collection('legend_applications').add({
      applicantUid: userUid,
      status: 'pending',
      applicationData: {
        artistName: applicationData.artistName,
        email: applicationData.email,
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
        isNewUser,
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
