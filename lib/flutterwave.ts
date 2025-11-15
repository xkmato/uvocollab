import Flutterwave from 'flutterwave-node-v3';

// Lazy initialization to avoid issues during build
let flw: Flutterwave | null = null;

function getFlutterwaveClient(): Flutterwave {
  if (!flw) {
    const publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    
    if (!publicKey || !secretKey) {
      throw new Error('Flutterwave credentials not configured');
    }
    
    flw = new Flutterwave(publicKey, secretKey);
  }
  return flw;
}

export default getFlutterwaveClient;

/**
 * Create a Flutterwave subaccount for a Legend
 * This allows the platform to split payments between the platform and the Legend
 */
export async function createSubaccount(params: {
  accountBank: string;
  accountNumber: string;
  businessName: string;
  businessEmail: string;
  businessContact: string;
  businessMobile: string;
  splitType: 'percentage' | 'flat';
  splitValue: number;
}) {
  try {
    const flw = getFlutterwaveClient();
    const payload = {
      account_bank: params.accountBank,
      account_number: params.accountNumber,
      business_name: params.businessName,
      business_email: params.businessEmail,
      business_contact: params.businessContact,
      business_mobile: params.businessMobile,
      split_type: params.splitType,
      split_value: params.splitValue,
    };

    const response = await flw.Subaccount.create(payload);
    return response;
  } catch (error) {
    console.error('Error creating Flutterwave subaccount:', error);
    throw error;
  }
}

/**
 * Get list of Nigerian banks for bank account verification
 */
export async function getBanks(country: string = 'NG') {
  try {
    const flw = getFlutterwaveClient();
    const response = await flw.Bank.country({ country });
    return response;
  } catch (error) {
    console.error('Error fetching banks:', error);
    throw error;
  }
}

/**
 * Verify a bank account number
 */
export async function verifyBankAccount(params: {
  accountNumber: string;
  accountBank: string;
}) {
  try {
    const flw = getFlutterwaveClient();
    const payload = {
      account_number: params.accountNumber,
      account_bank: params.accountBank,
    };

    const response = await flw.Misc.verify_Account(payload);
    return response;
  } catch (error) {
    console.error('Error verifying bank account:', error);
    throw error;
  }
}

/**
 * Get subaccount details
 */
export async function getSubaccount(subaccountId: string) {
  try {
    const flw = getFlutterwaveClient();
    const response = await flw.Subaccount.fetch(subaccountId);
    return response;
  } catch (error) {
    console.error('Error fetching subaccount:', error);
    throw error;
  }
}

/**
 * Update a subaccount
 */
export async function updateSubaccount(
  subaccountId: string,
  params: {
    businessName?: string;
    businessEmail?: string;
    accountBank?: string;
    accountNumber?: string;
    splitType?: 'percentage' | 'flat';
    splitValue?: number;
  }
) {
  try {
    const flw = getFlutterwaveClient();
    const payload = {
      id: subaccountId,
      business_name: params.businessName,
      business_email: params.businessEmail,
      account_bank: params.accountBank,
      account_number: params.accountNumber,
      split_type: params.splitType,
      split_value: params.splitValue,
    };

    const response = await flw.Subaccount.update(payload);
    return response;
  } catch (error) {
    console.error('Error updating subaccount:', error);
    throw error;
  }
}

/**
 * Initiate a transfer/payout to a subaccount
 * This is used to release funds from escrow to the Legend after project completion
 */
export async function initiateTransfer(params: {
  accountBank: string;
  accountNumber: string;
  amount: number;
  narration: string;
  reference: string;
  currency?: string;
  beneficiaryName?: string;
}) {
  try {
    const flw = getFlutterwaveClient();
    const payload = {
      account_bank: params.accountBank,
      account_number: params.accountNumber,
      amount: params.amount,
      narration: params.narration,
      currency: params.currency || 'NGN',
      reference: params.reference,
      beneficiary_name: params.beneficiaryName,
    };

    const response = await flw.Transfer.initiate(payload);
    return response;
  } catch (error) {
    console.error('Error initiating transfer:', error);
    throw error;
  }
}

/**
 * Verify a transfer status
 */
export async function verifyTransfer(transferId: string) {
  try {
    const flw = getFlutterwaveClient();
    const response = await flw.Transfer.get_a_transfer({ id: transferId });
    return response;
  } catch (error) {
    console.error('Error verifying transfer:', error);
    throw error;
  }
}

/**
 * Verify a transaction/payment status
 */
export async function verifyTransaction(transactionId: string) {
  try {
    const flw = getFlutterwaveClient();
    const response = await flw.Transaction.verify({ id: transactionId });
    return response;
  } catch (error) {
    console.error('Error verifying transaction:', error);
    throw error;
  }
}
