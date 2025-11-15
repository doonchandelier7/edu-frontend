import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { alpacaAccountsApi, TradingAccount, PDTStatus } from '../../services/alpacaAccountsApi';

interface TradingAccountDetailsProps {
  accountId: string;
  onClose: () => void;
}

const TradingAccountDetails: React.FC<TradingAccountDetailsProps> = ({ accountId, onClose }) => {
  const [tradingAccount, setTradingAccount] = useState<TradingAccount | null>(null);
  const [pdtStatus, setPdtStatus] = useState<PDTStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestingPDTRemoval, setRequestingPDTRemoval] = useState(false);

  useEffect(() => {
    loadTradingDetails();
  }, [accountId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTradingDetails = async () => {
    try {
      setLoading(true);
      const [accountData, pdtData] = await Promise.all([
        alpacaAccountsApi.getTradingAccountDetails(accountId),
        alpacaAccountsApi.getPDTStatus(accountId)
      ]);
      setTradingAccount(accountData);
      setPdtStatus(pdtData);
    } catch (err) {
      setError('Failed to load trading account details');
      console.error('Error loading trading details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePDTRemovalRequest = async () => {
    try {
      setRequestingPDTRemoval(true);
      const result = await alpacaAccountsApi.requestPDTRemoval(accountId);
      console.log('PDT removal request result:', result);
      // Reload PDT status
      const updatedPdtStatus = await alpacaAccountsApi.getPDTStatus(accountId);
      setPdtStatus(updatedPdtStatus);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request PDT removal');
    } finally {
      setRequestingPDTRemoval(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${numAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'blocked':
        return 'text-red-600 bg-red-100';
      case 'suspended':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading trading details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadTradingDetails}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!tradingAccount) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">No trading account details found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ChartBarIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Trading Account Details</h2>
            <p className="text-sm text-gray-600">Account #{tradingAccount.account_number}</p>
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

      {/* Account Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Account Status</h3>
          <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(tradingAccount.status)}`}>
            {tradingAccount.status}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Trading Blocked</p>
              <p className={`font-medium ${tradingAccount.trading_blocked ? 'text-red-600' : 'text-green-600'}`}>
                {tradingAccount.trading_blocked ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Transfers Blocked</p>
              <p className={`font-medium ${tradingAccount.transfers_blocked ? 'text-red-600' : 'text-green-600'}`}>
                {tradingAccount.transfers_blocked ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Overview</h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(tradingAccount.portfolio_value)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cash</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(tradingAccount.cash)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Buying Power</p>
              <p className="text-xl font-semibold text-blue-600">{formatCurrency(tradingAccount.buying_power)}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Equity</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(tradingAccount.equity)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cash Withdrawable</p>
              <p className="text-xl font-semibold text-green-600">{formatCurrency(tradingAccount.cash_withdrawable)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cash Transferable</p>
              <p className="text-xl font-semibold text-green-600">{formatCurrency(tradingAccount.cash_transferable)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Buying Power Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Buying Power Breakdown</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Reg T Buying Power</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(tradingAccount.regt_buying_power)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Day Trading Buying Power</p>
            <p className="text-lg font-semibold text-blue-600">{formatCurrency(tradingAccount.daytrading_buying_power)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Options Buying Power</p>
            <p className="text-lg font-semibold text-purple-600">{formatCurrency(tradingAccount.options_buying_power)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Multiplier</p>
            <p className="text-lg font-semibold text-gray-900">{tradingAccount.multiplier}x</p>
          </div>
        </div>
      </div>

      {/* Market Values */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Values</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Long Market Value</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(tradingAccount.long_market_value)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm text-gray-600">Short Market Value</p>
              <p className="text-lg font-semibold text-red-600">{formatCurrency(tradingAccount.short_market_value)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Margin Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Margin Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Initial Margin</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(tradingAccount.initial_margin)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Maintenance Margin</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(tradingAccount.maintenance_margin)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Special Memorandum Account (SMA)</p>
            <p className="text-lg font-semibold text-blue-600">{formatCurrency(tradingAccount.sma || '0')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Shorting Enabled</p>
            <p className={`font-medium ${tradingAccount.shorting_enabled ? 'text-green-600' : 'text-red-600'}`}>
              {tradingAccount.shorting_enabled ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </div>

      {/* Pattern Day Trader Status */}
      {pdtStatus && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pattern Day Trader Status</h3>
            <span className={`px-3 py-1 text-sm rounded-full ${
              pdtStatus.pdt ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'
            }`}>
              {pdtStatus.pdt ? 'PDT' : 'Non-PDT'}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">PDT Status:</span>
              <span className={`font-medium ${pdtStatus.pdt ? 'text-red-600' : 'text-green-600'}`}>
                {pdtStatus.pdt ? 'Pattern Day Trader' : 'Regular Trader'}
              </span>
            </div>
            
            {pdtStatus.pdt_removed && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">PDT Removed:</span>
                <span className="font-medium text-green-600">Yes</span>
              </div>
            )}
            
            {pdtStatus.pdt_removed_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Removed At:</span>
                <span className="font-medium text-gray-900">
                  {new Date(pdtStatus.pdt_removed_at).toLocaleDateString()}
                </span>
              </div>
            )}
            
            {pdtStatus.pdt && !pdtStatus.pdt_removed && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-medium text-yellow-900">Pattern Day Trader Restriction</h4>
                </div>
                <p className="text-sm text-yellow-800 mb-3">
                  As a Pattern Day Trader, you must maintain a minimum equity of $25,000 in your account.
                  You can request a one-time removal of this restriction.
                </p>
                <button
                  onClick={handlePDTRemovalRequest}
                  disabled={requestingPDTRemoval}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {requestingPDTRemoval ? 'Requesting...' : 'Request PDT Removal'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trading Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trading Statistics</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Day Trade Count</p>
            <p className="text-lg font-semibold text-gray-900">{tradingAccount.daytrade_count}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Options Approved Level</p>
            <p className="text-lg font-semibold text-blue-600">{tradingAccount.options_approved_level}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Options Trading Level</p>
            <p className="text-lg font-semibold text-purple-600">{tradingAccount.options_trading_level}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Clearing Broker</p>
            <p className="text-lg font-semibold text-gray-900">{tradingAccount.clearing_broker}</p>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Account ID</p>
            <p className="text-sm font-mono text-gray-900">{tradingAccount.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Account Number</p>
            <p className="text-sm font-mono text-gray-900">{tradingAccount.account_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Currency</p>
            <p className="text-sm font-medium text-gray-900">{tradingAccount.currency}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Created At</p>
            <p className="text-sm text-gray-900">
              {new Date(tradingAccount.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingAccountDetails;
