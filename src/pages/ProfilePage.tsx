import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Profile Settings</h1>
        <p className="text-gray-400 text-lg">Manage your account and preferences</p>
      </div>

      {/* Profile Header */}
      <div className="card p-8">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-3xl">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-400 text-lg">{user?.email}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="bg-teal-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {user?.subscriptionPlan ? `${user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1)} Plan` : 'No Plan'}
              </span>
              <span className="text-gray-400">
                {user?.points?.toLocaleString()} points
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-xl font-bold text-white mb-4">Account Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                className="input-field"
                value={user?.firstName || ''}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                className="input-field"
                value={user?.lastName || ''}
                placeholder="Enter last name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                className="input-field"
                value={user?.email || ''}
                placeholder="Enter email address"
              />
            </div>
            <button className="btn-primary w-full">
              Update Profile
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-bold text-white mb-4">Subscription</h3>
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium">
                {user?.subscriptionPlan ? `${user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1)} Plan` : 'No Plan'}
              </h4>
              <p className="text-gray-400 text-sm mt-1">
                {user?.subscriptionPlan === 'free' && 'Limited trades, basic courses'}
                {user?.subscriptionPlan === 'pro' && 'Unlimited trading, full courses'}
                {user?.subscriptionPlan === 'premium' && 'All features, certificates'}
              </p>
            </div>
            <button className="btn-primary w-full">
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-red-500/20 border-2">
        <h3 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Sign Out</h4>
            <p className="text-gray-400 text-sm mb-4">
              Sign out of your EduCrypto account
            </p>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
