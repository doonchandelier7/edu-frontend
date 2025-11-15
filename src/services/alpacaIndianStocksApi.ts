import { api } from './api';

export interface IndianStockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  timestamp: Date;
  exchange: string;
  sector?: string;
}

export interface IndianStockHistoricalData {
  symbol: string;
  data: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

export interface IndianStockMarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe: number;
  eps: number;
  dividend: number;
  dividendYield: number;
  exchange: string;
  sector: string;
}

export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  buying_power: string;
  cash: string;
  portfolio_value: string;
  equity: string;
  created_at: string;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  qty: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  current_price: string;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  submitted_at: string;
  filled_at?: string;
  asset_id: string;
  symbol: string;
  asset_class: string;
  qty?: string;
  filled_qty: string;
  filled_avg_price?: string;
  order_class: string;
  order_type: string;
  type: string;
  side: string;
  time_in_force: string;
  limit_price?: string;
  stop_price?: string;
  status: string;
  extended_hours: boolean;
}

export interface PaperTradeData {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  orderType: 'market' | 'limit';
}

export interface RiskMetrics {
  totalValue: number;
  cash: number;
  equity: number;
  cashPercentage: number;
  marginUsed: number;
  marginPercentage: number;
  buyingPower: number;
  dayTradingBuyingPower: number;
  positions: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export const alpacaIndianStocksApi = {
  // Account Management
  getAccount: async (): Promise<AlpacaAccount> => {
    const response = await api.get('/trading/alpaca-indian/account');
    return response.data.data;
  },

  // Portfolio Management
  getPortfolio: async (): Promise<any> => {
    const response = await api.get('/trading/alpaca-indian/portfolio');
    return response.data.data;
  },

  getPositions: async (): Promise<AlpacaPosition[]> => {
    const response = await api.get('/trading/alpaca-indian/positions');
    return response.data.data;
  },

  getPosition: async (symbol: string): Promise<AlpacaPosition | null> => {
    const response = await api.get(`/trading/alpaca-indian/positions/${symbol}`);
    return response.data.data;
  },

  // Orders Management
  createOrder: async (orderData: {
    symbol: string;
    qty?: number;
    notional?: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop' | 'stop_limit';
    time_in_force: 'day' | 'gtc' | 'ioc' | 'fok';
    limit_price?: number;
    stop_price?: number;
    client_order_id?: string;
  }): Promise<AlpacaOrder> => {
    const response = await api.post('/trading/alpaca-indian/orders', orderData);
    return response.data.data;
  },

  getOrders: async (status?: string, limit?: number, after?: string): Promise<AlpacaOrder[]> => {
    const params: any = {};
    if (status) params.status = status;
    if (limit) params.limit = limit;
    if (after) params.after = after;

    const response = await api.get('/trading/alpaca-indian/orders', { params });
    return response.data.data;
  },

  getOrder: async (orderId: string): Promise<AlpacaOrder> => {
    const response = await api.get(`/trading/alpaca-indian/orders/${orderId}`);
    return response.data.data;
  },

  cancelOrder: async (orderId: string): Promise<void> => {
    await api.delete(`/trading/alpaca-indian/orders/${orderId}`);
  },

  // Market Data
  getQuote: async (symbol: string): Promise<IndianStockQuote> => {
    const response = await api.get(`/trading/alpaca-indian/quotes/${symbol}`);
    return response.data.data;
  },

  getHistoricalData: async (symbol: string, timeframe?: string): Promise<IndianStockHistoricalData> => {
    const params = timeframe ? { timeframe } : {};
    const response = await api.get(`/trading/alpaca-indian/historical/${symbol}`, { params });
    return response.data.data;
  },

  getMarketData: async (symbols: string[]): Promise<IndianStockMarketData[]> => {
    const response = await api.post('/trading/alpaca-indian/market-data', { symbols });
    return response.data.data;
  },

  // News
  getNews: async (symbol: string): Promise<any[]> => {
    try {
      const response = await api.get(`/trading/alpaca-indian/news/${symbol}`);
      return response.data.data || [];
    } catch (e) {
      return [];
    }
  },

  // Paper Trading
  executePaperTrade: async (tradeData: PaperTradeData): Promise<AlpacaOrder> => {
    const response = await api.post('/trading/alpaca-indian/paper-trade', tradeData);
    return response.data.data;
  },

  // Risk Management
  getRiskMetrics: async (): Promise<RiskMetrics> => {
    const response = await api.get('/trading/alpaca-indian/risk-metrics');
    return response.data.data;
  },

  // Indian Stock Symbols
  getIndianStockSymbols: async (): Promise<string[]> => {
    const response = await api.get('/trading/alpaca-indian/symbols');
    return response.data.data;
  },

  searchIndianStocks: async (query: string): Promise<any[]> => {
    const response = await api.get(`/trading/alpaca-indian/search?q=${query}`);
    return response.data.data;
  },

  // Market Overview
  getMarketOverview: async (): Promise<any> => {
    const response = await api.get('/trading/alpaca-indian/overview');
    return response.data.data;
  },

  // Top Gainers
  getTopGainers: async (): Promise<any[]> => {
    const response = await api.get('/trading/watchlists/market/top-gainers');
    return response.data;
  },

  // Top Losers
  getTopLosers: async (): Promise<any[]> => {
    const response = await api.get('/trading/watchlists/market/top-losers');
    return response.data;
  },

  // Indian Indices
  getIndianIndices: async (): Promise<any[]> => {
    const response = await api.get('/trading/watchlists/market/indices');
    return response.data;
  },

  // Utility functions
  formatPrice: (price: number): string => {
    if (price >= 1000) {
      return `$${price.toLocaleString()}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(4)}`;
    }
  },

  formatChange: (change: number): string => {
    return change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
  },

  formatChangePercent: (changePercent: number): string => {
    return changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
  },

  // Get color class for change
  getChangeColorClass: (change: number): string => {
    return change >= 0 ? 'text-green-500' : 'text-red-500';
  },

  // Get risk level color
  getRiskLevelColor: (riskLevel: string): string => {
    switch (riskLevel) {
      case 'Low':
        return 'text-green-500';
      case 'Medium':
        return 'text-yellow-500';
      case 'High':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  },
};
