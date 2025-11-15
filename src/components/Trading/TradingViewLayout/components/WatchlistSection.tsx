import React from 'react';
import { PlusIcon, FolderIcon, EllipsisVerticalIcon, StarIcon } from '@heroicons/react/24/outline';
import { watchlistApi } from '../../../../services/watchlistApi';
import { alpacaIndianStocksApi } from '../../../../services/alpacaIndianStocksApi';
import { StockList } from './StockList';
import { StockItem, SelectedStockData } from '../types';

interface WatchlistSectionProps {
  watchlistData: StockItem[];
  portfolioHoldings: Record<string, number>;
  recentlyBought: Set<string>;
  onStockClick: (stock: SelectedStockData) => void;
  onBuyClick: (stock: StockItem) => void;
  onSellClick: (stock: StockItem) => void;
  onChartClick: (stock: StockItem) => void;
  onWatchlistManagerClick: () => void;
  onRefresh: (data: StockItem[]) => void;
}

export const WatchlistSection: React.FC<WatchlistSectionProps> = ({
  watchlistData,
  portfolioHoldings,
  recentlyBought,
  onStockClick,
  onBuyClick,
  onSellClick,
  onChartClick,
  onWatchlistManagerClick,
  onRefresh,
}) => {
  const handleRefresh = async () => {
    try {
      const watchlists = await watchlistApi.getUserWatchlists();
      const allAssets: any[] = [];
      watchlists.forEach(watchlist => {
        if (watchlist.assets && watchlist.isActive) {
          allAssets.push(...watchlist.assets);
        }
      });

      if (allAssets.length > 0) {
        const symbols = allAssets.map(asset => asset.symbol);
        try {
          const marketData = await alpacaIndianStocksApi.getMarketData(symbols);
          const transformedWatchlist = allAssets.map((asset: any) => {
            const marketInfo = marketData.find(m => m.symbol === asset.symbol);
            return {
              id: asset.id,
              symbol: asset.symbol,
              name: asset.name || asset.symbol,
              price: marketInfo?.price || 0,
              change: marketInfo?.change || 0,
              changePercent: marketInfo?.changePercent || 0,
              volume: marketInfo?.volume || 0,
              marketCap: marketInfo?.marketCap || 0,
              exchange: marketInfo?.exchange || 'NSE',
              sector: marketInfo?.sector || 'General'
            };
          });
          onRefresh(transformedWatchlist);
        } catch (marketError) {
          console.log('Failed to fetch market data for watchlist:', marketError);
          const transformedWatchlist = allAssets.map((asset: any) => ({
            id: asset.id,
            symbol: asset.symbol,
            name: asset.name || asset.symbol,
            price: asset.lastPrice || 0,
            change: 0,
            changePercent: asset.changePercent || 0,
            volume: asset.volume || 0,
            marketCap: asset.marketCap || 0,
            exchange: asset.exchange || 'NSE',
            sector: asset.assetClass || 'General'
          }));
          onRefresh(transformedWatchlist);
        }
      } else {
        onRefresh([]);
      }
    } catch (error) {
      console.error('Failed to refresh watchlist:', error);
    }
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-slate-700/60">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Watchlist</h2>
          <p className="text-slate-400 text-sm">Track your favorite assets</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="p-3 text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 rounded-xl transition-all duration-200"
            title="Refresh Watchlist"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          <button
            onClick={onWatchlistManagerClick}
            className="p-3 text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 rounded-xl transition-all duration-200"
            title="Add to Watchlist"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onWatchlistManagerClick}
            className="p-3 text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 rounded-xl transition-all duration-200"
            title="Manage Watchlists"
          >
            <FolderIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onWatchlistManagerClick}
            className="p-3 text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 rounded-xl transition-all duration-200"
            title="More Options"
          >
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">My Watchlist</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-400">Personal List</span>
          </div>
        </div>

        {watchlistData.length > 0 ? (
          <StockList
            title="Watchlist"
            stocks={watchlistData}
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
                description: `${stock.name} is a stock in your watchlist.`,
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
              <StarIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">No Watchlist Items</h4>
            <p className="text-slate-400 text-sm mb-4">Add stocks to your watchlist to track them here</p>
            <button
              onClick={onWatchlistManagerClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            >
              Add to Watchlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

