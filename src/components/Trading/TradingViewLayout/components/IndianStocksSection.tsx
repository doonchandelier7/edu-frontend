import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { alpacaIndianStocksApi } from '../../../../services/alpacaIndianStocksApi';
import { StockList } from './StockList';
import { StockItem, SelectedStockData } from '../types';

interface IndianStocksSectionProps {
  indianStockData: StockItem[];
  portfolioHoldings: Record<string, number>;
  recentlyBought: Set<string>;
  onStockClick: (stock: SelectedStockData) => void;
  onBuyClick: (stock: StockItem) => void;
  onSellClick: (stock: StockItem) => void;
  onChartClick: (stock: StockItem) => void;
  onRefresh: (data: StockItem[]) => void;
}

export const IndianStocksSection: React.FC<IndianStocksSectionProps> = ({
  indianStockData,
  portfolioHoldings,
  recentlyBought,
  onStockClick,
  onBuyClick,
  onSellClick,
  onChartClick,
  onRefresh,
}) => {
  const handleRefresh = async () => {
    try {
      const indianSymbols = await alpacaIndianStocksApi.getIndianStockSymbols();
      const indianMarketData = await alpacaIndianStocksApi.getMarketData(indianSymbols.slice(0, 20));
      const transformedData = indianMarketData.map((stock: any) => ({
        symbol: stock.symbol,
        name: stock.name || stock.symbol,
        price: stock.price || 0,
        change: stock.change || 0,
        changePercent: stock.changePercent || 0,
        volume: stock.volume || 0,
        marketCap: stock.marketCap || 0,
        exchange: stock.exchange || 'NSE',
        sector: stock.sector || 'General'
      }));
      onRefresh(transformedData);
    } catch (error) {
      console.error('Failed to refresh Indian stocks:', error);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Indian Stocks</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-400">Live Market Data</span>
          <button
            onClick={handleRefresh}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-all duration-200 ml-2"
            title="Refresh Indian Stocks"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {indianStockData.length > 0 ? (
        <StockList
          title="Indian Stocks"
          stocks={indianStockData}
          onStockClick={(stock) => {
            onStockClick({
              symbol: stock.symbol,
              name: stock.name,
              exchange: stock.exchange || 'NSE',
              sector: stock.sector || 'General',
              price: stock.price || 0,
              change: stock.change || 0,
              changePercent: stock.changePercent || 0,
              marketStatus: 'Market Open',
              lastUpdate: 'Last update at 15:30 IST',
              description: `${stock.name} is an Indian stock.`,
              keyStats: {
                nextEarnings: 'N/A',
                volume: stock.volume?.toString() || 'N/A',
                avgVolume: 'N/A',
                marketCap: stock.marketCap?.toString() || 'N/A'
              }
            });
          }}
          onBuyClick={onBuyClick}
          onSellClick={onSellClick}
          onChartClick={onChartClick}
          portfolioHoldings={portfolioHoldings}
          recentlyBought={recentlyBought}
        />
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChartBarIcon className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">No Indian Stock Data</h4>
          <p className="text-slate-400 text-sm mb-4">
            Unable to load Indian stock data. Please check your connection.
          </p>
          <button
            onClick={handleRefresh}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          >
            Retry Loading
          </button>
        </div>
      )}
    </div>
  );
};

