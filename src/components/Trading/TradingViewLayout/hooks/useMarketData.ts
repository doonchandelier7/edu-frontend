import { useState, useEffect, useRef } from 'react';
import { alpacaIndianStocksApi } from '../../../../services/alpacaIndianStocksApi';
import { watchlistApi } from '../../../../services/watchlistApi';
import { marketDataApi } from '../../../../services/api';
import { tradingApi } from '../../../../services/tradingApi';
import { StockItem, AlpacaAccount } from '../types';

export const useMarketData = () => {
  const [watchlistData, setWatchlistData] = useState<StockItem[]>([]);
  const [indianStockData, setIndianStockData] = useState<StockItem[]>([]);
  const [alpacaAccount, setAlpacaAccount] = useState<AlpacaAccount | null>(null);
  const [portfolioHoldings, setPortfolioHoldings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const isInitialLoad = useRef(true);

  const fetchMarketData = async (isRefresh = false) => {
    try {
      if (!isRefresh && isInitialLoad.current) {
        setLoading(true);
      }

      if (!isRefresh) {
        setIndianStockData([]);
        setWatchlistData([]);
      }

      // Fetch watchlist data
      try {
        const watchlists = await watchlistApi.getUserWatchlists();
        const allAssets: any[] = [];
        watchlists.forEach(watchlist => {
          if (watchlist.assets && watchlist.isActive) {
            allAssets.push(...watchlist.assets);
          }
        });

        if (allAssets.length > 0) {
          const symbols = allAssets.map(asset => asset.symbol);
          try {
            const marketData = await alpacaIndianStocksApi.getMarketData(symbols);
            const transformedWatchlist = allAssets.map((asset: any) => {
              const marketInfo = marketData.find(m => m.symbol === asset.symbol);
              return {
                id: asset.id,
                symbol: asset.symbol,
                name: asset.name || asset.symbol,
                price: marketInfo?.price || 0,
                change: marketInfo?.change || 0,
                changePercent: marketInfo?.changePercent || 0,
                volume: marketInfo?.volume || 0,
                marketCap: marketInfo?.marketCap || 0,
                exchange: marketInfo?.exchange || 'NSE',
                sector: marketInfo?.sector || 'General'
              };
            });
            setWatchlistData(transformedWatchlist);
          } catch (marketError) {
            console.log('Failed to fetch market data for watchlist:', marketError);
            const transformedWatchlist = allAssets.map((asset: any) => ({
              id: asset.id,
              symbol: asset.symbol,
              name: asset.name || asset.symbol,
              price: asset.lastPrice || 0,
              change: 0,
              changePercent: asset.changePercent || 0,
              volume: asset.volume || 0,
              marketCap: asset.marketCap || 0,
              exchange: asset.exchange || 'NSE',
              sector: asset.assetClass || 'General'
            }));
            setWatchlistData(transformedWatchlist);
          }
        } else {
          setWatchlistData([]);
        }
      } catch (error) {
        console.log('Watchlist API failed:', error);
        if (!isRefresh) {
          setWatchlistData([]);
        }
      }

      // Fetch Indian stock data
      try {
        const indianSymbols = await alpacaIndianStocksApi.getIndianStockSymbols();
        const indianMarketData = await alpacaIndianStocksApi.getMarketData(indianSymbols.slice(0, 20));
        const transformedData = indianMarketData.map((stock: any) => ({
          symbol: stock.symbol,
          name: stock.name || stock.symbol,
          price: stock.price || 0,
          change: stock.change || 0,
          changePercent: stock.changePercent || 0,
          volume: stock.volume || 0,
          marketCap: stock.marketCap || 0,
          exchange: stock.exchange || 'NSE',
          sector: stock.sector || 'General'
        }));
        setIndianStockData(transformedData);

        // Fetch Alpaca account info
        try {
          const account = await alpacaIndianStocksApi.getAccount();
          setAlpacaAccount(account);
        } catch (accError) {
          console.log('Failed to refresh account:', accError);
        }
      } catch (alpacaError) {
        console.log('Alpaca API failed:', alpacaError);
        if (!isRefresh) {
          setIndianStockData([]);
        }
      }

      // Load portfolio holdings
      try {
        const portfolio = await tradingApi.getPortfolio();
        const holdingsMap: Record<string, number> = {};
        (portfolio.holdings || []).forEach((h: any) => {
          holdingsMap[h.symbol?.toUpperCase()] = h.quantity || 0;
        });
        setPortfolioHoldings(holdingsMap);
      } catch (pfErr) {
        console.log('Failed to load portfolio holdings:', pfErr);
      }

      // Fetch market overview
      try {
        await marketDataApi.getMarketOverview();
      } catch (error) {
        console.log('Market overview API failed:', error);
      }

    } catch (err) {
      console.error('Error loading market data:', err);
    } finally {
      if (!isRefresh && isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
      }
    }
  };

  useEffect(() => {
    fetchMarketData(false);
    const interval = setInterval(() => fetchMarketData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    watchlistData,
    indianStockData,
    alpacaAccount,
    portfolioHoldings,
    loading,
    refreshMarketData: () => fetchMarketData(true),
  };
};

