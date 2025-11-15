import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  Cog6ToothIcon,
  PencilIcon,
  PlusIcon,
  BoltIcon,
  ArrowPathIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  ArrowsPointingOutIcon,
  MinusIcon,
  Square2StackIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import ProfessionalChart from './ProfessionalChart';
import DynamicChart from './DynamicChart';
import { chartService, CandlestickData } from '../../services/chartService';

interface ChartInterfaceProps {
  initialSymbol?: string;
  onSymbolChange?: (symbol: string) => void;
}

const ChartInterface: React.FC<ChartInterfaceProps> = ({
  initialSymbol = 'INFY',
  onSymbolChange
}) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState('1Y');
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'option_chain'>('chart');
  const [showIndicators, setShowIndicators] = useState(true);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['COG']);

  // Popular symbols for quick access
  const popularSymbols = ['INFY', 'HDFC', 'TCS', 'RELIANCE', 'WIPRO', 'ITC', 'SBIN', 'BHARTIARTL'];

  useEffect(() => {
    setSymbol(initialSymbol);
  }, [initialSymbol]);

  useEffect(() => {
    fetchChartData();
  }, [symbol, timeframe]);

  const fetchChartData = async () => {
    setLoading(true);
    setError(null);
    
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
  };

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

  const toggleIndicator = (indicator: string) => {
    setSelectedIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].close : 0;
  const previousPrice = chartData.length > 1 ? chartData[chartData.length - 2].close : currentPrice;
  const change = currentPrice - previousPrice;
  const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top Navigation Bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
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
                <div className="absolute top-full left-0 w-64 bg-slate-700 border border-slate-600 rounded-lg mt-1 shadow-lg z-10">
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
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="p-6">
        {activeTab === 'chart' ? (
          <div className="space-y-6">
            {/* Chart Header */}
            <div className="flex items-center justify-between">
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

            {/* Chart Component */}
            <DynamicChart
              symbol={symbol}
              data={chartData}
              timeframe={timeframe}
              onTimeframeChange={handleTimeframeChange}
              onSymbolChange={handleSymbolChange}
            />

            {/* Indicators Panel */}
            <div className="bg-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Technical Indicators</h3>
                <button
                  onClick={() => setShowIndicators(!showIndicators)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                >
                  {showIndicators ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>

              {showIndicators && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['SMA20', 'SMA50', 'EMA12', 'EMA26', 'RSI', 'MACD', 'COG', 'BB'].map((indicator) => (
                    <button
                      key={indicator}
                      onClick={() => toggleIndicator(indicator)}
                      className={`p-3 rounded-lg border transition-colors ${
                        selectedIndicators.includes(indicator)
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <div className="text-sm font-medium">{indicator}</div>
                      <div className="text-xs text-slate-400">Technical</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Timeframe Selector */}
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
        ) : (
          /* Option Chain Tab */
          <div className="bg-slate-800 rounded-xl p-6">
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

export default ChartInterface;
