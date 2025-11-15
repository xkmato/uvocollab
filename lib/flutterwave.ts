import Flutterwave from 'flutterwave-node-v3';

// Initialize Flutterwave with your credentials
const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY!,
  process.env.FLUTTERWAVE_SECRET_KEY!
);

export default flw;

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
