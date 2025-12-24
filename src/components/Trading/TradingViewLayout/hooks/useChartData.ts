import { useState } from 'react';
import { alpacaIndianStocksApi } from '../../../../services/alpacaIndianStocksApi';
import { chartService, CandlestickData } from '../../../../services/chartService';
import { sanitizeSymbol, mapTimeframeToBackend, filterDataByTimeframe } from '../utils';

export const useChartData = () => {
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [newsItems, setNewsItems] = useState<any[]>([]);

  const fetchChartData = async (symbol: string, timeframe: string) => {
    try {
      const baseSymbol = sanitizeSymbol(symbol);

      // Try to fetch historical data from Alpaca Indian Stocks API first
      try {
        const backendTimeframe = mapTimeframeToBackend(timeframe);
        const historicalData = await alpacaIndianStocksApi.getHistoricalData(baseSymbol, backendTimeframe, timeframe);

        if (historicalData && historicalData.data && historicalData.data.length > 0) {
          const candlestickData = historicalData.data.map((bar: any) => {
            let timestamp: number;
            if (typeof bar.date === 'string') {
              timestamp = new Date(bar.date).getTime();
            } else if (bar.date instanceof Date) {
              timestamp = bar.date.getTime();
            } else if (typeof bar.date === 'number') {
              // If timestamp is in seconds (less than year 2000 in milliseconds), convert to milliseconds
              timestamp = bar.date < 946684800000 && bar.date > 946684800 ? bar.date * 1000 : bar.date;
            } else if (bar.timestamp) {
              timestamp = typeof bar.timestamp === 'number'
                ? (bar.timestamp < 946684800000 && bar.timestamp > 946684800 ? bar.timestamp * 1000 : bar.timestamp)
                : new Date(bar.timestamp).getTime();
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
            // Filter by timeframe
            const filteredData = filterDataByTimeframe(candlestickData, timeframe);
            filteredData.sort((a, b) => a.timestamp - b.timestamp);
            setChartData(filteredData);
            return;
          }
        }
      } catch (alpacaError) {
        console.log('Alpaca historical data failed, trying chart service...', alpacaError);
      }

      // Fallback to chart service
      const resp = await chartService.getCandlestickData(baseSymbol, timeframe);
      if (resp.success && resp.data && resp.data.length > 0) {
        // Data is already filtered in chartService, but ensure it's sorted
        const sortedData = [...resp.data].sort((a, b) => a.timestamp - b.timestamp);
        setChartData(sortedData);
      } else {
        // Generate mock data and filter by timeframe
        const mockData = chartService.generateMockData(baseSymbol, timeframe);
        const filteredMockData = filterDataByTimeframe(mockData, timeframe);
        setChartData(filteredMockData);
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

