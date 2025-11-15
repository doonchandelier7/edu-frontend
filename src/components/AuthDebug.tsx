import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthDebug: React.FC = () => {
  const { user, isAuthenticated, isLoading, validateToken, refreshAuth } = useAuth();

  const handleValidateToken = async () => {
    const isValid = await validateToken();
    console.log('Token validation result:', isValid);
  };

  const handleRefreshAuth = async () => {
    await refreshAuth();
    console.log('Auth refreshed');
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50">
      {/* <div className="text-sm">
        <div><strong>Auth Status:</strong> {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
        <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
        <div><strong>User:</strong> {user ? `${user.firstName} ${user.lastName}` : 'None'}</div>
        <div><strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Missing'}</div>
      </div>
      <div className="mt-2 space-x-2">
        <button 
          onClick={handleValidateToken}
          className="bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded text-xs"
        >
          Validate Token
        </button>
        <button 
          onClick={handleRefreshAuth}
          className="bg-green-500 hover:bg-green-600 px-2 py-1 rounded text-xs"
        >
          Refresh Auth
        </button>
      </div> */}
    </div>
  );
};

export default AuthDebug;
