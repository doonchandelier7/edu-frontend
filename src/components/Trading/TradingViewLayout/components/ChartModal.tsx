import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import LightweightChart from '../../LightweightChart';
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
  onSymbolChange?: (symbol: string) => void;
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
  onSymbolChange,
}) => {
  // Hooks must be called before any early returns
  const [showRightSidebar, setShowRightSidebar] = React.useState(false); // Hide by default for cleaner design

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-white to-gray-50 w-full h-full max-w-[98vw] mx-2 my-2 shadow-2xl border border-gray-300 rounded-xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-white">{stock.symbol.charAt(0)}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{stock.symbol}</h2>
                <p className="text-gray-600 text-sm font-medium">{stock.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200">
                <div className="text-3xl font-bold text-gray-900 mb-1">₹{stock.price.toLocaleString()}</div>
                <div className={`text-base font-semibold px-2 py-1 rounded-lg inline-block ${
                  stock.change >= 0 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent >= 0 ? '+' : ''}
                  {stock.changePercent.toFixed(2)}%)
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onBuyClick}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  Buy
                </button>
                <button
                  onClick={onSellClick}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  Sell
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-3 text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden bg-gradient-to-br from-gray-50 to-white">
          {/* Main Chart Area */}
          <div className="h-full p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Price Chart</h3>
              <div className="flex items-center space-x-3">
                <div className="flex bg-gray-100 rounded-xl p-1.5 border border-gray-200 shadow-sm">
                  {['candles', 'line', 'bars'].map((t) => (
                    <button
                      key={t}
                      onClick={() => onChartTypeChange(t as any)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                        chartType === t 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex bg-gray-100 rounded-xl p-1.5 border border-gray-200 shadow-sm">
                  {['1D', '1W', '1M', '3M', '1Y'].map((period) => (
                    <button
                      key={period}
                      onClick={() => onTimeframeChange(period)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedTimeframe === period
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-[calc(100vh-300px)] min-h-[500px] bg-white rounded-xl border border-gray-200 shadow-inner">
              <LightweightChart
                key={`${stock.symbol}-${chartTimeframe}`}
                symbol={stock.symbol}
                data={chartData}
                timeframe={chartTimeframe}
                onTimeframeChange={onTimeframeChange}
                onSymbolChange={(newSymbol) => {
                  if (onSymbolChange && newSymbol && newSymbol !== stock.symbol) {
                    onSymbolChange(newSymbol);
                  }
                }}
                chartType={chartType}
                onChartTypeChange={onChartTypeChange}
                onPriceUpdate={onPriceUpdate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

