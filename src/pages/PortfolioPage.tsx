import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tradingApi } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/shared/Card';
import { Badge } from '../components/shared/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/shared/Tabs';
import SellStockModal from '../components/Trading/SellStockModal';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  LogOut,
  Clock,
  Calendar,
  HelpCircle
} from 'lucide-react';

interface PortfolioHolding {
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
  assetType: 'crypto' | 'stock';
  isSynthetic?: boolean; // Flag to indicate if this is a synthetic holding (not yet in portfolio)
}


const PortfolioPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'1d' | '7d' | '30d' | '90d' | '1y'>('7d');
  const [selectedHolding, setSelectedHolding] = useState<PortfolioHolding | null>(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'holdings' | 'performance' | 'allocation' | 'history'>('holdings');
  const [holdingsSubTab, setHoldingsSubTab] = useState<'longterm' | 'intraday'>('intraday');
  const [syntheticPrices, setSyntheticPrices] = useState<Record<string, number>>({});

  const { data: portfolio, isLoading, refetch } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => tradingApi.getPortfolio(),
    select: (response) => response.data,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to the tab
  });

  // Fetch intraday trades - get recent trades and filter by executedAt date
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // Fetch trades for today and yesterday to catch trades executed today
  const { data: intradayTradesToday, refetch: refetchToday } = useQuery({
    queryKey: ['intraday-trades', today],
    queryFn: () => tradingApi.getIntradayTrades(today),
    select: (response) => {
      const data = response?.data || response || [];
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
  });

  const { data: intradayTradesYesterday, refetch: refetchYesterday } = useQuery({
    queryKey: ['intraday-trades', yesterdayStr],
    queryFn: () => tradingApi.getIntradayTrades(yesterdayStr),
    select: (response) => {
      const data = response?.data || response || [];
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
  });

  // Combine and filter by executedAt date (today)
  const intradayTrades = useMemo(() => {
    const allTrades = [...(intradayTradesToday || []), ...(intradayTradesYesterday || [])];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    // Filter trades that were executed today (regardless of tradeDate)
    const todayTrades = allTrades.filter((trade: any) => {
      if (!trade.executedAt) return false;
      const executedDate = new Date(trade.executedAt);
      executedDate.setHours(0, 0, 0, 0);
      return executedDate.getTime() === todayDate.getTime();
    });
    
    console.log('All trades (today + yesterday):', allTrades);
    console.log('Filtered trades executed today:', todayTrades);
    
    return todayTrades;
  }, [intradayTradesToday, intradayTradesYesterday]);

  // Filter stock holdings only
  const stockHoldings = useMemo(() => {
    if (!portfolio?.holdings) return [];
    return portfolio.holdings.filter((holding: PortfolioHolding) => holding.assetType === 'stock');
  }, [portfolio?.holdings]);

  // Separate holdings into long-term and intraday (only stocks)
  const { longTermHoldings, intradayHoldings } = useMemo(() => {
    if (!stockHoldings.length) {
      return { longTermHoldings: [], intradayHoldings: [] };
    }

    // Calculate net intraday positions (bought - sold) for each symbol
    const intradayPositions = new Map<string, number>();
    
    // Debug: Log intraday trades
    console.log('Intraday trades received:', intradayTrades);
    console.log('Stock holdings:', stockHoldings.map((h: PortfolioHolding) => h.symbol));
    
    if (!intradayTrades || intradayTrades.length === 0) {
      console.log('No intraday trades found for today');
    }
    
    (intradayTrades || []).forEach((trade: any) => {
      console.log('Processing trade:', trade);
      const symbol = trade.symbol?.toUpperCase();
      if (!symbol) {
        console.log('Skipping trade - no symbol:', trade);
        return;
      }
      
      // Check if it's a stock trade (if assetType is provided)
      // If assetType is not provided, assume it's a stock for intraday trades
      if (trade.assetType && trade.assetType.toLowerCase() !== 'stock') {
        console.log('Skipping trade - not a stock:', trade.symbol, trade.assetType);
        return;
      }
      
      const quantity = typeof trade.quantity === 'number' ? trade.quantity : parseFloat(trade.quantity || '0');
      const side = (trade.side || '').toUpperCase();
      const status = (trade.status || '').toLowerCase();
      
      // Accept executed, pending, filled, or complete statuses
      // Also accept if status is empty (might be default) or any status for now
      // We'll be more lenient to catch all trades
      const isValidStatus = !status || 
                           status === 'executed' || 
                           status === 'pending' || 
                           status === 'filled' || 
                           status === 'complete' ||
                           status === 'active' ||
                           status === 'new';
      
      console.log(`Processing trade: ${symbol}, side: ${side}, status: ${status}, quantity: ${quantity}, isValidStatus: ${isValidStatus}`);
      
      if ((side === 'BUY' || side === 'Buy') && isValidStatus) {
        const currentQty = intradayPositions.get(symbol) || 0;
        intradayPositions.set(symbol, currentQty + quantity);
        console.log(`Added BUY: ${symbol}, new quantity: ${currentQty + quantity}`);
      } else if ((side === 'SELL' || side === 'Sell') && isValidStatus) {
        const currentQty = intradayPositions.get(symbol) || 0;
        intradayPositions.set(symbol, currentQty - quantity);
        console.log(`Added SELL: ${symbol}, new quantity: ${currentQty - quantity}`);
      } else {
        console.log(`Skipping trade - invalid side or status: ${symbol}, side: ${side}, status: ${status}`);
      }
    });

    console.log('Intraday positions map:', Array.from(intradayPositions.entries()));

    // Get symbols that have open intraday positions (net quantity > 0)
    const intradaySymbols = new Set(
      Array.from(intradayPositions.entries())
        .filter(([_, netQty]) => netQty > 0)
        .map(([symbol]) => symbol)
    );

    console.log('Intraday symbols with open positions:', Array.from(intradaySymbols));
    console.log('Available stock holdings symbols:', stockHoldings.map((h: PortfolioHolding) => h.symbol.toUpperCase()));

    const longTerm: PortfolioHolding[] = [];
    const intraday: PortfolioHolding[] = [];
    const holdingsMap = new Map<string, PortfolioHolding>();
    
    // Create a map of existing holdings by symbol
    stockHoldings.forEach((holding: PortfolioHolding) => {
      holdingsMap.set(holding.symbol.toUpperCase(), holding);
    });

    // Process existing holdings
    stockHoldings.forEach((holding: PortfolioHolding) => {
      const holdingSymbol = holding.symbol.toUpperCase();
      if (intradaySymbols.has(holdingSymbol)) {
        console.log(`Adding ${holdingSymbol} to intraday holdings`);
        intraday.push(holding);
      } else {
        console.log(`Adding ${holdingSymbol} to long-term holdings (not in intraday symbols)`);
        longTerm.push(holding);
      }
    });

    // Create synthetic holdings for intraday trades that aren't in portfolio yet
    intradaySymbols.forEach((symbol) => {
      if (!holdingsMap.has(symbol)) {
        console.log(`Creating synthetic holding for ${symbol} (not in portfolio yet)`);
        
        // Find the most recent buy trade for this symbol to get price info
        const buyTrades = (intradayTrades || []).filter((trade: any) => 
          trade.symbol?.toUpperCase() === symbol && 
          (trade.side?.toUpperCase() === 'BUY' || trade.side?.toUpperCase() === 'Buy')
        );
        
        if (buyTrades.length > 0) {
          // Sort by executedAt to get the most recent
          const latestTrade = buyTrades.sort((a: any, b: any) => {
            const dateA = new Date(a.executedAt || 0).getTime();
            const dateB = new Date(b.executedAt || 0).getTime();
            return dateB - dateA;
          })[0];
          
          const netQuantity = intradayPositions.get(symbol) || 0;
          const avgPrice = typeof latestTrade.price === 'number' ? latestTrade.price : parseFloat(latestTrade.price || '0');
          // Try to get current price from portfolio, then from syntheticPrices state, otherwise use avgPrice
          const portfolioHolding = stockHoldings.find((h: PortfolioHolding) => h.symbol.toUpperCase() === symbol);
          const currentPrice = portfolioHolding?.currentPrice || syntheticPrices[symbol.toUpperCase()] || avgPrice;
          
          // Calculate P&L for synthetic holdings
          const profitLoss = (currentPrice - avgPrice) * netQuantity;
          const profitLossPercent = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;
          
          // Create a synthetic holding
          const syntheticHolding: PortfolioHolding = {
            symbol: symbol,
            name: symbol,
            quantity: netQuantity,
            averagePrice: avgPrice,
            currentPrice: currentPrice,
            totalValue: netQuantity * currentPrice,
            profitLoss: profitLoss,
            profitLossPercent: profitLossPercent,
            assetType: 'stock',
            isSynthetic: true, // Mark as synthetic
          };
          
          console.log(`Created synthetic holding for ${symbol}:`, syntheticHolding);
          intraday.push(syntheticHolding);
        }
      }
    });

    // If we have intraday trades but no matching holdings, log a warning
    if (intradaySymbols.size > 0 && intraday.length === 0) {
      console.warn('WARNING: Found intraday trades but no matching holdings in portfolio!');
      console.warn('Intraday symbols:', Array.from(intradaySymbols));
      console.warn('Portfolio symbols:', stockHoldings.map((h: PortfolioHolding) => h.symbol.toUpperCase()));
      console.warn('This might mean the portfolio needs to be refreshed after the trade.');
    }

    console.log(`Final: ${longTerm.length} long-term, ${intraday.length} intraday holdings`);

    return { longTermHoldings: longTerm, intradayHoldings: intraday };
  }, [stockHoldings, intradayTrades, syntheticPrices]);

  // Helper function to calculate metrics from holdings
  const calculateMetrics = (holdings: PortfolioHolding[]) => {
    if (!holdings.length) {
      return {
        totalValue: 0,
        totalPnl: 0,
        totalPnlPercent: 0,
        totalInvestedAmount: 0,
        totalAssets: 0,
      };
    }

    const totalValue = holdings.reduce((sum: number, h: PortfolioHolding) => {
      const val = typeof h.totalValue === 'number' ? h.totalValue : parseFloat(h.totalValue || '0');
      return sum + val;
    }, 0);

    const totalInvested = holdings.reduce((sum: number, h: PortfolioHolding) => {
      const qty = typeof h.quantity === 'number' ? h.quantity : parseFloat(h.quantity || '0');
      const avgPrice = typeof h.averagePrice === 'number' ? h.averagePrice : parseFloat(h.averagePrice || '0');
      return sum + (qty * avgPrice);
    }, 0);

    const totalPnl = holdings.reduce((sum: number, h: PortfolioHolding) => {
      const pnl = typeof h.profitLoss === 'number' ? h.profitLoss : parseFloat(h.profitLoss || '0');
      return sum + pnl;
    }, 0);

    const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    return {
      totalValue,
      totalPnl,
      totalPnlPercent,
      totalInvestedAmount: totalInvested,
      totalAssets: totalValue,
    };
  };

  // Calculate metrics for long-term holdings
  const longTermMetrics = useMemo(() => {
    return calculateMetrics(longTermHoldings);
  }, [longTermHoldings]);

  // Calculate metrics for intraday holdings
  const intradayMetrics = useMemo(() => {
    return calculateMetrics(intradayHoldings);
  }, [intradayHoldings]);

  // Calculate stock-only portfolio metrics (all stocks)
  const stockPortfolioMetrics = useMemo(() => {
    return calculateMetrics(stockHoldings);
  }, [stockHoldings]);

  // Get current metrics based on active tab and sub-tab
  const currentMetrics = useMemo(() => {
    if (activeTab === 'holdings') {
      if (holdingsSubTab === 'longterm') {
        return longTermMetrics;
      } else if (holdingsSubTab === 'intraday') {
        return intradayMetrics;
      }
      return stockPortfolioMetrics;
    }
    // For other tabs, return full portfolio metrics
    return {
      totalValue: portfolio?.totalValue || 0,
      totalPnl: portfolio?.totalPnl || 0,
      totalPnlPercent: portfolio?.totalPnlPercent || 0,
      totalInvestedAmount: portfolio?.totalInvestedAmount || 0,
      totalAssets: portfolio?.totalAssets || 0,
    };
  }, [activeTab, holdingsSubTab, longTermMetrics, intradayMetrics, stockPortfolioMetrics, portfolio]);

  // const { data: portfolioHistory } = useQuery({
  //   queryKey: ['portfolio-history', timeframe],
  //   queryFn: () => tradingApi.getPortfolioHistory(timeframe),
  //   select: (response) => response.data,
  // });

  const getPnlColor = (pnl: number) => {
    return pnl >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getPnlIcon = (pnl: number) => {
    return pnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const getAssetIcon = (symbol: string, assetType: 'crypto' | 'stock') => {
    if (assetType === 'crypto') {
      return (
        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-xs">{symbol.charAt(0)}</span>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-xs">{symbol.charAt(0)}</span>
        </div>
      );
    }
  };

  const getAssetTypeColor = (assetType: 'crypto' | 'stock') => {
    return assetType === 'crypto' 
      ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  // Fetch current prices for synthetic holdings
  useEffect(() => {
    const fetchSyntheticPrices = async () => {
      // Get all symbols that might be synthetic (from intraday trades)
      const allIntradaySymbols = new Set<string>();
      (intradayTrades || []).forEach((trade: any) => {
        const symbol = trade.symbol?.toUpperCase();
        if (symbol) allIntradaySymbols.add(symbol);
      });
      
      // Filter out symbols that are already in portfolio
      const syntheticSymbols = Array.from(allIntradaySymbols).filter(
        symbol => !stockHoldings.some((h: PortfolioHolding) => h.symbol.toUpperCase() === symbol)
      );
      
      if (syntheticSymbols.length === 0) return;
      
      try {
        const response = await tradingApi.getStockPrices(syntheticSymbols);
        const prices = response.data || response;
        // Update synthetic prices state
        setSyntheticPrices((prev) => {
          const updated = { ...prev };
          Object.keys(prices).forEach((symbol) => {
            updated[symbol.toUpperCase()] = prices[symbol];
          });
          return updated;
        });
      } catch (error) {
        console.error('Error fetching prices for synthetic holdings:', error);
      }
    };
    
    // Fetch prices for synthetic holdings every 30 seconds
    const interval = setInterval(fetchSyntheticPrices, 30000);
    fetchSyntheticPrices(); // Initial fetch
    
    return () => clearInterval(interval);
  }, [intradayTrades, stockHoldings]);

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetch(),
        refetchToday(),
        refetchYesterday(),
      ]);
    } catch (error) {
      console.error('Error refreshing portfolio:', error);
    }
  };

  // For Indian stocks, prices are already in INR, no conversion needed
  const formatCurrency = (amount: number) => {
    const inr = amount || 0;
    
    // Prices are already in INR for Indian stocks
    return (
      <div>
        <div className="text-white">₹{inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>
    );
  };

  // Render holdings table
  const renderHoldingsTable = (holdings: PortfolioHolding[], title: string, icon: React.ReactNode) => {
    if (holdings.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No {title}</h3>
              <p className="text-gray-400">No holdings in this category</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Symbol</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Quantity</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">
                    <div className="flex items-center justify-end gap-1 group relative">
                      <span>Avg Buy Price</span>
                      <HelpCircle className="w-4 h-4 cursor-help" />
                      <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <p className="text-xs text-gray-300">
                          <strong className="text-white">Average Buy Price:</strong> The average price at which you purchased these shares. If you bought at different prices, this is the weighted average.
                        </p>
                      </div>
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">
                    <div className="flex items-center justify-end gap-1 group relative">
                      <span>Current Price</span>
                      <HelpCircle className="w-4 h-4 cursor-help" />
                      <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <p className="text-xs text-gray-300">
                          <strong className="text-white">Current Price:</strong> The current market price of the stock (live price). This is what the stock is worth right now.
                        </p>
                      </div>
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">
                    <div className="flex items-center justify-end gap-1 group relative">
                      <span>Total Value</span>
                      <HelpCircle className="w-4 h-4 cursor-help" />
                      <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <p className="text-xs text-gray-300">
                          <strong className="text-white">Total Value:</strong> Current Price × Quantity. This is what your holdings are worth at the current market price.
                        </p>
                      </div>
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">P&L</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">P&L %</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding: PortfolioHolding) => {
                  const avgPrice = typeof holding.averagePrice === 'number' ? holding.averagePrice : parseFloat(holding.averagePrice || '0');
                  const currentPrice = typeof holding.currentPrice === 'number' ? holding.currentPrice : parseFloat(holding.currentPrice || '0');
                  const totalValue = typeof holding.totalValue === 'number' ? holding.totalValue : parseFloat(holding.totalValue || '0');
                  const profitLoss = typeof holding.profitLoss === 'number' ? holding.profitLoss : parseFloat(holding.profitLoss || '0');
                  const profitLossPercent = typeof holding.profitLossPercent === 'number' ? holding.profitLossPercent : parseFloat(holding.profitLossPercent || '0');
                  
                  return (
                    <tr key={holding.symbol} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {getAssetIcon(holding.symbol, holding.assetType)}
                          <div>
                            <div className="font-semibold text-white">{holding.symbol}</div>
                            <Badge className={`${getAssetTypeColor(holding.assetType)} text-xs`}>
                              {holding.assetType.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{holding.name}</td>
                      <td className="py-4 px-4 text-right text-white">{holding.quantity} {holding.assetType === 'crypto' ? 'coins' : 'shares'}</td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-white font-semibold">₹{avgPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Invested: ₹{(avgPrice * holding.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-white font-semibold">₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Market price</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-white font-semibold">₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          = {holding.quantity} × ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className={`flex items-center justify-end gap-1 ${getPnlColor(profitLoss)}`}>
                          {getPnlIcon(profitLoss)}
                          <span className="font-semibold">
                            {profitLoss >= 0 ? '+' : ''}₹{profitLoss.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </td>
                      <td className={`py-4 px-4 text-right font-semibold ${getPnlColor(profitLossPercent)}`}>
                        {profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedHolding(holding);
                            setIsSellModalOpen(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          Sell
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Portfolio</h1>
          <p className="text-gray-400">Track your investments and performance</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6" key={`${activeTab}-${holdingsSubTab}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-400">Total Value</p>
                <div className="text-2xl font-bold">
                  {formatCurrency(currentMetrics.totalValue)}
                </div>
              </div>
              <Wallet className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-400">Total P&L</p>
                <div className={`text-2xl font-bold ${getPnlColor(currentMetrics.totalPnl)}`}>
                  {(() => {
                    const pnl = currentMetrics.totalPnl;
                    return (
                      <div>
                        <div>{pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              {getPnlIcon(currentMetrics.totalPnl)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-400">P&L %</p>
                <p className={`text-2xl font-bold ${getPnlColor(currentMetrics.totalPnlPercent)}`}>
                  {(() => {
                    const pnlPercent = currentMetrics.totalPnlPercent;
                    return `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%`;
                  })()}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 group relative">
                  <p className="text-sm text-gray-400">Total Invested</p>
                  <HelpCircle className="w-4 h-4 text-gray-500 cursor-help" />
                  <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <p className="text-xs text-gray-300">
                      <strong className="text-white">Total Invested:</strong> The total amount of money you spent to buy all your holdings. Calculated as: Average Buy Price × Quantity for each stock, then summed.
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(currentMetrics.totalInvestedAmount)}
                </div>
              </div>
              <Activity className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-400">Total Assets</p>
                <div className="text-2xl font-bold">
                  {formatCurrency(currentMetrics.totalAssets)}
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          setActiveTab(value as any);
          // Reset to intraday when switching to holdings tab
          if (value === 'holdings') {
            setHoldingsSubTab('intraday');
          }
        }} 
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Holdings Tab */}
        <TabsContent value="holdings" className="space-y-6">
          {isLoading ? (
          <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading portfolio...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Sub-tabs for Long Term and Intraday */}
              <Tabs value={holdingsSubTab} onValueChange={(value) => setHoldingsSubTab(value as any)}>
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                  <TabsTrigger value="longterm" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Long Term
                  </TabsTrigger>
                  <TabsTrigger value="intraday" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Intraday
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="longterm" className="mt-6">
                  {renderHoldingsTable(
                    longTermHoldings,
                    'Long Term Holdings',
                    <Calendar className="w-5 h-5" />
                  )}
                </TabsContent>

                <TabsContent value="intraday" className="mt-6">
                  {renderHoldingsTable(
                    intradayHoldings,
                    'Intraday Holdings',
                    <Clock className="w-5 h-5" />
                  )}
                </TabsContent>
              </Tabs>
                </div>
              )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Chart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">Performance chart will be implemented here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">Best Performer</span>
                  <span className="text-green-400 font-semibold">+25.4%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">Worst Performer</span>
                  <span className="text-red-400 font-semibold">-8.2%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">Win Rate</span>
                  <span className="text-blue-400 font-semibold">68%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-gray-300">Total Trades</span>
                  <span className="text-white font-semibold">47</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Asset Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">Pie chart will be implemented here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Allocation Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-300">Stocks</span>
                    </div>
                    <span className="text-white font-semibold">65%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-300">Crypto</span>
                    </div>
                    <span className="text-white font-semibold">25%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-300">Cash</span>
                    </div>
                    <span className="text-white font-semibold">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as any)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="1d">1 Day</option>
                  <option value="7d">7 Days</option>
                  <option value="30d">30 Days</option>
                  <option value="90d">90 Days</option>
                  <option value="1y">1 Year</option>
                </select>
              </div>
              <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Portfolio history chart will be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sell Stock Modal */}
      {selectedHolding && (
        <SellStockModal
          isOpen={isSellModalOpen}
          onClose={() => {
            setIsSellModalOpen(false);
            setSelectedHolding(null);
          }}
          holding={selectedHolding}
          onSuccess={async () => {
            // Refresh portfolio and intraday trades
            await refetch();
            refetchToday();
            refetchYesterday();
            // If it was synthetic, wait a bit and refresh again
            if (selectedHolding.isSynthetic) {
              setTimeout(() => {
                refetch();
                refetchToday();
                refetchYesterday();
              }, 1500);
            }
          }}
        />
      )}
    </div>
  );
};

export default PortfolioPage;
