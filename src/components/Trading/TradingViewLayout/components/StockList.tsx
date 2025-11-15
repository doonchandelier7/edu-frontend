import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { StockItem } from '../types';
import { formatChange, formatChangePercent } from '../utils';

interface StockListProps {
  title: string;
  stocks: StockItem[];
  onStockClick: (stock: StockItem) => void;
  onBuyClick: (stock: StockItem) => void;
  onSellClick: (stock: StockItem) => void;
  onChartClick: (stock: StockItem) => void;
  portfolioHoldings: Record<string, number>;
  recentlyBought: Set<string>;
}

export const StockList: React.FC<StockListProps> = ({
  title,
  stocks,
  onStockClick,
  onBuyClick,
  onSellClick,
  onChartClick,
  portfolioHoldings,
  recentlyBought,
}) => {
  if (stocks.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ChartBarIcon className="w-8 h-8 text-slate-400" />
        </div>
        <h4 className="text-lg font-semibold text-white mb-2">No {title} Data</h4>
        <p className="text-slate-400 text-sm">Unable to load {title.toLowerCase()} data. Please check your connection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stocks.map((stock, index) => (
        <div
          key={stock.id || stock.symbol || index}
          className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-2xl border border-slate-600/60 hover:shadow-md cursor-pointer transition-all duration-200"
          onClick={() => onStockClick(stock)}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mr-4 shadow-sm">
              <span className="text-sm font-bold text-white">{stock.symbol?.charAt(0) || '?'}</span>
            </div>
            <div>
              <div className="font-semibold text-white">{stock.symbol}</div>
              <div className="text-xs text-slate-400">{stock.name}</div>
              {stock.sector && <div className="text-xs text-slate-500">{stock.sector}</div>}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-white text-lg">₹{stock.price?.toLocaleString() || '0'}</div>
            <div
              className={`text-sm font-semibold ${(stock.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {formatChange(stock.change || 0)} {formatChangePercent(stock.changePercent || 0)}
            </div>
            <div className="mt-1 flex justify-end gap-2">
              {portfolioHoldings[stock.symbol?.toUpperCase?.() || ''] > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-700/40 text-emerald-300 border border-emerald-600/40">
                  Owned
                </span>
              )}
              {recentlyBought.has((stock.symbol || '').toUpperCase()) && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-700/40 text-blue-300 border border-blue-600/40">
                  New
                </span>
              )}
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBuyClick(stock);
                }}
                className="px-2 py-1 rounded-md text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
                title="Buy"
              >
                B
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSellClick(stock);
                }}
                className="px-2 py-1 rounded-md text-xs font-bold bg-orange-600 text-white hover:bg-orange-700"
                title="Sell"
              >
                S
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChartClick(stock);
                }}
                className="p-1 rounded-md text-xs bg-slate-700 text-slate-200 hover:bg-slate-600"
                title="Open Chart"
              >
                <ChartBarIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

