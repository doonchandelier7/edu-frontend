# Alpaca Accounts Integration

This document describes the comprehensive Alpaca Accounts API integration implemented in the trading application.

## Overview

The Alpaca Accounts integration provides a complete solution for managing trading accounts, including account creation, bank relationships, transfers, and trading details. This implementation is based on the provided Postman collection and follows the Alpaca API v1 specifications.

## Components

### 1. AlpacaAccountsApi Service (`alpacaAccountsApi.ts`)

A comprehensive service that provides all the functionality from the Postman collection:

#### Account Management
- `getAllAccounts()` - Retrieve all accounts with optional filtering
- `createAccount()` - Create new trading accounts
- `getAccountById()` - Get specific account details
- `updateAccount()` - Update account information
- `closeAccount()` - Close an account

#### Bank Relationships
- `createBankRelationship()` - Add bank for transfers
- `getBankRelationships()` - Retrieve account's bank relationships

#### Transfers
- `requestTransfer()` - Create deposit/withdrawal requests

#### Activities
- `getAccountActivities()` - Get account transaction history
- `getSpecificAccountActivities()` - Filter activities by type

#### Trading Details
- `getTradingAccountDetails()` - Get comprehensive trading account info
- `getPDTStatus()` - Check Pattern Day Trader status
- `requestPDTRemoval()` - Request PDT restriction removal

#### Options Trading
- `requestOptionsTrading()` - Request options trading approval

### 2. AlpacaAccountManager Component

Main account management interface with:
- Account listing and selection
- Account overview with key metrics
- Bank relationship management
- Quick action buttons for transfers
- Recent activities display

### 3. AccountCreationForm Component

Multi-step form for creating new Alpaca accounts:
- **Step 1**: Contact Information
- **Step 2**: Identity Information  
- **Step 3**: Disclosures
- **Step 4**: Documents & Agreements
- **Step 5**: Review & Submit

### 4. BankRelationshipForm Component

Form for adding bank relationships:
- Bank information (name, code, account number)
- Address details
- Validation and error handling

### 5. TransferForm Component

Transfer request form with:
- Transfer type selection (ACH/Wire)
- Amount input with validation
- Bank account selection
- Transfer timing options
- Summary display

### 6. TradingAccountDetails Component

Comprehensive trading account view showing:
- Account status and restrictions
- Portfolio overview (value, cash, buying power)
- Buying power breakdown
- Market values (long/short)
- Margin information
- Pattern Day Trader status
- Trading statistics
- Account information

## API Credentials

The integration uses the provided Alpaca credentials:
- **Base URL**: `https://paper-api.alpaca.markets/v2`
- **API Key**: `PK1SKEPD3SBYDYYQFRME`
- **Secret**: `p2nwJM9Ws7kbgJeCbGlHKkNXbMoF0bX4dIl2B0aS`

## Integration with TradingViewLayout

The Alpaca Account Manager is integrated into the main trading interface:

1. **Navigation**: Added "Alpaca Accounts" button in the header navigation
2. **Modal Integration**: Opens as a full-screen modal overlay
3. **Account Selection**: Selected accounts can be used for trading operations
4. **Real-time Updates**: Account data refreshes automatically

## Key Features

### Account Management
- ✅ Create new trading accounts
- ✅ View account details and status
- ✅ Update account information
- ✅ Close accounts when needed

### Bank Relationships
- ✅ Add multiple bank accounts
- ✅ Support for ACH and Wire transfers
- ✅ International bank support (BIC/SWIFT)
- ✅ Bank account validation

### Transfer Management
- ✅ Deposit funds to accounts
- ✅ Withdraw funds from accounts
- ✅ ACH and Wire transfer support
- ✅ Transfer history tracking

### Trading Features
- ✅ Comprehensive trading account details
- ✅ Buying power calculations
- ✅ Margin information
- ✅ Pattern Day Trader management
- ✅ Options trading approval requests

### Security & Compliance
- ✅ KYC/AML compliance support
- ✅ Document upload handling
- ✅ Agreement management
- ✅ Disclosure tracking

## Usage Examples

### Creating a New Account
```typescript
const accountData = {
  contact: {
    email_address: "user@example.com",
    phone_number: "+1234567890",
    street_address: ["123 Main St"],
    city: "New York",
    state: "NY",
    postal_code: "10001"
  },
  identity: {
    given_name: "John",
    family_name: "Doe",
    date_of_birth: "1990-01-01",
    tax_id: "123-45-6789",
    tax_id_type: "USA_SSN",
    country_of_citizenship: "USA",
    country_of_birth: "USA",
    country_of_tax_residence: "USA",
    funding_source: ["employment_income"]
  },
  // ... other required fields
};

const account = await alpacaAccountsApi.createAccount(accountData);
```

### Adding a Bank Relationship
```typescript
const bankData = {
  name: "Chase Bank",
  bank_code: "021000021",
  bank_code_type: "ABA",
  account_number: "1234567890"
};

const bank = await alpacaAccountsApi.createBankRelationship(accountId, bankData);
```

### Requesting a Transfer
```typescript
const transferData = {
  transfer_type: "ach",
  amount: "1000.00",
  direction: "INCOMING",
  timing: "immediate",
  bank_id: "bank-relationship-id"
};

const transfer = await alpacaAccountsApi.requestTransfer(accountId, transferData);
```

## Error Handling

The integration includes comprehensive error handling:
- Form validation with user-friendly messages
- API error responses with fallback messages
- Loading states for all async operations
- Retry mechanisms for failed requests

## Security Considerations

- All API calls are made through the backend proxy
- Sensitive information is not stored in localStorage
- Bank account numbers are masked in the UI
- Transfer amounts are validated before submission

## Future Enhancements

- Real-time account balance updates
- Advanced portfolio analytics
- Automated compliance checking
- Integration with external KYC providers
- Mobile-responsive design improvements

## Testing

The integration can be tested using the provided Alpaca sandbox environment:
- All operations work with paper trading
- No real money is involved
- Full API functionality is available
- Perfect for development and testing

## Support

For issues or questions regarding the Alpaca integration:
1. Check the Alpaca API documentation
2. Verify API credentials and permissions
3. Review error messages in the browser console
4. Ensure all required fields are provided in forms
