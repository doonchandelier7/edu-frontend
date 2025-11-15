import { SelectedStockData } from './types';

/**
 * Sanitize stock symbol by removing exchange prefixes/suffixes
 */
export const sanitizeSymbol = (raw: string): string => {
  if (!raw) return '';
  let t = String(raw).toUpperCase().trim();
  t = t.replace(/^NSE:/, '');
  t = t.replace(/\.NS$/, '');
  return t;
};

/**
 * Normalize stock data to SelectedStockData format
 */
export const normalizeStockData = (data: any): SelectedStockData => {
  return {
    symbol: sanitizeSymbol(data.symbol),
    name: data.name,
    exchange: data.exchange || 'NSE',
    sector: data.sector || 'General',
    price: data.price || 0,
    change: data.change || 0,
    changePercent: data.changePercent || 0,
    marketStatus: data.marketStatus || 'Market Open',
    lastUpdate: data.lastUpdate || 'Last update at 15:30 IST',
    description: data.description || `${data.name || data.symbol} is an Indian stock.`,
    keyStats: {
      nextEarnings: (data.keyStats && data.keyStats.nextEarnings) || data.nextEarnings || 'N/A',
      volume: (data.keyStats && data.keyStats.volume) || data.volume || 'N/A',
      avgVolume: (data.keyStats && data.keyStats.avgVolume) || data.avgVolume || 'N/A',
      marketCap: (data.keyStats && data.keyStats.marketCap) || data.marketCap || 'N/A',
      high24h: (data.keyStats && data.keyStats.high24h) || data.high24h,
      low24h: (data.keyStats && data.keyStats.low24h) || data.low24h,
    },
  };
};

/**
 * Format price change value
 */
export const formatChange = (change: number): string => {
  return change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
};

/**
 * Format price change percentage
 */
export const formatChangePercent = (changePercent: number): string => {
  return changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
};

/**
 * Format price with currency symbol
 */
export const formatPrice = (price: number): string => {
  if (price >= 1000) {
    return `₹${price.toLocaleString()}`;
  } else if (price >= 1) {
    return `₹${price.toFixed(2)}`;
  } else {
    return `₹${price.toFixed(4)}`;
  }
};

/**
 * Map frontend timeframe to backend timeframe
 */
export const mapTimeframeToBackend = (timeframe: string): string => {
  const timeframeMap: { [key: string]: string } = {
    '1D': '1Day',
    '5D': '1Day',
    '1W': '1Week',
    '1M': '1Month',
    '3M': '1Month',
    '6M': '1Month',
    '1Y': '1Month',
    '5Y': '1Month',
  };
  return timeframeMap[timeframe] || '1Day';
};

