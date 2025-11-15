import { api } from './api';

export interface TradeOrder {
  symbol: string;
  side: 'buy' | 'sell';
  tradeType: 'market' | 'limit';
  quantity: number;
  price?: number;
  assetType: 'crypto' | 'stock';
}

export interface PortfolioData {
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  holdings: PortfolioHolding[];
}

export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface TradeHistory {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price: number;
  totalValue: number;
  timestamp: string;
  assetType: 'crypto' | 'stock';
}

export interface IntradayTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  tradeType: 'market' | 'limit' | 'stop_loss';
  quantity: number;
  price: number;
  totalAmount: number;
  status: string;
  tradeDate: string;
  executedAt: string;
  assetType: 'crypto' | 'stock';
  stopLossPrice?: number;
  limitPrice?: number;
  externalOrderId?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
}

export const tradingApi = {
  // Get current prices for crypto assets
  getCryptoPrices: async (symbols: string[]): Promise<Record<string, number>> => {
    const response = await api.post('/trading/crypto/prices', { symbols });
    return response.data;
  },

  // Get current prices for stock assets
  getStockPrices: async (symbols: string[]): Promise<Record<string, number>> => {
    const response = await api.post('/trading/stock/prices', { symbols });
    return response.data;
  },

  // Place a trading order
  placeOrder: async (orderData: TradeOrder): Promise<any> => {
    const response = await api.post('/trading/trade', orderData);
    return response.data;
  },

  // Get user's portfolio
  getPortfolio: async (): Promise<PortfolioData> => {
    const response = await api.get('/trading/portfolio');
    return response.data;
  },

  // Get user's trade history
  getUserTrades: async (assetType?: 'crypto' | 'stock'): Promise<TradeHistory[]> => {
    const params = assetType ? { assetType } : {};
    const response = await api.get('/trading/trades', { params });
    return response.data;
  },

  // Get user's intraday trades
  getIntradayTrades: async (date?: string): Promise<IntradayTrade[]> => {
    const params = date ? { date } : {};
    const response = await api.get('/trading/intraday-trades', { params });
    return response.data;
  },

  // Get leaderboard
  getLeaderboard: async (limit: number = 50): Promise<LeaderboardEntry[]> => {
    const response = await api.get('/trading/leaderboard', { 
      params: { limit } 
    });
    return response.data;
  },

  // Get market data for a specific asset
  getMarketData: async (symbol: string, assetType: 'crypto' | 'stock'): Promise<any> => {
    const endpoint = assetType === 'crypto' 
      ? `/trading/crypto/market-data/${symbol}`
      : `/trading/stock/market-data/${symbol}`;
    const response = await api.get(endpoint);
    return response.data;
  },

  // Get real-time price updates (WebSocket connection)
  subscribeToPriceUpdates: (symbols: string[], assetType: 'crypto' | 'stock', callback: (data: any) => void) => {
    // This would implement WebSocket connection for real-time updates
    // For now, we'll use polling
    const interval = setInterval(async () => {
      try {
        const prices = assetType === 'crypto' 
          ? await tradingApi.getCryptoPrices(symbols)
          : await tradingApi.getStockPrices(symbols);
        callback(prices);
      } catch (error) {
        console.error('Error fetching price updates:', error);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  },
};
