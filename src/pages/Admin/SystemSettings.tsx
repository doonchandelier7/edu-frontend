import React, { useState } from 'react';
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  BellIcon,
  KeyIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import ApiKeysManagement from './ApiKeysManagement';

const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'EduCrypto',
    siteDescription: 'Learn cryptocurrency and stock trading',
    maintenanceMode: false,
    registrationEnabled: true,
    
    // Trading Settings
    defaultCryptoBalance: 10000,
    defaultStockBalance: 100000,
    maxTradesPerDay: 100,
    tradingEnabled: true,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    tradeAlerts: true,
    courseUpdates: true,
    
    // Security Settings
    twoFactorAuth: false,
    passwordMinLength: 8,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    
    // API Settings
    binanceApiKey: '',
    coinGeckoApiKey: '',
    iexCloudApiKey: '',
    apiRateLimit: 1000,
  });

  const tabs = [
    { id: 'general', name: 'General', icon: Cog6ToothIcon },
    { id: 'trading', name: 'Trading', icon: CurrencyDollarIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'apis', name: 'API Keys', icon: KeyIcon },
    { id: 'system', name: 'System', icon: ServerIcon },
  ];

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    // Here you would typically save to backend
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Site Name</label>
        <input
          type="text"
          value={settings.siteName}
          onChange={(e) => handleSettingChange('siteName', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Site Description</label>
        <textarea
          value={settings.siteDescription}
          onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-300">Maintenance Mode</label>
          <p className="text-xs text-gray-400">Temporarily disable the site for maintenance</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-300">Registration Enabled</label>
          <p className="text-xs text-gray-400">Allow new users to register</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.registrationEnabled}
            onChange={(e) => handleSettingChange('registrationEnabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );

  const renderTradingSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Default Crypto Balance</label>
        <input
          type="number"
          value={settings.defaultCryptoBalance}
          onChange={(e) => handleSettingChange('defaultCryptoBalance', parseInt(e.target.value))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Default Stock Balance</label>
        <input
          type="number"
          value={settings.defaultStockBalance}
          onChange={(e) => handleSettingChange('defaultStockBalance', parseInt(e.target.value))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Max Trades Per Day</label>
        <input
          type="number"
          value={settings.maxTradesPerDay}
          onChange={(e) => handleSettingChange('maxTradesPerDay', parseInt(e.target.value))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-300">Trading Enabled</label>
          <p className="text-xs text-gray-400">Allow users to place trades</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.tradingEnabled}
            onChange={(e) => handleSettingChange('tradingEnabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-300">Email Notifications</label>
          <p className="text-xs text-gray-400">Send notifications via email</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.emailNotifications}
            onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-300">Push Notifications</label>
          <p className="text-xs text-gray-400">Send push notifications</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.pushNotifications}
            onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-300">Trade Alerts</label>
          <p className="text-xs text-gray-400">Notify users about trade opportunities</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.tradeAlerts}
            onChange={(e) => handleSettingChange('tradeAlerts', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-300">Course Updates</label>
          <p className="text-xs text-gray-400">Notify users about new courses</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.courseUpdates}
            onChange={(e) => handleSettingChange('courseUpdates', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-300">Two-Factor Authentication</label>
          <p className="text-xs text-gray-400">Require 2FA for admin accounts</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.twoFactorAuth}
            onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Password Minimum Length</label>
        <input
          type="number"
          value={settings.passwordMinLength}
          onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Session Timeout (minutes)</label>
        <input
          type="number"
          value={settings.sessionTimeout}
          onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Max Login Attempts</label>
        <input
          type="number"
          value={settings.maxLoginAttempts}
          onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  const renderApiSettings = () => (
    <ApiKeysManagement />
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="text-white font-medium mb-2">System Information</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Node.js Version:</span>
            <span className="text-white ml-2">v18.17.0</span>
          </div>
          <div>
            <span className="text-gray-400">Database:</span>
            <span className="text-white ml-2">PostgreSQL 14.8</span>
          </div>
          <div>
            <span className="text-gray-400">Uptime:</span>
            <span className="text-white ml-2">7 days, 12 hours</span>
          </div>
          <div>
            <span className="text-gray-400">Memory Usage:</span>
            <span className="text-white ml-2">256 MB / 1 GB</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
          Clear Cache
        </button>
        <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors">
          Restart Services
        </button>
        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
          Backup Database
        </button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'trading':
        return renderTradingSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'apis':
        return renderApiSettings();
      case 'system':
        return renderSystemSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-gray-400">Configure system-wide settings and preferences</p>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>

        {/* Save Button */}
        <div className="border-t border-gray-700 px-6 py-4 bg-gray-700/50">
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
