import React from 'react';
import {
  UsersIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400">Welcome to the admin panel</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Users</p>
              <p className="text-2xl font-bold text-white mt-2">1,234</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-400 mr-1" />
                <span className="text-sm font-medium text-green-400">+12%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Trades</p>
              <p className="text-2xl font-bold text-white mt-2">5,678</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-400 mr-1" />
                <span className="text-sm font-medium text-green-400">+8%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Active Courses</p>
              <p className="text-2xl font-bold text-white mt-2">45</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-400 mr-1" />
                <span className="text-sm font-medium text-green-400">+5%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <AcademicCapIcon className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Revenue</p>
              <p className="text-2xl font-bold text-white mt-2">$12,345</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-400 mr-1" />
                <span className="text-sm font-medium text-green-400">+15%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
            Manage Users
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
            View Analytics
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
            System Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;