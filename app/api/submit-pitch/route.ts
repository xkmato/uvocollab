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
            legendId,
            serviceId,
            price,
            pitchDemoUrl,
            pitchMessage,
            pitchBestWorkUrl,
        }: CreateCollaborationData = body;

        // Validate required fields
        if (!legendId || !serviceId || !price || !pitchMessage || !pitchBestWorkUrl) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate pitch message length
        if (pitchMessage.trim().length < 50) {
            return NextResponse.json(
                { error: 'Pitch message must be at least 50 characters' },
                { status: 400 }
            );
        }

        // Validate price
        if (price <= 0) {
            return NextResponse.json(
                { error: 'Invalid price' },
                { status: 400 }
            );
        }

        // Verify buyer cannot pitch to themselves
        if (buyerId === legendId) {
            return NextResponse.json(
                { error: 'You cannot request a collaboration with yourself' },
                { status: 400 }
            );
        }

        // Verify the legend exists and has the 'legend' role
        const legendDoc = await adminDb.collection('users').doc(legendId).get();
        if (!legendDoc.exists) {
            return NextResponse.json(
                { error: 'Legend not found' },
                { status: 404 }
            );
        }

        const legendData = legendDoc.data();
        if (legendData?.role !== 'legend') {
            return NextResponse.json(
                { error: 'User is not a verified Legend' },
                { status: 400 }
            );
        }

        // Verify the service exists and belongs to the legend
        const serviceDoc = await adminDb
            .collection('users')
            .doc(legendId)
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
        if (!serviceData?.isActive) {
            return NextResponse.json(
                { error: 'Service is not available' },
                { status: 400 }
            );
        }

        // Verify the price matches
        if (serviceData.price !== price) {
            return NextResponse.json(
                { error: 'Service price has changed. Please refresh and try again.' },
                { status: 400 }
            );
        }

        // Create the collaboration document
        const collaborationData = {
            buyerId,
            legendId,
            serviceId,
            price,
            status: 'pending_review',
            pitchDemoUrl: pitchDemoUrl || null,
            pitchMessage: pitchMessage.trim(),
            pitchBestWorkUrl: pitchBestWorkUrl.trim(),
            contractUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const collaborationRef = await adminDb
            .collection('collaborations')
            .add(collaborationData);

        // Get buyer information for the email
        const buyerDoc = await adminDb.collection('users').doc(buyerId).get();
        const buyerData = buyerDoc.data();
        const buyerName = buyerData?.displayName || 'A new artist';

        // Send notification email to legend/manager about new pitch
        try {
            await sendNewPitchNotification(
                legendData.email,
                legendData.displayName,
                buyerName,
                serviceData.title,
                pitchMessage.trim(),
                pitchBestWorkUrl.trim(),
                collaborationRef.id,
                legendData.managementInfo // This is the management email if provided
            );
        } catch (emailError) {
            // Log the error but don't fail the request if email fails
            console.error('Failed to send notification email:', emailError);
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

/**
 * Send notification email to Legend (and their manager) about a new pitch
 */
async function sendNewPitchNotification(
    legendEmail: string,
    legendName: string,
    buyerName: string,
    serviceTitle: string,
    pitchMessage: string,
    pitchBestWorkUrl: string,
    collaborationId: string,
    managementEmail?: string
): Promise<void> {
    const subject = `🎵 New Collaboration Request: ${serviceTitle}`;
    
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://uvocollab.com'}/legend/dashboard`;
    
    const text = `
Hello ${legendName},

You have a new collaboration request from ${buyerName}!

Service Requested: ${serviceTitle}

Artist's Message:
"${pitchMessage}"

Artist's Best Work:
${pitchBestWorkUrl}

To review this pitch and listen to the demo, visit your Legend Dashboard:
${dashboardUrl}

You can accept or decline this request from your dashboard. Remember, you have full control over which projects you take on.

Best regards,
The UvoCollab Team

---
Questions? Reply to this email or contact us at support@uvocollab.com
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .pitch-details { background-color: #F3F4F6; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .message-box { background-color: #EEF2FF; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0; font-style: italic; }
    .cta-button { 
      display: inline-block; 
      background-color: #4F46E5; 
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
    <h1>🎵 New Collaboration Request</h1>
  </div>
  <div class="content">
    <p>Hello <strong>${legendName}</strong>,</p>
    
    <p>You have a new collaboration request from <strong>${buyerName}</strong>!</p>
    
    <div class="pitch-details">
      <h3>Service Requested:</h3>
      <p><strong>${serviceTitle}</strong></p>
      
      <h3>Artist's Best Work:</h3>
      <p><a href="${pitchBestWorkUrl}" target="_blank">${pitchBestWorkUrl}</a></p>
    </div>
    
    <h3>Artist's Message:</h3>
    <div class="message-box">
      "${pitchMessage}"
    </div>
    
    <p>To review this pitch and listen to the demo, visit your Legend Dashboard:</p>
    
    <a href="${dashboardUrl}" class="cta-button">Review Pitch in Dashboard</a>
    
    <p>You can accept or decline this request from your dashboard. Remember, you have full control over which projects you take on.</p>
    
    <p><strong>Best regards,</strong><br>The UvoCollab Team</p>
  </div>
  <div class="footer">
    Questions? Reply to this email or contact us at support@uvocollab.com
  </div>
</body>
</html>
`;

    // Send to legend
    await sendEmail({ to: legendEmail, subject, text, html });
    
    // Also send to management if provided and different from legend's email
    if (managementEmail && managementEmail !== legendEmail) {
        const mgmtText = `
Hello,

${legendName} has received a new collaboration request from ${buyerName} on UvoCollab.

${text}
`;
        await sendEmail({ 
            to: managementEmail, 
            subject: `${legendName} - New Collaboration Request: ${serviceTitle}`, 
            text: mgmtText,
            html 
        });
    }
}
