import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChartBarIcon,
  Cog6ToothIcon,
  PencilIcon,
  PlusIcon,
  BoltIcon,
  ArrowPathIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import LightweightChart from './LightweightChart';
import { chartService, CandlestickData } from '../../services/chartService';

interface EnhancedChartInterfaceProps {
  initialSymbol?: string;
  onSymbolChange?: (symbol: string) => void;
  onClose?: () => void;
}

const EnhancedChartInterface: React.FC<EnhancedChartInterfaceProps> = ({
  initialSymbol = 'INFY',
  onSymbolChange,
  onClose
}) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState('1Y');
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'option_chain'>('chart');
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Popular symbols for quick access
  const popularSymbols = ['INFY', 'HDFC', 'TCS', 'RELIANCE', 'WIPRO', 'ITC', 'SBIN', 'BHARTIARTL'];

  useEffect(() => {
    setSymbol(initialSymbol);
  }, [initialSymbol]);

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    
    try {
      // Try to fetch real data first
      const response = await chartService.getCandlestickData(symbol, timeframe);
      
      if (response.success && response.data.length > 0) {
        setChartData(response.data);
      } else {
        // Fallback to mock data
        const mockData = chartService.generateMockData(symbol, timeframe);
        setChartData(mockData);
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      // Use mock data as fallback
      const mockData = chartService.generateMockData(symbol, timeframe);
      setChartData(mockData);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
    onSymbolChange?.(newSymbol);
  };

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      handleSymbolChange(query.toUpperCase());
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    setIsScrolling(true);
    const container = scrollContainerRef.current;
    const scrollAmount = 200;
    
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
    
    setTimeout(() => setIsScrolling(false), 300);
  };

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].close : 0;
  const previousPrice = chartData.length > 1 ? chartData[chartData.length - 2].close : currentPrice;
  const change = currentPrice - previousPrice;
  const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          {/* Left Section - Tabs and Search */}
          <div className="flex items-center space-x-6">
            {/* Tabs */}
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('chart')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'chart'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => setActiveTab('option_chain')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'option_chain'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Option chain
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <div className="flex items-center bg-slate-700 rounded-lg px-3 py-2 w-64">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="text"
                  placeholder="Q Enter Symbol"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none"
                />
              </div>
              
              {/* Search Suggestions */}
              {showSearch && (
                <div className="absolute top-full left-0 w-64 bg-slate-700 border border-slate-600 rounded-lg mt-1 shadow-lg z-20">
                  <div className="p-2">
                    <div className="text-xs text-slate-400 mb-2">Popular Symbols</div>
                    {popularSymbols.map((sym) => (
                      <button
                        key={sym}
                        onClick={() => handleSymbolChange(sym)}
                        className="w-full text-left px-2 py-1 text-sm hover:bg-slate-600 rounded"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Chart Controls */}
          <div className="flex items-center space-x-2">
            {/* Chart Type */}
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
              <ChartBarIcon className="w-4 h-4" />
            </button>
            
            {/* Timeframe Dropdown */}
            <select
              value={timeframe}
              onChange={(e) => handleTimeframeChange(e.target.value)}
              className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1M">1M</option>
              <option value="5M">5M</option>
              <option value="15M">15M</option>
              <option value="1H">1H</option>
              <option value="4H">4H</option>
              <option value="1D">1D</option>
              <option value="1W">1W</option>
            </select>

            {/* Chart Tools */}
            <div className="flex items-center space-x-1">
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                <Cog6ToothIcon className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                <PencilIcon className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                <PlusIcon className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                <BoltIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={fetchChartData}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                <ShareIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Trade Button */}
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <span>Trade</span>
              <ArrowPathIcon className="w-4 h-4 rotate-90" />
            </button>

            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Chart Area with Scroller */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chart' ? (
          <div className="h-full flex flex-col">
            {/* Chart Header */}
            <div className="flex items-center justify-between p-6 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">{symbol}</h1>
                  <button className="text-blue-400 hover:text-blue-300 text-sm">
                    + Compare...
                  </button>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{currentPrice.toFixed(2)}</div>
                <div className={`text-lg ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>

            {/* Chart Container with Horizontal Scroller */}
            <div className="flex-1 relative overflow-hidden">
              {/* Scroll Controls */}
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 flex flex-col space-y-2">
                <button
                  onClick={() => handleScroll('left')}
                  disabled={isScrolling}
                  className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 transition-all"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleScroll('right')}
                  disabled={isScrolling}
                  className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50 transition-all"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Chart Scroll Container */}
              <div 
                ref={scrollContainerRef}
                className="h-full overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
                style={{ scrollbarWidth: 'thin' }}
              >
                <div className="min-w-full h-full">
                  <LightweightChart
                    symbol={symbol}
                    data={chartData}
                    timeframe={timeframe}
                    onTimeframeChange={handleTimeframeChange}
                    onSymbolChange={handleSymbolChange}
                  />
                </div>
              </div>

              {/* Scroll Position Indicator */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                <div className="bg-slate-800 rounded-lg px-3 py-1 text-xs text-slate-400">
                  Scroll to navigate chart
                </div>
              </div>
            </div>

            {/* Bottom Timeframe Selector */}
            <div className="bg-slate-800 border-t border-slate-700 p-4">
              <div className="flex items-center justify-center space-x-2">
                {['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => handleTimeframeChange(tf)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      timeframe === tf
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Option Chain Tab */
          <div className="h-full bg-slate-800 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Option Chain - {symbol}</h2>
            <div className="text-slate-400">
              Option chain data will be displayed here. This feature is coming soon.
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-white">Loading chart data...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedChartInterface;
