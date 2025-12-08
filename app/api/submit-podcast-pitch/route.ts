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
            // Guest spot fields
            topicProposal,
            guestBio,
            previousMediaUrl,
            proposedDates,
            pressKitUrl,
            // Cross-promotion fields
            crossPromoPodcastId,
            crossPromoMessage,
            // Ad read fields
            adProductName,
            adProductDescription,
            adTargetAudience,
            adProductUrl,
        } = body;

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
        const serviceType = serviceData?.type || 'guest_spot';
        
        // Verify the price matches
        if (serviceData?.price !== price) {
            return NextResponse.json(
                { error: 'Service price has changed. Please refresh and try again.' },
                { status: 400 }
            );
        }

        // Validate required fields based on service type
        if (serviceType === 'guest_spot' || serviceType === 'other') {
            if (!topicProposal || !guestBio || !previousMediaUrl || !proposedDates) {
                return NextResponse.json(
                    { error: 'Missing required fields for guest spot' },
                    { status: 400 }
                );
            }
        } else if (serviceType === 'cross_promotion') {
            if (!crossPromoPodcastId || !crossPromoMessage) {
                return NextResponse.json(
                    { error: 'Missing required fields for cross-promotion' },
                    { status: 400 }
                );
            }
        } else if (serviceType === 'ad_read') {
            if (!adProductName || !adProductDescription) {
                return NextResponse.json(
                    { error: 'Missing required fields for ad read' },
                    { status: 400 }
                );
            }
        }

        // Create the collaboration document with type-specific fields
        const collaborationData: CreateCollaborationData = {
            type: 'podcast',
            buyerId,
            podcastId,
            serviceId,
            price,
        };

        // Add fields based on service type
        if (serviceType === 'guest_spot' || serviceType === 'other') {
            collaborationData.topicProposal = topicProposal?.trim();
            collaborationData.guestBio = guestBio?.trim();
            collaborationData.previousMediaUrl = previousMediaUrl?.trim();
            collaborationData.pitchBestWorkUrl = previousMediaUrl?.trim();
            collaborationData.proposedDates = proposedDates?.trim();
            collaborationData.pressKitUrl = pressKitUrl || null;
        } else if (serviceType === 'cross_promotion') {
            collaborationData.crossPromoPodcastId = crossPromoPodcastId;
            collaborationData.crossPromoMessage = crossPromoMessage?.trim();
        } else if (serviceType === 'ad_read') {
            collaborationData.adProductName = adProductName?.trim();
            collaborationData.adProductDescription = adProductDescription?.trim();
            collaborationData.adTargetAudience = adTargetAudience?.trim();
            collaborationData.adProductUrl = adProductUrl?.trim();
        }

        const dbData = {
            ...collaborationData,
            status: 'pending_review' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
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
                    serviceType,
                    collaborationData
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
    serviceType: string,
    collaborationData: CreateCollaborationData
): Promise<void> {
    const subject = `🎙️ New Collaboration Request for ${podcastTitle}`;
    
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://uvocollab.com'}/dashboard/podcast`;
    
    // Build details based on service type
    let detailsText = '';
    let detailsHtml = '';

    if (serviceType === 'guest_spot' || serviceType === 'other') {
        detailsText = `Topic Proposal:\n"${collaborationData.topicProposal}"\n\nGuest Bio:\n${collaborationData.guestBio}`;
        detailsHtml = `
            <h3>Topic Proposal:</h3>
            <div class="message-box">"${collaborationData.topicProposal}"</div>
            <h3>Guest Bio:</h3>
            <div class="pitch-details"><p>${collaborationData.guestBio}</p></div>
        `;
    } else if (serviceType === 'cross_promotion') {
        detailsText = `Message:\n"${collaborationData.crossPromoMessage}"`;
        detailsHtml = `
            <h3>Cross-Promotion Message:</h3>
            <div class="message-box">"${collaborationData.crossPromoMessage}"</div>
        `;
    } else if (serviceType === 'ad_read') {
        detailsText = `Product: ${collaborationData.adProductName}\n\nDescription:\n${collaborationData.adProductDescription}`;
        detailsHtml = `
            <h3>Product:</h3>
            <p><strong>${collaborationData.adProductName}</strong></p>
            <h3>Description:</h3>
            <div class="pitch-details"><p>${collaborationData.adProductDescription}</p></div>
        `;
    }
    
    const text = `
Hello ${ownerName},

You have a new collaboration request for ${podcastTitle} from ${buyerName}!

Service Requested: ${serviceTitle}

${detailsText}

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
    
    ${detailsHtml}
    
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
