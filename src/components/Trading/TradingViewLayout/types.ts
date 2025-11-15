import { CandlestickData } from '../../../services/chartService';

export interface SelectedStockData {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  marketStatus: string;
  lastUpdate: string;
  description: string;
  keyStats: {
    nextEarnings: string;
    volume: string;
    avgVolume: string;
    marketCap: string;
    high24h?: number;
    low24h?: number;
  };
}

export interface StockItem {
  id?: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  exchange?: string;
  sector?: string;
}

export interface ChartStockData {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
}

export interface TradeOrderData {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price?: number;
  assetType: 'stock';
}

export interface AlpacaAccount {
  status: string;
  portfolio_value?: string;
  buying_power?: string;
  cash?: string;
  equity?: string;
  day_trade_count?: number;
}

export interface ChartDataState {
  data: CandlestickData[];
  timeframe: string;
  chartType: 'candles' | 'line' | 'bars';
  loading: boolean;
}

export interface NewsItem {
  title?: string;
  headline?: string;
  source?: string;
  url?: string;
  publishedAt?: string;
}

