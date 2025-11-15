import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  AcademicCapIcon,
  CreditCardIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const AdminSidebar: React.FC = () => {
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Users', href: '/admin/users', icon: UsersIcon },
    { name: 'Courses', href: '/admin/courses', icon: AcademicCapIcon },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCardIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="fixed inset-y-0 z-50 flex w-64 flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-800 px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        `group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                          isActive
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                        }`
                      }
                    >
                      <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      {item.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar;