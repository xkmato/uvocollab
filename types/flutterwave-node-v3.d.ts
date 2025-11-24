declare module 'flutterwave-node-v3' {
  interface SubaccountPayload {
    account_bank: string;
    account_number: string;
    business_name: string;
    business_email: string;
    business_contact: string;
    business_mobile: string;
    country: string;
    split_type?: string;
    split_value?: number;
  }

  interface SubaccountResponse {
    status: string;
    message: string;
    data: {
      id: number;
      account_number: string;
      account_bank: string;
      business_name: string;
      subaccount_id: string;
      [key: string]: unknown;
    };
  }

  interface BankResponse {
    status: string;
    message: string;
    data: Array<{
      id: number;
      code: string;
      name: string;
    }>;
  }

  interface VerifyAccountResponse {
    status: string;
    message: string;
    data: {
      account_number: string;
      account_name: string;
    };
  }

  interface TransferPayload {
    account_bank: string;
    account_number: string;
    amount: number;
    narration: string;
    currency: string;
    reference?: string;
    callback_url?: string;
    debit_currency?: string;
  }

  interface TransferResponse {
    status: string;
    message: string;
    data: {
      id: number;
      account_number: string;
      bank_code: string;
      full_name: string;
      amount: number;
      reference: string;
      status: string;
      [key: string]: unknown;
    };
  }

  export default class Flutterwave {
    constructor(publicKey: string, secretKey: string);
    
    Subaccount: {
      create(payload: SubaccountPayload): Promise<SubaccountResponse>;
      fetch(id: string): Promise<SubaccountResponse>;
      update(payload: Partial<SubaccountPayload> & { id: string }): Promise<SubaccountResponse>;
    };
    
    Bank: {
      country(params: { country: string }): Promise<BankResponse>;
    };
    
    Misc: {
      verify_Account(payload: { account_number: string; account_bank: string }): Promise<VerifyAccountResponse>;
    };

    Transaction: {
      verify(payload: { id: string }): Promise<{ status: string; message: string; data: Record<string, unknown> }>;
    };

    Transfer: {
      initiate(payload: TransferPayload): Promise<TransferResponse>;
      get_a_transfer(params: { id: string }): Promise<TransferResponse>;
    };
  }
}
