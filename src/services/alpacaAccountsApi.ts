import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Types
export interface AlpacaAccount {
  id: string;
  alpacaAccountId: string; // Add this property for compatibility
  account_number: string;
  status: string;
  crypto_status: string;
  currency: string;
  last_equity: string;
  created_at: string;
  contact?: any;
  identity?: any;
  disclosures?: any;
  agreements?: any[];
  documents?: any[];
  trusted_contact?: any;
  account_type: string;
  trading_configurations?: any;
  enabled_assets: string[];
}

export interface TradingAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  created_at: string;
  last_equity: string;
  equity: string;
  cash: string;
  buying_power: string;
  regt_buying_power: string;
  daytrading_buying_power: string;
  options_buying_power: string;
  cash_withdrawable: string;
  cash_transferable: string;
  pending_transfer_out: string;
  portfolio_value: string;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  transfers_blocked: boolean;
  account_blocked: boolean;
  trade_suspended_by_user: boolean;
  multiplier: string;
  shorting_enabled: boolean;
  long_market_value: string;
  short_market_value: string;
  equity_previous_close: string;
  initial_margin: string;
  maintenance_margin: string;
  last_regt_buying_power: string;
  last_daytrading_buying_power: string;
  last_buying_power: string;
  last_daytrade_count: number;
  daytrade_count: number;
  sma?: string;
  options_approved_level?: string;
  options_trading_level?: string;
  clearing_broker?: string;
}

export interface PDTStatus {
  is_pdt: boolean;
  is_pdt_eligible: boolean;
  pdt_remaining_day_trades: number;
  pdt_remaining_waivers: number;
  pdt?: boolean;
  pdt_removed?: boolean;
  pdt_removed_at?: string;
}

export interface ContactInfo {
  emailAddress: string;
  phoneNumber: string;
  streetAddress: string[];
  city: string;
  state: string;
  postalCode: string;
}

export interface IdentityInfo {
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  taxId: string;
  taxIdType: string;
  countryOfCitizenship: string;
  countryOfBirth: string;
  countryOfTaxResidence: string;
  fundingSource: string[];
}

export interface DisclosuresInfo {
  isControlPerson: boolean;
  isAffiliatedExchangeOrFinra: boolean;
  isPoliticallyExposed: boolean;
  immediateFamilyExposed: boolean;
}

export interface AgreementInfo {
  agreement: string;
  signedAt: string;
  ipAddress: string;
  revision?: string;
}

export interface DocumentInfo {
  document_type: string;
  document_sub_type: string;
  content: string;
  mime_type: string;
}

export interface TrustedContactInfo {
  givenName: string;
  familyName: string;
  emailAddress: string;
}

export interface AccountCreateRequest {
  contact: ContactInfo;
  identity: IdentityInfo;
  disclosures: DisclosuresInfo;
  agreements: AgreementInfo[];
  documents: DocumentInfo[];
  trustedContact: TrustedContactInfo;
  enabledAssets?: string[];
}

export interface BankRelationship {
  id: string;
  account_id: string;
  name: string;
  bank_code: string;
  bank_code_type: string;
  account_number: string;
  status: string;
  created_at: string;
}

export interface BankRelationshipCreateRequest {
  name: string;
  bankCode: string;
  bankCodeType: string;
  accountNumber: string;
  country?: string;
  stateProvince?: string;
  postalCode?: string;
  city?: string;
  streetAddress?: string;
}

export interface TransferRequest {
  amount: string;
  direction: 'INCOMING' | 'OUTGOING';
  bank_relationship_id: string;
  transfer_type?: string;
  timing?: string;
  bank_id?: string;
  additional_information?: string;
}

