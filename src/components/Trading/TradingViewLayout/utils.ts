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
    'YTD': '1Month',
    '1Y': '1Month',
    '5Y': '1Month',
    'All': '1Month',
  };
  return timeframeMap[timeframe] || '1Day';
};

/**
 * Get date range for a timeframe
 */
export const getTimeframeDateRange = (timeframe: string): { startDate: number; endDate: number } => {
  const now = Date.now();
  const endDate = now;
  let startDate: number;

  switch (timeframe) {
    case '1D':
      startDate = now - (1 * 24 * 60 * 60 * 1000); // 1 day
      break;
    case '5D':
      startDate = now - (5 * 24 * 60 * 60 * 1000); // 5 days
      break;
    case '1W':
      startDate = now - (7 * 24 * 60 * 60 * 1000); // 1 week
      break;
    case '1M':
      startDate = now - (30 * 24 * 60 * 60 * 1000); // 1 month (30 days)
      break;
    case '3M':
      startDate = now - (90 * 24 * 60 * 60 * 1000); // 3 months (90 days)
      break;
    case '6M':
      startDate = now - (180 * 24 * 60 * 60 * 1000); // 6 months (180 days)
      break;
    case 'YTD':
      // Year to date - from January 1st of current year
      const currentYear = new Date().getFullYear();
      startDate = new Date(currentYear, 0, 1).getTime();
      break;
    case '1Y':
      startDate = now - (365 * 24 * 60 * 60 * 1000); // 1 year
      break;
    case '5Y':
      startDate = now - (5 * 365 * 24 * 60 * 60 * 1000); // 5 years
      break;
    case 'All':
      startDate = 0; // All available data
      break;
    default:
      startDate = now - (30 * 24 * 60 * 60 * 1000); // Default to 30 days
  }

  return { startDate, endDate };
};

/**
 * Filter candlestick data by timeframe
 */
export const filterDataByTimeframe = (data: any[], timeframe: string): any[] => {
  if (!data || data.length === 0) return data;
  if (timeframe === 'All') return data;

  const { startDate, endDate } = getTimeframeDateRange(timeframe);
  
  return data.filter(item => {
    const timestamp = typeof item.timestamp === 'number' 
      ? item.timestamp 
      : new Date(item.timestamp || item.date || item.time).getTime();
    return timestamp >= startDate && timestamp <= endDate;
  }).sort((a, b) => {
    const timestampA = typeof a.timestamp === 'number' 
      ? a.timestamp 
      : new Date(a.timestamp || a.date || a.time).getTime();
    const timestampB = typeof b.timestamp === 'number' 
      ? b.timestamp 
      : new Date(b.timestamp || b.date || b.time).getTime();
    return timestampA - timestampB;
  });
};

