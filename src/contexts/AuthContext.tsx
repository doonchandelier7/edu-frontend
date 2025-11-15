import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  subscriptionPlan: string;
  points: number;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  validateToken: () => Promise<boolean>;
  refreshAuth: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Set the token in axios headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Don't automatically fetch user profile - let components request it manually
          console.log('Token found - no automatic profile fetch');
          setIsLoading(false);
        } else {
          // No token found, user is not authenticated
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // Clear any invalid tokens
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setIsLoading(false);
      }
    };
    
    initializeAuth();

    // Disabled automatic window focus refresh to prevent unwanted API calls
    const handleWindowFocus = () => {
      // No automatic API calls on window focus
      console.log('Window focused - no automatic profile refresh');
    };

    // Add storage event listener to handle login from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (e.newValue) {
          // Token was added, set headers but don't auto-refresh
          api.defaults.headers.common['Authorization'] = `Bearer ${e.newValue}`;
          console.log('Token updated from storage - no automatic profile refresh');
        } else {
          // Token was removed, logout
          setUser(null);
          delete api.defaults.headers.common['Authorization'];
        }
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile...');
      const response = await api.get('/auth/profile');
      setUser(response.data);
      console.log('User profile fetched successfully:', response.data);
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error);
      // Only clear token if it's a 401 error (unauthorized)
      if (error.response?.status === 401) {
        console.log('Token is invalid, clearing authentication');
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = response.data;
      
      localStorage.setItem('token', accessToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setUser(userData);
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post('/auth/register', data);
      const { accessToken, user: userData } = response.data;
      
      localStorage.setItem('token', accessToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setUser(userData);
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const validateToken = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      const response = await api.get('/auth/profile');
      if (response.status === 200) {
        setUser(response.data);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Token validation failed:', error);
      return false;
    }
  };

  // Add a function to refresh authentication state (manual call only)
  const refreshAuth = async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous calls
    
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Manual profile refresh requested');
      setIsRefreshing(true);
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await fetchUserProfile();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Manual function to fetch user profile when needed
  const fetchUserProfileManually = async () => {
    console.log('Manual user profile fetch requested');
    await fetchUserProfile();
  };

  const value = {
    user,
    login,
    register,
    logout,
    validateToken,
    refreshAuth,
    fetchUserProfileManually,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

