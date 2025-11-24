import { CreateCollaborationData } from '@/app/types/collaboration';
import { adminDb } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/mailgun';
import { auth } from 'firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await auth().verifyIdToken(token);
        } catch (error) {
            console.error('Token verification failed:', error);
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const buyerId = decodedToken.uid;

        // Parse request body
        const body = await request.json();
        const {
            podcastId,
            serviceId,
            price,
            topicProposal,
            guestBio,
            previousMediaUrl,
            proposedDates,
            pressKitUrl,
        } = body;

        // Validate required fields
        if (!podcastId || !serviceId || !topicProposal || !guestBio || !previousMediaUrl || !proposedDates) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate price
        if (price < 0) {
            return NextResponse.json(
                { error: 'Invalid price' },
                { status: 400 }
            );
        }

        // Verify the podcast exists
        const podcastDoc = await adminDb.collection('podcasts').doc(podcastId).get();
        if (!podcastDoc.exists) {
            return NextResponse.json(
                { error: 'Podcast not found' },
                { status: 404 }
            );
        }

        const podcastData = podcastDoc.data();
        if (podcastData?.status !== 'approved') {
            return NextResponse.json(
                { error: 'Podcast is not currently accepting collaborations' },
                { status: 400 }
            );
        }

        // Verify buyer cannot pitch to their own podcast
        if (podcastData.ownerId === buyerId) {
            return NextResponse.json(
                { error: 'You cannot request a collaboration with your own podcast' },
                { status: 400 }
            );
        }

        // Verify the service exists and belongs to the podcast
        const serviceDoc = await adminDb
            .collection('podcasts')
            .doc(podcastId)
            .collection('services')
            .doc(serviceId)
            .get();

        if (!serviceDoc.exists) {
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            );
        }

        const serviceData = serviceDoc.data();
        
        // Verify the price matches
        if (serviceData?.price !== price) {
            return NextResponse.json(
                { error: 'Service price has changed. Please refresh and try again.' },
                { status: 400 }
            );
        }

        // Create the collaboration document
        const collaborationData: CreateCollaborationData = {
            type: 'podcast',
            buyerId,
            podcastId,
            serviceId,
            price,
            topicProposal: topicProposal.trim(),
            guestBio: guestBio.trim(),
            pitchBestWorkUrl: previousMediaUrl.trim(), // Mapping previousMediaUrl to pitchBestWorkUrl for consistency or use a new field
            proposedDates: proposedDates.trim(),
            pressKitUrl: pressKitUrl || null,
            // Initialize other fields
            status: 'pending_review',
            createdAt: new Date() as unknown as Date, // Cast to satisfy type if needed, or just Date
            updatedAt: new Date() as unknown as Date,
        };

        // Note: I'm using pitchBestWorkUrl to store previousMediaUrl to reuse some frontend logic if needed, 
        // but I also added specific fields to the type. 
        // Let's make sure we save all specific fields.
        const dbData = {
            ...collaborationData,
            previousMediaUrl: previousMediaUrl.trim(), // Explicitly save it if needed, though pitchBestWorkUrl might be enough
            contractUrl: null,
        };

        const collaborationRef = await adminDb
            .collection('collaborations')
            .add(dbData);

        // Get buyer information for the email
        const buyerDoc = await adminDb.collection('users').doc(buyerId).get();
        const buyerData = buyerDoc.data();
        const buyerName = buyerData?.displayName || 'A guest';

        // Get Podcast Owner information
        const ownerDoc = await adminDb.collection('users').doc(podcastData.ownerId).get();
        const ownerData = ownerDoc.data();

        if (ownerData?.email) {
            // Send notification email to Podcast Owner
            try {
                await sendNewPodcastPitchNotification(
                    ownerData.email,
                    ownerData.displayName || 'Podcaster',
                    buyerName,
                    podcastData.title,
                    serviceData?.title,
                    topicProposal.trim()
                );
            } catch (emailError) {
                console.error('Failed to send notification email:', emailError);
            }
        }

        return NextResponse.json({
            success: true,
            collaborationId: collaborationRef.id,
            message: 'Pitch submitted successfully',
        });
    } catch (error) {
        console.error('Error submitting pitch:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function sendNewPodcastPitchNotification(
    ownerEmail: string,
    ownerName: string,
    buyerName: string,
    podcastTitle: string,
    serviceTitle: string,
    topicProposal: string
): Promise<void> {
    const subject = `🎙️ New Collaboration Request for ${podcastTitle}`;
    
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://uvocollab.com'}/dashboard/podcast`;
    
    const text = `
Hello ${ownerName},

You have a new collaboration request for ${podcastTitle} from ${buyerName}!

Service Requested: ${serviceTitle}

Topic Proposal:
"${topicProposal}"

To review this pitch, visit your Podcast Dashboard:
${dashboardUrl}

Best regards,
The UvoCollab Team
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #7C3AED; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .pitch-details { background-color: #F3F4F6; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .message-box { background-color: #F5F3FF; padding: 15px; border-left: 4px solid #7C3AED; margin: 20px 0; font-style: italic; }
    .cta-button { 
      display: inline-block; 
      background-color: #7C3AED; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 5px; 
      margin: 20px 0;
      font-weight: bold;
    }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎙️ New Collaboration Request</h1>
  </div>
  <div class="content">
    <p>Hello <strong>${ownerName}</strong>,</p>
    
    <p>You have a new collaboration request for <strong>${podcastTitle}</strong> from <strong>${buyerName}</strong>!</p>
    
    <div class="pitch-details">
      <h3>Service Requested:</h3>
      <p><strong>${serviceTitle}</strong></p>
    </div>
    
    <h3>Topic Proposal:</h3>
    <div class="message-box">
      "${topicProposal}"
    </div>
    
    <p>To review this pitch, visit your Podcast Dashboard:</p>
    
    <a href="${dashboardUrl}" class="cta-button">Review Pitch in Dashboard</a>
    
    <p><strong>Best regards,</strong><br>The UvoCollab Team</p>
  </div>
  <div class="footer">
    Questions? Reply to this email or contact us at support@uvocollab.com
  </div>
</body>
</html>
`;

    await sendEmail({ to: ownerEmail, subject, text, html });
}
