import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { AlpacaAccount, TradingAccount } from '../../services/alpacaAccountsApi';
import { accountStatusService, AccountStatus } from '../../services/accountStatusService';
import StockAccountSetup from './StockAccountSetup';
import TradingAccountDetails from './TradingAccountDetails';

interface StockTradingGatewayProps {
  onClose: () => void;
}

const StockTradingGateway: React.FC<StockTradingGatewayProps> = ({ onClose }) => {
  const [currentView, setCurrentView] = useState<'check' | 'setup' | 'details'>('check');
  const [accounts, setAccounts] = useState<AlpacaAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AlpacaAccount | null>(null);
  const [, setTradingAccount] = useState<TradingAccount | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAccountStatus();
  }, []);

  const checkAccountStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the account status service to get comprehensive status
      const status = await accountStatusService.checkAccountStatus();
      setAccountStatus(status);
      
      if (status.hasAccount && status.account) {
        setSelectedAccount(status.account);
        setAccounts([status.account]);
        
        if (status.tradingDetails) {
          setTradingAccount(status.tradingDetails);
        }
        
        if (status.isActive && status.canTrade) {
          setCurrentView('details');
        } else {
          setCurrentView('check');
        }
      } else {
        setCurrentView('setup');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check account status');
      setCurrentView('setup');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountCreated = (accountData: AlpacaAccount) => {
    setAccounts(prev => [...prev, accountData]);
    setSelectedAccount(accountData);
    setCurrentView('details');
  };

  // const handleBackToSetup = () => {
  //   setCurrentView('setup');
  // };

  const getAccountStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'submitted':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'closed':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getAccountStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'submitted':
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
      case 'rejected':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'closed':
        return <UserIcon className="w-5 h-5 text-gray-600" />;
      default:
        return <UserIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Checking account status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={checkAccountStatus}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (currentView === 'setup') {
    return (
      <StockAccountSetup
        onComplete={handleAccountCreated}
        onCancel={onClose}
      />
    );
  }

  if (currentView === 'details' && selectedAccount) {
    return (
      <TradingAccountDetails
        accountId={selectedAccount.alpacaAccountId}
        onClose={onClose}
      />
    );
  }

  // Add status display for non-active accounts
  if (currentView === 'check' && accountStatus) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Stock Trading</h2>
              <p className="text-gray-600">Account Status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Account Status Display */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            {getAccountStatusIcon(accountStatus.account?.status || 'UNKNOWN')}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Account Status</h3>
              <p className="text-sm text-gray-600">{accountStatus.statusMessage}</p>
            </div>
          </div>

          {accountStatus.account && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Account Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Account Number:</span>
                  <span className="ml-2 font-medium">{accountStatus.account.account_number}</span>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 font-medium">
                    {new Date(accountStatus.account.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getAccountStatusColor(accountStatus.account.status)}`}>
                    {accountStatus.account.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Currency:</span>
                  <span className="ml-2 font-medium">{accountStatus.account.currency}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Next Steps</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {accountStatus.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={checkAccountStatus}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh Status
            </button>
            {!accountStatus.isActive && (
              <button
                onClick={() => setCurrentView('setup')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Create New Account
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <ChartBarIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Stock Trading</h2>
            <p className="text-gray-600">Manage your Alpaca trading accounts</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Account Status Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Trading Accounts</h3>
        
        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <UserIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Trading Accounts</h4>
            <p className="text-gray-600 mb-4">You don't have any trading accounts set up yet.</p>
            <button
              onClick={() => setCurrentView('setup')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Trading Account
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedAccount(account);
                  setCurrentView('details');
                }}
              >
                <div className="flex items-center space-x-4">
                  {getAccountStatusIcon(account.status)}
                  <div>
                    <h4 className="font-medium text-gray-900">Account #{account.account_number}</h4>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(account.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 text-sm rounded-full ${getAccountStatusColor(account.status)}`}>
                    {account.status}
                  </span>
                  
                  {account.status === 'ACTIVE' && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <BanknotesIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        ${parseFloat(account.last_equity).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => setCurrentView('setup')}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create New Account</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-2">
              <BanknotesIcon className="w-6 h-6 text-green-600" />
              <h4 className="font-medium text-gray-900">Fund Account</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Add money to your trading account</p>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
              Add Funds
            </button>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-2">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
              <h4 className="font-medium text-gray-900">Start Trading</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Access your trading dashboard</p>
            <button 
              onClick={() => setCurrentView('details')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Trade Now
            </button>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-2">
              <UserIcon className="w-6 h-6 text-purple-600" />
              <h4 className="font-medium text-gray-900">Account Settings</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">Manage your account preferences</p>
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
              Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTradingGateway;