class AlpacaAccountsApi {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api/v1/trading/alpaca-accounts`;
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // Debug logging
    console.log('Token found:', !!token);
    console.log('Token value:', token ? token.substring(0, 20) + '...' : 'No token');
    
    if (!token) {
      console.error('No authentication token found. Please log in first.');
      throw new Error('No authentication token found. Please log in first.');
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Account Management
  async getAllAccounts(): Promise<AlpacaAccount[]> {
    const response = await axios.get(`${this.baseURL}`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async getAccountById(id: string): Promise<AlpacaAccount> {
    const response = await axios.get(`${this.baseURL}/${id}`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async createAccount(accountData: AccountCreateRequest): Promise<AlpacaAccount> {
    try {
      console.log('Creating account with data:', accountData);
      console.log('Using headers:', this.getAuthHeaders());
      
      const response = await axios.post(`${this.baseURL}`, accountData, { headers: this.getAuthHeaders() });
      console.log('Account created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Account creation failed:', error.response?.data || error.message);
      console.error('Status:', error.response?.status);
      console.error('Headers sent:', this.getAuthHeaders());
      throw error;
    }
  }

  async updateAccount(id: string, accountData: Partial<AccountCreateRequest>): Promise<AlpacaAccount> {
    const response = await axios.put(`${this.baseURL}/${id}`, accountData, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async closeAccount(id: string): Promise<void> {
    await axios.delete(`${this.baseURL}/${id}`, { headers: this.getAuthHeaders() });
  }

  // Trading Details
  async getTradingDetails(accountId: string): Promise<TradingAccount> {
    const response = await axios.get(`${this.baseURL}/${accountId}/trading-details`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async getTradingAccountDetails(accountId: string): Promise<TradingAccount> {
    return this.getTradingDetails(accountId);
  }

  async getPDTStatus(accountId: string): Promise<PDTStatus> {
    const response = await axios.get(`${this.baseURL}/${accountId}/pdt-status`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async requestPDTRemoval(accountId: string): Promise<void> {
    await axios.post(`${this.baseURL}/${accountId}/pdt-removal`, {}, { headers: this.getAuthHeaders() });
  }

  // Bank Relationships
  async getBankRelationships(accountId: string): Promise<BankRelationship[]> {
    const response = await axios.get(`${this.baseURL}/${accountId}/bank-relationships`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async createBankRelationship(accountId: string, bankData: BankRelationshipCreateRequest): Promise<BankRelationship> {
    const response = await axios.post(`${this.baseURL}/${accountId}/bank-relationships`, bankData, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async getBankRelationshipById(accountId: string, bankId: string): Promise<BankRelationship> {
    const response = await axios.get(`${this.baseURL}/${accountId}/bank-relationships/${bankId}`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  // Transfers
  async requestTransfer(accountId: string, transferData: TransferRequest): Promise<any> {
    const response = await axios.post(`${this.baseURL}/${accountId}/transfers`, transferData, { headers: this.getAuthHeaders() });
    return response.data;
  }

  async getTransfers(accountId: string): Promise<any[]> {
    const response = await axios.get(`${this.baseURL}/${accountId}/transfers`, { headers: this.getAuthHeaders() });
    return response.data;
  }

  // Account Activities
  async getAccountActivities(accountId: string, params?: any): Promise<any[]> {
    const response = await axios.get(`${this.baseURL}/${accountId}/activities`, { 
      params,
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getAccountActivitiesById(params: { account_id: string }): Promise<any[]> {
    return this.getAccountActivities(params.account_id);
  }

  // Options Trading
  async requestOptionsTrading(accountId: string): Promise<void> {
    await axios.post(`${this.baseURL}/${accountId}/options-trading`, {}, { headers: this.getAuthHeaders() });
  }

  // Test authentication
  async testAuth(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1`, { headers: this.getAuthHeaders() });
      console.log('Auth test successful:', response.status);
      return true;
    } catch (error: any) {
      console.error('Auth test failed:', error.response?.status, error.response?.data);
      return false;
    }
  }

  // Utility Methods
  validateAccountData(data: AccountCreateRequest, currentStep?: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Step 1: Contact Info validation
    if (!currentStep || currentStep === 1) {
      if (!data.contact.emailAddress) errors.push('Email address is required');
      if (!data.contact.phoneNumber) errors.push('Phone number is required');
      if (!data.contact.streetAddress || data.contact.streetAddress.length === 0 || !data.contact.streetAddress[0]) errors.push('Street address is required');
      if (!data.contact.city) errors.push('City is required');
      if (!data.contact.state) errors.push('State is required');
      if (!data.contact.postalCode) errors.push('Postal code is required');
    }
    
    // Step 2: Identity validation (only if we're on step 2 or later)
    if (!currentStep || currentStep >= 2) {
      if (!data.identity.givenName) errors.push('Given name is required');
      if (!data.identity.familyName) errors.push('Family name is required');
      if (!data.identity.dateOfBirth) errors.push('Date of birth is required');
      if (!data.identity.taxId) errors.push('Tax ID is required');
      if (!data.identity.taxIdType) errors.push('Tax ID type is required');
      if (!data.identity.countryOfCitizenship) errors.push('Country of citizenship is required');
      if (!data.identity.countryOfBirth) errors.push('Country of birth is required');
      if (!data.identity.countryOfTaxResidence) errors.push('Country of tax residence is required');
      if (!data.identity.fundingSource || data.identity.fundingSource.length === 0) {
        errors.push('At least one funding source is required');
      }
    }
    
    // Step 4: Agreements validation (only if we're on step 4 or later)
    if (!currentStep || currentStep >= 4) {
      // Agreements are now an array, so we'll skip validation for now
      // The backend will handle agreement validation
    }
    
    // Step 5: Trusted contact validation (only if we're on step 5 or later)
    if (!currentStep || currentStep >= 5) {
      if (!data.trustedContact.givenName) errors.push('Trusted contact given name is required');
      if (!data.trustedContact.familyName) errors.push('Trusted contact family name is required');
      if (!data.trustedContact.emailAddress) errors.push('Trusted contact email is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  formatAccountStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'ACTIVE': 'Active',
      'PENDING': 'Pending Review',
      'REJECTED': 'Rejected',
      'SUBMITTED': 'Submitted',
      'ONBOARDING': 'Onboarding',
      'SUBMISSION_FAILED': 'Submission Failed',
      'INVALID': 'Invalid'
    };
    return statusMap[status] || status;
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  formatCurrency(amount: string | number): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numAmount);
  }

  validateBankData(data: BankRelationshipCreateRequest): string[] {
    const errors: string[] = [];
    
    if (!data.name) errors.push('Bank name is required');
    if (!data.bankCode) errors.push('Bank code is required');
    if (!data.bankCodeType) errors.push('Bank code type is required');
    if (!data.accountNumber) errors.push('Account number is required');
    
    return errors;
  }
}

// Export singleton instance
export const alpacaAccountsApi = new AlpacaAccountsApi();