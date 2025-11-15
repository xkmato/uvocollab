import {
    downloadSignedContract,
    getEnvelopeCustomFields,
    getEnvelopeStatus,
} from '@/lib/docusign';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { sendContractSignedEmails } from '@/lib/mailgun';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DocuSign Webhook Handler
 * This endpoint receives notifications from DocuSign when envelope events occur
 * We specifically listen for the "completed" event (all parties have signed)
 */
export async function POST(request: NextRequest) {
  try {
    // DocuSign sends webhook data in the request body
    const body = await request.json();

    console.log('DocuSign webhook received:', JSON.stringify(body, null, 2));

    // Extract envelope information
    const { event, data } = body;
    const envelopeId = data?.envelopeSummary?.envelopeId;
    const status = data?.envelopeSummary?.status;

    if (!envelopeId) {
      return NextResponse.json(
        { error: 'Missing envelope ID' },
        { status: 400 }
      );
    }

    // We only care about "completed" events (all signatures collected)
    if (event !== 'envelope-completed' && status !== 'completed') {
      console.log(
        `Ignoring event: ${event} with status: ${status}. Waiting for completion.`
      );
      return NextResponse.json({
        success: true,
        message: 'Event acknowledged but not processed',
      });
    }

    // Verify the envelope status directly with DocuSign API
    const verifiedStatus = await getEnvelopeStatus(envelopeId);
    if (verifiedStatus !== 'completed') {
      return NextResponse.json(
        { error: 'Envelope not completed' },
        { status: 400 }
      );
    }

    // Get custom fields to retrieve collaboration ID
    const customFields = await getEnvelopeCustomFields(envelopeId);
    const collaborationId = customFields.collaborationId;

    if (!collaborationId) {
      console.error(
        'Collaboration ID not found in envelope custom fields:',
        customFields
      );
      return NextResponse.json(
        { error: 'Collaboration ID not found in envelope' },
        { status: 400 }
      );
    }

    // Get collaboration document
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

    // Verify the envelope ID matches
    if (collabData?.docusignEnvelopeId !== envelopeId) {
      return NextResponse.json(
        { error: 'Envelope ID mismatch' },
        { status: 400 }
      );
    }

    // Download the signed contract PDF from DocuSign
    const signedContractBuffer = await downloadSignedContract(envelopeId);

    // Upload signed contract to Firebase Storage
    const bucket = adminStorage.bucket();
    const signedFileName = `contracts/${collaborationId}/signed_contract.pdf`;
    const signedFile = bucket.file(signedFileName);

    await signedFile.save(signedContractBuffer, {
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          collaborationId,
          envelopeId,
          signedAt: new Date().toISOString(),
        },
      },
    });

    // Generate a long-lived signed URL for the contract (valid for 10 years)
    const [signedContractUrl] = await signedFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
    });

    // Update collaboration document
    await adminDb
      .collection('collaborations')
      .doc(collaborationId)
      .update({
        contractUrl: signedContractUrl,
        allPartiesSignedAt: new Date().toISOString(),
        status: 'in_progress',
        updatedAt: new Date().toISOString(),
      });

    // Get buyer and legend details for email notifications
    const buyerDoc = await adminDb.collection('users').doc(collabData.buyerId).get();
    const legendDoc = await adminDb.collection('users').doc(collabData.legendId).get();
    const buyerData = buyerDoc.data();
    const legendData = legendDoc.data();

    // Get service details for email
    const serviceDoc = await adminDb
      .collection('users')
      .doc(collabData.legendId)
      .collection('services')
      .doc(collabData.serviceId)
      .get();
    const serviceData = serviceDoc.data();

    // Send email notifications to both parties
    if (buyerData && legendData && serviceData) {
      try {
        await sendContractSignedEmails(
          buyerData.email,
          buyerData.displayName || buyerData.email,
          legendData.email,
          legendData.displayName || legendData.email,
          serviceData.title,
          collaborationId
        );
        console.log(`Sent contract signed notifications to both parties for collaboration ${collaborationId}`);
      } catch (emailError) {
        console.error('Failed to send contract signed emails:', emailError);
        // Don't fail the webhook if email fails
      }
    }

    // TODO: Create the Collaboration Hub (Epic 7)
    // This is where the private collaboration space is initialized
    // For now, we just update the status to 'in_progress'

    console.log(
      `Contract signed for collaboration ${collaborationId}, status updated to in_progress`
    );

    return NextResponse.json({
      success: true,
      message: 'Contract signed and processed successfully',
      collaborationId,
      status: 'in_progress',
    });
  } catch (error) {
    console.error('Error processing DocuSign webhook:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to verify webhook is accessible
 */
export async function GET() {
  return NextResponse.json({
    message: 'DocuSign webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
