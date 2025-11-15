import React, { useState } from 'react';
import { MagnifyingGlassIcon, BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardHeaderProps {
  onMenuToggle?: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMenuToggle }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  // Determine market status (you can make this dynamic based on actual market hours)
  const isMarketOpen = true; // Example: You can check actual market hours here
  const marketStatus = isMarketOpen ? 'Market Open' : 'Market Closed';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Handle search - you can navigate to search results or filter content
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-30">
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        {/* Left Section: Hamburger Menu & Search */}
        <div className="flex items-center gap-3 flex-1">
          {/* Hamburger Menu Button */}
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-gray-300"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-purple-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stocks, news, or help..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </form>
        </div>

        {/* Right Section: Market Status, Notifications & User Avatar */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Market Status */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-900/30 rounded-lg border border-green-700/50">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-400">{marketStatus}</span>
          </div>

          {/* Notifications */}
          <button
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors relative"
            aria-label="Notifications"
          >
            <BellIcon className="h-6 w-6 text-yellow-400" />
            {/* Notification badge - you can add logic to show/hide based on notifications */}
            {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
          </button>

          {/* User Avatar */}
          <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
            <span className="text-white font-bold text-sm">
              {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

