import axios from 'axios';

// Get base URL from environment variable
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
// Ensure API_BASE_URL includes /api/v1
const API_BASE_URL = BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if it's not an API keys request
      // This prevents logout when API keys are not configured
      const url = error.config?.url || '';
      if (!url.includes('/admin/api-keys') && !url.includes('/auth/profile')) {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        // Only redirect if we're not already on the login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  profile: () => api.get('/auth/profile'),
};

// Trading API
export const tradingApi = {
  // Order Management
  createTrade: (tradeData: any) => api.post('/trading/trade', tradeData),
  placeOrder: (orderData: any) => api.post('/trading/trade', orderData),
  getTrades: (assetType?: string) => api.get(`/trading/trades?assetType=${assetType || ''}`),
  getUserTrades: (assetType?: string) => api.get(`/trading/trades?assetType=${assetType || ''}`),
  
  // Intraday Trades
  getIntradayTrades: (date?: string) => {
    const params = date ? { date } : {};
    return api.get('/trading/intraday-trades', { params });
  },
  
  // Portfolio Management
  getPortfolio: () => api.get('/trading/portfolio'),
  getPortfolioValue: () => api.get('/trading/portfolio/value'),
  getPortfolioHistory: (period?: string) => api.get(`/trading/portfolio/history?period=${period || '1d'}`),
  
  // Price Data
  getCryptoPrices: (symbols: string[]) => api.post('/trading/crypto/prices', { symbols }),
  getStockPrices: (symbols: string[]) => api.post('/trading/stock/prices', { symbols }),
  getCurrentPrices: (symbols: string[], assetType: 'crypto' | 'stock') => 
    api.post(`/trading/${assetType}/prices`, { symbols }),
  
  // Market Data
  getMarketData: (symbol: string, assetType: 'crypto' | 'stock') => 
    api.get(`/trading/${assetType}/market-data/${symbol}`),
  getMarketOverview: (assetType: 'crypto' | 'stock') => 
    api.get(`/trading/${assetType}/overview`),
  
  // Leaderboard
  getLeaderboard: (limit?: number) => api.get(`/trading/leaderboard?limit=${limit || 50}`),
  getMyRank: () => api.get('/trading/leaderboard/my-rank'),
  
  // Real-time Updates
  subscribeToUpdates: (symbols: string[], assetType: 'crypto' | 'stock') => {
    // WebSocket implementation would go here
    console.log('Subscribing to updates for:', symbols, assetType);
  },
};

// Market Data API
export const marketDataApi = {
  getMarketData: (symbol: string, type: 'crypto' | 'stock') => 
    api.get(`/trading/market-data/${symbol}?type=${type}`),
  getMarketOverview: () => api.get('/trading/alpaca-indian/overview'),
  getTopGainers: (type: 'crypto' | 'stock', limit = 10) => 
    api.get(`/trading/top-gainers?type=${type}&limit=${limit}`),
  getTopLosers: (type: 'crypto' | 'stock', limit = 10) => 
    api.get(`/trading/top-losers?type=${type}&limit=${limit}`),
  searchSymbols: (query: string, type?: 'crypto' | 'stock') => 
    api.get(`/trading/search?q=${query}&type=${type}`),
};

// Paper Trading API
export const paperTradingApi = {
  placeTrade: (tradeData: any) => api.post('/trading/paper-trade', tradeData),
  getPortfolio: (userId: string) => api.get(`/trading/portfolio/${userId}`),
  getRiskMetrics: (userId: string) => api.get(`/trading/risk-metrics/${userId}`),
};

// Admin API
export const adminApi = {
  getApiConfigs: () => api.get('/admin/api-configs'),
  updateApiConfig: (name: string, updates: any) => 
    api.put(`/admin/api-configs/${name}`, updates),
  testApiConnection: (name: string) => 
    api.post(`/admin/test-api/${name}`),
};

// API Keys Management
export const apiKeysApi = {
  // Get all API keys
  getAllApiKeys: () => api.get('/admin/api-keys'),
  
  // Get API key by ID
  getApiKeyById: (id: string) => api.get(`/admin/api-keys/${id}`),
  
  // Create new API key
  createApiKey: (data: any) => api.post('/admin/api-keys', data),
  
  // Update API key
  updateApiKey: (id: string, data: any) => api.put(`/admin/api-keys/${id}`, data),
  
  // Delete API key
  deleteApiKey: (id: string) => api.delete(`/admin/api-keys/${id}`),
  
  // Test API key connection
  testApiKey: (id: string) => api.post(`/admin/api-keys/${id}/test`),
  
  // Get API key status
  getApiKeyStatus: (id: string) => api.get(`/admin/api-keys/${id}/status`),
  
  // Initialize default API keys
  initializeDefaultApiKeys: () => api.post('/admin/api-keys/initialize'),
};

// Courses API
export const coursesApi = {
  getCourses: () => api.get('/courses'),
  getCourse: (id: string) => api.get(`/courses/${id}`),
  enroll: (courseId: string) => api.post(`/courses/${courseId}/enroll`),
  getEnrollments: () => api.get('/courses/my/enrollments'),
  createCourse: (courseData: any) => api.post('/courses', courseData),
  updateCourse: (id: string, courseData: any) => api.put(`/courses/${id}`, courseData),
  deleteCourse: (id: string) => api.delete(`/courses/${id}`),
};

// Portfolio API
export const portfolioApi = {
  getUserPortfolio: () => api.get('/portfolio'),
  getLeaderboard: () => api.get('/portfolio/leaderboard'),
  getMyRank: () => api.get('/portfolio/my-rank'),
};

// Users API
export const usersApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getAllUsers: () => api.get('/users'),
  createUser: (userData: any) => api.post('/users', userData),
  updateUser: (id: string, userData: any) => api.put(`/users/${id}`, userData),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  getUserById: (id: string) => api.get(`/users/${id}`),
};

export default api;

