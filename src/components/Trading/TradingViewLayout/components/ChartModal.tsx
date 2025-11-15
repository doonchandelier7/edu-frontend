import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import DynamicChart from '../../DynamicChart';
import { ChartStockData, NewsItem } from '../types';
import { CandlestickData } from '../../../../services/chartService';
import EnhancedChartInterface from '../../EnhancedChartInterface';

interface ChartModalProps {
  stock: ChartStockData;
  chartData: CandlestickData[];
  chartTimeframe: string;
  chartType: 'candles' | 'line' | 'bars';
  selectedTimeframe: string;
  newsItems: NewsItem[];
  portfolioHoldings: Record<string, number>;
  recentlyBought: Set<string>;
  showProfessionalChart: boolean;
  onClose: () => void;
  onTimeframeChange: (timeframe: string) => void;
  onChartTypeChange: (type: 'candles' | 'line' | 'bars') => void;
  onProfessionalChartClick: () => void;
  onPriceUpdate: (price: number, change: number, changePercent: number) => void;
  onBuyClick: () => void;
  onSellClick: () => void;
}

export const ChartModal: React.FC<ChartModalProps> = ({
  stock,
  chartData,
  chartTimeframe,
  chartType,
  selectedTimeframe,
  newsItems,
  portfolioHoldings,
  recentlyBought,
  showProfessionalChart,
  onClose,
  onTimeframeChange,
  onChartTypeChange,
  onProfessionalChartClick,
  onPriceUpdate,
  onBuyClick,
  onSellClick,
}) => {
  if (showProfessionalChart) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-slate-900 rounded-lg w-full h-full mx-2 my-2 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">Professional Trading Chart</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="h-[calc(100vh-80px)]">
            <EnhancedChartInterface
              key={stock?.symbol || 'DEFAULT'}
              initialSymbol={stock?.symbol || 'INFY'}
              onSymbolChange={() => {}}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900/95 backdrop-blur-sm rounded-3xl w-full h-full max-w-[98vw] mx-2 my-2 shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-700/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold text-white">{stock.symbol.charAt(0)}</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{stock.symbol}</h2>
                <p className="text-slate-400">{stock.name}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm font-medium">
                    {stock.exchange}
                  </span>
                  <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-sm font-medium">
                    {stock.sector}
                  </span>
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
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-4xl font-bold text-white">₹{stock.price.toLocaleString()}</div>
                <div className={`text-xl font-semibold ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent >= 0 ? '+' : ''}
                  {stock.changePercent}%)
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onBuyClick}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Buy
                </button>
                <button
                  onClick={onSellClick}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                >
                  Sell
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 min-h-0 overflow-y-auto">
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/60 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Price Chart - {stock.symbol}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onProfessionalChartClick}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <ChartBarIcon className="w-4 h-4" />
                  <span>Professional Chart</span>
                </button>
                <div className="flex bg-slate-700 rounded-lg p-1">
                  {['candles', 'line', 'bars'].map((t) => (
                    <button
                      key={t}
                      onClick={() => onChartTypeChange(t as any)}
                      className={`px-3 py-1 text-xs rounded-md ${
                        chartType === t ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {['1D', '1W', '1M', '3M', '1Y'].map((period) => (
                  <button
                    key={period}
                    onClick={() => onTimeframeChange(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedTimeframe === period
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {period}
                  </button>
                ))}
                <button
                  onClick={() => {
                    const el = document.getElementById('stock-news-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600"
                >
                  News
                </button>
              </div>
            </div>

            <div className="h-[28rem]">
              <DynamicChart
                key={`${stock.symbol}-${chartTimeframe}`}
                symbol={stock.symbol}
                data={chartData}
                timeframe={chartTimeframe}
                onTimeframeChange={onTimeframeChange}
                onSymbolChange={() => {}}
                chartType={chartType}
                onPriceUpdate={onPriceUpdate}
              />
            </div>

            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-slate-700/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">Open</p>
                <p className="font-bold text-white">
                  {chartData.length > 0
                    ? `₹${chartData[0].open.toFixed(2)}`
                    : stock.price > 0
                      ? `₹${(stock.price * 0.98).toFixed(2)}`
                      : '₹0.00'}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">High</p>
                <p className="font-bold text-white">
                  {chartData.length > 0
                    ? `₹${Math.max(...chartData.map((d) => d.high)).toFixed(2)}`
                    : stock.price > 0
                      ? `₹${(stock.price * 1.05).toFixed(2)}`
                      : '₹0.00'}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">Low</p>
                <p className="font-bold text-white">
                  {chartData.length > 0
                    ? `₹${Math.min(...chartData.map((d) => d.low)).toFixed(2)}`
                    : stock.price > 0
                      ? `₹${(stock.price * 0.95).toFixed(2)}`
                      : '₹0.00'}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">Volume</p>
                <p className="font-bold text-white">
                  {chartData.length > 0
                    ? chartData.reduce((sum, d) => sum + (d.volume || 0), 0).toLocaleString()
                    : stock.volume
                      ? stock.volume.toLocaleString()
                      : '0'}
                </p>
              </div>
            </div>

            {newsItems && newsItems.length > 0 && (
              <div id="stock-news-section" className="mt-6 bg-slate-800/60 rounded-xl p-4">
                <div className="text-slate-300 text-sm mb-3">Related News</div>
                <div className="space-y-2">
                  {newsItems.map((n: any, idx: number) => (
                    <a
                      key={idx}
                      href={n.url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="block p-3 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-200"
                    >
                      <div className="text-sm font-semibold">{n.title || n.headline || 'News'}</div>
                      {n.source && (
                        <div className="text-xs text-slate-400 mt-1">
                          {n.source} • {n.publishedAt ? new Date(n.publishedAt).toLocaleString() : ''}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

