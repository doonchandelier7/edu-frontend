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

  // Fetch candlestick data for a symbol
  async getCandlestickData(
    symbol: string, 
    timeframe: string, 
    limit: number = 1000
  ): Promise<ChartDataResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/candles/${symbol}?timeframe=${timeframe}&limit=${limit}`,
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
      return {
        success: true,
        data: data.candles || []
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
    const data: CandlestickData[] = [];
    const basePrice = symbol === 'INFY' ? 1486 : symbol === 'HDFC' ? 994 : 1000;
    const volatility = 0.02;
    
    let currentPrice = basePrice;
    const now = Date.now();
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000);
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
    
    return data;
  }
}

export const chartService = new ChartService();
