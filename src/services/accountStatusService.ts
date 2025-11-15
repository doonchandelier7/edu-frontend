import { alpacaAccountsApi, AlpacaAccount, TradingAccount } from './alpacaAccountsApi';

export interface AccountStatus {
  hasAccount: boolean;
  isActive: boolean;
  isPending: boolean;
  isRejected: boolean;
  canTrade: boolean;
  account?: AlpacaAccount;
  tradingDetails?: TradingAccount;
  statusMessage: string;
  nextSteps: string[];
}

class AccountStatusService {
  async checkAccountStatus(): Promise<AccountStatus> {
    try {
      // Get all accounts for the user
      const accounts = await alpacaAccountsApi.getAllAccounts();
      
      if (accounts.length === 0) {
        return {
          hasAccount: false,
          isActive: false,
          isPending: false,
          isRejected: false,
          canTrade: false,
          statusMessage: 'No trading account found',
          nextSteps: [
            'Create a new Alpaca trading account',
            'Complete the account setup process',
            'Wait for account approval'
          ]
        };
      }

      // Find the most recent account
      const latestAccount = accounts.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      const status = latestAccount.status.toUpperCase();
      
      switch (status) {
        case 'ACTIVE':
          try {
            const tradingDetails = await alpacaAccountsApi.getTradingAccountDetails(latestAccount.alpacaAccountId);
            return {
              hasAccount: true,
              isActive: true,
              isPending: false,
              isRejected: false,
              canTrade: true,
              account: latestAccount,
              tradingDetails,
              statusMessage: 'Account is active and ready for trading',
              nextSteps: [
                'Start trading stocks',
                'Fund your account if needed',
                'Set up bank relationships for transfers'
              ]
            };
          } catch (error) {
            return {
              hasAccount: true,
              isActive: true,
              isPending: false,
              isRejected: false,
              canTrade: false,
              account: latestAccount,
              statusMessage: 'Account is active but trading details unavailable',
              nextSteps: [
                'Contact support for assistance',
                'Try refreshing the page',
                'Check your internet connection'
              ]
            };
          }

        case 'SUBMITTED':
          return {
            hasAccount: true,
            isActive: false,
            isPending: true,
            isRejected: false,
            canTrade: false,
            account: latestAccount,
            statusMessage: 'Account application is under review',
            nextSteps: [
              'Wait for account approval (1-3 business days)',
              'Check your email for updates',
              'Contact support if you have questions'
            ]
          };

        case 'REJECTED':
          return {
            hasAccount: true,
            isActive: false,
            isPending: false,
            isRejected: true,
            canTrade: false,
            account: latestAccount,
            statusMessage: 'Account application was rejected',
            nextSteps: [
              'Review the rejection reason',
              'Update your information if needed',
              'Submit a new application',
              'Contact support for assistance'
            ]
          };

        case 'CLOSED':
          return {
            hasAccount: true,
            isActive: false,
            isPending: false,
            isRejected: false,
            canTrade: false,
            account: latestAccount,
            statusMessage: 'Account has been closed',
            nextSteps: [
              'Create a new trading account',
              'Contact support if you need assistance',
              'Review account closure reasons'
            ]
          };

        default:
          return {
            hasAccount: true,
            isActive: false,
            isPending: false,
            isRejected: false,
            canTrade: false,
            account: latestAccount,
            statusMessage: `Account status: ${status}`,
            nextSteps: [
              'Contact support for assistance',
              'Check your account status',
              'Wait for status updates'
            ]
          };
      }
    } catch (error) {
      console.error('Error checking account status:', error);
      return {
        hasAccount: false,
        isActive: false,
        isPending: false,
        isRejected: false,
        canTrade: false,
        statusMessage: 'Unable to check account status',
        nextSteps: [
          'Check your internet connection',
          'Try refreshing the page',
          'Contact support if the issue persists'
        ]
      };
    }
  }

  async validateAccountForTrading(accountId: string): Promise<{
    isValid: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      // Get trading details
      const tradingDetails = await alpacaAccountsApi.getTradingAccountDetails(accountId);
      
      // Check if trading is blocked
      if (tradingDetails.trading_blocked) {
        issues.push('Trading is currently blocked on this account');
      }

      // Check if account is blocked
      if (tradingDetails.account_blocked) {
        issues.push('Account is currently blocked');
      }

      // Check if transfers are blocked
      if (tradingDetails.transfers_blocked) {
        warnings.push('Transfers are currently blocked');
      }

      // Check if user has suspended trading
      if (tradingDetails.trade_suspended_by_user) {
        issues.push('Trading has been suspended by user');
      }

      // Check buying power
      const buyingPower = parseFloat(tradingDetails.buying_power);
      if (buyingPower <= 0) {
        warnings.push('No buying power available - consider adding funds');
      }

      // Check if account is a Pattern Day Trader
      if (tradingDetails.pattern_day_trader) {
        const equity = parseFloat(tradingDetails.equity);
        if (equity < 25000) {
          issues.push('Pattern Day Trader account requires minimum $25,000 equity');
        }
      }

      // Check day trade count
      if (tradingDetails.daytrade_count >= 3) {
        warnings.push('Day trade limit reached - consider Pattern Day Trader status');
      }

      return {
        isValid: issues.length === 0,
        issues,
        warnings
      };
    } catch (error) {
      console.error('Error validating account:', error);
      return {
        isValid: false,
        issues: ['Unable to validate account status'],
        warnings: []
      };
    }
  }

  async getAccountRecommendations(accountId: string): Promise<string[]> {
    const recommendations: string[] = [];

    try {
      const tradingDetails = await alpacaAccountsApi.getTradingAccountDetails(accountId);
      
      // Check buying power
      const buyingPower = parseFloat(tradingDetails.buying_power);
      if (buyingPower < 1000) {
        recommendations.push('Consider adding more funds to increase your buying power');
      }

      // Check if options trading is available
      if (tradingDetails.options_approved_level === '0' || !tradingDetails.options_approved_level) {
        recommendations.push('Consider applying for options trading to expand your trading capabilities');
      }

      // Check if shorting is enabled
      if (!tradingDetails.shorting_enabled) {
        recommendations.push('Consider enabling short selling for more trading strategies');
      }

      // Check bank relationships
      try {
        const bankRelationships = await alpacaAccountsApi.getBankRelationships(accountId);
        if (bankRelationships.length === 0) {
          recommendations.push('Add a bank account for easy deposits and withdrawals');
        }
      } catch (error) {
        // Bank relationships might not be available
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }
}

export const accountStatusService = new AccountStatusService();
