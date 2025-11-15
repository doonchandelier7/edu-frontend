import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TradingHeaderProvider } from '../../contexts/TradingHeaderContext';
import { useAuth } from '../../contexts/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const content = children || <Outlet />;
  const isTradingPage = location.pathname.includes('/trading');

  const handleMenuToggle = () => {
    // Toggle sidebar collapse state
    const currentState = localStorage.getItem('sidebarCollapsed') === 'true';
    const newState = !currentState;
    localStorage.setItem('sidebarCollapsed', String(newState));
    setSidebarCollapsed(newState);
    // Dispatch custom event to update sidebar in same window
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: newState }));
  };
  
  return (
    <TradingHeaderProvider>
      <div className="flex h-screen bg-gray-900">
        {/* Show Sidebar when authenticated, Header when not authenticated */}
        {isAuthenticated ? (
          <>
            {/* Sidebar */}
            <Sidebar />
            
            {/* Main Content Area with Dashboard Header */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Dashboard Header */}
              <DashboardHeader onMenuToggle={handleMenuToggle} />
              
              {/* Main Content */}
              <main className={`flex-1 overflow-hidden ${isTradingPage ? '' : 'overflow-y-auto bg-gray-900'}`}>
                {isTradingPage ? (
                  content
                ) : (
                  <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {content}
                  </div>
                )}
              </main>
            </div>
          </>
        ) : (
          <div className="flex flex-col flex-1">
            {/* Header - Only shown when not authenticated */}
            <Header />
            
            {/* Main Content Area */}
            <main className={`flex-1 overflow-hidden ${isTradingPage ? '' : 'overflow-y-auto'}`}>
              {isTradingPage ? (
                content
              ) : (
                <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  {content}
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </TradingHeaderProvider>
  );
};

export default Layout;

