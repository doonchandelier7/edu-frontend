import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useTradingHeader } from '../../../contexts/TradingHeaderContext';
import { useMarketData } from './hooks/useMarketData';
import { useChartData } from './hooks/useChartData';
import { useQuote } from './hooks/useQuote';
import { AccountInfo } from './components/AccountInfo';
import { EmptyAccount } from './components/EmptyAccount';
import { WatchlistSection } from './components/WatchlistSection';
import { IndianStocksSection } from './components/IndianStocksSection';
import { IndianIndices } from './components/IndianIndices';
import { ChartModal } from './components/ChartModal';
import { TradeModal } from './components/TradeModal';
import MarketData from '../MarketData';
import AlpacaAccountManager from '../AlpacaAccountManager';
import WatchlistManager from '../WatchlistManager';
import EnhancedChartInterface from '../EnhancedChartInterface';
import { normalizeStockData, sanitizeSymbol } from './utils';
import { SelectedStockData, ChartStockData, StockItem, AlpacaAccount } from './types';

const TradingViewLayout: React.FC = () => {
  const { searchQuery, setSearchQuery, setOnAccountManagerClick, setOnNewTradeClick } = useTradingHeader();
  const [, setSelectedStock] = useState<SelectedStockData | null>(null);
  const [filteredIndianStocks, setFilteredIndianStocks] = useState<StockItem[]>([]);
  const [filteredWatchlist, setFilteredWatchlist] = useState<StockItem[]>([]);
  const [showAccountManager, setShowAccountManager] = useState(false);
  const [showWatchlistManager, setShowWatchlistManager] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [showProfessionalChart, setShowProfessionalChart] = useState(false);
  const [selectedChartStock, setSelectedChartStock] = useState<ChartStockData | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [portfolioHoldings, setPortfolioHoldings] = useState<Record<string, number>>({});
  const [recentlyBought, setRecentlyBought] = useState<Set<string>>(new Set());
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [orderLimitPrice, setOrderLimitPrice] = useState<number | undefined>(undefined);
  const [orderTab, setOrderTab] = useState<'quick' | 'regular'>('quick');
  const [isIntraday, setIsIntraday] = useState<boolean>(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');
  const [selectedTradeStock, setSelectedTradeStock] = useState<ChartStockData | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<string>('1Y');
  const [chartType, setChartType] = useState<'candles' | 'line' | 'bars'>('candles');
  const [isOrderLoading, setIsOrderLoading] = useState(false);

  const {
    watchlistData,
    indianStockData,
    alpacaAccount: marketAlpacaAccount,
    portfolioHoldings: marketPortfolioHoldings,
    loading,
    refreshMarketData,
  } = useMarketData();

  const [alpacaAccount, setAlpacaAccount] = useState<AlpacaAccount | null>(marketAlpacaAccount);
  
  useEffect(() => {
    setAlpacaAccount(marketAlpacaAccount);
  }, [marketAlpacaAccount]);

  const { chartData, newsItems, fetchChartData, fetchNews } = useChartData();

  const { stockData: quoteStockData } = useQuote(
    selectedChartStock?.symbol || null,
    showChartModal || showProfessionalChart
  );

  // Update portfolioHoldings from market data hook
  useEffect(() => {
    setPortfolioHoldings(marketPortfolioHoldings);
  }, [marketPortfolioHoldings]);

  // Handle search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredIndianStocks(indianStockData || []);
      setFilteredWatchlist(watchlistData || []);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filteredIndian = (indianStockData || []).filter(
      (stock) =>
        stock.symbol?.toLowerCase().includes(query) ||
        stock.name?.toLowerCase().includes(query) ||
        stock.sector?.toLowerCase().includes(query)
    );
    setFilteredIndianStocks(filteredIndian);

    const filteredWatchlistItems = (watchlistData || []).filter(
      (item) => item.symbol?.toLowerCase().includes(query) || item.name?.toLowerCase().includes(query)
    );
    setFilteredWatchlist(filteredWatchlistItems);
  }, [searchQuery, indianStockData, watchlistData]);

  // Update chart stock data when quote updates
  useEffect(() => {
    if (quoteStockData && selectedChartStock) {
      setSelectedChartStock((prev: any) => ({
        ...prev,
        price: quoteStockData.price,
        change: quoteStockData.change,
        changePercent: quoteStockData.changePercent,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteStockData]);

  // Refresh selected chart stock data
  useEffect(() => {
    const refreshSelectedChart = async () => {
      try {
        if (!selectedChartStock?.symbol) return;
        const baseSymbol = sanitizeSymbol(selectedChartStock.symbol);

        try {
          const { alpacaIndianStocksApi } = await import('../../../services/alpacaIndianStocksApi');
          const quote = await (alpacaIndianStocksApi as any).getQuote(baseSymbol);
          if (quote && (quote.price || quote.ltp || quote.lastPrice)) {
            const price = quote.price || quote.ltp || quote.lastPrice || 0;
            setSelectedChartStock((prev: any) => ({
              ...prev,
              price: price,
              change: quote.change || prev?.change || 0,
              changePercent: quote.changePercent || prev?.changePercent || 0,
              volume: quote.volume || prev?.volume || 0,
            }));
            return;
          }
        } catch (quoteError) {
          // Try market data
        }

        const { alpacaIndianStocksApi } = await import('../../../services/alpacaIndianStocksApi');
        const md = await alpacaIndianStocksApi.getMarketData([baseSymbol]);
        const latest = Array.isArray(md)
          ? md.find((m: any) => sanitizeSymbol(m.symbol) === baseSymbol)
          : null;
        if (latest) {
          setSelectedChartStock((prev: any) => ({
            ...prev,
            price: latest.price ?? prev?.price ?? 0,
            change: latest.change ?? prev?.change ?? 0,
            changePercent: latest.changePercent ?? prev?.changePercent ?? 0,
            volume: latest.volume ?? prev?.volume ?? 0,
          }));
        }
      } catch (e) {
        console.error('Error refreshing chart stock data:', e);
      }
    };
    refreshSelectedChart();
  }, [selectedChartStock?.symbol]);

  const handleStockClick = (stockData: any) => {
    const normalized = normalizeStockData(stockData);
    setSelectedStock(stockData);
    setSelectedChartStock({
      symbol: normalized.symbol,
      name: normalized.name,
      exchange: normalized.exchange,
      sector: normalized.sector,
      price: normalized.price,
      change: normalized.change,
      changePercent: normalized.changePercent,
      volume: normalized.keyStats?.volume ? Number(normalized.keyStats.volume) : undefined,
    });
    setShowChartModal(true);
    setOrderQuantity(1);
    setOrderType('market');
    setOrderLimitPrice(undefined);
    setChartTimeframe('1Y');
    setChartType('candles');
    fetchChartData(normalized.symbol, '1Y');
    fetchNews(normalized.symbol);
  };

  const handleSymbolChangeFromChart = async (newSymbol: string) => {
    if (!newSymbol || newSymbol === selectedChartStock?.symbol) return;
    
    try {
      // Find the stock data from watchlist or indian stocks
      const allStocks = [...(watchlistData || []), ...(indianStockData || [])];
      const stockData = allStocks.find(
        (s) => sanitizeSymbol(s.symbol) === sanitizeSymbol(newSymbol)
      );

      if (stockData) {
        const normalized = normalizeStockData(stockData);
        setSelectedChartStock({
          symbol: normalized.symbol,
          name: normalized.name,
          exchange: normalized.exchange,
          sector: normalized.sector,
          price: normalized.price,
          change: normalized.change,
          changePercent: normalized.changePercent,
          volume: stockData.volume || undefined,
        });
        // Fetch new chart data for the new symbol
        fetchChartData(normalized.symbol, chartTimeframe);
        fetchNews(normalized.symbol);
      } else {
        // If not found in lists, create a basic stock object and fetch data
        const baseSymbol = sanitizeSymbol(newSymbol);
        setSelectedChartStock({
          symbol: baseSymbol,
          name: baseSymbol,
          exchange: 'NSE',
          sector: 'General',
          price: 0,
          change: 0,
          changePercent: 0,
        });
        fetchChartData(baseSymbol, chartTimeframe);
        fetchNews(baseSymbol);
      }
    } catch (error) {
      console.error('Error changing symbol from chart:', error);
    }
  };

  const triggerOrder = async (side: 'buy' | 'sell') => {
    const target = selectedTradeStock || selectedChartStock;
    if (!target) return;
    
    // Validate order
    if (orderQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (orderType === 'limit' && (!orderLimitPrice || orderLimitPrice <= 0)) {
      toast.error('Please enter a valid limit price');
      return;
    }

    // Check sell quantity
    if (side === 'sell') {
      const availableQty = portfolioHoldings[target.symbol?.toUpperCase() || ''] || 0;
      if (orderQuantity > availableQty) {
        toast.error(`Insufficient holdings. You have ${availableQty} shares available.`);
        return;
      }
    }

    setIsOrderLoading(true);
    try {
      const { tradingApi } = await import('../../../services/tradingApi');
      const payload: any = {
        symbol: target.symbol,
        side,
        tradeType: orderType,
        quantity: orderQuantity,
        price: orderType === 'limit' ? orderLimitPrice : undefined,
        assetType: 'stock' as const,
      };
      
      // Only include isIntraday if it's true (to avoid validation issues)
      if (isIntraday === true) {
        payload.isIntraday = true;
      }

      await tradingApi.placeOrder(payload);
      
      // Success - refresh portfolio and market data
      const portfolio = await tradingApi.getPortfolio();
      const holdingsMap: Record<string, number> = {};
      (portfolio.holdings || []).forEach((h: any) => {
        holdingsMap[h.symbol?.toUpperCase()] = h.quantity || 0;
      });
      setPortfolioHoldings(holdingsMap);
      
      // Refresh Alpaca account balance
      try {
        const { alpacaIndianStocksApi } = await import('../../../services/alpacaIndianStocksApi');
        const updatedAccount = await alpacaIndianStocksApi.getAccount();
        setAlpacaAccount(updatedAccount);
      } catch (accError) {
        console.log('Failed to refresh account balance:', accError);
      }
      
      if (side === 'buy') {
        setRecentlyBought((prev) => new Set([...Array.from(prev), target.symbol?.toUpperCase()]));
      } else {
        // Remove from recently bought if selling all
        const remainingQty = holdingsMap[target.symbol?.toUpperCase()] || 0;
        if (remainingQty === 0) {
          setRecentlyBought((prev) => {
            const newSet = new Set(prev);
            newSet.delete(target.symbol?.toUpperCase());
            return newSet;
          });
        }
      }
      
      // Show success message
      const successMessage = `Successfully ${side === 'buy' ? 'bought' : 'sold'} ${orderQuantity} ${target.symbol} at ${orderType === 'limit' && orderLimitPrice ? `₹${orderLimitPrice.toFixed(2)}` : 'market price'}`;
      toast.success(successMessage);
      
      setShowTradeModal(false);
      refreshMarketData(); // This will also refresh portfolio holdings
      
      // Reset order form
      setOrderQuantity(1);
      setOrderType('market');
      setOrderLimitPrice(undefined);
    } catch (e: any) {
      console.error('Order failed:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Failed to execute trade. Please try again.';
      toast.error(`Trade Error: ${errorMessage}`);
    } finally {
      setIsOrderLoading(false);
    }
  };

  const openOrderForItem = (item: any, side: 'buy' | 'sell') => {
    const normalized = normalizeStockData(item);
    setSelectedTradeStock({
      symbol: normalized.symbol,
      name: normalized.name,
      exchange: normalized.exchange,
      sector: normalized.sector,
      price: normalized.price,
      change: normalized.change,
      changePercent: normalized.changePercent,
    });
    setTradeSide(side);
    setShowTradeModal(true);
  };

  const openChartForItem = (item: any) => {
    const normalized = normalizeStockData(item);
    setSelectedChartStock({
      symbol: normalized.symbol,
      name: normalized.name,
      exchange: normalized.exchange,
      sector: normalized.sector,
      price: normalized.price,
      change: normalized.change,
      changePercent: normalized.changePercent,
    });
    setShowChartModal(true);
    fetchChartData(normalized.symbol, chartTimeframe);
    fetchNews(normalized.symbol);
  };

  // Register handlers with context
  useEffect(() => {
    setOnAccountManagerClick(() => {
      setShowAccountManager(true);
    });
    setOnNewTradeClick(() => {
      setSearchQuery('');
      setTimeout(() => {
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    });
  }, [setOnAccountManagerClick, setOnNewTradeClick, setSearchQuery]);

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
    <div className="h-full w-full bg-gray-900">
      {/* Main Content Area - Full Screen */}
      <div className="flex gap-6 h-[calc(100vh-160px)] overflow-hidden">
        {/* Left Column - Market Overview */}
        <div className="w-1/3 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Market Overview</h2>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <MarketData />
            </div>

            {alpacaAccount ? (
              <AccountInfo
                account={alpacaAccount}
                onRefresh={(account) => {
                  setAlpacaAccount(account);
                }}
              />
            ) : (
              !loading && <EmptyAccount onConnectClick={() => setShowAccountManager(true)} />
            )}
          </div>
        </div>

        {/* Right Column - Watchlist */}
        <div className="w-2/3 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            <WatchlistSection
              watchlistData={filteredWatchlist}
              portfolioHoldings={portfolioHoldings}
              recentlyBought={recentlyBought}
              onStockClick={handleStockClick}
              onBuyClick={(item) => openOrderForItem(item, 'buy')}
              onSellClick={(item) => openOrderForItem(item, 'sell')}
              onChartClick={openChartForItem}
              onWatchlistManagerClick={() => setShowWatchlistManager(true)}
              onRefresh={(data) => {
                refreshMarketData();
              }}
            />

            <IndianIndices onStockClick={handleStockClick} />

            <IndianStocksSection
              indianStockData={filteredIndianStocks}
              portfolioHoldings={portfolioHoldings}
              recentlyBought={recentlyBought}
              onStockClick={handleStockClick}
              onBuyClick={(item) => openOrderForItem(item, 'buy')}
              onSellClick={(item) => openOrderForItem(item, 'sell')}
              onChartClick={openChartForItem}
              onRefresh={(data) => {
                refreshMarketData();
              }}
            />
          </div>
        </div>
      </div>

      {showAccountManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl w-full max-w-7xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/60">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800">Alpaca Account Management</h2>
                  <p className="text-slate-500 mt-1">Manage your trading accounts and settings</p>
                </div>
                <button
                  onClick={() => setShowAccountManager(false)}
                  className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <AlpacaAccountManager onAccountSelect={() => {}} />
            </div>
          </div>
        </div>
      )}

      {showWatchlistManager && <WatchlistManager onClose={() => setShowWatchlistManager(false)} />}

      {showChartModal && selectedChartStock && (
        <ChartModal
          stock={selectedChartStock}
          chartData={chartData}
          chartTimeframe={chartTimeframe}
          chartType={chartType}
          selectedTimeframe={selectedTimeframe}
          newsItems={newsItems}
          portfolioHoldings={portfolioHoldings}
          recentlyBought={recentlyBought}
          showProfessionalChart={showProfessionalChart}
          onClose={() => {
            setShowChartModal(false);
            setShowProfessionalChart(false);
          }}
          onTimeframeChange={(tf) => {
            setChartTimeframe(tf);
            setSelectedTimeframe(tf);
            if (selectedChartStock?.symbol) {
              fetchChartData(selectedChartStock.symbol, tf);
            }
          }}
          onChartTypeChange={setChartType}
          onProfessionalChartClick={() => setShowProfessionalChart(true)}
          onPriceUpdate={(p, ch, chPct) => {
            setSelectedChartStock((prev: any) => ({
              ...prev,
              price: p,
              change: ch,
              changePercent: chPct,
            }));
          }}
          onBuyClick={() => {
            setSelectedTradeStock(selectedChartStock);
            setTradeSide('buy');
            setShowTradeModal(true);
          }}
          onSellClick={() => {
            setSelectedTradeStock(selectedChartStock);
            setTradeSide('sell');
            setShowTradeModal(true);
          }}
          onSymbolChange={handleSymbolChangeFromChart}
        />
      )}

      {showProfessionalChart && selectedChartStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg w-full h-full mx-4 my-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Professional Trading Chart</h2>
              <button
                onClick={() => setShowProfessionalChart(false)}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-[calc(100vh-80px)]">
              <EnhancedChartInterface
                key={selectedChartStock?.symbol || 'DEFAULT'}
                initialSymbol={selectedChartStock?.symbol || 'INFY'}
                onSymbolChange={() => {}}
                onClose={() => setShowProfessionalChart(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showTradeModal && selectedTradeStock && (
        <TradeModal
          stock={selectedTradeStock}
          tradeSide={tradeSide}
          orderType={orderType}
          orderQuantity={orderQuantity}
          orderLimitPrice={orderLimitPrice}
          orderTab={orderTab}
          isIntraday={isIntraday}
          alpacaAccount={alpacaAccount}
          portfolioHoldings={portfolioHoldings}
          isLoading={isOrderLoading}
          onClose={() => {
            setShowTradeModal(false);
            setOrderQuantity(1);
            setOrderType('market');
            setOrderLimitPrice(undefined);
          }}
          onOrderTypeChange={setOrderType}
          onQuantityChange={setOrderQuantity}
          onLimitPriceChange={setOrderLimitPrice}
          onTabChange={setOrderTab}
          onIntradayChange={setIsIntraday}
          onSubmit={triggerOrder}
          onPriceUpdate={(price, change, changePercent) => {
            setSelectedTradeStock((prev: any) => ({
              ...prev,
              price,
              change,
              changePercent,
            }));
          }}
        />
      )}
    </div>
  );
};

export default TradingViewLayout;

