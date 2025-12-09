import { adminStorage } from '@/lib/firebase-admin';
import PDFDocument from 'pdfkit';

export interface ContractData {
  buyerName: string;
  buyerEmail: string;
  legendName: string;
  legendEmail: string;
  serviceDescription: string;
  price: number;
  collaborationId: string;
  createdDate: string;
  type?: 'legend' | 'podcast';
}

/**
 * Generates a Work for Hire (WFH) contract PDF
 * This is the MVP default contract template
 */
export async function generateContractPDF(
  contractData: ContractData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('MUSIC COLLABORATION AGREEMENT', { align: 'center' })
      .moveDown();

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Agreement Date: ${contractData.createdDate}`, { align: 'center' })
      .moveDown(2);

    // Parties Section
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('PARTIES', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        `This Work for Hire Agreement ("Agreement") is entered into as of ${contractData.createdDate} by and between:`
      )
      .moveDown();

    doc
      .font('Helvetica-Bold')
      .text('BUYER (Artist/Client):')
      .font('Helvetica')
      .text(`Name: ${contractData.buyerName}`)
      .text(`Email: ${contractData.buyerEmail}`)
      .moveDown();

    doc
      .font('Helvetica-Bold')
      .text('SELLER (Legend/Service Provider):')
      .font('Helvetica')
      .text(`Name: ${contractData.legendName}`)
      .text(`Email: ${contractData.legendEmail}`)
      .moveDown(2);

    // Service Description Section
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('1. SERVICE DESCRIPTION', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        `Seller agrees to provide the following service to Buyer: ${contractData.serviceDescription}`
      )
      .moveDown();

    doc
      .text(`Total Service Fee: $${contractData.price.toFixed(2)} USD`)
      .moveDown(2);

    // Work for Hire Section
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('2. WORK FOR HIRE - MASTER OWNERSHIP', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        'The parties agree that all musical recordings, performances, and sound recordings created under this Agreement ("the Work") shall be considered a "work made for hire" as defined under U.S. Copyright Law (17 U.S.C. § 101).'
      )
      .moveDown();

    doc
      .text(
        'Buyer shall own all right, title, and interest in and to the master recording, including but not limited to:'
      )
      .moveDown(0.5);

    doc
      .list(
        [
          'The exclusive right to reproduce, distribute, and publicly perform the master recording',
          'The right to create derivative works from the master recording',
          'The right to exploit the master recording in all media now known or hereafter devised',
          'The right to register copyright in the master recording in Buyer\'s name',
        ],
        { bulletRadius: 2, indent: 20 }
      )
      .moveDown(2);

    // Publisher Share Section
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('3. PUBLISHING RIGHTS - SONGWRITER SHARE', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        'Notwithstanding the master ownership provisions above, Seller retains 100% of the songwriter\'s share (writer\'s share) of any musical compositions embodied in the Work.'
      )
      .moveDown();

    doc
      .text(
        'Seller shall have the right to register their writer\'s share with their performing rights organization (PRO) of choice (ASCAP, BMI, SESAC, etc.).'
      )
      .moveDown();

    doc
      .text(
        'Publisher\'s share and administration rights shall be negotiated separately if applicable, and are not covered by this Agreement unless specifically stated in writing.'
      )
      .moveDown(2);

    // Credit Section
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('4. CREDIT AND ATTRIBUTION', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        `Buyer agrees to provide Seller with appropriate credit on all commercial releases of the Work, in substantially the following format: "Produced by ${contractData.legendName}" or "Featuring ${contractData.legendName}" as applicable to the service provided.`
      )
      .moveDown();

    doc
      .text(
        'Credit shall be provided in liner notes, digital metadata (ID3 tags), and any other crediting systems used for the release.'
      )
      .moveDown(2);

    // Deliverables Section
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('5. DELIVERABLES AND TIMELINE', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        'Seller agrees to deliver the completed Work through the UvoCollab platform within a reasonable timeframe as communicated through the collaboration hub.'
      )
      .moveDown();

    doc
      .text(
        'All deliverables shall be provided in industry-standard formats as specified in the service description.'
      )
      .moveDown(2);

    // Payment Section
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('6. PAYMENT AND ESCROW', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        `Buyer has paid the total service fee of $${contractData.price.toFixed(2)} USD, which is currently held in escrow by UvoCollab.`
      )
      .moveDown();

    doc
      .text(
        'Upon completion of the Work and Buyer\'s acceptance, UvoCollab will release payment to Seller minus the platform commission (20%).'
      )
      .moveDown(2);

    // Warranties Section
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('7. WARRANTIES AND REPRESENTATIONS', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text('Seller warrants and represents that:')
      .moveDown(0.5);

    doc
      .list(
        [
          'The Work is original and does not infringe upon any third-party rights',
          'Seller has the full right and authority to enter into this Agreement',
          'The Work does not contain any unlicensed samples or unauthorized copyrighted material',
          'Seller will indemnify Buyer against any claims arising from breach of these warranties',
        ],
        { bulletRadius: 2, indent: 20 }
      )
      .moveDown(2);

    // Dispute Resolution
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('8. DISPUTE RESOLUTION', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        'Any disputes arising under this Agreement shall first be addressed through UvoCollab\'s dispute resolution process. If unresolved, the parties agree to binding arbitration in accordance with the rules of the American Arbitration Association.'
      )
      .moveDown(2);

    // Entire Agreement
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('9. ENTIRE AGREEMENT', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        'This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements. This Agreement may only be modified in writing signed by both parties.'
      )
      .moveDown(2);

    // Add new page for signatures
    doc.addPage();

    // Signature Section
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('SIGNATURES', { align: 'center', underline: true })
      .moveDown(2);

    doc
      .fontSize(11)
      .text(
        'By signing below, both parties acknowledge that they have read, understood, and agree to be bound by the terms of this Agreement.'
      )
      .moveDown(3);

    // Buyer Signature Block
    doc
      .font('Helvetica-Bold')
      .text('BUYER:')
      .moveDown();

    doc
      .font('Helvetica')
      .text('Signature: _________________________________')
      .moveDown(0.5);

    doc.text(`Name: ${contractData.buyerName}`).moveDown(0.5);

    doc.text('Date: _________________________________').moveDown(3);

    // Seller Signature Block
    doc
      .font('Helvetica-Bold')
      .text('SELLER:')
      .moveDown();

    doc
      .font('Helvetica')
      .text('Signature: _________________________________')
      .moveDown(0.5);

    doc.text(`Name: ${contractData.legendName}`).moveDown(0.5);

    doc.text('Date: _________________________________').moveDown(3);

    // Footer
    doc
      .fontSize(9)
      .font('Helvetica')
      .text(
        `Contract ID: ${contractData.collaborationId}`,
        { align: 'center' }
      )
      .moveDown(0.5);

    doc
      .text('Generated via UvoCollab Platform', { align: 'center' })
      .text('www.collab.uvotam.com', { align: 'center' });

    doc.end();
  });
}

/**
 * Generates a Guest Release Form PDF for Podcast collaborations
 */
export async function generateGuestReleasePDF(
  contractData: ContractData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('PODCAST GUEST RELEASE FORM', { align: 'center' })
      .moveDown();

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Date: ${contractData.createdDate}`, { align: 'center' })
      .moveDown(2);

    // Parties Section
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('PARTIES', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        `This Guest Release Form ("Agreement") is entered into as of ${contractData.createdDate} by and between:`
      )
      .moveDown();

    doc
      .font('Helvetica-Bold')
      .text('PODCASTER (Host/Producer):')
      .font('Helvetica')
      .text(`Name: ${contractData.legendName}`) // Legend is the Podcaster
      .text(`Email: ${contractData.legendEmail}`)
      .moveDown();

    doc
      .font('Helvetica-Bold')
      .text('GUEST:')
      .font('Helvetica')
      .text(`Name: ${contractData.buyerName}`) // Buyer is the Guest
      .text(`Email: ${contractData.buyerEmail}`)
      .moveDown(2);

    // Grant of Rights
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('1. GRANT OF RIGHTS', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        'Guest hereby grants to Podcaster and its successors, licensees, and assigns the irrevocable, worldwide, perpetual right to record, edit, use, publish, distribute, and exploit Guest\'s name, voice, likeness, image, and biographical information (collectively, the "Appearance") in connection with the podcast episode described as:'
      )
      .moveDown();

    doc
      .font('Helvetica-Bold')
      .text(`Topic/Service: ${contractData.serviceDescription}`)
      .font('Helvetica')
      .moveDown();

    doc
      .text(
        'This grant includes the right to use the Appearance in any and all media now known or hereafter devised, including but not limited to audio, video, digital, and print formats, for purposes of the Podcast, including promotion and advertising thereof.'
      )
      .moveDown(2);

    // Ownership
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('2. OWNERSHIP', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        'Guest acknowledges and agrees that Podcaster shall be the sole and exclusive owner of all rights, title, and interest in and to the Podcast and the recording of the Appearance, including all copyrights and other intellectual property rights therein.'
      )
      .moveDown(2);

    // Compensation
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('3. COMPENSATION', { underline: true })
      .moveDown(0.5);

    if (contractData.price > 0) {
      doc
        .fontSize(11)
        .font('Helvetica')
        .text(
          `As consideration for the Appearance and the rights granted herein, Guest has paid Podcaster the sum of $${contractData.price.toFixed(2)} USD.`
        )
        .moveDown();
    } else {
      doc
        .fontSize(11)
        .font('Helvetica')
        .text(
          'Guest acknowledges that the publicity and exposure from the Appearance constitute sufficient consideration for the rights granted herein, and no monetary compensation shall be due to Guest.'
        )
        .moveDown();
    }
    doc.moveDown(1);

    // Release
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('4. RELEASE', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        'Guest hereby releases and discharges Podcaster from any and all claims, demands, or causes of action that Guest may have against Podcaster arising out of or in connection with the use of the Appearance, including but not limited to any claims for defamation, invasion of privacy, or infringement of publicity rights.'
      )
      .moveDown(2);

    // Warranties
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('5. WARRANTIES', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        'Guest represents and warrants that they have the full right and authority to enter into this Agreement and to grant the rights granted herein, and that the use of the Appearance will not violate the rights of any third party.'
      )
      .moveDown(2);

    // Entire Agreement
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('6. ENTIRE AGREEMENT', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        'This Agreement constitutes the entire understanding between the parties with respect to the subject matter hereof and supersedes all prior agreements and understandings, whether written or oral.'
      )
      .moveDown(2);

    // Add new page for signatures
    doc.addPage();

    // Signature Section
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('SIGNATURES', { align: 'center', underline: true })
      .moveDown(2);

    doc
      .fontSize(11)
      .text(
        'By signing below, both parties acknowledge that they have read, understood, and agree to be bound by the terms of this Agreement.'
      )
      .moveDown(3);

    // Podcaster Signature Block
    doc
      .font('Helvetica-Bold')
      .text('PODCASTER:')
      .moveDown();

    doc
      .font('Helvetica')
      .text('Signature: _________________________________')
      .moveDown(0.5);

    doc.text(`Name: ${contractData.legendName}`).moveDown(0.5);

    doc.text('Date: _________________________________').moveDown(3);

    // Guest Signature Block
    doc
      .font('Helvetica-Bold')
      .text('GUEST:')
      .moveDown();

    doc
      .font('Helvetica')
      .text('Signature: _________________________________')
      .moveDown(0.5);

    doc.text(`Name: ${contractData.buyerName}`).moveDown(0.5);

    doc.text('Date: _________________________________').moveDown(3);

    // Footer
    doc
      .fontSize(9)
      .font('Helvetica')
      .text(
        `Contract ID: ${contractData.collaborationId}`,
        { align: 'center' }
      )
      .moveDown(0.5);

    doc
      .text('Generated via UvoCollab Platform', { align: 'center' })
      .text('www.collab.uvotam.com', { align: 'center' });

    doc.end();
  });
}

/**
 * Uploads the generated contract PDF to Firebase Storage
 */
export async function uploadContractToStorage(
  collaborationId: string,
  pdfBuffer: Buffer
): Promise<string> {
  const bucket = adminStorage.bucket();
  const fileName = `contracts/${collaborationId}/unsigned_contract.pdf`;
  const file = bucket.file(fileName);

  await file.save(pdfBuffer, {
    metadata: {
      contentType: 'application/pdf',
      metadata: {
        collaborationId,
        generatedAt: new Date().toISOString(),
      },
    },
  });

  // Make the file accessible via a signed URL (valid for 7 days)
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return url;
}
