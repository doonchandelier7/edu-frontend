import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { realTimeDataService, RealTimePrice, LiveCandlestick, MarketUpdate } from '../services/realTimeDataService';

interface LiveMarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
  bid?: number;
  ask?: number;
  high24h?: number;
  low24h?: number;
}

interface LiveMarketContextType {
  // State
  liveData: Map<string, LiveMarketData>;
  isConnected: boolean;
  subscribedSymbols: string[];
  
  // Actions
  subscribeToSymbol: (symbol: string) => void;
  unsubscribeFromSymbol: (symbol: string) => void;
  getLiveData: (symbol: string) => LiveMarketData | null;
  getAllLiveData: () => LiveMarketData[];
  
  // Connection
  connect: () => Promise<void>;
  disconnect: () => void;
  getConnectionStatus: () => boolean;
}

const LiveMarketContext = createContext<LiveMarketContextType | undefined>(undefined);

export const useLiveMarket = () => {
  const context = useContext(LiveMarketContext);
  if (!context) {
    throw new Error('useLiveMarket must be used within a LiveMarketProvider');
  }
  return context;
};

interface LiveMarketProviderProps {
  children: ReactNode;
}

export const LiveMarketProvider: React.FC<LiveMarketProviderProps> = ({ children }) => {
  const [liveData, setLiveData] = useState<Map<string, LiveMarketData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [subscribedSymbols, setSubscribedSymbols] = useState<string[]>([]);

  // Initialize real-time service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await realTimeDataService.connect();
        setIsConnected(true);
        
        // Set up callbacks
        realTimeDataService.onPriceUpdate((priceData: RealTimePrice) => {
          setLiveData(prev => {
            const newMap = new Map(prev);
            newMap.set(priceData.symbol, {
              symbol: priceData.symbol,
              price: priceData.price,
              change: priceData.change,
              changePercent: priceData.changePercent,
              volume: priceData.volume,
              timestamp: priceData.timestamp,
              bid: priceData.bid,
              ask: priceData.ask,
              high24h: priceData.high24h,
              low24h: priceData.low24h
            });
            return newMap;
          });
        });

        realTimeDataService.onCandlestickUpdate((candlestickData: LiveCandlestick) => {
          // Update live data with candlestick information
          setLiveData(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(candlestickData.symbol);
            if (existing) {
              newMap.set(candlestickData.symbol, {
                ...existing,
                price: candlestickData.close,
                volume: candlestickData.volume,
                timestamp: candlestickData.timestamp
              });
            }
            return newMap;
          });
        });

        realTimeDataService.onMarketUpdate((marketData: MarketUpdate) => {
          // Handle market-wide updates
          console.log('Market update:', marketData);
        });

      } catch (error) {
        console.error('Failed to initialize live market service:', error);
        setIsConnected(false);
      }
    };

    initializeService();

    return () => {
      realTimeDataService.disconnect();
    };
  }, []);

  const subscribeToSymbol = useCallback((symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    
    if (!subscribedSymbols.includes(upperSymbol)) {
      realTimeDataService.subscribeToSymbol(upperSymbol);
      setSubscribedSymbols(prev => [...prev, upperSymbol]);
      
      // Start mock data stream for testing
      realTimeDataService.startMockDataStream(upperSymbol, 3000);
    }
  }, [subscribedSymbols]);

  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    
    if (subscribedSymbols.includes(upperSymbol)) {
      realTimeDataService.unsubscribeFromSymbol(upperSymbol);
      setSubscribedSymbols(prev => prev.filter(s => s !== upperSymbol));
      
      // Remove from live data
      setLiveData(prev => {
        const newMap = new Map(prev);
        newMap.delete(upperSymbol);
        return newMap;
      });
    }
  }, [subscribedSymbols]);

  const getLiveData = useCallback((symbol: string) => {
    return liveData.get(symbol.toUpperCase()) || null;
  }, [liveData]);

  const getAllLiveData = useCallback(() => {
    return Array.from(liveData.values());
  }, [liveData]);

  const connect = useCallback(async () => {
    try {
      await realTimeDataService.connect();
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect to live market service:', error);
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    realTimeDataService.disconnect();
    setIsConnected(false);
  }, []);

  const getConnectionStatus = useCallback(() => {
    return realTimeDataService.getConnectionStatus();
  }, []);

  const value: LiveMarketContextType = {
    liveData,
    isConnected,
    subscribedSymbols,
    subscribeToSymbol,
    unsubscribeFromSymbol,
    getLiveData,
    getAllLiveData,
    connect,
    disconnect,
    getConnectionStatus
  };

  return (
    <LiveMarketContext.Provider value={value}>
      {children}
    </LiveMarketContext.Provider>
  );
};
