import * as docusign from 'docusign-esign';

// DocuSign API client configuration
const apiClient = new docusign.ApiClient();

// Configure base path for production or demo environment
const basePath =
  process.env.DOCUSIGN_ENV === 'production'
    ? 'https://www.docusign.net/restapi'
    : 'https://demo.docusign.net/restapi';

apiClient.setBasePath(basePath);

/**
 * Get DocuSign access token using JWT authentication
 */
async function getAccessToken(): Promise<string> {
  const jwtLifeSec = 10 * 60; // Token valid for 10 minutes
  const scopes = ['signature', 'impersonation'];

    const rsaKey = process.env.DOCUSIGN_PRIVATE_KEY!.replace(/\\n/g, '\n');

    const results = await apiClient.requestJWTUserToken(
      process.env.DOCUSIGN_INTEGRATION_KEY!,
      process.env.DOCUSIGN_USER_ID!,
      scopes,
      Buffer.from(rsaKey),
      jwtLifeSec
    );  const accessToken = results.body.access_token;
  return accessToken;
}

/**
 * Set authentication for API client
 */
async function authenticateApiClient() {
  const accessToken = await getAccessToken();
  apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);
  return apiClient;
}

export interface SignerInfo {
  name: string;
  email: string;
  recipientId: string;
}

export interface EnvelopeData {
  contractPdfBuffer: Buffer;
  contractFileName: string;
  emailSubject: string;
  signers: SignerInfo[];
  collaborationId: string;
}

/**
 * Creates a DocuSign envelope and sends it for signature
 * Returns the envelope ID for tracking
 */
export async function sendContractForSignature(
  envelopeData: EnvelopeData
): Promise<string> {
  try {
    await authenticateApiClient();

    const envelopesApi = new docusign.EnvelopesApi(apiClient);

    // Create the document from the PDF buffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const document = new (docusign as any).Document();
    document.documentBase64 = envelopeData.contractPdfBuffer.toString('base64');
    document.name = envelopeData.contractFileName;
    document.fileExtension = 'pdf';
    document.documentId = '1';

    // Create signers
    const signers = envelopeData.signers.map((signerInfo, index) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const signer = (docusign as any).Signer.constructFromObject({
        email: signerInfo.email,
        name: signerInfo.name,
        recipientId: signerInfo.recipientId,
        routingOrder: (index + 1).toString(),
      });

      // Add signature tabs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const signHere = (docusign as any).SignHere.constructFromObject({
        documentId: '1',
        pageNumber: '2', // Signature page
        recipientId: signerInfo.recipientId,
        tabLabel: `${signerInfo.name}Signature`,
        xPosition: '100',
        yPosition: signerInfo.recipientId === '1' ? '200' : '400', // Different Y positions for buyer vs seller
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dateSigned = (docusign as any).DateSigned.constructFromObject({
        documentId: '1',
        pageNumber: '2',
        recipientId: signerInfo.recipientId,
        tabLabel: `${signerInfo.name}DateSigned`,
        xPosition: '100',
        yPosition: signerInfo.recipientId === '1' ? '280' : '480',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signer.tabs = (docusign as any).Tabs.constructFromObject({
        signHereTabs: [signHere],
        dateSignedTabs: [dateSigned],
      });

      return signer;
    });

    // Create recipients object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recipients = (docusign as any).Recipients.constructFromObject({
      signers: signers,
    });

    // Create envelope definition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const envelopeDefinition = (docusign as any).EnvelopeDefinition.constructFromObject({
      emailSubject: envelopeData.emailSubject,
      documents: [document],
      recipients: recipients,
      status: 'sent',
      // Store collaboration ID in custom fields for webhook retrieval
      customFields: {
        textCustomFields: [
          {
            name: 'collaborationId',
            value: envelopeData.collaborationId,
          },
        ],
      },
    });

    // Create and send the envelope
    const accountId = process.env.DOCUSIGN_ACCOUNT_ID!;
    const results = await envelopesApi.createEnvelope(accountId, {
      envelopeDefinition,
    });

    return results.envelopeId!;
  } catch (error) {
    console.error('Error sending contract for signature:', error);
    throw new Error('Failed to send contract for signature');
  }
}

/**
 * Check the status of a DocuSign envelope
 */
export async function getEnvelopeStatus(envelopeId: string): Promise<string> {
  try {
    await authenticateApiClient();

    const envelopesApi = new docusign.EnvelopesApi(apiClient);
    const accountId = process.env.DOCUSIGN_ACCOUNT_ID!;

    const envelope = await envelopesApi.getEnvelope(accountId, envelopeId);
    return envelope.status!;
  } catch (error) {
    console.error('Error getting envelope status:', error);
    throw new Error('Failed to get envelope status');
  }
}

/**
 * Download the completed, signed contract PDF
 */
export async function downloadSignedContract(
  envelopeId: string
): Promise<Buffer> {
  try {
    await authenticateApiClient();

    const envelopesApi = new docusign.EnvelopesApi(apiClient);
    const accountId = process.env.DOCUSIGN_ACCOUNT_ID!;

    const documentBytes = await envelopesApi.getDocument(
      accountId,
      envelopeId,
      'combined',
      {}
    );

    return Buffer.from(documentBytes);
  } catch (error) {
    console.error('Error downloading signed contract:', error);
    throw new Error('Failed to download signed contract');
  }
}

/**
 * Get custom fields from envelope (to retrieve collaboration ID)
 */
export async function getEnvelopeCustomFields(
  envelopeId: string
): Promise<Record<string, string>> {
  try {
    await authenticateApiClient();

    const envelopesApi = new docusign.EnvelopesApi(apiClient);
    const accountId = process.env.DOCUSIGN_ACCOUNT_ID!;

    const customFields = await envelopesApi.listCustomFields(
      accountId,
      envelopeId
    );

    const fields: Record<string, string> = {};
    if (customFields.textCustomFields) {
      customFields.textCustomFields.forEach((field: { name?: string; value?: string }) => {
        if (field.name && field.value) {
          fields[field.name] = field.value;
        }
      });
    }

    return fields;
  } catch (error) {
    console.error('Error getting envelope custom fields:', error);
    throw new Error('Failed to get envelope custom fields');
  }
}
