export interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicator {
  name: string;
  values: number[];
  period: number;
  color: string;
}

export interface ChartDataResponse {
  success: boolean;
  data: CandlestickData[];
  error?: string;
}

class ChartService {
  private baseUrl = '/api/charts';

  // Calculate appropriate limit based on timeframe
  private calculateLimitForTimeframe(timeframe: string): number {
    switch (timeframe) {
      case '1D':
        return 100; // 1 day of data
      case '5D':
        return 500; // 5 days
      case '1W':
        return 700; // 1 week
      case '1M':
        return 2000; // 1 month (~30 days, but with intraday could be more)
      case '3M':
        return 5000; // 3 months
      case '6M':
        return 10000; // 6 months
      case 'YTD':
        // Year to date - could be up to 365 days
        const currentYear = new Date().getFullYear();
        const jan1 = new Date(currentYear, 0, 1);
        const daysSinceJan1 = Math.ceil((Date.now() - jan1.getTime()) / (24 * 60 * 60 * 1000));
        return Math.max(5000, daysSinceJan1 * 2); // At least 5000, or 2x the days
      case '1Y':
        return 10000; // 1 year (~365 days, but with intraday could be more)
      case '5Y':
        return 50000; // 5 years (~1825 days, but with intraday could be much more)
      case 'All':
        return 100000; // All data - use a very high limit
      default:
        return 5000; // Default to 5000 for unknown timeframes
    }
  }

