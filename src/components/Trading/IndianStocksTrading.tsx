import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  StarIcon,
  FolderIcon,
  EllipsisVerticalIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { alpacaIndianStocksApi } from '../../services/alpacaIndianStocksApi';

interface IndianStockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  exchange: string;
  sector: string;
}

interface AlpacaAccount {
  portfolio_value: string;
  buying_power: string;
  cash: string;
  equity: string;
  status: string;
}

interface AlpacaPosition {
  symbol: string;
  qty: string;
  market_value: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  current_price: string;
}

interface TradeFormData {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  orderType: 'market' | 'limit';
}

const IndianStocksTrading: React.FC = () => {
  const [indianStocks, setIndianStocks] = useState<IndianStockData[]>([]);
  const [alpacaAccount, setAlpacaAccount] = useState<AlpacaAccount | null>(null);
  const [positions, setPositions] = useState<AlpacaPosition[]>([]);
  const [selectedStock, setSelectedStock] = useState<IndianStockData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tradeForm, setTradeForm] = useState<TradeFormData>({
    symbol: '',
    side: 'buy',
    quantity: 0,
    orderType: 'market'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTradeForm, setShowTradeForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch Indian stock symbols and market data
      const symbols = await alpacaIndianStocksApi.getIndianStockSymbols();
      const marketData = await alpacaIndianStocksApi.getMarketData(symbols.slice(0, 10));
      setIndianStocks(marketData);

      // Fetch Alpaca account info
      const account = await alpacaIndianStocksApi.getAccount();
      setAlpacaAccount(account);

      // Fetch positions
      const positionsData = await alpacaIndianStocksApi.getPositions();
      setPositions(positionsData);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
      
      // Fallback to mock data
      setIndianStocks([
        { symbol: 'INFY', name: 'Infosys ADR', price: 18.45, change: 0.25, changePercent: 1.37, volume: 1250000, exchange: 'NASDAQ', sector: 'Technology' },
        { symbol: 'WIT', name: 'Wipro ADR', price: 5.67, change: -0.12, changePercent: -2.07, volume: 890000, exchange: 'NASDAQ', sector: 'Technology' },
        { symbol: 'HDB', name: 'HDFC Bank ADR', price: 65.23, change: 1.45, changePercent: 2.27, volume: 2100000, exchange: 'NASDAQ', sector: 'Financial' },
        { symbol: 'IBN', name: 'ICICI Bank ADR', price: 22.18, change: 0.33, changePercent: 1.51, volume: 1560000, exchange: 'NASDAQ', sector: 'Financial' },
        { symbol: 'TTM', name: 'Tata Motors ADR', price: 28.91, change: -0.67, changePercent: -2.26, volume: 980000, exchange: 'NASDAQ', sector: 'Automotive' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async () => {
    try {
      if (!tradeForm.symbol || tradeForm.quantity <= 0) {
        alert('Please fill in all required fields');
        return;
      }

      const orderData = {
        symbol: tradeForm.symbol,
        side: tradeForm.side,
        quantity: tradeForm.quantity,
        price: tradeForm.price,
        orderType: tradeForm.orderType
      };

      const result = await alpacaIndianStocksApi.executePaperTrade(orderData);
      alert(`Trade executed successfully! Order ID: ${result.id}`);
      
      // Reset form and refresh data
      setTradeForm({
        symbol: '',
        side: 'buy',
        quantity: 0,
        orderType: 'market'
      });
      setShowTradeForm(false);
      fetchData();
      
    } catch (error) {
      console.error('Trade execution failed:', error);
      alert('Trade execution failed. Please try again.');
    }
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

  const formatChange = (change: number) => {
    return change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
  };

  const formatChangePercent = (changePercent: number) => {
    return changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
  };

  const filteredStocks = indianStocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Indian stocks data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-orange-600">🇮🇳</span>
              <span className="ml-2 text-xl font-semibold text-gray-900">Indian Stocks Trading</span>
            </div>
            
            <div className="relative">
              <div className="flex items-center bg-white rounded-lg border border-gray-300 px-3 py-2 w-80">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search Indian stocks..."
                  className="flex-1 outline-none text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowTradeForm(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Trade
            </button>
            <button className="p-2 text-gray-600 hover:text-blue-600">
              <UserCircleIcon className="w-8 h-8" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Column - Account Info & Positions */}
        <div className="w-1/3 p-6">
          <div className="space-y-6">
            {/* Alpaca Account Info */}
            {alpacaAccount && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Overview</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Portfolio Value:</span>
                    <span className="font-medium">{formatPrice(parseFloat(alpacaAccount.portfolio_value))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Buying Power:</span>
                    <span className="font-medium">{formatPrice(parseFloat(alpacaAccount.buying_power))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cash:</span>
                    <span className="font-medium">{formatPrice(parseFloat(alpacaAccount.cash))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`font-medium ${alpacaAccount.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`}>
                      {alpacaAccount.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Positions */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Positions</h2>
              {positions.length > 0 ? (
                <div className="space-y-3">
                  {positions.map((position) => (
                    <div key={position.symbol} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{position.symbol}</div>
                        <div className="text-sm text-gray-600">Qty: {position.qty}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatPrice(parseFloat(position.current_price))}</div>
                        <div className={`text-sm ${parseFloat(position.unrealized_pl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatChange(parseFloat(position.unrealized_pl))} ({formatChangePercent(parseFloat(position.unrealized_plpc) * 100)})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No positions</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Stock List */}
        <div className="w-2/3 p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Indian Stocks</h2>
              <div className="flex items-center space-x-2">
                <button className="p-1 text-gray-600 hover:text-blue-600">
                  <StarIcon className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-600 hover:text-blue-600">
                  <FolderIcon className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-600 hover:text-blue-600">
                  <EllipsisVerticalIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {filteredStocks.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedStock(stock)}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-sm font-bold text-orange-600">{stock.symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{stock.symbol} {stock.name}</div>
                      <div className="text-sm text-gray-600">{stock.sector} • {stock.exchange}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{formatPrice(stock.price)}</div>
                    <div className={`text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatChange(stock.change)} {formatChangePercent(stock.changePercent)}
                    </div>
                    <div className="text-xs text-gray-500">Vol: {(stock.volume / 1000000).toFixed(1)}M</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trade Form Modal */}
      {showTradeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Place Trade</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={tradeForm.symbol}
                  onChange={(e) => setTradeForm({...tradeForm, symbol: e.target.value.toUpperCase()})}
                  placeholder="e.g., INFY"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Side</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={tradeForm.side}
                  onChange={(e) => setTradeForm({...tradeForm, side: e.target.value as 'buy' | 'sell'})}
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={tradeForm.quantity}
                  onChange={(e) => setTradeForm({...tradeForm, quantity: parseInt(e.target.value) || 0})}
                  placeholder="Number of shares"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  value={tradeForm.orderType}
                  onChange={(e) => setTradeForm({...tradeForm, orderType: e.target.value as 'market' | 'limit'})}
                >
                  <option value="market">Market</option>
                  <option value="limit">Limit</option>
                </select>
              </div>

              {tradeForm.orderType === 'limit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={tradeForm.price || ''}
                    onChange={(e) => setTradeForm({...tradeForm, price: parseFloat(e.target.value) || undefined})}
                    placeholder="Limit price"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTradeForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTrade}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Place Trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndianStocksTrading;
