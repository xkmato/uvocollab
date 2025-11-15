declare module 'flutterwave-node-v3' {
  export default class Flutterwave {
    constructor(publicKey: string, secretKey: string);
    
    Subaccount: {
      create(payload: any): Promise<any>;
      fetch(id: string): Promise<any>;
      update(payload: any): Promise<any>;
    };
    
    Bank: {
      country(params: { country: string }): Promise<any>;
    };
    
    Misc: {
      verify_Account(payload: { account_number: string; account_bank: string }): Promise<any>;
    };

    Transaction: {
      verify(payload: { id: string }): Promise<any>;
    };
  }
}
