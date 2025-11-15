import React from 'react';
import { alpacaIndianStocksApi } from '../../../../services/alpacaIndianStocksApi';
import { AlpacaAccount } from '../types';
import { formatPrice } from '../utils';

interface AccountInfoProps {
  account: AlpacaAccount;
  onRefresh: (account: AlpacaAccount) => void;
}

export const AccountInfo: React.FC<AccountInfoProps> = ({ account, onRefresh }) => {
  const handleRefresh = async () => {
    try {
      const refreshedAccount = await alpacaIndianStocksApi.getAccount();
      onRefresh(refreshedAccount);
    } catch (error) {
      console.error('Failed to refresh account:', error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-3xl p-6 shadow-lg border border-slate-600/60">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Alpaca Account</h3>
        <div className="flex items-center space-x-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              account.status === 'ACTIVE'
                ? 'bg-green-900/50 text-green-400 border border-green-500/30'
                : 'bg-red-900/50 text-red-400 border border-red-500/30'
            }`}
          >
            {account.status}
          </div>
          <button
            onClick={handleRefresh}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-all duration-200"
            title="Refresh Account Data"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-slate-700/60 rounded-2xl">
          <span className="text-sm font-medium text-slate-300">Portfolio Value</span>
          <span className="font-bold text-white">
            {account.portfolio_value ? formatPrice(parseFloat(account.portfolio_value)) : 'N/A'}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-slate-700/60 rounded-2xl">
          <span className="text-sm font-medium text-slate-300">Buying Power</span>
          <span className="font-bold text-white">
            {account.buying_power ? formatPrice(parseFloat(account.buying_power)) : 'N/A'}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-slate-700/60 rounded-2xl">
          <span className="text-sm font-medium text-slate-300">Cash</span>
          <span className="font-bold text-white">
            {account.cash ? formatPrice(parseFloat(account.cash)) : 'N/A'}
          </span>
        </div>

        {account.equity && (
          <div className="flex justify-between items-center p-3 bg-slate-700/60 rounded-2xl">
            <span className="text-sm font-medium text-slate-300">Equity</span>
            <span className="font-bold text-white">{formatPrice(parseFloat(account.equity))}</span>
          </div>
        )}

        {account.day_trade_count !== undefined && (
          <div className="flex justify-between items-center p-3 bg-slate-700/60 rounded-2xl">
            <span className="text-sm font-medium text-slate-300">Day Trades</span>
            <span className="font-bold text-white">{account.day_trade_count}</span>
          </div>
        )}
      </div>
    </div>
  );
};

