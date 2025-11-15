import React, { useState, useEffect } from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { watchlistApi } from '../../services/watchlistApi';

interface MarketDataItem {
  symbol: string;
  name: string;
  exchange: string;
  assetClass: string;
  lastPrice: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

const MarketData: React.FC = () => {
  const [topGainers, setTopGainers] = useState<MarketDataItem[]>([]);
  const [topLosers, setTopLosers] = useState<MarketDataItem[]>([]);
  const [indices, setIndices] = useState<MarketDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch authenticated data first
      try {
        const [gainersData, losersData, indicesData] = await Promise.all([
          watchlistApi.getTopGainers(),
          watchlistApi.getTopLosers(),
          watchlistApi.getIndianIndices(),
        ]);

        setTopGainers(gainersData);
        setTopLosers(losersData);
        setIndices(indicesData);
      } catch (authError) {
        console.log('Authentication failed, trying direct API calls:', authError);
        
        // Try to get real-time data directly from alpacaIndianStocksApi
        try {
          const { alpacaIndianStocksApi } = await import('../../services/alpacaIndianStocksApi');
          
          const [gainersData, losersData, indicesData] = await Promise.all([
            alpacaIndianStocksApi.getTopGainers(),
            alpacaIndianStocksApi.getTopLosers(),
            alpacaIndianStocksApi.getIndianIndices(),
          ]);

          setTopGainers(gainersData);
          setTopLosers(losersData);
          setIndices(indicesData);
        } catch (directApiError) {
          console.log('Direct API calls failed, using fallback data:', directApiError);
          
          // Fallback to static data only if all APIs fail
          const fallbackGainers = [
            { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', lastPrice: 2029.30, changePercent: 1.07, volume: 3200000, exchange: 'NSE', assetClass: 'indian_equity', marketCap: 0 },
            { symbol: 'RELIANCE', name: 'Reliance Industries Limited', lastPrice: 1451.60, changePercent: 0.22, volume: 9700000, exchange: 'NSE', assetClass: 'indian_equity', marketCap: 0 }
          ];
          
          const fallbackLosers = [
            { symbol: 'NTPC', name: 'NTPC Limited', lastPrice: 339.60, changePercent: -0.89, volume: 7600000, exchange: 'NSE', assetClass: 'indian_equity', marketCap: 0 },
            { symbol: 'SBIN', name: 'State Bank of India', lastPrice: 904.50, changePercent: -0.77, volume: 5300000, exchange: 'NSE', assetClass: 'indian_equity', marketCap: 0 },
            { symbol: 'BAJFINANCE', name: 'Bajaj Finance Limited', lastPrice: 1089.75, changePercent: -0.40, volume: 6400000, exchange: 'NSE', assetClass: 'indian_equity', marketCap: 0 },
            { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Limited', lastPrice: 288.50, changePercent: -0.40, volume: 16300000, exchange: 'NSE', assetClass: 'indian_equity', marketCap: 0 }
          ];
          
          const fallbackIndices = [
            { symbol: 'NIFTY50', name: 'Nifty 50', lastPrice: 25795.15, changePercent: -0.37, volume: 0, exchange: 'NSE', assetClass: 'indian_index', marketCap: 0 },
            { symbol: 'BANKNIFTY', name: 'Bank Nifty', lastPrice: 57699.60, changePercent: -0.65, volume: 0, exchange: 'NSE', assetClass: 'indian_index', marketCap: 0 },
            { symbol: 'NIFTYIT', name: 'Nifty IT', lastPrice: 35986.35, changePercent: -0.26, volume: 0, exchange: 'NSE', assetClass: 'indian_index', marketCap: 0 },
            { symbol: 'NIFTYPHARMA', name: 'Nifty Pharma', lastPrice: 22357.35, changePercent: -0.55, volume: 0, exchange: 'NSE', assetClass: 'indian_index', marketCap: 0 },
            { symbol: 'NIFTYAUTO', name: 'Nifty Auto', lastPrice: 27108.70, changePercent: -0.40, volume: 0, exchange: 'NSE', assetClass: 'indian_index', marketCap: 0 },
            { symbol: 'NIFTYFMCG', name: 'Nifty FMCG', lastPrice: 56348.10, changePercent: -0.75, volume: 0, exchange: 'NSE', assetClass: 'indian_index', marketCap: 0 },
            { symbol: 'NIFTYMETAL', name: 'Nifty Metal', lastPrice: 10347.45, changePercent: 1.03, volume: 0, exchange: 'NSE', assetClass: 'indian_index', marketCap: 0 },
            { symbol: 'NIFTYENERGY', name: 'Nifty Energy', lastPrice: 35626.90, changePercent: 0.02, volume: 0, exchange: 'NSE', assetClass: 'indian_index', marketCap: 0 }
          ];
          
          setTopGainers(fallbackGainers);
          setTopLosers(fallbackLosers);
          setIndices(fallbackIndices);
        }
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getChangeBgColor = (change: number) => {
    if (change > 0) return 'bg-green-100 dark:bg-green-900/30';
    if (change < 0) return 'bg-red-100 dark:bg-red-900/30';
    return 'bg-gray-100 dark:bg-gray-800';
  };

  const renderMarketItem = (item: MarketDataItem, index: number) => (
    <div key={`${item.symbol}-${index}`} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{item.symbol.substring(0, 2)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.symbol}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.name}</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {watchlistApi.formatPrice(item.lastPrice, 'INR')}
              </span>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getChangeBgColor(item.changePercent)} ${getChangeColor(item.changePercent)}`}>
                {watchlistApi.formatChange(item.changePercent)}
              </span>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Vol: {watchlistApi.formatVolume(item.volume)}
              </div>
              {item.marketCap > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  MCap: {watchlistApi.formatMarketCap(item.marketCap)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Top Gainers Loading */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
          <div className="animate-pulse">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
              <div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Losers Loading */}
        <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
          <div className="animate-pulse">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
              <div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-28 mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
              </div>
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Indian Indices Loading */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="animate-pulse">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
              <div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-36 mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-40"></div>
              </div>
            </div>
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchMarketData}
          className="mt-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Gainers */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top Gainers</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Best performing stocks today</p>
          </div>
        </div>
        <div className="space-y-3">
          {topGainers.length > 0 ? (
            topGainers.slice(0, 5).map((item, index) => renderMarketItem(item, index))
          ) : (
            <div className="p-6 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-gray-500 dark:text-gray-400">
                <ArrowTrendingUpIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No gainers data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Losers */}
      <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
            <ArrowTrendingDownIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top Losers</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Stocks with biggest declines</p>
          </div>
        </div>
        <div className="space-y-3">
          {topLosers.length > 0 ? (
            topLosers.slice(0, 5).map((item, index) => renderMarketItem(item, index))
          ) : (
            <div className="p-6 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-gray-500 dark:text-gray-400">
                <ArrowTrendingDownIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No losers data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Indian Indices */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <ChartBarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Indian Indices</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Major Indian market indices</p>
          </div>
        </div>
        <div className="space-y-3">
          {indices.length > 0 ? (
            indices.map((item, index) => renderMarketItem(item, index))
          ) : (
            <div className="p-6 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-gray-500 dark:text-gray-400">
                <ChartBarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No indices data available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketData;
