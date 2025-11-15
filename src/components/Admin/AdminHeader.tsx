import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const AdminHeader: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-white">
            Admin Dashboard
          </h2>
          <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
            <span>Welcome back,</span>
            <span className="text-white font-medium">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
            <BellIcon className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Dropdown Menu */}
            <div className="relative group">
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Cog6ToothIcon className="h-5 w-5" />
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <UserCircleIcon className="h-4 w-4 mr-3" />
                    Profile Settings
                  </Link>
                  <Link
                    to="/admin/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <Cog6ToothIcon className="h-4 w-4 mr-3" />
                    Admin Settings
                  </Link>
                  <hr className="my-2 border-gray-700" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
