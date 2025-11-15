import { generateContractPDF, uploadContractToStorage } from '@/lib/contract-generator';
import { sendContractForSignature } from '@/lib/docusign';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
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

    const body = await request.json();
    const { collaborationId } = body;

    if (!collaborationId) {
      return NextResponse.json(
        { error: 'Missing collaborationId' },
        { status: 400 }
      );
    }

    // Get collaboration details
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

    // Verify the collaboration is in awaiting_contract status
    if (collabData?.status !== 'awaiting_contract') {
      return NextResponse.json(
        {
          error: `Invalid status. Expected 'awaiting_contract', got '${collabData?.status}'`,
        },
        { status: 400 }
      );
    }

    // Verify the requesting user is either the buyer or legend (or admin)
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const isAdmin = userData?.role === 'admin';
    const isBuyer = collabData?.buyerId === uid;
    const isLegend = collabData?.legendId === uid;

    if (!isAdmin && !isBuyer && !isLegend) {
      return NextResponse.json(
        { error: 'Unauthorized - not a party to this collaboration' },
        { status: 403 }
      );
    }

    // Get buyer details
    const buyerDoc = await adminDb.collection('users').doc(collabData.buyerId).get();
    const buyerData = buyerDoc.data();

    if (!buyerData) {
      return NextResponse.json(
        { error: 'Buyer not found' },
        { status: 404 }
      );
    }

    // Get legend details
    const legendDoc = await adminDb.collection('users').doc(collabData.legendId).get();
    const legendData = legendDoc.data();

    if (!legendData) {
      return NextResponse.json(
        { error: 'Legend not found' },
        { status: 404 }
      );
    }

    // Get service details
    const serviceDoc = await adminDb
      .collection('users')
      .doc(collabData.legendId)
      .collection('services')
      .doc(collabData.serviceId)
      .get();

    const serviceData = serviceDoc.data();

    if (!serviceData) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Generate contract PDF
    const contractPdfBuffer = await generateContractPDF({
      buyerName: buyerData.displayName || buyerData.email,
      buyerEmail: buyerData.email,
      legendName: legendData.displayName || legendData.email,
      legendEmail: legendData.email,
      serviceDescription: serviceData.description,
      price: collabData.price,
      collaborationId,
      createdDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    });

    // Upload unsigned contract to Firebase Storage for record-keeping
    const unsignedContractUrl = await uploadContractToStorage(
      collaborationId,
      contractPdfBuffer
    );

    // Send contract to DocuSign for e-signature
    const envelopeId = await sendContractForSignature({
      contractPdfBuffer,
      contractFileName: `UvoCollab_Contract_${collaborationId}.pdf`,
      emailSubject: `UvoCollab Collaboration Agreement - ${serviceData.title}`,
      signers: [
        {
          name: buyerData.displayName || buyerData.email,
          email: buyerData.email,
          recipientId: '1',
        },
        {
          name: legendData.displayName || legendData.email,
          email: legendData.email,
          recipientId: '2',
        },
      ],
      collaborationId,
    });

    // Update collaboration with contract info
    await adminDb
      .collection('collaborations')
      .doc(collaborationId)
      .update({
        docusignEnvelopeId: envelopeId,
        contractSentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

    // TODO: Send email notifications to both parties
    // - Buyer: Contract has been sent to your email for signature
    // - Legend: Contract has been sent to your email for signature

    return NextResponse.json({
      success: true,
      message: 'Contract generated and sent for signature',
      envelopeId,
      unsignedContractUrl,
    });
  } catch (error) {
    console.error('Error generating contract:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
