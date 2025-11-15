import React, { useState, useEffect } from 'react';
import {
  UserCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  BanknotesIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { alpacaAccountsApi, AlpacaAccount, BankRelationship } from '../../services/alpacaAccountsApi';
import AccountCreationForm from './AccountCreationForm';
import BankRelationshipForm from './BankRelationshipForm';
import TransferForm from './TransferForm';
import TradingAccountDetails from './TradingAccountDetails';

interface AlpacaAccountManagerProps {
  onAccountSelect?: (account: AlpacaAccount) => void;
  selectedAccountId?: string;
}

const AlpacaAccountManager: React.FC<AlpacaAccountManagerProps> = ({ 
  onAccountSelect, 
  selectedAccountId 
}) => {
  const [accounts, setAccounts] = useState<AlpacaAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AlpacaAccount | null>(null);
  const [bankRelationships, setBankRelationships] = useState<BankRelationship[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showTradingDetails, setShowTradingDetails] = useState(false);

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load selected account details when accountId changes
  useEffect(() => {
    if (selectedAccountId) {
      loadAccountDetails(selectedAccountId);
    }
  }, [selectedAccountId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await alpacaAccountsApi.getAllAccounts();
      setAccounts(accountsData);
      
      if (accountsData.length > 0 && !selectedAccountId) {
        setSelectedAccount(accountsData[0]);
        onAccountSelect?.(accountsData[0]);
      }
    } catch (err) {
      setError('Failed to load accounts');
      console.error('Error loading accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAccountDetails = async (accountId: string) => {
    try {
      const account = await alpacaAccountsApi.getAccountById(accountId);
      setSelectedAccount(account);
      onAccountSelect?.(account);

      // Load bank relationships
      try {
        console.log('Loading bank relationships for account:', accountId);
        const banks = await alpacaAccountsApi.getBankRelationships(accountId);
        console.log('Bank relationships loaded:', banks);
        setBankRelationships(Array.isArray(banks) ? banks : [banks]);
        console.log('Bank relationships state updated:', Array.isArray(banks) ? banks : [banks]);
      } catch (bankError) {
        console.warn('Failed to load bank relationships:', bankError);
        setBankRelationships([]); // Ensure we set empty array on error
      }

      // Load activities
      try {
        const activitiesData = await alpacaAccountsApi.getAccountActivitiesById({ account_id: accountId });
        setActivities(activitiesData);
      } catch (activityError) {
        console.warn('Failed to load activities:', activityError);
      }
    } catch (err) {
      setError('Failed to load account details');
      console.error('Error loading account details:', err);
    }
  };

  const handleAccountSelect = (account: AlpacaAccount) => {
    setSelectedAccount(account);
    onAccountSelect?.(account);
    loadAccountDetails(account.id);
  };

  const handleViewAccount = (account: AlpacaAccount) => {
    setSelectedAccount(account);
    onAccountSelect?.(account);
    loadAccountDetails(account.id);
    setShowTradingDetails(true);
  };

  const handleEditAccount = (account: AlpacaAccount) => {
    setSelectedAccount(account);
    onAccountSelect?.(account);
    loadAccountDetails(account.id);
    // For now, we'll show the trading details as editing
    // In the future, you can create a dedicated edit form
    setShowTradingDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-100';
      case 'SUBMITTED':
        return 'text-blue-600 bg-blue-100';
      case 'REJECTED':
        return 'text-red-600 bg-red-100';
      case 'ONBOARDING':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatAccountNumber = (accountNumber: string) => {
    return `****${accountNumber.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading accounts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserCircleIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Alpaca Accounts</h2>
            <p className="text-sm text-gray-600">Manage your trading accounts</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Create Account</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Your Accounts</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedAccount?.id === account.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                  }`}
                  onClick={() => handleAccountSelect(account)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {formatAccountNumber(account.account_number)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(account.status)}`}>
                          {alpacaAccountsApi.formatAccountStatus(account.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {account.account_type === 'trading' ? 'Trading Account' : 'Cash Account'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created {alpacaAccountsApi.formatDate(account.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button 
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewAccount(account);
                        }}
                        title="View Account Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAccount(account);
                        }}
                        title="Edit Account"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="lg:col-span-2">
          {selectedAccount ? (
            <div className="space-y-6">
              {/* Account Overview */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Account Overview</h3>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setShowTradingDetails(true)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="View Trading Details"
                    >
                      <ChartBarIcon className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-600">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Account Number</p>
                    <p className="font-medium">{formatAccountNumber(selectedAccount.account_number)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(selectedAccount.status)}`}>
                      {alpacaAccountsApi.formatAccountStatus(selectedAccount.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Account Type</p>
                    <p className="font-medium capitalize">{selectedAccount.account_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Currency</p>
                    <p className="font-medium">{selectedAccount.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Equity</p>
                    <p className="font-medium">{alpacaAccountsApi.formatCurrency(selectedAccount.last_equity)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">{alpacaAccountsApi.formatDate(selectedAccount.created_at)}</p>
                  </div>
                </div>

                {selectedAccount.contact && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{selectedAccount.contact.email_address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{selectedAccount.contact.phone_number}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bank Relationships */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Bank Relationships</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => selectedAccount && loadAccountDetails(selectedAccount.id)}
                      className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-sm"
                      title="Refresh bank relationships"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Refresh</span>
                    </button>
                    <button
                      onClick={() => setShowBankForm(true)}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Add Bank</span>
                    </button>
                  </div>
                </div>

                {bankRelationships.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 mb-2">
                      {bankRelationships.length} bank relationship{bankRelationships.length !== 1 ? 's' : ''} found
                    </div>
                    {bankRelationships.map((bank) => (
                      <div key={bank.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <BanknotesIcon className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{bank.name}</p>
                            <p className="text-sm text-gray-600">
                              {bank.bank_code_type}: {bank.bank_code}
                            </p>
                            <p className="text-xs text-gray-500">
                              Account: ****{bank.account_number ? bank.account_number.slice(-4) : '****'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-1 text-gray-400 hover:text-blue-600">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BanknotesIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No bank relationships found</p>
                    <p className="text-sm">Add a bank to enable transfers</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowTransferForm(true)}
                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <ArrowUpTrayIcon className="w-6 h-6 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Deposit Funds</p>
                      <p className="text-sm text-gray-600">Add money to your account</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowTransferForm(true)}
                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <ArrowDownTrayIcon className="w-6 h-6 text-red-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Withdraw Funds</p>
                      <p className="text-sm text-gray-600">Transfer money out</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                {activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <ClockIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{activity.activity_type}</p>
                            <p className="text-sm text-gray-600">{activity.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {alpacaAccountsApi.formatCurrency(activity.net_amount)}
                          </p>
                          <p className="text-sm text-gray-600">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ClockIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No recent activities</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <UserCircleIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Account Selected</h3>
              <p className="text-gray-600">Select an account from the list to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Account Modal */}
      {showCreateForm && (
        <CreateAccountModal
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadAccounts();
          }}
        />
      )}

      {/* Add Bank Modal */}
      {showBankForm && selectedAccount && (
        <AddBankModal
          accountId={selectedAccount.id}
          onClose={() => setShowBankForm(false)}
          onSuccess={(bank) => {
            console.log('Bank relationship created successfully:', bank);
            setShowBankForm(false);
            // Force refresh of bank relationships
            loadAccountDetails(selectedAccount.id);
          }}
        />
      )}

      {/* Transfer Modal */}
      {showTransferForm && selectedAccount && (
        <TransferModal
          accountId={selectedAccount.id}
          onClose={() => setShowTransferForm(false)}
          onSuccess={() => {
            setShowTransferForm(false);
            loadAccountDetails(selectedAccount.id);
          }}
        />
      )}

      {/* Trading Details Modal */}
      {showTradingDetails && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <TradingAccountDetails
                accountId={selectedAccount.id}
                onClose={() => setShowTradingDetails(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Create Account Modal using the actual form
const CreateAccountModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  return (
    <AccountCreationForm
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

const AddBankModal: React.FC<{ accountId: string; onClose: () => void; onSuccess: (bank?: any) => void }> = ({ accountId, onClose, onSuccess }) => {
  return (
    <BankRelationshipForm
      accountId={accountId}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

const TransferModal: React.FC<{ accountId: string; onClose: () => void; onSuccess: () => void }> = ({ accountId, onClose, onSuccess }) => {
  return (
    <TransferForm
      accountId={accountId}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

export default AlpacaAccountManager;