  // Fetch candlestick data for a symbol
  async getCandlestickData(
    symbol: string, 
    timeframe: string, 
    limit?: number
  ): Promise<ChartDataResponse> {
    try {
      // Calculate limit based on timeframe if not provided
      const calculatedLimit = limit || this.calculateLimitForTimeframe(timeframe);
      
      const response = await fetch(
        `${this.baseUrl}/candles/${symbol}?timeframe=${timeframe}&limit=${calculatedLimit}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let candles = data.candles || [];
      
      // Ensure timestamps are in milliseconds
      candles = candles.map((candle: any) => {
        let timestamp = candle.timestamp;
        
        // Convert timestamp to milliseconds if needed
        if (typeof timestamp === 'number') {
          // If timestamp is less than year 2000 in seconds, it's likely in seconds, convert to ms
          if (timestamp < 946684800000 && timestamp > 946684800) {
            timestamp = timestamp * 1000;
          }
        } else if (typeof timestamp === 'string') {
          timestamp = new Date(timestamp).getTime();
        } else if (candle.date) {
          timestamp = typeof candle.date === 'number' 
            ? (candle.date < 946684800000 && candle.date > 946684800 ? candle.date * 1000 : candle.date)
            : new Date(candle.date).getTime();
        } else {
          timestamp = Date.now();
        }
        
        return {
          ...candle,
          timestamp: isNaN(timestamp) ? Date.now() : timestamp,
          open: Number(candle.open) || 0,
          high: Number(candle.high) || 0,
          low: Number(candle.low) || 0,
          close: Number(candle.close) || 0,
          volume: Number(candle.volume) || 0,
        };
      });
      
      // Filter data by timeframe if needed
      candles = this.filterDataByTimeframe(candles, timeframe);
      
      // Sort by timestamp
      candles.sort((a: CandlestickData, b: CandlestickData) => a.timestamp - b.timestamp);
      
      return {
        success: true,
        data: candles
      };
    } catch (error) {
      console.error('Failed to fetch candlestick data:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Filter data by timeframe
  private filterDataByTimeframe(data: CandlestickData[], timeframe: string): CandlestickData[] {
    if (!data || data.length === 0) return data;
    if (timeframe === 'All') return data;

    const now = Date.now();
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
      default:
        return data; // Return all data if timeframe not recognized
    }

    return data.filter(item => item.timestamp >= startDate && item.timestamp <= now)
      .sort((a: CandlestickData, b: CandlestickData) => a.timestamp - b.timestamp);
  }

  // Calculate Simple Moving Average
  calculateSMA(data: CandlestickData[], period: number): number[] {
    const sma: number[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      sma.push(sum / period);
    }
    
    return sma;
  }

  // Calculate Exponential Moving Average
  calculateEMA(data: CandlestickData[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA is SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i].close;
    }
    ema.push(sum / period);
    
    // Calculate subsequent EMAs
    for (let i = period; i < data.length; i++) {
      const currentEMA = (data[i].close - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(currentEMA);
    }
    
    return ema;
  }

  // Calculate Relative Strength Index (RSI)
  calculateRSI(data: CandlestickData[], period: number = 14): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Calculate price changes
    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    // Calculate initial average gain and loss
    let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
    
    // Calculate RSI for each period
    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      
      const rs = avgGain / avgLoss;
      const rsiValue = 100 - (100 / (1 + rs));
      rsi.push(rsiValue);
    }
    
    return rsi;
  }

  // Calculate MACD (Moving Average Convergence Divergence)
  calculateMACD(data: CandlestickData[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    const emaFast = this.calculateEMA(data, fastPeriod);
    const emaSlow = this.calculateEMA(data, slowPeriod);
    
    // Calculate MACD line
    const macdLine: number[] = [];
    const startIndex = Math.max(fastPeriod, slowPeriod) - 1;
    
    for (let i = 0; i < emaFast.length; i++) {
      const fastIndex = i + fastPeriod - 1;
      const slowIndex = i + slowPeriod - 1;
      
      if (fastIndex < emaFast.length && slowIndex < emaSlow.length) {
        macdLine.push(emaFast[fastIndex] - emaSlow[slowIndex]);
      }
    }
    
    // Calculate signal line (EMA of MACD)
    const signalLine = this.calculateEMA(
      macdLine.map((value, index) => ({
        timestamp: data[startIndex + index].timestamp,
        open: value,
        high: value,
        low: value,
        close: value,
        volume: 0
      })),
      signalPeriod
    );
    
    // Calculate histogram
    const histogram: number[] = [];
    for (let i = 0; i < macdLine.length; i++) {
      if (i < signalLine.length) {
        histogram.push(macdLine[i] - signalLine[i]);
      }
    }
    
    return {
      macdLine,
      signalLine,
      histogram
    };
  }

  // Calculate Bollinger Bands
  calculateBollingerBands(data: CandlestickData[], period: number = 20, stdDev: number = 2) {
    const sma = this.calculateSMA(data, period);
    const upperBand: number[] = [];
    const lowerBand: number[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      // Calculate standard deviation
      let sum = 0;
      for (let j = 0; j < period; j++) {
        const diff = data[i - j].close - sma[i - period + 1];
        sum += diff * diff;
      }
      const variance = sum / period;
      const standardDeviation = Math.sqrt(variance);
      
      const middle = sma[i - period + 1];
      upperBand.push(middle + (standardDeviation * stdDev));
      lowerBand.push(middle - (standardDeviation * stdDev));
    }
    
    return {
      upperBand,
      middleBand: sma,
      lowerBand
    };
  }

  // Calculate Center of Gravity (COG)
  calculateCOG(data: CandlestickData[], period: number = 10): number[] {
    const cog: number[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      let weightSum = 0;
      
      for (let j = 0; j < period; j++) {
        const weight = period - j;
        sum += data[i - j].close * weight;
        weightSum += weight;
      }
      
      cog.push(sum / weightSum);
    }
    
    return cog;
  }

  // Calculate Stochastic Oscillator
  calculateStochastic(data: CandlestickData[], kPeriod: number = 14, dPeriod: number = 3) {
    const kValues: number[] = [];
    const dValues: number[] = [];
    
    for (let i = kPeriod - 1; i < data.length; i++) {
      let highestHigh = data[i - kPeriod + 1].high;
      let lowestLow = data[i - kPeriod + 1].low;
      
      for (let j = i - kPeriod + 1; j <= i; j++) {
        highestHigh = Math.max(highestHigh, data[j].high);
        lowestLow = Math.min(lowestLow, data[j].low);
      }
      
      const kValue = ((data[i].close - lowestLow) / (highestHigh - lowestLow)) * 100;
      kValues.push(kValue);
    }
    
    // Calculate %D (SMA of %K)
    for (let i = dPeriod - 1; i < kValues.length; i++) {
      let sum = 0;
      for (let j = 0; j < dPeriod; j++) {
        sum += kValues[i - j];
      }
      dValues.push(sum / dPeriod);
    }
    
    return {
      kValues,
      dValues
    };
  }

  // Calculate Williams %R
  calculateWilliamsR(data: CandlestickData[], period: number = 14): number[] {
    const williamsR: number[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      let highestHigh = data[i - period + 1].high;
      let lowestLow = data[i - period + 1].low;
      
      for (let j = i - period + 1; j <= i; j++) {
        highestHigh = Math.max(highestHigh, data[j].high);
        lowestLow = Math.min(lowestLow, data[j].low);
      }
      
      const wr = ((highestHigh - data[i].close) / (highestHigh - lowestLow)) * -100;
      williamsR.push(wr);
    }
    
    return williamsR;
  }

  // Calculate CCI (Commodity Channel Index)
  calculateCCI(data: CandlestickData[], period: number = 20): number[] {
    const cci: number[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      // Calculate Typical Price
      const typicalPrices: number[] = [];
      for (let j = i - period + 1; j <= i; j++) {
        typicalPrices.push((data[j].high + data[j].low + data[j].close) / 3);
      }
      
      // Calculate SMA of Typical Price
      const smaTP = typicalPrices.reduce((sum, tp) => sum + tp, 0) / period;
      
      // Calculate Mean Deviation
      let meanDev = 0;
      for (let j = 0; j < typicalPrices.length; j++) {
        meanDev += Math.abs(typicalPrices[j] - smaTP);
      }
      meanDev /= period;
      
      // Calculate CCI
      const currentTP = (data[i].high + data[i].low + data[i].close) / 3;
      const cciValue = meanDev !== 0 ? (currentTP - smaTP) / (0.015 * meanDev) : 0;
      cci.push(cciValue);
    }
    
    return cci;
  }

  // Calculate ATR (Average True Range)
  calculateATR(data: CandlestickData[], period: number = 14): number[] {
    const atr: number[] = [];
    const trueRanges: number[] = [];
    
    // Calculate True Range
    for (let i = 1; i < data.length; i++) {
      const tr1 = data[i].high - data[i].low;
      const tr2 = Math.abs(data[i].high - data[i - 1].close);
      const tr3 = Math.abs(data[i].low - data[i - 1].close);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    // Calculate ATR (SMA of True Range)
    for (let i = period - 1; i < trueRanges.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += trueRanges[i - j];
      }
      atr.push(sum / period);
    }
    
    return atr;
  }

  // Calculate VWAP (Volume Weighted Average Price)
  calculateVWAP(data: CandlestickData[]): number[] {
    const vwap: number[] = [];
    let cumulativeTPV = 0; // Cumulative Typical Price * Volume
    let cumulativeVolume = 0;
    
    for (let i = 0; i < data.length; i++) {
      const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
      cumulativeTPV += typicalPrice * data[i].volume;
      cumulativeVolume += data[i].volume;
      
      const vwapValue = cumulativeVolume !== 0 ? cumulativeTPV / cumulativeVolume : typicalPrice;
      vwap.push(vwapValue);
    }
    
    return vwap;
  }

  // Calculate Volume SMA
  calculateVolumeSMA(data: CandlestickData[], period: number = 20): number[] {
    const volumeSMA: number[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].volume;
      }
      volumeSMA.push(sum / period);
    }
    
    return volumeSMA;
  }

  // Calculate Volume EMA
  calculateVolumeEMA(data: CandlestickData[], period: number = 20): number[] {
    const volumeEMA: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i].volume;
    }
    volumeEMA.push(sum / period);
    
    // Calculate EMA for rest
    for (let i = period; i < data.length; i++) {
      const value = (data[i].volume - volumeEMA[volumeEMA.length - 1]) * multiplier + volumeEMA[volumeEMA.length - 1];
      volumeEMA.push(value);
    }
    
    return volumeEMA;
  }

  // Get all technical indicators for a dataset
  getAllIndicators(data: CandlestickData[]): Record<string, TechnicalIndicator> {
    return {
      SMA20: {
        name: 'SMA 20',
        values: this.calculateSMA(data, 20),
        period: 20,
        color: '#3b82f6'
      },
      SMA50: {
        name: 'SMA 50',
        values: this.calculateSMA(data, 50),
        period: 50,
        color: '#ef4444'
      },
      EMA12: {
        name: 'EMA 12',
        values: this.calculateEMA(data, 12),
        period: 12,
        color: '#10b981'
      },
      EMA26: {
        name: 'EMA 26',
        values: this.calculateEMA(data, 26),
        period: 26,
        color: '#f59e0b'
      },
      RSI: {
        name: 'RSI',
        values: this.calculateRSI(data, 14),
        period: 14,
        color: '#8b5cf6'
      },
      COG: {
        name: 'COG',
        values: this.calculateCOG(data, 10),
        period: 10,
        color: '#06b6d4'
      }
    };
  }

  // Generate mock data for testing
  generateMockData(symbol: string, timeframe: string, days: number = 365): CandlestickData[] {
    // Calculate days based on timeframe
    switch (timeframe) {
      case '1D':
        days = 1;
        break;
      case '5D':
        days = 5;
        break;
      case '1W':
        days = 7;
        break;
      case '1M':
        days = 30;
        break;
      case '3M':
        days = 90;
        break;
      case '6M':
        days = 180;
        break;
      case 'YTD':
        // Days from January 1st to now
        const currentYear = new Date().getFullYear();
        const jan1 = new Date(currentYear, 0, 1);
        days = Math.ceil((Date.now() - jan1.getTime()) / (24 * 60 * 60 * 1000));
        break;
      case '1Y':
        days = 365;
        break;
      case '5Y':
        days = 5 * 365;
        break;
      case 'All':
        days = 5 * 365; // Default to 5 years for "All"
        break;
      default:
        days = 30;
    }
    
    const data: CandlestickData[] = [];
    const basePrice = symbol === 'INFY' ? 1486 : symbol === 'HDFC' ? 994 : 1000;
    const volatility = 0.02;
    
    let currentPrice = basePrice;
    const now = Date.now();
    
    // For YTD, start from January 1st
    let startTime = now - (days * 24 * 60 * 60 * 1000);
    if (timeframe === 'YTD') {
      const currentYear = new Date().getFullYear();
      startTime = new Date(currentYear, 0, 1).getTime();
      days = Math.ceil((now - startTime) / (24 * 60 * 60 * 1000));
    }
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000);
      
      // Skip if before start time (for YTD)
      if (timeframe === 'YTD' && timestamp < startTime) {
        continue;
      }
      
      const change = (Math.random() - 0.5) * volatility;
      
      const open = currentPrice;
      const close = open * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.random() * 1000000;
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume
      });
      
      currentPrice = close;
    }
    
    // Filter by timeframe to ensure accuracy
    return this.filterDataByTimeframe(data, timeframe);
  }
}

export const chartService = new ChartService();
