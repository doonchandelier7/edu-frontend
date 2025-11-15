import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../../components/Admin/AdminLayout';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import CourseManagement from './CourseManagement';
import SubscriptionManagement from './SubscriptionManagement';
import TradingAnalytics from './TradingAnalytics';
import SystemSettings from './SystemSettings';
import ApiManagement from './ApiManagement';

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="courses" element={<CourseManagement />} />
        <Route path="subscriptions" element={<SubscriptionManagement />} />
        <Route path="analytics" element={<TradingAnalytics />} />
        <Route path="portfolios" element={<div className="text-white">Portfolio Analytics - Coming Soon</div>} />
        <Route path="leaderboards" element={<div className="text-white">Leaderboard Management - Coming Soon</div>} />
        <Route path="api-management" element={<ApiManagement />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="reports" element={<div className="text-white">Reports - Coming Soon</div>} />
        <Route path="notifications" element={<div className="text-white">Notification Management - Coming Soon</div>} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
