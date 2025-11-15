import React, { useState, useEffect } from 'react';
import {
  Cog6ToothIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  StarIcon,
  FolderIcon,
  EllipsisVerticalIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { tradingApi } from '../../services/tradingApi';
import { marketDataApi } from '../../services/api';
import StockTradingGateway from './StockTradingGateway';

// interface MarketData {
//   symbol: string;
//   name: string;
//   price: number;
//   change: number;
//   changePercent: number;
//   volume?: number;
//   type: 'index' | 'stock' | 'crypto';
// }

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'index' | 'stock' | 'crypto';
  volume?: number;
}

interface TradingForm {
  symbol: string;
  assetType: 'crypto' | 'stock';
  side: 'buy' | 'sell';
  tradeType: 'market' | 'limit';
  quantity: number;
  price?: number;
}

const TradingInterface: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<WatchlistItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'stocks' | 'crypto'>('stocks');
  const [showStockTrading, setShowStockTrading] = useState(false);
  const [tradingForm, setTradingForm] = useState<TradingForm>({
    symbol: '',
    assetType: 'stock',
    side: 'buy',
    tradeType: 'market',
    quantity: 0,
    price: 0
  });
  const [marketData, setMarketData] = useState<any>(null);
  const [watchlistData, setWatchlistData] = useState<any>(null);
  const [, setPortfolioData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  // Fetch market data on component mount
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        
        // Fetch market overview
        const marketOverview = await marketDataApi.getMarketOverview();
        setMarketData(marketOverview.data);

        // Fetch portfolio data
        const portfolio = await tradingApi.getPortfolio();
        setPortfolioData(portfolio);

        // Fetch crypto and stock prices for watchlist
        const cryptoPrices = await tradingApi.getCryptoPrices(['BTC', 'ETH', 'ADA', 'SOL']);
        const stockPrices = await tradingApi.getStockPrices(['AAPL', 'GOOGL', 'MSFT', 'TSLA']);
        
        setWatchlistData({
          crypto: cryptoPrices,
          stocks: stockPrices
        });

      } catch (err) {
        console.error('Error fetching market data:', err);
        setError('Failed to load market data');
        // Fallback to mock data
        setMarketData({
          sp500: { symbol: 'SPX', name: 'S&P 500', price: 6664.00, change: 34.92, changePercent: 0.53, type: 'index' },
          nasdaq: { symbol: 'NDX', name: 'Nasdaq 100', price: 24817.95, change: 160.71, changePercent: 0.65, type: 'index' },
          crypto: { symbol: 'CRYPTO', name: 'Crypto Market Cap', price: 3.57, change: -0.46, changePercent: -11.32, type: 'crypto' }
        });
        setWatchlistData({
          stocks: [
            { symbol: 'AAPL', name: 'Apple Inc', price: 252.29, change: 4.84, changePercent: 1.96, type: 'stock' },
            { symbol: 'TSLA', name: 'Tesla Inc', price: 439.31, change: 10.56, changePercent: 2.46, type: 'stock' },
            { symbol: 'NFLX', name: 'Netflix Inc', price: 1199.36, change: 15.77, changePercent: 1.33, type: 'stock' }
          ],
          crypto: [
            { symbol: 'BTC', name: 'Bitcoin', price: 67890.45, change: 1234.56, changePercent: 1.85, type: 'crypto' },
            { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change: 45.67, changePercent: 1.34, type: 'crypto' }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  const formatChange = (change: number) => {
    return change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
  };

  const formatChangePercent = (changePercent: number) => {
    return changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString()}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(4)}`;
    }
  };

  const handleTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tradingApi.placeOrder(tradingForm);
      alert('Trade executed successfully!');
      // Refresh portfolio data
      const portfolio = await tradingApi.getPortfolio();
      setPortfolioData(portfolio);
    } catch (error) {
      console.error('Trade execution failed:', error);
      alert('Trade execution failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TradingView Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">TV</span>
              <span className="ml-2 text-xl font-semibold text-gray-900">TradingView</span>
            </div>
            
            <div className="relative">
              <div className="flex items-center bg-white rounded-lg border border-gray-300 px-3 py-2 w-80">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search (Ctrl+K)"
                  className="flex-1 outline-none text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <nav className="flex items-center space-x-6">
              <button className="text-gray-600 hover:text-blue-600 text-sm font-medium">Products</button>
              <button className="text-gray-600 hover:text-blue-600 text-sm font-medium">Community</button>
              <button className="text-gray-600 hover:text-blue-600 text-sm font-medium">Markets</button>
              <button className="text-gray-600 hover:text-blue-600 text-sm font-medium">Brokers</button>
              <button className="text-gray-600 hover:text-blue-600 text-sm font-medium flex items-center">
                More
                <ArrowTrendingDownIcon className="w-4 h-4 ml-1" />
              </button>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-600 hover:text-blue-600">
              <StarIcon className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-blue-600">
              <FolderIcon className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-blue-600">
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-blue-600">
              <UserCircleIcon className="w-8 h-8" />
            </button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700">
              Upgrade now 30-day free trial
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Column - Market Summary */}
        <div className="w-1/3 p-6">
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Market summary</h2>
            
            {/* S&P 500 Card */}
            {marketData?.sp500 && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                      500
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{marketData.sp500.name}</h3>
                      <p className="text-sm text-gray-600">{marketData.sp500.symbol}</p>
                    </div>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(marketData.sp500.price)}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-medium">
                    {formatChange(marketData.sp500.change)} ({formatChangePercent(marketData.sp500.changePercent)})
                  </span>
                </div>
              </div>
            )}

            {/* Major Indices */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Major indices</h3>
              {marketData?.nasdaq && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                        100
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{marketData.nasdaq.name}</h3>
                        <p className="text-sm text-gray-600">{marketData.nasdaq.symbol}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(marketData.nasdaq.price)}</p>
                  <div className="flex items-center space-x-1">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 font-medium">
                      {formatChange(marketData.nasdaq.change)} ({formatChangePercent(marketData.nasdaq.changePercent)})
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Crypto Market Cap */}
            {marketData?.crypto && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Crypto market cap</h3>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(marketData.crypto.price)} T USD</p>
                <div className="flex items-center space-x-1 mt-1">
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
                  <span className="text-red-500 font-medium">{formatChangePercent(marketData.crypto.changePercent)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Watchlist */}
        <div className="w-2/3 p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Watchlist</h2>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-gray-600 hover:text-blue-600">
                  <PlusIcon className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-600 hover:text-blue-600">
                  <FolderIcon className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-600 hover:text-blue-600">
                  <EllipsisVerticalIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('stocks')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'stocks'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                STOCKS
              </button>
              <button
                onClick={() => setActiveTab('crypto')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'crypto'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                CRYPTO
              </button>
            </div>

            {/* Stock Trading Setup Button */}
            {activeTab === 'stocks' && (
              <div className="mt-4">
                <button
                  onClick={() => setShowStockTrading(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ChartBarIcon className="w-5 h-5" />
                  <span>Set Up Stock Trading Account</span>
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Create an Alpaca account to start trading real stocks
                </p>
              </div>
            )}

            {/* Watchlist Items */}
            <div className="space-y-2">
              {activeTab === 'stocks' && watchlistData?.stocks?.map((item: WatchlistItem) => (
                <div
                  key={item.symbol}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedAsset(item)}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-bold text-gray-600">{item.symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{item.symbol}</div>
                      <div className="text-sm text-gray-600">{item.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{formatPrice(item.price)}</div>
                    <div className={`text-sm ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatChange(item.change)} {formatChangePercent(item.changePercent)}
                    </div>
                  </div>
                </div>
              ))}

              {activeTab === 'crypto' && watchlistData?.crypto?.map((item: WatchlistItem) => (
                <div
                  key={item.symbol}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedAsset(item)}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-bold text-gray-600">{item.symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{item.symbol}</div>
                      <div className="text-sm text-gray-600">{item.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{formatPrice(item.price)}</div>
                    <div className={`text-sm ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatChange(item.change)} {formatChangePercent(item.changePercent)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Asset Details */}
            {selectedAsset && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-bold text-gray-600">{selectedAsset.symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedAsset.symbol}</h3>
                      <p className="text-sm text-gray-600">{selectedAsset.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-600 hover:text-blue-600">
                      <ChartBarIcon className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-blue-600">
                      <Cog6ToothIcon className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-blue-600">
                      <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">NASDAQ</p>
                  <p className="text-sm text-gray-600">Electronic Technology • Telecommunications Equipment</p>
                </div>

                <div className="mb-4">
                  <p className="text-3xl font-bold text-gray-900">{formatPrice(selectedAsset.price)}</p>
                  <p className={`text-lg ${selectedAsset.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatChange(selectedAsset.change)} {formatChangePercent(selectedAsset.changePercent)}
                  </p>
                  <p className="text-sm text-gray-600">Market closed</p>
                  <p className="text-sm text-gray-600">Last update at 05:29 GMT+5:30</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-700">
                    {selectedAsset.name} is a key stock in the technology sector, representing significant market cap contribution and importance in the tech industry.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Next earnings report</p>
                    <p className="font-medium">In 13 days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Volume</p>
                    <p className="font-medium">49.15 M</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Volume (30D)</p>
                    <p className="font-medium">53.43 M</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Market capitalization</p>
                    <p className="font-medium">3.74T</p>
                  </div>
                </div>
              </div>
            )}

            {/* Trading Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Place Trade</h3>
              <form onSubmit={handleTradeSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                    <input
                      type="text"
                      value={tradingForm.symbol}
                      onChange={(e) => setTradingForm({...tradingForm, symbol: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., AAPL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
                    <select
                      value={tradingForm.assetType}
                      onChange={(e) => setTradingForm({...tradingForm, assetType: e.target.value as 'crypto' | 'stock'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="stock">Stock</option>
                      <option value="crypto">Crypto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Side</label>
                    <select
                      value={tradingForm.side}
                      onChange={(e) => setTradingForm({...tradingForm, side: e.target.value as 'buy' | 'sell'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={tradingForm.quantity}
                      onChange={(e) => setTradingForm({...tradingForm, quantity: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={tradingForm.tradeType}
                      onChange={(e) => setTradingForm({...tradingForm, tradeType: e.target.value as 'market' | 'limit'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="market">Market</option>
                      <option value="limit">Limit</option>
                    </select>
                  </div>
                </div>

                {tradingForm.tradeType === 'limit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      value={tradingForm.price || ''}
                      onChange={(e) => setTradingForm({...tradingForm, price: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Place Order
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Trading Gateway Modal */}
      {showStockTrading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <StockTradingGateway onClose={() => setShowStockTrading(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingInterface;