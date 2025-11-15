import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  AcademicCapIcon,
  ChartBarIcon,
  TrophyIcon,
  UserIcon,
  ShieldCheckIcon,
  WalletIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarCollapsed') {
        setIsCollapsed(e.newValue === 'true');
      }
    };
    
    const handleSidebarToggle = (e: CustomEvent) => {
      setIsCollapsed(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);


  const handleLogout = () => {
    logout();
    navigate('/login');
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
    <div className={`bg-gray-800 border-r border-gray-700 flex-shrink-0 flex flex-col h-full transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Header Section */}
      <div className={`p-5 border-b border-gray-700 ${isCollapsed ? 'px-3 py-4' : ''}`}>
        <Link to="/dashboard" className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-r from-teal-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">E</span>
            </div>
          </div>
          {!isCollapsed && (
            <div className="ml-3">
              <h1 className="text-xl font-bold text-white">EduCrypto</h1>
            </div>
          )}
        </Link>
      </div>

      {/* User Info & Wallet Balance - Only show when not collapsed */}
      {!isCollapsed && (
        <div className="px-4 py-5 border-b border-gray-700 space-y-4">
          {/* Wallet Balance */}
          <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl px-4 py-3 border border-gray-600 shadow-sm">
            <div className="text-green-400 text-xs font-semibold uppercase tracking-wide mb-1">Wallet Balance</div>
            <div className="text-white text-xl font-bold">₹1,00,000.00</div>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors">
            <div className="w-10 h-10 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-semibold truncate">
                {user?.firstName || 'User'} {user?.lastName || ''}
              </div>
              <div className="text-gray-400 text-xs truncate">
                {user?.subscriptionPlan ? `${user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1)} Plan` : 'Free Plan'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`mt-2 flex-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3'} pb-4`}>
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
              (item.href === '/dashboard' && location.pathname === '/');
            
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`
                    group flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-gray-700 text-white shadow-sm' 
                      : 'text-gray-300 hover:bg-gray-700/70 hover:text-white'
                    }
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon
                    className={`
                      flex-shrink-0 ${isCollapsed ? '' : 'mr-3'} h-5 w-5 transition-colors duration-200
                      ${isActive ? item.color : 'text-gray-400 group-hover:text-white'}
                    `}
                  />
                  {!isCollapsed && <span className="font-medium">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className={`border-t border-gray-700 ${isCollapsed ? 'px-2' : 'px-3'} py-3 mt-auto`}>
        <button
          onClick={handleLogout}
          className={`
            group flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-all duration-200 w-full
            text-gray-300 hover:bg-red-600/90 hover:text-white hover:shadow-sm
          `}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <ArrowRightOnRectangleIcon
            className={`
              flex-shrink-0 ${isCollapsed ? '' : 'mr-3'} h-5 w-5 transition-colors duration-200
              text-gray-400 group-hover:text-white
            `}
          />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>

      {/* Subscription Plans Info */}
      {/* <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4">
          <h3 className="text-white text-sm font-semibold mb-1">Upgrade to Pro</h3>
          <p className="text-white text-xs opacity-90 mb-2">
            Unlimited trading & full courses
          </p>
          <button className="w-full bg-white text-purple-600 text-xs font-medium py-2 px-3 rounded-md hover:bg-gray-100 transition-colors">
            Upgrade Now
          </button>
        </div>
      </div> */}
    </div>
  );
};

export default Sidebar;

