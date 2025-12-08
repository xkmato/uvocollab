import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/mailgun';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const ownerId = decodedToken.uid;
    const ownerEmail = decodedToken.email;

    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      rssFeedUrl,
      categories,
      coverImageUrl,
      avgListeners,
      websiteUrl,
    } = body as {
      title: string;
      description?: string;
      rssFeedUrl: string;
      categories: string[];
      coverImageUrl?: string;
      avgListeners?: number;
      websiteUrl?: string;
    };

    // Validate required fields
    if (!title || !rssFeedUrl || !categories || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create podcast document
    const podcastData = {
      ownerId,
      title: title.trim(),
      description: description?.trim() || null,
      rssFeedUrl: rssFeedUrl.trim(),
      categories,
      coverImageUrl: coverImageUrl || null,
      avgListeners: avgListeners || null,
      websiteUrl: websiteUrl || null,
      status: 'approved',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const podcastRef = await adminDb.collection('podcasts').add(podcastData);

    // Update user's document to indicate they have a podcast
    try {
      await adminDb.collection('users').doc(ownerId).set({ hasPodcast: true, updatedAt: new Date() }, { merge: true });
    } catch (err) {
      console.error('Failed to update user document for podcast', err);
      // Continue - we don't want to abort just because the user update failed
    }

    // Notify Admins for vetting — fallback to support email
    try {
      const adminEmail = process.env.SUPPORT_EMAIL || 'support@uvocollab.com';
      const subject = `New Podcast Submission: ${podcastData.title}`;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://uvocollab.com';
      const text = `A new podcast submission has been created by ${ownerEmail}.

Title: ${podcastData.title}
Categories: ${podcastData.categories.join(', ')}
RSS Feed: ${podcastData.rssFeedUrl}
Status: ${podcastData.status}

View and vet the application here: ${appUrl}/admin/vetting
`;

      await sendEmail({ to: adminEmail, subject, text });
    } catch (emailError) {
      console.error('Failed to send admin notification email for podcast', emailError);
    }

    return NextResponse.json({ success: true, podcastId: podcastRef.id, message: 'Podcast submitted successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error submitting podcast:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
