import React from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';

interface EmptyAccountProps {
  onConnectClick: () => void;
}

export const EmptyAccount: React.FC<EmptyAccountProps> = ({ onConnectClick }) => {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-3xl p-6 shadow-lg border border-slate-600/60">
      <div className="text-center">
        <div className="w-16 h-16 bg-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UserCircleIcon className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">No Account Connected</h3>
        <p className="text-slate-400 text-sm mb-4">Connect your Alpaca account to view trading data</p>
        <button
          onClick={onConnectClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
        >
          Connect Account
        </button>
      </div>
    </div>
  );
};

