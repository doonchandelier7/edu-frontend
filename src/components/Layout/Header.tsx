import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTradingHeader } from '../../contexts/TradingHeaderContext';
import { BellIcon, CogIcon, HomeIcon, AcademicCapIcon, ChartBarIcon, TrophyIcon, UserIcon, ShieldCheckIcon, WalletIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isTradingPage = location.pathname.includes('/trading');
  
  // Use trading header context (always available, returns defaults if not in provider)
  const tradingHeaderContext = useTradingHeader();

  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(() => {
    const saved = localStorage.getItem('navigationCollapsed');
    return saved === 'true';
  });

  // Listen for storage changes to sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'navigationCollapsed') {
        setIsNavigationCollapsed(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleNavigation = () => {
    const newState = !isNavigationCollapsed;
    setIsNavigationCollapsed(newState);
    localStorage.setItem('navigationCollapsed', String(newState));
  };

  const navigation = [
    {
      name: 'Home',
      href: '/dashboard',
      icon: HomeIcon,
      color: 'text-blue-500',
    },
    {
      name: 'Learn',
      href: '/learn',
      icon: AcademicCapIcon,
      color: 'text-green-500',
    },
    {
      name: 'Trade',
      href: '/trading',
      icon: ChartBarIcon,
      color: 'text-orange-500',
    },
    {
      name: 'Portfolio',
      href: '/portfolio',
      icon: WalletIcon,
      color: 'text-blue-500',
    },
    {
      name: 'Leaderboard',
      href: '/leaderboard',
      icon: TrophyIcon,
      color: 'text-purple-500',
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserIcon,
      color: 'text-gray-400',
    },
  ];

  // Add admin link for admin users
  if (user && (user.role === 'super_admin' || user.role === 'instructor')) {
    navigation.push({
      name: 'Admin Panel',
      href: '/admin',
      icon: ShieldCheckIcon,
      color: 'text-red-500',
    });
  }

  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
      {/* Top Section - Logo and User Info */}
      <div className="px-4 py-2 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-7 h-7 bg-gradient-to-r from-teal-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-base">E</span>
                </div>
              </div>
              <div className="ml-2">
                <h1 className="text-lg font-bold text-white">EduCrypto</h1>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            {/* Wallet Balance */}
            <div className="bg-gray-700 rounded-lg px-3 py-1.5">
              <div className="text-green-400 text-xs font-medium">Wallet Balance</div>
              <div className="text-white text-base font-bold">₹1,00,000.00</div>
            </div>

            {/* Notifications */}
            <button className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700">
              <BellIcon className="h-5 w-5" />
            </button>

            {/* Settings */}
            <button className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700">
              <CogIcon className="h-5 w-5" />
            </button>

            {/* User Profile */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
                </span>
              </div>
              <div className="text-right hidden md:block">
                <div className="text-white text-xs font-medium">
                  {user?.firstName || 'User'} {user?.lastName || ''}
                </div>
                <div className="text-gray-400 text-xs">
                  {user?.subscriptionPlan ? `${user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1)} Plan` : 'No Plan'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Navigation Menu */}
      <div 
        data-tour="navigation"
        className={`bg-gray-800 transition-all duration-300 ${
          isNavigationCollapsed ? 'py-1' : 'py-2'
        }`}
      >
        {isNavigationCollapsed ? (
          /* Collapsed State - Compact Design */
          <div className="px-6">
            <button
              onClick={toggleNavigation}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition w-full py-1"
            >
              <ChevronDownIcon className="w-4 h-4" />
              <span className="text-xs font-medium">Show Navigation</span>
            </button>
          </div>
        ) : (
          /* Expanded State */
          <div className="px-6">
            <div className="flex items-center justify-between gap-4">
              {/* Navigation Links */}
              <nav className="flex items-center space-x-1 overflow-x-auto flex-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href || 
                    (item.href === '/dashboard' && location.pathname === '/');
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`
                        flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 whitespace-nowrap
                        ${isActive 
                          ? 'bg-gray-700 text-white shadow-sm' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }
                      `}
                    >
                      <Icon
                        className={`
                          flex-shrink-0 mr-2 h-5 w-5 transition-colors duration-150
                          ${isActive ? item.color : 'text-gray-400'}
                        `}
                      />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Trading Tools - Only visible on trading page */}
              {isTradingPage && (
                <div className={`flex items-center space-x-3 transition-all duration-300 ${
                  isNavigationCollapsed ? 'opacity-0 max-w-0 overflow-hidden' : 'opacity-100 max-w-full'
                }`}>
                  {/* Search Bar */}
                  <div className="relative">
                    <div className="flex items-center bg-gray-700 rounded-lg border border-gray-600 px-4 py-2 w-80">
                      <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Search Indian stocks and watchlist..."
                        className="flex-1 outline-none text-sm bg-transparent placeholder-gray-400 text-white min-w-0"
                        value={tradingHeaderContext.searchQuery}
                        onChange={(e) => tradingHeaderContext.setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Alpaca Accounts Button */}
                  <button
                    onClick={tradingHeaderContext.onAccountManagerClick}
                    className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg text-sm font-medium transition whitespace-nowrap"
                  >
                    Alpaca Accounts
                  </button>

                  {/* New Trade Button */}
                  <button
                    onClick={tradingHeaderContext.onNewTradeClick}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition whitespace-nowrap"
                  >
                    New Trade
                  </button>
                </div>
              )}

              {/* Main Collapse Toggle Button - Controls entire navigation */}
              <button
                onClick={toggleNavigation}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition flex-shrink-0"
                title="Hide Navigation"
              >
                <ChevronUpIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
