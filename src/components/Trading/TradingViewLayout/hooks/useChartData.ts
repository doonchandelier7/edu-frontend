import { useState } from 'react';
import { alpacaIndianStocksApi } from '../../../../services/alpacaIndianStocksApi';
import { chartService, CandlestickData } from '../../../../services/chartService';
import { sanitizeSymbol, mapTimeframeToBackend } from '../utils';

export const useChartData = () => {
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [newsItems, setNewsItems] = useState<any[]>([]);

  const fetchChartData = async (symbol: string, timeframe: string) => {
    try {
      const baseSymbol = sanitizeSymbol(symbol);

      // Try to fetch historical data from Alpaca Indian Stocks API first
      try {
        const backendTimeframe = mapTimeframeToBackend(timeframe);
        const historicalData = await alpacaIndianStocksApi.getHistoricalData(baseSymbol, backendTimeframe);

        if (historicalData && historicalData.data && historicalData.data.length > 0) {
          const candlestickData = historicalData.data.map((bar: any) => {
            let timestamp: number;
            if (typeof bar.date === 'string') {
              timestamp = new Date(bar.date).getTime();
            } else if (bar.date instanceof Date) {
              timestamp = bar.date.getTime();
            } else if (typeof bar.date === 'number') {
              timestamp = bar.date;
            } else {
              timestamp = Date.now();
            }

            return {
              timestamp: isNaN(timestamp) ? Date.now() : timestamp,
              open: Number(bar.open) || 0,
              high: Number(bar.high) || 0,
              low: Number(bar.low) || 0,
              close: Number(bar.close) || 0,
              volume: Number(bar.volume) || 0,
            };
          }).filter(bar => bar.timestamp > 0 && (bar.open > 0 || bar.close > 0));

          if (candlestickData.length > 0) {
            candlestickData.sort((a, b) => a.timestamp - b.timestamp);
            setChartData(candlestickData);
            return;
          }
        }
      } catch (alpacaError) {
        console.log('Alpaca historical data failed, trying chart service...', alpacaError);
      }

      // Fallback to chart service
      const resp = await chartService.getCandlestickData(baseSymbol, timeframe);
      if (resp.success && resp.data && resp.data.length > 0) {
        setChartData(resp.data);
      } else {
        setChartData(chartService.generateMockData(baseSymbol, timeframe));
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      const baseSymbol = sanitizeSymbol(symbol);
      setChartData(chartService.generateMockData(baseSymbol, timeframe));
    }
  };

  const fetchNews = async (symbol: string) => {
    try {
      const items = await alpacaIndianStocksApi.getNews(sanitizeSymbol(symbol));
      setNewsItems(items.slice(0, 6));
    } catch {
      setNewsItems([]);
    }
  };

  return {
    chartData,
    newsItems,
    fetchChartData,
    fetchNews,
  };
};

