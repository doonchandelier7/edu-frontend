import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <AdminSidebar />
      <div className="pl-64">
        <AdminHeader />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;