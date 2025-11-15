import React from 'react';
import {
  MagnifyingGlassIcon,
  StarIcon,
  FolderIcon,
  EllipsisVerticalIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAccountManagerClick: () => void;
  onNewTradeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onAccountManagerClick,
  onNewTradeClick,
}) => {
  return (
    <div className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/60 shadow-lg">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Trading Dashboard
                </h1>
                <p className="text-sm text-slate-400">Real-time market insights</p>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center bg-slate-700/90 backdrop-blur-sm rounded-2xl border border-slate-600/60 px-4 py-3 w-96 shadow-sm hover:shadow-md transition-all duration-200">
                <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 mr-3" />
                <input
                  type="text"
                  placeholder="Search Indian stocks and watchlist..."
                  className="flex-1 outline-none text-sm bg-transparent placeholder-slate-400 text-white"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>

            <nav className="flex items-center space-x-1">
              <button className="px-4 py-2 text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 rounded-xl text-sm font-medium transition-all duration-200">
                Markets
              </button>
              <button className="px-4 py-2 text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 rounded-xl text-sm font-medium transition-all duration-200">
                Portfolio
              </button>
              <button className="px-4 py-2 text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 rounded-xl text-sm font-medium transition-all duration-200">
                Orders
              </button>
              <button className="px-4 py-2 text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 rounded-xl text-sm font-medium transition-all duration-200">
                History
              </button>
              <button
                onClick={onAccountManagerClick}
                className="px-4 py-2 text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 rounded-xl text-sm font-medium transition-all duration-200"
              >
                Alpaca Accounts
              </button>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <button className="p-3 text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 rounded-xl transition-all duration-200">
              <StarIcon className="w-5 h-5" />
            </button>
            <button className="p-3 text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 rounded-xl transition-all duration-200">
              <FolderIcon className="w-5 h-5" />
            </button>
            <button className="p-3 text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 rounded-xl transition-all duration-200">
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            <button className="p-3 text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 rounded-xl transition-all duration-200">
              <UserCircleIcon className="w-6 h-6" />
            </button>
            <button
              onClick={onNewTradeClick}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              New Trade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

