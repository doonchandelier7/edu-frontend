import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Badge } from '../shared/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../shared/Tabs';
import { Alert, AlertDescription } from '../shared/Alert';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Wallet,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';
import { marketDataApi, paperTradingApi } from '../../services/api';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  timestamp: number;
  source: string;
  assetType: 'crypto' | 'stock';
}

interface PortfolioSnapshot {
  userId: string;
  totalValue: number;
  cashBalance: {
    crypto: number;
    stock: number;
  };
  positions: Array<{
    symbol: string;
    assetType: 'crypto' | 'stock';
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    marketValue: number;
    pnl: number;
    pnlPercent: number;
  }>;
  totalPnl: number;
  totalPnlPercent: number;
  lastUpdated: Date;
}

interface TradeRequest {
  symbol: string;
  assetType: 'crypto' | 'stock';
  side: 'buy' | 'sell';
  tradeType: 'market' | 'limit' | 'stop_loss';
  quantity: number;
  price?: number;
  stopLossPrice?: number;
  limitPrice?: number;
}

interface OrderBookEntry {
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
}

const AdvancedTradingInterface: React.FC<{ userId: string }> = ({ userId }) => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [assetType, setAssetType] = useState<'crypto' | 'stock'>('crypto');
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioSnapshot | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBookEntry[]>([]);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Trade form state
  const [tradeForm, setTradeForm] = useState<TradeRequest>({
    symbol: 'BTC',
    assetType: 'crypto',
    side: 'buy',
    tradeType: 'market',
    quantity: 0,
    price: 0,
  });

  // Fetch market data
  const fetchMarketData = useCallback(async () => {
    if (!selectedSymbol) return;
    
    try {
      setIsLoading(true);
      const response = await marketDataApi.getMarketData(selectedSymbol, assetType);
      setMarketData(response.data);
      setError(null);
    } catch (err: any) {
      setError(`Failed to fetch market data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSymbol, assetType]);

  // Fetch portfolio
  const fetchPortfolio = useCallback(async () => {
    try {
      const response = await paperTradingApi.getPortfolio(userId);
      setPortfolio(response.data);
    } catch (err: any) {
      console.error('Failed to fetch portfolio:', err);
    }
  }, [userId]);

  // Fetch order book (mock data for now)
  const fetchOrderBook = useCallback(async () => {
    if (!marketData) return;
    
    // Mock order book data
    const mockOrderBook: OrderBookEntry[] = [
      { price: marketData.price * 0.999, quantity: 1.5, side: 'buy' },
      { price: marketData.price * 0.998, quantity: 2.3, side: 'buy' },
      { price: marketData.price * 0.997, quantity: 1.8, side: 'buy' },
      { price: marketData.price * 1.001, quantity: 1.2, side: 'sell' },
      { price: marketData.price * 1.002, quantity: 2.1, side: 'sell' },
      { price: marketData.price * 1.003, quantity: 1.7, side: 'sell' },
    ];
    
    setOrderBook(mockOrderBook);
  }, [marketData]);

  // Place trade
  const placeTrade = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const tradeData = {
        ...tradeForm,
        userId,
      };

      const result = await paperTradingApi.placeTrade(tradeData);
      
      setSuccess(`Trade placed successfully! Order ID: ${result.data.tradeId}`);
      
      // Reset form
      setTradeForm({
        symbol: selectedSymbol,
        assetType,
        side: 'buy',
        tradeType: 'market',
        quantity: 0,
        price: 0,
      });

      // Refresh data
      await Promise.all([fetchMarketData(), fetchPortfolio()]);
    } catch (err: any) {
      setError(`Failed to place trade: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update trade form when symbol changes
  useEffect(() => {
    setTradeForm(prev => ({
      ...prev,
      symbol: selectedSymbol,
      assetType,
    }));
  }, [selectedSymbol, assetType]);

  // Auto-refresh data
  useEffect(() => {
    fetchMarketData();
    fetchPortfolio();
    
    const interval = setInterval(() => {
      fetchMarketData();
      fetchPortfolio();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [fetchMarketData, fetchPortfolio]);

  // Update order book when market data changes
  useEffect(() => {
    fetchOrderBook();
  }, [fetchOrderBook]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Advanced Trading</h1>
          <p className="text-gray-400">Real-time paper trading with multiple exchanges</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-green-100 text-green-800">
            <Activity className="w-3 h-3 mr-1" />
            Live
          </Badge>
          <Button onClick={fetchPortfolio} variant="outline">
            Refresh Portfolio
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="border-red-500">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-500">
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Market Data & Trading Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Market Data Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Market Data - {selectedSymbol}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value as 'crypto' | 'stock')}
                    className="bg-gray-700 text-white px-3 py-1 rounded"
                  >
                    <option value="crypto">Crypto</option>
                    <option value="stock">Stock</option>
                  </select>
                  <Input
                    value={selectedSymbol}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedSymbol(e.target.value.toUpperCase())}
                    placeholder="Symbol"
                    className="w-24"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {marketData ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Current Price</p>
                    <p className="text-2xl font-bold text-white">
                      ${marketData.price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">24h Change</p>
                    <div className="flex items-center gap-1">
                      {marketData.changePercent >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      <p className={`text-xl font-semibold ${
                        marketData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {marketData.changePercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Volume</p>
                    <p className="text-lg text-white">
                      {marketData.volume.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Source</p>
                    <Badge className="bg-blue-100 text-blue-800">
                      {marketData.source}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  ) : (
                    <p className="text-gray-400">Select a symbol to view market data</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trading Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Place Trade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Trade Type
                    </label>
                    <select
                      value={tradeForm.tradeType}
                      onChange={(e) => setTradeForm(prev => ({
                        ...prev,
                        tradeType: e.target.value as 'market' | 'limit' | 'stop_loss'
                      }))}
                      className="w-full p-2 bg-gray-700 text-white rounded"
                    >
                      <option value="market">Market Order</option>
                      <option value="limit">Limit Order</option>
                      <option value="stop_loss">Stop Loss</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Side
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant={tradeForm.side === 'buy' ? 'default' : 'outline'}
                        onClick={() => setTradeForm(prev => ({ ...prev, side: 'buy' }))}
                        className="flex-1"
                      >
                        Buy
                      </Button>
                      <Button
                        variant={tradeForm.side === 'sell' ? 'default' : 'outline'}
                        onClick={() => setTradeForm(prev => ({ ...prev, side: 'sell' }))}
                        className="flex-1"
                      >
                        Sell
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={tradeForm.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTradeForm(prev => ({
                        ...prev,
                        quantity: parseFloat(e.target.value) || 0
                      }))}
                      placeholder="Enter quantity"
                    />
                  </div>

                  {tradeForm.tradeType === 'limit' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Limit Price
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={tradeForm.limitPrice || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTradeForm(prev => ({
                          ...prev,
                          limitPrice: parseFloat(e.target.value) || undefined
                        }))}
                        placeholder="Enter limit price"
                      />
                    </div>
                  )}

                  {tradeForm.tradeType === 'stop_loss' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Stop Loss Price
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={tradeForm.stopLossPrice || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTradeForm(prev => ({
                          ...prev,
                          stopLossPrice: parseFloat(e.target.value) || undefined
                        }))}
                        placeholder="Enter stop loss price"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Trade Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Symbol:</span>
                        <span className="text-white">{tradeForm.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Side:</span>
                        <span className="text-white capitalize">{tradeForm.side}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white capitalize">{tradeForm.tradeType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Quantity:</span>
                        <span className="text-white">{tradeForm.quantity}</span>
                      </div>
                      {marketData && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Est. Total:</span>
                          <span className="text-white">
                            ${(tradeForm.quantity * marketData.price).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={placeTrade}
                    disabled={isLoading || tradeForm.quantity <= 0}
                    className="w-full"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Placing Trade...
                      </div>
                    ) : (
                      `Place ${tradeForm.side.toUpperCase()} Order`
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Book */}
          <Card>
            <CardHeader>
              <CardTitle>Order Book</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {orderBook.map((entry, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-2 rounded ${
                      entry.side === 'buy' ? 'bg-green-900/20' : 'bg-red-900/20'
                    }`}
                  >
                    <span className={`font-mono ${
                      entry.side === 'buy' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      ${entry.price.toFixed(2)}
                    </span>
                    <span className="text-white">{entry.quantity}</span>
                    <Badge className={
                      entry.side === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }>
                      {entry.side.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Sidebar */}
        <div className="space-y-6">
          {/* Portfolio Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              {portfolio ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Total Value</p>
                    <p className="text-2xl font-bold text-white">
                      ${portfolio.totalValue.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Crypto Cash</p>
                      <p className="text-lg text-white">
                        ${portfolio.cashBalance.crypto.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Stock Cash</p>
                      <p className="text-lg text-white">
                        ${portfolio.cashBalance.stock.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400">Total P&L</p>
                    <div className="flex items-center gap-2">
                      {portfolio.totalPnl >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      <p className={`text-lg font-semibold ${
                        portfolio.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ${portfolio.totalPnl.toFixed(2)} ({portfolio.totalPnlPercent.toFixed(2)}%)
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400">
                    Last updated: {new Date(portfolio.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <Clock className="w-8 h-8 mx-auto mb-2" />
                  <p>Loading portfolio...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Positions */}
          <Card>
            <CardHeader>
              <CardTitle>Positions</CardTitle>
            </CardHeader>
            <CardContent>
              {portfolio && portfolio.positions.length > 0 ? (
                <div className="space-y-3">
                  {portfolio.positions.map((position, index) => (
                    <div key={index} className="p-3 bg-gray-800 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-white">{position.symbol}</p>
                          <p className="text-xs text-gray-400">{position.assetType}</p>
                        </div>
                        <Badge className={
                          position.pnl >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }>
                          {position.pnlPercent.toFixed(1)}%
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-400">Quantity</p>
                          <p className="text-white">{position.quantity}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Avg Price</p>
                          <p className="text-white">${position.averagePrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Current</p>
                          <p className="text-white">${position.currentPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Value</p>
                          <p className="text-white">${position.marketValue.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <p>No positions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTradingInterface;
