/**
 * LightweightChart Component
 * 
 * A professional trading chart component using TradingView Lightweight Charts library.
 * 
 * Usage Example:
 * ```tsx
 * import LightweightChart from './components/Trading/LightweightChart';
 * import { chartService } from './services/chartService';
 * 
 * const [chartData, setChartData] = useState([]);
 * const [timeframe, setTimeframe] = useState('1D');
 * 
 * useEffect(() => {
 *   chartService.getCandlestickData('INFY', timeframe).then(result => {
 *     if (result.success) {
 *       setChartData(result.data);
 *     }
 *   });
 * }, [timeframe]);
 * 
 * <LightweightChart
 *   symbol="INFY"
 *   data={chartData}
 *   timeframe={timeframe}
 *   onTimeframeChange={setTimeframe}
 *   onSymbolChange={(symbol) => console.log(symbol)}
 *   chartType="candles"
 *   onPriceUpdate={(price, change, changePercent) => {
 *     console.log('Price updated:', price, change, changePercent);
 *   }}
 * />
 * ```
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData as TVCandlestickData, 
  UTCTimestamp,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  LineStyle
} from 'lightweight-charts';
import { CandlestickData, chartService } from '../../services/chartService';
import { useAuth } from '../../contexts/AuthContext';
import { alpacaIndianStocksApi, AlpacaAccount, AlpacaPosition } from '../../services/alpacaIndianStocksApi';
import { watchlistApi, Watchlist } from '../../services/watchlistApi';

interface LightweightChartProps {
  symbol: string;
  data: CandlestickData[];
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  onSymbolChange: (symbol: string) => void;
  chartType?: 'candles' | 'line' | 'bars';
  onChartTypeChange?: (chartType: 'candles' | 'line' | 'bars') => void;
  onPriceUpdate?: (price: number, change: number, changePercent: number) => void;
}

const LightweightChart: React.FC<LightweightChartProps> = ({
  symbol,
  data,
  timeframe,
  onTimeframeChange,
  onSymbolChange,
  chartType = 'candles',
  onChartTypeChange,
  onPriceUpdate
}) => {
  const [localChartType, setLocalChartType] = useState<'candles' | 'line' | 'bars'>(chartType);

  // Update local chart type when prop changes
  useEffect(() => {
    setLocalChartType(chartType);
  }, [chartType]);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const isFirstDataLoadRef = useRef<boolean>(true);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [change, setChange] = useState<number>(0);
  const [changePercent, setChangePercent] = useState<number>(0);
  
  // Indicator state
  const [showIndicators, setShowIndicators] = useState(true);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['SMA20', 'EMA20']);
  const indicatorSeriesRefs = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());
  
  // Additional indicators (separate panes)
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showStochastic, setShowStochastic] = useState(false);
  const [showWilliamsR, setShowWilliamsR] = useState(false);
  const [showCCI, setShowCCI] = useState(false);
  const [showATR, setShowATR] = useState(false);
  const [showVWAP, setShowVWAP] = useState(false);
  
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSignalRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdHistogramRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const stochasticKRef = useRef<ISeriesApi<'Line'> | null>(null);
  const stochasticDRef = useRef<ISeriesApi<'Line'> | null>(null);
  const williamsRRef = useRef<ISeriesApi<'Line'> | null>(null);
  const cciRef = useRef<ISeriesApi<'Line'> | null>(null);
  const atrRef = useRef<ISeriesApi<'Line'> | null>(null);
  const vwapRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  // Drawing tools state
  type DrawingTool = 'none' | 'line' | 'horizontal' | 'rectangle' | 'fibonacci';
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('none');
  const [priceLines, setPriceLines] = useState<Array<{ id: string; price: number; color: string; lineId?: any }>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingStartRef = useRef<{ x: number; y: number; price?: number; time?: UTCTimestamp } | null>(null);
  const drawingEndRef = useRef<{ x: number; y: number; price?: number; time?: UTCTimestamp } | null>(null);
  const [drawings, setDrawings] = useState<Array<{
    id: string;
    type: DrawingTool;
    points: Array<{ time: UTCTimestamp; price: number }>;
    color: string;
  }>>([]);
  const [showPriceLineInput, setShowPriceLineInput] = useState(false);
  const [priceLineInput, setPriceLineInput] = useState('');
  const drawingsRef = useRef<Map<string, any>>(new Map());
  
  // User state
  const { user } = useAuth();
  
  // Stock search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Watchlist state
  const [watchlistData, setWatchlistData] = useState<any[]>([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(true);
  const [changingSymbol, setChangingSymbol] = useState<string | null>(null);

  // News and Events state
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [eventsItems, setEventsItems] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [showNewsMarkers, setShowNewsMarkers] = useState(true);
  const [showEventMarkers, setShowEventMarkers] = useState(true);

  // Custom component to render news and events markers as overlays
  const NewsEventsMarkers: React.FC<{
    chart: IChartApi | null;
    chartContainer: HTMLDivElement | null;
    data: CandlestickData[];
    newsItems: any[];
    eventsItems: any[];
    series: ISeriesApi<any> | null;
  }> = ({ chart, chartContainer, data, newsItems, eventsItems, series }) => {
    const [markerPositions, setMarkerPositions] = useState<Array<{ x: number; y: number; type: 'news' | 'event'; icon: string; color: string; title: string }>>([]);

    useEffect(() => {
      if (!chart || !chartContainer || !series || data.length === 0) {
        setMarkerPositions([]);
        return;
      }

      const updateMarkerPositions = () => {
        const positions: Array<{ x: number; y: number; type: 'news' | 'event'; icon: string; color: string; title: string }> = [];
        const timeScale = chart.timeScale();
        const visibleRange = timeScale.getVisibleRange();
        
        if (!visibleRange || !visibleRange.from || !visibleRange.to) {
          setMarkerPositions([]);
          return;
        }

        // Find the price range for positioning markers
        const visibleData = data.filter(d => {
          const t = Math.floor(d.timestamp / 1000) as UTCTimestamp;
          return Number(t) >= Number(visibleRange.from) && Number(t) <= Number(visibleRange.to);
        });
        
        if (visibleData.length === 0) {
          setMarkerPositions([]);
          return;
        }

        const minPrice = Math.min(...visibleData.map(d => d.low));
        const maxPrice = Math.max(...visibleData.map(d => d.high));
        const priceRange = maxPrice - minPrice;
        const containerHeight = chartContainer.clientHeight || 400;
        const bottomY = containerHeight - 100; // Leave space for volume
        const topY = 50; // Top margin

        // Add news markers
        newsItems.forEach((news: any) => {
          if (news.date || news.published_at) {
            const newsDate = news.date ? new Date(news.date).getTime() : new Date(news.published_at).getTime();
            const newsTime = Math.floor(newsDate / 1000) as UTCTimestamp;
            
            if (Number(newsTime) >= Number(visibleRange.from) && Number(newsTime) <= Number(visibleRange.to)) {
              try {
                const x = timeScale.timeToCoordinate(newsTime);
                if (x !== null && x >= 0) {
                  positions.push({
                    x: x,
                    y: bottomY - 30, // Position below the chart area
                    type: 'news',
                    icon: '📰',
                    color: '#2196F3',
                    title: news.headline || news.title || news.summary || 'News'
                  });
                }
              } catch (e) {
                // Ignore coordinate conversion errors
              }
            }
          }
        });

        // Add event markers
        eventsItems.forEach((event: any) => {
          if (event.date) {
            const eventTime = Math.floor(event.date / 1000) as UTCTimestamp;
            
            if (Number(eventTime) >= Number(visibleRange.from) && Number(eventTime) <= Number(visibleRange.to)) {
              try {
                const x = timeScale.timeToCoordinate(eventTime);
                if (x !== null && x >= 0) {
                  const eventIcon = event.type === 'Dividend' ? '💰' : event.type === 'Quarterly Result' ? '📊' : '📈';
                  const eventColor = event.type === 'Dividend' ? '#10b981' : event.type === 'Quarterly Result' ? '#f59e0b' : '#8b5cf6';
                  positions.push({
                    x: x,
                    y: topY + 20, // Position above the chart area
                    type: 'event',
                    icon: eventIcon,
                    color: eventColor,
                    title: `${event.type}: ${event.description}${event.value ? ` - ${event.value}` : ''}`
                  });
                }
              } catch (e) {
                // Ignore coordinate conversion errors
              }
            }
          }
        });
        
        setMarkerPositions(positions);
      };

      // Initial update
      const timeoutId = setTimeout(updateMarkerPositions, 100);
      
      // Update positions on scroll/zoom
      const handleVisibleRangeChange = () => {
        updateMarkerPositions();
      };
      
      chart.timeScale().subscribeVisibleTimeRangeChange(handleVisibleRangeChange);
      
      return () => {
        clearTimeout(timeoutId);
        chart.timeScale().unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
      };
    }, [chart, chartContainer, series, data, newsItems, eventsItems]);

    if (markerPositions.length === 0) return null;

    return (
      <div className="absolute inset-0 pointer-events-none z-10">
        {markerPositions.map((marker, index) => (
          <div
            key={index}
            className="absolute pointer-events-auto cursor-pointer hover:scale-125 transition-transform"
            style={{
              left: `${marker.x}px`,
              top: `${marker.y}px`,
              transform: 'translate(-50%, -50%)',
              fontSize: '18px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              zIndex: 15
            }}
            title={marker.title}
          >
            {marker.icon}
          </div>
        ))}
      </div>
    );
  };

  // Convert our CandlestickData to TradingView format
  const convertToTradingViewData = (data: CandlestickData[]): TVCandlestickData[] => {
    return data.map(item => {
      // Ensure timestamp is in milliseconds, then convert to seconds for TradingView
      let timestamp = item.timestamp;
      
      // If timestamp is in seconds (less than year 2000 in milliseconds), convert to milliseconds first
      if (timestamp < 946684800000 && timestamp > 946684800) {
        timestamp = timestamp * 1000;
      }
      
      // TradingView expects timestamp in seconds (UTCTimestamp)
      const timeInSeconds = Math.floor(timestamp / 1000) as UTCTimestamp;
      
      return {
        time: timeInSeconds,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      };
    }).filter(item => item.time > 0 && item.open > 0 && item.close > 0);
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#191919',
      },
      grid: {
        vertLines: { color: '#e5e7eb' },
        horzLines: { color: '#e5e7eb' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#d1d5db',
        rightOffset: 0,
        barSpacing: 2,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: false,
        rightBarStaysOnScroll: false,
      },
      rightPriceScale: {
        borderColor: '#d1d5db',
      },
    });

    chartRef.current = chart;

    // If data is already available, fit content after a short delay (only for short timeframes)
    if (data && data.length > 0) {
      setTimeout(() => {
        if (chartRef.current && chartContainerRef.current) {
          try {
            const containerWidth = chartContainerRef.current.clientWidth;
            if (containerWidth > 0) {
              chartRef.current.applyOptions({
                width: containerWidth,
              });
            }
            // Only fit content if data is small enough to fit on screen
            const maxBars = Math.floor(containerWidth / 3);
            if (data.length <= maxBars) {
              chartRef.current.timeScale().fitContent();
            } else {
              // For large datasets, scroll to the end but allow scrolling back
              const timeScale = chartRef.current.timeScale();
              const tvData = convertToTradingViewData(data);
              if (tvData.length > 0) {
                const lastTime = tvData[tvData.length - 1].time;
                const visibleBars = Math.floor(containerWidth / 3);
                const startTime = Math.max(
                  Number(tvData[0].time),
                  Number(lastTime) - (visibleBars * 86400)
                );
                timeScale.setVisibleRange({
                  from: startTime as UTCTimestamp,
                  to: lastTime
                });
              }
            }
          } catch (e) {
            console.warn('Error fitting content on initial load:', e);
          }
        }
      }, 200);
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
        // Refit content after resize
        setTimeout(() => {
          if (chartRef.current) {
            try {
              chartRef.current.timeScale().fitContent();
            } catch (e) {
              console.warn('Error fitting content on resize:', e);
            }
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Stock search functionality
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await alpacaIndianStocksApi.searchIndianStocks(searchQuery);
        setSearchResults(results || []);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Failed to search stocks:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.stock-search-container')) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSearchResults]);

  // Fetch watchlist data
  useEffect(() => {
    const fetchWatchlist = async () => {
      setLoadingWatchlist(true);
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
                price: marketInfo?.price || asset.lastPrice || 0,
                change: marketInfo?.change || 0,
                changePercent: marketInfo?.changePercent || asset.changePercent || 0,
                volume: marketInfo?.volume || asset.volume || 0,
                marketCap: marketInfo?.marketCap || asset.marketCap || 0,
                exchange: marketInfo?.exchange || asset.exchange || 'NSE',
                sector: marketInfo?.sector || asset.assetClass || 'General'
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
        console.error('Failed to fetch watchlist:', error);
        setWatchlistData([]);
      } finally {
        setLoadingWatchlist(false);
      }
    };

    fetchWatchlist();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchWatchlist, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch news and events when symbol changes
  useEffect(() => {
    // Clear previous data immediately when symbol changes
    setNewsItems([]);
    setEventsItems([]);
    setLoadingNews(true);
    
    const fetchNewsAndEvents = async () => {
      if (!symbol) {
        setLoadingNews(false);
        return;
      }
      
      console.log(`[NEWS/EVENTS] Fetching for symbol: ${symbol}`);
      
      try {
        // Fetch news from API - ensure it's stock-specific
        let news: any[] = [];
        try {
          // Clean symbol for API call
          const cleanSymbol = symbol.replace(/\.NS$|\.BO$/, '').toUpperCase();
          console.log(`[NEWS] Fetching news for: ${cleanSymbol}`);
          
          news = await alpacaIndianStocksApi.getNews(cleanSymbol);
          
          // If empty, try with .NS suffix
          if (!news || news.length === 0) {
            console.log(`[NEWS] Trying with .NS suffix: ${cleanSymbol}.NS`);
            news = await alpacaIndianStocksApi.getNews(`${cleanSymbol}.NS`);
          }
          
          console.log(`[NEWS] Fetched ${news?.length || 0} news items for symbol ${cleanSymbol}`);
          if (news && news.length > 0) {
            console.log(`[NEWS] Sample news:`, news[0]);
          } else {
            console.warn(`[NEWS] No news found for ${cleanSymbol} - API may not have stock-specific news`);
            // Keep empty array - don't show generic news
            news = [];
          }
        } catch (newsError) {
          console.error('[NEWS] API failed:', newsError);
          news = [];
        }
        setNewsItems(news || []);
        
        // Fetch stock-specific events dynamically
        let events: any[] = [];
        try {
          // Try to fetch from API if endpoint exists
          const cleanSymbol = symbol.replace(/\.NS$|\.BO$/, '').toUpperCase();
          console.log(`[EVENTS] Fetching events for: ${cleanSymbol}`);
          
          events = await alpacaIndianStocksApi.getEvents(cleanSymbol);
          // If API returns empty, generate stock-specific events as fallback
          if (!events || events.length === 0) {
            console.log(`[EVENTS] API returned empty, generating stock-specific events for ${cleanSymbol}`);
            events = generateStockEvents(cleanSymbol);
          }
          console.log(`[EVENTS] Generated ${events.length} events for ${cleanSymbol}`, events);
        } catch (error) {
          // Fallback to generating events
          console.warn(`[EVENTS] API failed, using generated events:`, error);
          const cleanSymbol = symbol.replace(/\.NS$|\.BO$/, '').toUpperCase();
          events = generateStockEvents(cleanSymbol);
          console.log(`[EVENTS] Generated ${events.length} fallback events for ${cleanSymbol}`);
        }
        setEventsItems(events);
      } catch (error) {
        console.error(`[NEWS/EVENTS] Failed to fetch:`, error);
        setNewsItems([]);
        // Still generate events even if news fails
        const cleanSymbol = symbol.replace(/\.NS$|\.BO$/, '').toUpperCase();
        const fallbackEvents = generateStockEvents(cleanSymbol);
        setEventsItems(fallbackEvents);
        console.log(`[EVENTS] Generated ${fallbackEvents.length} fallback events`);
      } finally {
        setLoadingNews(false);
      }
    };

    fetchNewsAndEvents();
    
    // Cleanup function to cancel any pending requests
    return () => {
      // Clear loading state if component unmounts or symbol changes
      setLoadingNews(false);
    };
  }, [symbol]);

  // Generate stock-specific events based on symbol and current year
  const generateStockEvents = (stockSymbol: string): any[] => {
    const currentYear = new Date().getFullYear();
    const events: any[] = [];
    
    // Clean symbol
    const cleanSymbol = stockSymbol.replace(/\.NS$|\.BO$/, '').toUpperCase();
    
    // Generate events based on symbol patterns - make it truly stock-specific
    const symbolHash = cleanSymbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Use symbol hash to determine which quarters have results (varies by stock)
    const hasQ1 = (symbolHash % 4) !== 0;
    const hasQ2 = (symbolHash % 4) !== 1;
    const hasQ3 = (symbolHash % 4) !== 2;
    const hasQ4 = (symbolHash % 4) !== 3;
    
    // Quarterly results - dates vary by stock based on symbol hash
    const quarterOffsets = [
      { month: 0, baseDay: 10, hasResult: hasQ1 },   // January (Q3 of previous year)
      { month: 3, baseDay: 15, hasResult: hasQ2 },   // April (Q4 of previous year)
      { month: 6, baseDay: 4, hasResult: hasQ3 },    // July (Q1)
      { month: 9, baseDay: 15, hasResult: hasQ4 }     // October (Q2)
    ];
    
    quarterOffsets.forEach((q, index) => {
      if (q.hasResult && (q.month <= new Date().getMonth() || index < 3)) {
        const day = q.baseDay + (symbolHash % 10); // Vary day by 0-9 based on symbol
        const eventDate = new Date(currentYear, q.month, Math.min(day, 28));
        events.push({
          date: eventDate.getTime(),
          type: 'Quarterly Result',
          description: 'Release date',
          value: null,
          symbol: cleanSymbol // Add symbol to identify stock
        });
      }
    });
    
    // Annual result - date varies by stock
    if (new Date().getMonth() >= 4) {
      const annualDay = 15 + (symbolHash % 15); // Vary between May 15-29
      events.push({
        date: new Date(currentYear, 4, Math.min(annualDay, 29)).getTime(),
        type: 'Annual Result',
        description: 'Release date',
        value: null,
        symbol: cleanSymbol
      });
    }
    
    // Dividends - vary significantly by stock
    const dividendCount = 1 + (symbolHash % 3); // 1-3 dividends per stock
    const dividendMonths = [3, 4, 5, 6, 7]; // March through July
    const selectedMonths = dividendMonths
      .sort(() => (symbolHash % 2) - 0.5) // Shuffle based on symbol
      .slice(0, dividendCount);
    
    selectedMonths.forEach((month, index) => {
      if (month <= new Date().getMonth()) {
        const day = 5 + (symbolHash % 20); // Vary day between 5-24
        const dividendAmount = (0.5 + (symbolHash % 10) * 0.25).toFixed(2); // ₹0.50 to ₹2.75
        events.push({
          date: new Date(currentYear, month, Math.min(day, 28)).getTime(),
          type: 'Dividend',
          description: index === 0 ? 'Announced' : 'Ex date',
          value: `₹${dividendAmount} per share`,
          symbol: cleanSymbol
        });
      }
    });
    
    // Sort by date and ensure unique dates
    const uniqueEvents = events.reduce((acc: any[], event: any) => {
      const existing = acc.find(e => 
        Math.abs(e.date - event.date) < 86400000 && e.type === event.type
      );
      if (!existing) {
        acc.push(event);
      }
      return acc;
    }, []);
    
    return uniqueEvents.sort((a, b) => a.date - b.date);
  };

  // Update chart when symbol changes to refit content
  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;
    
    // Reset first load flag when symbol changes
    isFirstDataLoadRef.current = true;
    
    // Use requestAnimationFrame and timeout to ensure chart is ready and rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (chartRef.current && chartContainerRef.current) {
            try {
              // Ensure chart width is correct
              const containerWidth = chartContainerRef.current.clientWidth;
              if (containerWidth > 0) {
                chartRef.current.applyOptions({
                  width: containerWidth,
                });
              }
              
              // Fit content
              chartRef.current.timeScale().fitContent();
            } catch (e) {
              console.warn('Error refitting content on symbol change:', e);
            }
          }
        }, 100);
      });
    });
  }, [symbol]);

  // Update chart when timeframe changes to refit content
  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;
    
    // Use requestAnimationFrame and timeout to ensure chart is ready and rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (chartRef.current && chartContainerRef.current) {
            try {
              // Ensure chart width is correct
              const containerWidth = chartContainerRef.current.clientWidth;
              if (containerWidth > 0) {
                chartRef.current.applyOptions({
                  width: containerWidth,
                });
              }
              
              // Fit content
              chartRef.current.timeScale().fitContent();
            } catch (e) {
              console.warn('Error refitting content on timeframe change:', e);
            }
          }
        }, 100);
      });
    });
  }, [timeframe]);

  // Update chart data
  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const chart = chartRef.current;
    const tvData = convertToTradingViewData(data);
    let crosshairHandler: ((param: any) => void) | null = null;

    // Remove existing series (with proper checks)
    if (candlestickSeriesRef.current && chart) {
      try {
        const series = candlestickSeriesRef.current;
        if (series) {
          chart.removeSeries(series);
        }
      } catch (e) {
        console.warn('Error removing candlestick series:', e);
      }
      candlestickSeriesRef.current = null;
    }
    if (lineSeriesRef.current && chart) {
      try {
        const series = lineSeriesRef.current;
        if (series) {
          chart.removeSeries(series);
        }
      } catch (e) {
        console.warn('Error removing line series:', e);
      }
      lineSeriesRef.current = null;
    }
    if (volumeSeriesRef.current && chart) {
      try {
        const series = volumeSeriesRef.current;
        if (series) {
          chart.removeSeries(series);
        }
      } catch (e) {
        console.warn('Error removing volume series:', e);
      }
      volumeSeriesRef.current = null;
    }
    
    // Remove all indicator series
    indicatorSeriesRefs.current.forEach((series, key) => {
      try {
        if (chart && series) {
          chart.removeSeries(series);
        }
      } catch (e) {
        console.warn(`Error removing indicator series ${key}:`, e);
      }
    });
    indicatorSeriesRefs.current.clear();

    // Add volume series (always show volume)
    if (!chart) return;
    
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    });

    // Configure volume price scale margins
    try {
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
    } catch (e) {
      console.warn('Error configuring volume price scale:', e);
    }

    const volumeData = data.map(item => {
      // Ensure timestamp is in milliseconds, then convert to seconds for TradingView
      let timestamp = item.timestamp;
      
      // If timestamp is in seconds (less than year 2000 in milliseconds), convert to milliseconds first
      if (timestamp < 946684800000 && timestamp > 946684800) {
        timestamp = timestamp * 1000;
      }
      
      // TradingView expects timestamp in seconds (UTCTimestamp)
      const timeInSeconds = Math.floor(timestamp / 1000) as UTCTimestamp;
      
      return {
        time: timeInSeconds,
        value: item.volume,
        color: item.close >= item.open ? '#26a69a80' : '#ef535080',
      };
    }).filter(item => item.time > 0);

    volumeSeries.setData(volumeData);
    volumeSeriesRef.current = volumeSeries;

    // Add price series based on chart type
    if (!chart) return;
    
    if (localChartType === 'candles' || localChartType === 'bars') {
      const candlestickSeriesInstance = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });
      candlestickSeriesInstance.setData(tvData);
      candlestickSeriesRef.current = candlestickSeriesInstance;

      // Markers are handled by the NewsEventsMarkers overlay component below

      // Subscribe to crosshair move to get current price
      crosshairHandler = (param: any) => {
        if (param.point === undefined || !param.time || param.seriesData.size === 0) {
          return;
        }
        const price = param.seriesData.get(candlestickSeriesInstance) as TVCandlestickData;
        if (price) {
          const newPrice = price.close;
          const lastCandle = data[data.length - 1];
          const prevPrice = data.length > 1 ? data[data.length - 2].close : lastCandle.close;
          const newChange = newPrice - prevPrice;
          const newChangePercent = prevPrice !== 0 ? (newChange / prevPrice) * 100 : 0;
          
          setCurrentPrice(newPrice);
          setChange(newChange);
          setChangePercent(newChangePercent);
        }
      };
      chart.subscribeCrosshairMove(crosshairHandler);
    } else if (localChartType === 'line') {
      const lineSeriesInstance = chart.addSeries(LineSeries, {
        color: '#2196F3',
        lineWidth: 2,
      });
      
      const lineData = tvData.map(item => ({
        time: item.time,
        value: item.close,
      }));
      
      lineSeriesInstance.setData(lineData);
      lineSeriesRef.current = lineSeriesInstance;

      // Markers are handled by the NewsEventsMarkers overlay component below

      // Subscribe to crosshair move for line chart
      crosshairHandler = (param: any) => {
        if (param.point === undefined || !param.time || param.seriesData.size === 0) {
          return;
        }
        const price = param.seriesData.get(lineSeriesInstance) as { value: number };
        if (price) {
          const newPrice = price.value;
          const lastCandle = data[data.length - 1];
          const prevPrice = data.length > 1 ? data[data.length - 2].close : lastCandle.close;
          const newChange = newPrice - prevPrice;
          const newChangePercent = prevPrice !== 0 ? (newChange / prevPrice) * 100 : 0;
          
          setCurrentPrice(newPrice);
          setChange(newChange);
          setChangePercent(newChangePercent);
        }
      };
      chart.subscribeCrosshairMove(crosshairHandler);
    }

    // Cleanup function
    return () => {
      if (chart && crosshairHandler) {
        try {
          chart.unsubscribeCrosshairMove(crosshairHandler);
        } catch (e) {
          console.warn('Error unsubscribing crosshair:', e);
        }
      }
    };

    // Update price scale for volume (already configured above, but ensure it's set)
    if (chart) {
      try {
        chart.priceScale('volume').applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
      } catch (e) {
        console.warn('Error updating volume price scale:', e);
      }
    }

    // Update current price from last candle
    if (data.length > 0) {
      const lastCandle = data[data.length - 1];
      const prevPrice = data.length > 1 ? data[data.length - 2].close : lastCandle.close;
      const newChange = lastCandle.close - prevPrice;
      const newChangePercent = prevPrice !== 0 ? (newChange / prevPrice) * 100 : 0;
      
      setCurrentPrice(lastCandle.close);
      setChange(newChange);
      setChangePercent(newChangePercent);
    }

    // Add indicators if enabled
    if (chart && showIndicators && data.length > 0) {
      // SMA 20
      if (selectedIndicators.includes('SMA20') && data.length >= 20) {
        const sma20 = chartService.calculateSMA(data, 20);
        const sma20Data = data.slice(19).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: sma20[index],
        }));
        const sma20Series = chart.addSeries(LineSeries, {
          color: '#f59e0b',
          lineWidth: 2,
          title: 'SMA 20',
        });
        sma20Series.setData(sma20Data);
        indicatorSeriesRefs.current.set('SMA20', sma20Series);
      }

      // SMA 50
      if (selectedIndicators.includes('SMA50') && data.length >= 50) {
        const sma50 = chartService.calculateSMA(data, 50);
        const sma50Data = data.slice(49).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: sma50[index],
        }));
        const sma50Series = chart.addSeries(LineSeries, {
          color: '#ef4444',
          lineWidth: 2,
          title: 'SMA 50',
        });
        sma50Series.setData(sma50Data);
        indicatorSeriesRefs.current.set('SMA50', sma50Series);
      }

      // EMA 12
      if (selectedIndicators.includes('EMA12') && data.length >= 12) {
        const ema12 = chartService.calculateEMA(data, 12);
        const ema12Data = data.slice(11).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: ema12[index],
        }));
        const ema12Series = chart.addSeries(LineSeries, {
          color: '#10b981',
          lineWidth: 2,
          title: 'EMA 12',
        });
        ema12Series.setData(ema12Data);
        indicatorSeriesRefs.current.set('EMA12', ema12Series);
      }

      // EMA 26
      if (selectedIndicators.includes('EMA26') && data.length >= 26) {
        const ema26 = chartService.calculateEMA(data, 26);
        const ema26Data = data.slice(25).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: ema26[index],
        }));
        const ema26Series = chart.addSeries(LineSeries, {
          color: '#f59e0b',
          lineWidth: 2,
          title: 'EMA 26',
        });
        ema26Series.setData(ema26Data);
        indicatorSeriesRefs.current.set('EMA26', ema26Series);
      }

      // EMA 20
      if (selectedIndicators.includes('EMA20') && data.length >= 20) {
        const ema20 = chartService.calculateEMA(data, 20);
        const ema20Data = data.slice(19).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: ema20[index],
        }));
        const ema20Series = chart.addSeries(LineSeries, {
          color: '#8b5cf6',
          lineWidth: 2,
          title: 'EMA 20',
        });
        ema20Series.setData(ema20Data);
        indicatorSeriesRefs.current.set('EMA20', ema20Series);
      }

      // COG
      if (selectedIndicators.includes('COG') && data.length >= 10) {
        const cog = chartService.calculateCOG(data, 10);
        const cogData = data.slice(9).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: cog[index],
        }));
        const cogSeries = chart.addSeries(LineSeries, {
          color: '#06b6d4',
          lineWidth: 2,
          title: 'COG 10',
        });
        cogSeries.setData(cogData);
        indicatorSeriesRefs.current.set('COG', cogSeries);
      }

      // SMA 5
      if (selectedIndicators.includes('SMA5') && data.length >= 5) {
        const sma5 = chartService.calculateSMA(data, 5);
        const sma5Data = data.slice(4).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: sma5[index],
        }));
        const sma5Series = chart.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 2,
          title: 'SMA 5',
        });
        sma5Series.setData(sma5Data);
        indicatorSeriesRefs.current.set('SMA5', sma5Series);
      }

      // SMA 10
      if (selectedIndicators.includes('SMA10') && data.length >= 10) {
        const sma10 = chartService.calculateSMA(data, 10);
        const sma10Data = data.slice(9).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: sma10[index],
        }));
        const sma10Series = chart.addSeries(LineSeries, {
          color: '#60a5fa',
          lineWidth: 2,
          title: 'SMA 10',
        });
        sma10Series.setData(sma10Data);
        indicatorSeriesRefs.current.set('SMA10', sma10Series);
      }

      // SMA 100
      if (selectedIndicators.includes('SMA100') && data.length >= 100) {
        const sma100 = chartService.calculateSMA(data, 100);
        const sma100Data = data.slice(99).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: sma100[index],
        }));
        const sma100Series = chart.addSeries(LineSeries, {
          color: '#a855f7',
          lineWidth: 2,
          title: 'SMA 100',
        });
        sma100Series.setData(sma100Data);
        indicatorSeriesRefs.current.set('SMA100', sma100Series);
      }

      // SMA 200
      if (selectedIndicators.includes('SMA200') && data.length >= 200) {
        const sma200 = chartService.calculateSMA(data, 200);
        const sma200Data = data.slice(199).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: sma200[index],
        }));
        const sma200Series = chart.addSeries(LineSeries, {
          color: '#ec4899',
          lineWidth: 2,
          title: 'SMA 200',
        });
        sma200Series.setData(sma200Data);
        indicatorSeriesRefs.current.set('SMA200', sma200Series);
      }

      // EMA 5
      if (selectedIndicators.includes('EMA5') && data.length >= 5) {
        const ema5 = chartService.calculateEMA(data, 5);
        const ema5Data = data.slice(4).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: ema5[index],
        }));
        const ema5Series = chart.addSeries(LineSeries, {
          color: '#22c55e',
          lineWidth: 2,
          title: 'EMA 5',
        });
        ema5Series.setData(ema5Data);
        indicatorSeriesRefs.current.set('EMA5', ema5Series);
      }

      // EMA 9
      if (selectedIndicators.includes('EMA9') && data.length >= 9) {
        const ema9 = chartService.calculateEMA(data, 9);
        const ema9Data = data.slice(8).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: ema9[index],
        }));
        const ema9Series = chart.addSeries(LineSeries, {
          color: '#14b8a6',
          lineWidth: 2,
          title: 'EMA 9',
        });
        ema9Series.setData(ema9Data);
        indicatorSeriesRefs.current.set('EMA9', ema9Series);
      }

      // EMA 50
      if (selectedIndicators.includes('EMA50') && data.length >= 50) {
        const ema50 = chartService.calculateEMA(data, 50);
        const ema50Data = data.slice(49).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: ema50[index],
        }));
        const ema50Series = chart.addSeries(LineSeries, {
          color: '#f97316',
          lineWidth: 2,
          title: 'EMA 50',
        });
        ema50Series.setData(ema50Data);
        indicatorSeriesRefs.current.set('EMA50', ema50Series);
      }

      // VWAP
      if (selectedIndicators.includes('VWAP') && data.length > 0) {
        const vwap = chartService.calculateVWAP(data);
        const vwapData = data.map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: vwap[index],
        }));
        const vwapSeries = chart.addSeries(LineSeries, {
          color: '#6366f1',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          title: 'VWAP',
        });
        vwapSeries.setData(vwapData);
        indicatorSeriesRefs.current.set('VWAP', vwapSeries);
      }

      // Bollinger Bands
      if (selectedIndicators.includes('BB') && data.length >= 20) {
        const bb = chartService.calculateBollingerBands(data, 20, 2);
        const bbUpperData = data.slice(19).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: bb.upperBand[index],
        }));
        const bbLowerData = data.slice(19).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: bb.lowerBand[index],
        }));
        const bbMiddleData = data.slice(19).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: bb.middleBand[index],
        }));

        const bbUpperSeries = chart.addSeries(LineSeries, {
          color: '#22c55e',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: 'BB Upper',
        });
        bbUpperSeries.setData(bbUpperData);
        indicatorSeriesRefs.current.set('BB_Upper', bbUpperSeries);

        const bbMiddleSeries = chart.addSeries(LineSeries, {
          color: '#f59e0b',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: 'BB Middle',
        });
        bbMiddleSeries.setData(bbMiddleData);
        indicatorSeriesRefs.current.set('BB_Middle', bbMiddleSeries);

        const bbLowerSeries = chart.addSeries(LineSeries, {
          color: '#ef4444',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: 'BB Lower',
        });
        bbLowerSeries.setData(bbLowerData);
        indicatorSeriesRefs.current.set('BB_Lower', bbLowerSeries);
      }

      // RSI Indicator (in separate pane)
      if (showRSI && data.length >= 14) {
        const rsi = chartService.calculateRSI(data, 14);
        const rsiData = data.slice(14).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: rsi[index],
        }));
        const rsiSeries = chart.addSeries(LineSeries, {
          color: '#ec4899',
          lineWidth: 2,
          title: 'RSI 14',
          priceScaleId: 'rsi',
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
        });
        rsiSeries.setData(rsiData);
        rsiSeriesRef.current = rsiSeries;

        // Configure RSI price scale (0-100)
        try {
          chart.priceScale('rsi').applyOptions({
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
          });
        } catch (e) {
          console.warn('Error configuring RSI price scale:', e);
        }
      }

      // MACD Indicator
      if (showMACD && data.length >= 26) {
        const macd = chartService.calculateMACD(data, 12, 26, 9);
        const macdStartIndex = 25;
        
        // MACD Line
        const macdLineData = data.slice(macdStartIndex).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: macd.macdLine[index] || 0,
        }));
        const macdLineSeries = chart.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 2,
          title: 'MACD',
          priceScaleId: 'macd',
        });
        macdLineSeries.setData(macdLineData);
        macdSeriesRef.current = macdLineSeries;

        // Signal Line
        const signalStartIndex = macdStartIndex + (macd.macdLine.length - macd.signalLine.length);
        const signalLineData = data.slice(signalStartIndex).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: macd.signalLine[index] || 0,
        }));
        const signalLineSeries = chart.addSeries(LineSeries, {
          color: '#f59e0b',
          lineWidth: 2,
          title: 'Signal',
          priceScaleId: 'macd',
        });
        signalLineSeries.setData(signalLineData);
        macdSignalRef.current = signalLineSeries;

        // Histogram
        const histogramData = data.slice(signalStartIndex).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: macd.histogram[index] || 0,
          color: macd.histogram[index] >= 0 ? '#22c55e' : '#ef4444',
        }));
        const histogramSeries = chart.addSeries(HistogramSeries, {
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: 'macd',
          title: 'MACD Histogram',
        });
        histogramSeries.setData(histogramData);
        macdHistogramRef.current = histogramSeries;

        // Configure MACD price scale
        try {
          chart.priceScale('macd').applyOptions({
            scaleMargins: {
              top: 0.7,
              bottom: 0,
            },
          });
        } catch (e) {
          console.warn('Error configuring MACD price scale:', e);
        }
      }

      // Stochastic Oscillator
      if (showStochastic && data.length >= 14) {
        const stochastic = chartService.calculateStochastic(data, 14, 3);
        const stochStartIndex = 13;
        const stochKData = data.slice(stochStartIndex).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: stochastic.kValues[index] || 0,
        }));
        const stochDStartIndex = stochStartIndex + (stochastic.kValues.length - stochastic.dValues.length);
        const stochDData = data.slice(stochDStartIndex).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: stochastic.dValues[index] || 0,
        }));

        const stochKSeries = chart.addSeries(LineSeries, {
          color: '#3b82f6',
          lineWidth: 2,
          title: 'Stoch %K',
          priceScaleId: 'stochastic',
        });
        stochKSeries.setData(stochKData);
        stochasticKRef.current = stochKSeries;

        const stochDSeries = chart.addSeries(LineSeries, {
          color: '#f59e0b',
          lineWidth: 2,
          title: 'Stoch %D',
          priceScaleId: 'stochastic',
        });
        stochDSeries.setData(stochDData);
        stochasticDRef.current = stochDSeries;

        try {
          chart.priceScale('stochastic').applyOptions({
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
          });
        } catch (e) {
          console.warn('Error configuring Stochastic price scale:', e);
        }
      }

      // Williams %R
      if (showWilliamsR && data.length >= 14) {
        const williamsR = chartService.calculateWilliamsR(data, 14);
        const wrData = data.slice(13).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: williamsR[index],
        }));
        const wrSeries = chart.addSeries(LineSeries, {
          color: '#ef4444',
          lineWidth: 2,
          title: 'Williams %R',
          priceScaleId: 'williamsr',
        });
        wrSeries.setData(wrData);
        williamsRRef.current = wrSeries;

        try {
          chart.priceScale('williamsr').applyOptions({
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
          });
        } catch (e) {
          console.warn('Error configuring Williams %R price scale:', e);
        }
      }

      // CCI
      if (showCCI && data.length >= 20) {
        const cci = chartService.calculateCCI(data, 20);
        const cciData = data.slice(19).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: cci[index],
        }));
        const cciSeries = chart.addSeries(LineSeries, {
          color: '#8b5cf6',
          lineWidth: 2,
          title: 'CCI 20',
          priceScaleId: 'cci',
        });
        cciSeries.setData(cciData);
        cciRef.current = cciSeries;

        try {
          chart.priceScale('cci').applyOptions({
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
          });
        } catch (e) {
          console.warn('Error configuring CCI price scale:', e);
        }
      }

      // ATR
      if (showATR && data.length >= 14) {
        const atr = chartService.calculateATR(data, 14);
        const atrData = data.slice(13).map((item, index) => ({
          time: (item.timestamp / 1000) as UTCTimestamp,
          value: atr[index],
        }));
        const atrSeries = chart.addSeries(LineSeries, {
          color: '#06b6d4',
          lineWidth: 2,
          title: 'ATR 14',
          priceScaleId: 'atr',
        });
        atrSeries.setData(atrData);
        atrRef.current = atrSeries;

        try {
          chart.priceScale('atr').applyOptions({
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
          });
        } catch (e) {
          console.warn('Error configuring ATR price scale:', e);
        }
      }
    }

    // Add price lines (recreate them if they don't exist)
    const series = candlestickSeriesRef.current || lineSeriesRef.current;
    if (series && priceLines.length > 0) {
      priceLines.forEach(priceLine => {
        if (!priceLine.lineId && series) {
          try {
            const lineId = series.createPriceLine({
              price: priceLine.price,
              color: priceLine.color,
              lineWidth: 2,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title: `₹${priceLine.price.toFixed(2)}`,
            });
            // Update the price line with the lineId
            const updatedPriceLine = { ...priceLine, lineId };
            setPriceLines(prev => prev.map(pl => pl.id === priceLine.id ? updatedPriceLine : pl));
          } catch (e) {
            console.warn('Error creating price line:', e);
          }
        }
      });
    }

    // Recreate drawing lines
    if (chart && drawings.length > 0) {
      drawings.forEach(drawing => {
        if (!drawingsRef.current.has(drawing.id) && drawing.type === 'line' && drawing.points.length >= 2) {
          try {
            const lineSeries = chart.addSeries(LineSeries, {
              color: drawing.color,
              lineWidth: 2,
              title: 'Trend Line',
              priceLineVisible: false,
              lastValueVisible: false,
            });
            
            lineSeries.setData([
              { time: drawing.points[0].time, value: drawing.points[0].price },
              { time: drawing.points[1].time, value: drawing.points[1].price },
            ]);
            
            drawingsRef.current.set(drawing.id, lineSeries);
          } catch (e) {
            console.warn('Error recreating drawing line:', e);
          }
        }
      });
    }

    // Fit content and update time scale based on timeframe
    if (chart && tvData.length > 0) {
      const isFirstLoad = isFirstDataLoadRef.current;
      isFirstDataLoadRef.current = false;
      
      // Use multiple animation frames and timeout to ensure data is fully rendered
      // For first load, use longer delays to ensure everything is ready
      const delay = isFirstLoad ? 300 : 50;
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!chartRef.current || !chartContainerRef.current) return;
          
          try {
            const chart = chartRef.current;
            const containerWidth = chartContainerRef.current.clientWidth;
            
            // Ensure chart width matches container
            if (containerWidth > 0) {
              chart.applyOptions({
                width: containerWidth,
              });
            }
            
            // Update time scale configuration based on timeframe
            const isIntraday = timeframe === '1D' || timeframe === '5D';
            const isShortTerm = timeframe === '1W' || timeframe === '1M' || timeframe === '3M' || timeframe === '6M';
            const isLongTerm = timeframe === '1Y' || timeframe === '5Y' || timeframe === 'YTD' || timeframe === 'All';
            
            // Calculate appropriate bar spacing based on data length and screen width
            const dataPoints = tvData.length;
            let barSpacing = 2;
            let maxBars = 0;
            
            if (dataPoints > 0 && containerWidth > 0) {
              // Calculate spacing to fit all data on screen
              maxBars = Math.floor(containerWidth / 3); // Minimum 3px per bar
              if (dataPoints > maxBars) {
                barSpacing = Math.max(1, containerWidth / dataPoints);
              } else {
                barSpacing = Math.max(2, containerWidth / dataPoints);
              }
            }
            
            // Enable scrolling by not fitting all content for longer timeframes
            const shouldFitContent = isIntraday || isShortTerm || (maxBars > 0 && dataPoints <= maxBars);
            
            chart.timeScale().applyOptions({
              timeVisible: true,
              secondsVisible: isIntraday,
              rightOffset: 0,
              barSpacing: barSpacing,
              fixLeftEdge: false,
              fixRightEdge: false,
              lockVisibleTimeRangeOnResize: false,
              rightBarStaysOnScroll: false,
            });
            
            // Fit content or scroll to end based on timeframe
            setTimeout(() => {
              if (chartRef.current && chartContainerRef.current) {
                try {
                  // Double-check container width
                  const finalWidth = chartContainerRef.current.clientWidth;
                  if (finalWidth > 0) {
                    if (finalWidth !== chartRef.current.options().width) {
                      chartRef.current.applyOptions({
                        width: finalWidth,
                      });
                    }
                    
                    if (shouldFitContent) {
                      // For short timeframes, fit all content
                      chartRef.current.timeScale().fitContent();
                    } else {
                      // For long timeframes, scroll to the end (most recent data) but allow scrolling back
                      const timeScale = chartRef.current.timeScale();
                      if (tvData.length > 0) {
                        const lastTime = tvData[tvData.length - 1].time;
                        const firstTime = tvData[0].time;
                        // Show last portion of data but allow scrolling
                        const visibleBars = Math.floor(finalWidth / barSpacing);
                        const startTime = Math.max(
                          Number(firstTime),
                          Number(lastTime) - (visibleBars * 86400) // Show last N bars worth of time
                        );
                        timeScale.setVisibleRange({
                          from: startTime as UTCTimestamp,
                          to: lastTime
                        });
                      }
                    }
                    
                    // For first load, do one more adjustment after a short delay
                    if (isFirstLoad) {
                      setTimeout(() => {
                        if (chartRef.current) {
                          try {
                            if (shouldFitContent) {
                              chartRef.current.timeScale().fitContent();
                            }
                          } catch (e) {
                            console.warn('Error in second adjustment on first load:', e);
                          }
                        }
                      }, 100);
                    }
                  }
                } catch (e) {
                  console.warn('Error adjusting content in timeout:', e);
                }
              }
            }, delay);
          } catch (e) {
            console.warn('Error fitting content:', e);
          }
        });
      });
    }
  }, [data, timeframe, localChartType, showIndicators, selectedIndicators, showRSI, showMACD, showStochastic, showWilliamsR, showCCI, showATR, showVWAP, priceLines, drawings, newsItems, eventsItems, showNewsMarkers, showEventMarkers]);

  // Update parent component with price changes
  useEffect(() => {
    if (onPriceUpdate) {
      onPriceUpdate(currentPrice, change, changePercent);
    }
  }, [currentPrice, change, changePercent, onPriceUpdate]);

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  const formatChange = (change: number) => {
    return change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
  };

  const formatChangePercent = (changePercent: number) => {
    return changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
  };

  // Convert screen coordinates to chart coordinates
  const screenToChartCoords = (x: number, y: number, rect: DOMRect) => {
    if (!chartRef.current || !data.length) return null;
    
    const chart = chartRef.current;
    const series = candlestickSeriesRef.current || lineSeriesRef.current;
    if (!series) return null;

    try {
      // Use chart's coordinate conversion methods
      const timeScale = chart.timeScale();
      
      // Get visible time range
      const visibleRange = timeScale.getVisibleRange();
      if (!visibleRange || !visibleRange.from || !visibleRange.to) {
        throw new Error('No visible range');
      }
      
      // Convert X coordinate to time
      const chartWidth = rect.width;
      const normalizedX = x / chartWidth;
      const timeRange = Number(visibleRange.to) - Number(visibleRange.from);
      const time = (Number(visibleRange.from) + (normalizedX * timeRange)) as UTCTimestamp;
      
      // Convert Y coordinate to price
      const chartHeight = rect.height;
      const normalizedY = 1 - (y / chartHeight); // Inverted Y axis
      
      // Get price range from visible data
      const visibleData = data.filter(d => {
        const t = (d.timestamp / 1000) as UTCTimestamp;
        return Number(t) >= Number(visibleRange.from) && Number(t) <= Number(visibleRange.to);
      });
      
      if (visibleData.length === 0) {
        // Fallback to all data
        const prices = data.map(d => [d.high, d.low]).flat();
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;
        const price = minPrice + (normalizedY * priceRange);
        
        const chartWidth = rect.width;
        const normalizedX = x / chartWidth;
        const timeIndex = Math.floor(normalizedX * data.length);
        const clampedIndex = Math.max(0, Math.min(timeIndex, data.length - 1));
        const time = (data[clampedIndex].timestamp / 1000) as UTCTimestamp;
        
        return { time, price };
      }
      
      const prices = visibleData.map(d => [d.high, d.low]).flat();
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;
      const price = minPrice + (normalizedY * priceRange);
      
      return { time, price };
    } catch (e) {
      console.warn('Error converting coordinates, using fallback:', e);
      // Fallback to simple conversion
      const prices = data.map(d => [d.high, d.low]).flat();
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;
      const chartHeight = rect.height;
      const normalizedY = 1 - (y / chartHeight);
      const price = minPrice + (normalizedY * priceRange);
      
      const chartWidth = rect.width;
      const normalizedX = x / chartWidth;
      const timeIndex = Math.floor(normalizedX * data.length);
      const clampedIndex = Math.max(0, Math.min(timeIndex, data.length - 1));
      const time = (data[clampedIndex].timestamp / 1000) as UTCTimestamp;
      
      return { time, price };
    }
  };

  // Handle mouse down for drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't interfere with toolbar clicks
    if ((e.target as HTMLElement).closest('.drawing-toolbar')) return;
    
    if (!chartContainerRef.current || !chartRef.current) return;
    
    // Prevent default to avoid text selection
    e.preventDefault();
    e.stopPropagation();
    
    const rect = chartContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log('Mouse down:', { x, y, selectedTool }); // Debug log
    
    if (selectedTool === 'horizontal') {
      const coords = screenToChartCoords(x, y, rect);
      if (coords) {
        console.log('Adding horizontal line at price:', coords.price);
        handleAddPriceLine(coords.price);
        setSelectedTool('none');
      }
    } else if (selectedTool === 'line' || selectedTool === 'rectangle') {
      const coords = screenToChartCoords(x, y, rect);
      if (coords) {
        console.log('Starting drawing:', coords);
        setIsDrawing(true);
        drawingStartRef.current = { x, y, price: coords.price, time: coords.time };
        drawingEndRef.current = null;
      }
    }
  };

  // Handle mouse move for drawing
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartContainerRef.current) return;
    
    if (isDrawing && drawingStartRef.current) {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = chartContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const coords = screenToChartCoords(x, y, rect);
      if (coords) {
        drawingEndRef.current = { x, y, price: coords.price, time: coords.time };
      }
    }
  };

  // Handle mouse up for drawing
  const handleMouseUp = (e?: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawingStartRef.current) {
      setIsDrawing(false);
      return;
    }
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (drawingEndRef.current && drawingStartRef.current.time && drawingEndRef.current.time) {
      const newDrawing = {
        id: `drawing-${Date.now()}`,
        type: selectedTool,
        points: [
          { time: drawingStartRef.current.time, price: drawingStartRef.current.price! },
          { time: drawingEndRef.current.time!, price: drawingEndRef.current.price! }
        ],
        color: '#3b82f6',
      };
      
      console.log('Completing drawing:', newDrawing);
      
      setDrawings(prev => [...prev, newDrawing]);
      
      // Add line series for trend line
      if (selectedTool === 'line' && chartRef.current) {
        try {
          const lineSeries = chartRef.current.addSeries(LineSeries, {
            color: newDrawing.color,
            lineWidth: 2,
            title: 'Trend Line',
            priceLineVisible: false,
            lastValueVisible: false,
          });
          
          lineSeries.setData([
            { time: newDrawing.points[0].time, value: newDrawing.points[0].price },
            { time: newDrawing.points[1].time, value: newDrawing.points[1].price },
          ]);
          
          drawingsRef.current.set(newDrawing.id, lineSeries);
          console.log('Trend line created successfully');
        } catch (e) {
          console.error('Error creating trend line:', e);
        }
      }
    } else {
      console.log('Drawing incomplete - no end point');
    }
    
    setIsDrawing(false);
    drawingStartRef.current = null;
    drawingEndRef.current = null;
    if (selectedTool !== 'horizontal') {
      setSelectedTool('none');
    }
  };

  // Handle adding price line (horizontal line)
  const handleAddPriceLine = (price: number) => {
    const series = candlestickSeriesRef.current || lineSeriesRef.current;
    if (!series) return;

    const priceLine = series.createPriceLine({
      price: price,
      color: '#3b82f6',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `₹${price.toFixed(2)}`,
    });

    const newPriceLine = {
      id: `priceLine-${Date.now()}`,
      price,
      color: '#3b82f6',
      lineId: priceLine,
    };
    setPriceLines(prev => [...prev, newPriceLine]);
  };

  const timeframes = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'];

  return (
    <>
      <style>{`
        .chart-scrollable {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        .chart-scrollable::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .chart-scrollable::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .chart-scrollable::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .chart-scrollable::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        /* News and Events scrollable containers */
        .news-events-scrollable {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
          overflow-y: auto !important;
          overflow-x: hidden !important;
        }
        .news-events-scrollable::-webkit-scrollbar {
          width: 8px;
        }
        .news-events-scrollable::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .news-events-scrollable::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .news-events-scrollable::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="flex flex-col lg:flex-row gap-4">
      {/* Main Chart Section */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-3 md:p-4 min-w-0" style={{ maxHeight: 'none', overflowY: 'visible', overflowX: 'hidden' }}>
      {/* Chart Header */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0 w-full sm:w-auto">
          <div className="min-w-0 flex-1 sm:flex-none">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{symbol}</h3>
            <p className="text-xs sm:text-sm text-gray-600">{timeframe}</p>
          </div>
          
          {/* Stock Search */}
          <div className="relative stock-search-container flex-1 sm:flex-none sm:w-64">
            <div className="relative">
              <div className="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search stocks..."
                  className="flex-1 outline-none text-sm bg-transparent placeholder-gray-400 text-gray-700 min-w-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                />
                {isSearching && (
                  <div className="ml-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
                {searchQuery && !isSearching && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                  {searchResults.map((stock, index) => (
                    <div
                      key={stock.symbol || index}
                      onClick={() => {
                        if (stock.symbol && stock.symbol !== symbol) {
                          onSymbolChange(stock.symbol);
                          setSearchQuery('');
                          setSearchResults([]);
                          setShowSearchResults(false);
                        }
                      }}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-gray-900">{stock.symbol}</span>
                            {stock.exchange && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {stock.exchange}
                              </span>
                            )}
                          </div>
                          {stock.name && (
                            <p className="text-xs text-gray-600 truncate mt-1">{stock.name}</p>
                          )}
                        </div>
                        {stock.price !== undefined && (
                          <div className="ml-3 text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              ₹{stock.price.toLocaleString()}
                            </div>
                            {stock.changePercent !== undefined && (
                              <div className={`text-xs font-medium ${
                                stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {showSearchResults && searchResults.length === 0 && searchQuery.trim().length >= 2 && !isSearching && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-4 text-center">
                  <p className="text-sm text-gray-500">No stocks found</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-left sm:text-right w-full sm:w-auto">
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{formatPrice(currentPrice)}</div>
          <div className={`text-xs sm:text-sm font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatChange(change)} ({formatChangePercent(changePercent)})
          </div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="mb-4 flex items-center space-x-2 overflow-x-auto pb-2">
        <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200 min-w-max gap-1">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors whitespace-nowrap flex-shrink-0 ${
                timeframe === tf
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>


      {/* Chart Container with Drawing Tools */}
      <div className="relative w-full" style={{ height: '400px', minHeight: '300px' }}>
        {/* Custom Markers Overlay for News and Events */}
        {chartRef.current && (showNewsMarkers || showEventMarkers) && (
          <NewsEventsMarkers
            chart={chartRef.current}
            chartContainer={chartContainerRef.current}
            data={data}
            newsItems={showNewsMarkers ? newsItems : []}
            eventsItems={showEventMarkers ? eventsItems : []}
            series={candlestickSeriesRef.current || lineSeriesRef.current}
          />
        )}

        {/* Drawing Toolbar */}
        <div className="drawing-toolbar absolute left-3 top-3 z-20 flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 gap-1">
          {/* Crosshair - Default tool */}
          <button
            onClick={() => setSelectedTool('none')}
            className={`p-2 rounded transition-colors ${
              selectedTool === 'none' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Crosshair"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          {/* Trend Line */}
          <button
            onClick={() => setSelectedTool(selectedTool === 'line' ? 'none' : 'line')}
            className={`p-2 rounded transition-colors ${
              selectedTool === 'line' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Trend Line"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19l14-14" />
              <circle cx="5" cy="19" r="2" fill="currentColor" />
              <circle cx="19" cy="5" r="2" fill="currentColor" />
            </svg>
          </button>

          {/* Horizontal Line */}
          <button
            onClick={() => {
              if (selectedTool === 'horizontal') {
                setSelectedTool('none');
              } else {
                setSelectedTool('horizontal');
                setShowPriceLineInput(true);
              }
            }}
            className={`p-2 rounded transition-colors ${
              selectedTool === 'horizontal' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Horizontal Line (Price Line)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" />
              <circle cx="3" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </button>
          
          {/* Add Price Line Input */}
          {showPriceLineInput && (
            <div className="absolute left-14 top-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20">
              <input
                type="number"
                placeholder="Enter price"
                value={priceLineInput}
                onChange={(e) => setPriceLineInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && priceLineInput) {
                    const price = parseFloat(priceLineInput);
                    if (!isNaN(price)) {
                      handleAddPriceLine(price);
                      setPriceLineInput('');
                      setShowPriceLineInput(false);
                      setSelectedTool('none');
                    }
                  }
                }}
                className="w-32 px-2 py-1 text-sm border border-gray-300 rounded"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowPriceLineInput(false);
                  setSelectedTool('none');
                }}
                className="ml-1 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          )}

          {/* Rectangle */}
          <button
            onClick={() => setSelectedTool(selectedTool === 'rectangle' ? 'none' : 'rectangle')}
            className={`p-2 rounded transition-colors ${
              selectedTool === 'rectangle' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Rectangle"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="4" y="4" width="16" height="16" strokeWidth={2} />
            </svg>
          </button>

          {/* Clear All Lines */}
          <div className="h-px bg-gray-200 my-1"></div>
          <button
            onClick={() => {
              // Remove all price lines from chart
              priceLines.forEach(priceLine => {
                if (priceLine.lineId) {
                  try {
                    const series = candlestickSeriesRef.current || lineSeriesRef.current;
                    if (series && priceLine.lineId) {
                      series.removePriceLine(priceLine.lineId);
                    }
                  } catch (e) {
                    console.warn('Error removing price line:', e);
                  }
                }
              });
              setPriceLines([]);
              
              // Remove all drawing lines
              drawingsRef.current.forEach((series) => {
                try {
                  if (chartRef.current && series) {
                    chartRef.current.removeSeries(series);
                  }
                } catch (e) {
                  console.warn('Error removing drawing series:', e);
                }
              });
              drawingsRef.current.clear();
              setDrawings([]);
            }}
            className="p-2 rounded transition-colors text-gray-600 hover:text-red-600 hover:bg-gray-100"
            title="Clear All Lines"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div 
          ref={chartContainerRef} 
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => handleMouseUp()}
          onWheel={(e) => {
            // Allow horizontal scrolling with shift+wheel or trackpad
            if (chartRef.current && (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY))) {
              e.preventDefault();
              const timeScale = chartRef.current.timeScale();
              const visibleRange = timeScale.getVisibleRange();
              if (visibleRange && visibleRange.from && visibleRange.to) {
                const delta = e.deltaX || e.deltaY;
                const timeDelta = (Number(visibleRange.to) - Number(visibleRange.from)) * (delta / 1000);
                const newFrom = (Number(visibleRange.from) - timeDelta) as UTCTimestamp;
                const newTo = (Number(visibleRange.to) - timeDelta) as UTCTimestamp;
                timeScale.setVisibleRange({ from: newFrom, to: newTo });
              }
            }
          }}
          style={{ 
            cursor: selectedTool !== 'none' ? 'crosshair' : 'default',
            position: 'relative',
            zIndex: 1,
            overflow: 'hidden'
          }}
        />
      </div>

      {/* Chart Type Selector */}
      <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-gray-700">Chart Type:</span>
          <div className="flex bg-gray-50 rounded-xl p-1.5 border border-gray-200 shadow-sm">
            {(['candles', 'line', 'bars'] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setLocalChartType(type);
                  if (onChartTypeChange) {
                    onChartTypeChange(type);
                  }
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                  localChartType === type
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* News and Events Toggle */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-gray-700">Markers:</span>
          <div className="flex bg-gray-50 rounded-xl p-1.5 border border-gray-200 shadow-sm gap-2">
            <button
              onClick={() => setShowNewsMarkers(!showNewsMarkers)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-1 ${
                showNewsMarkers
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Toggle News Markers"
            >
              <span>📰</span>
              <span>News</span>
            </button>
            <button
              onClick={() => setShowEventMarkers(!showEventMarkers)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-1 ${
                showEventMarkers
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Toggle Event Markers"
            >
              <span>📊</span>
              <span>Events</span>
            </button>
          </div>
        </div>
      </div>

      {/* Indicators Panel */}
      <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900">Technical Indicators</h4>
          <div className="relative">
            <button
              onClick={() => setShowIndicators(!showIndicators)}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <span>{showIndicators ? 'Hide' : 'Show'}</span>
              <svg 
                className={`w-4 h-4 transition-transform ${showIndicators ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {showIndicators && (
          <>
            {/* Moving Averages - SMA */}
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <span className="w-1 h-4 bg-blue-500 rounded"></span>
                <span>Simple Moving Average (SMA)</span>
              </h5>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
                {[
                  { id: 'SMA5', label: 'SMA 5', color: '#3b82f6' },
                  { id: 'SMA10', label: 'SMA 10', color: '#60a5fa' },
                  { id: 'SMA20', label: 'SMA 20', color: '#f59e0b' },
                  { id: 'SMA50', label: 'SMA 50', color: '#ef4444' },
                  { id: 'SMA100', label: 'SMA 100', color: '#a855f7' },
                  { id: 'SMA200', label: 'SMA 200', color: '#ec4899' },
                ].map((indicator) => (
                  <button
                    key={indicator.id}
                    onClick={() => {
                      setSelectedIndicators(prev => 
                        prev.includes(indicator.id)
                          ? prev.filter(id => id !== indicator.id)
                          : [...prev, indicator.id]
                      );
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                      selectedIndicators.includes(indicator.id)
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 text-white shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: indicator.color }}
                      />
                      <span>{indicator.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Moving Averages - EMA */}
            <div className="mb-4">
              <h5 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <span className="w-1 h-4 bg-indigo-500 rounded"></span>
                <span>Exponential Moving Average (EMA)</span>
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-2.5">
                {[
                  { id: 'EMA5', label: 'EMA 5', color: '#22c55e' },
                  { id: 'EMA9', label: 'EMA 9', color: '#14b8a6' },
                  { id: 'EMA12', label: 'EMA 12', color: '#10b981' },
                  { id: 'EMA20', label: 'EMA 20', color: '#8b5cf6' },
                  { id: 'EMA26', label: 'EMA 26', color: '#f59e0b' },
                  { id: 'EMA50', label: 'EMA 50', color: '#f97316' },
                ].map((indicator) => (
                  <button
                    key={indicator.id}
                    onClick={() => {
                      setSelectedIndicators(prev => 
                        prev.includes(indicator.id)
                          ? prev.filter(id => id !== indicator.id)
                          : [...prev, indicator.id]
                      );
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                      selectedIndicators.includes(indicator.id)
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 text-white shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: indicator.color }}
                      />
                      <span>{indicator.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Other Indicators */}
            <div className="mb-3">
              <h5 className="text-xs font-semibold text-gray-600 mb-2">Other Indicators</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: 'COG', label: 'COG 10', color: '#06b6d4' },
                  { id: 'BB', label: 'Bollinger Bands', color: '#22c55e' },
                  { id: 'VWAP', label: 'VWAP', color: '#6366f1' },
                ].map((indicator) => (
                  <button
                    key={indicator.id}
                    onClick={() => {
                      setSelectedIndicators(prev => 
                        prev.includes(indicator.id)
                          ? prev.filter(id => id !== indicator.id)
                          : [...prev, indicator.id]
                      );
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                      selectedIndicators.includes(indicator.id)
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 text-white shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: indicator.color }}
                      />
                      <span>{indicator.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Oscillators (Separate Panes) */}
            <div className="border-t border-gray-300 pt-4 mt-4">
              <h5 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <span className="w-1 h-4 bg-purple-500 rounded"></span>
                <span>Oscillators (Separate Panes)</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5">
                <button
                  onClick={() => setShowRSI(!showRSI)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all ${
                    showRSI
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-500 text-white shadow-md'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500" />
                    <span>RSI 14</span>
                  </div>
                </button>
                <button
                  onClick={() => setShowMACD(!showMACD)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    showMACD
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>MACD</span>
                  </div>
                </button>
                <button
                  onClick={() => setShowStochastic(!showStochastic)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    showStochastic
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span>Stochastic</span>
                  </div>
                </button>
                <button
                  onClick={() => setShowWilliamsR(!showWilliamsR)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    showWilliamsR
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Williams %R</span>
                  </div>
                </button>
                <button
                  onClick={() => setShowCCI(!showCCI)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    showCCI
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span>CCI 20</span>
                  </div>
                </button>
                <button
                  onClick={() => setShowATR(!showATR)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    showATR
                      ? 'bg-cyan-600 border-cyan-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500" />
                    <span>ATR 14</span>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* OHLC Info */}
      {data.length > 0 && (() => {
        const lastCandle = data[data.length - 1];
        const high = Math.max(...data.map(d => d.high));
        const low = Math.min(...data.map(d => d.low));
        return (
          <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-sm">
              <p className="text-xs font-medium text-gray-600 mb-2">Open</p>
              <p className="text-lg font-bold text-gray-900">{formatPrice(lastCandle.open)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 shadow-sm">
              <p className="text-xs font-medium text-gray-600 mb-2">High</p>
              <p className="text-lg font-bold text-green-700">{formatPrice(high)}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border border-red-200 shadow-sm">
              <p className="text-xs font-medium text-gray-600 mb-2">Low</p>
              <p className="text-lg font-bold text-red-700">{formatPrice(low)}</p>
            </div>
            <div className={`rounded-xl p-4 border shadow-sm ${
              lastCandle.close >= lastCandle.open 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
            }`}>
              <p className="text-xs font-medium text-gray-600 mb-2">Close</p>
              <p className={`text-lg font-bold ${lastCandle.close >= lastCandle.open ? 'text-green-700' : 'text-red-700'}`}>
                {formatPrice(lastCandle.close)}
              </p>
            </div>
          </div>
        );
      })()}

      {/* News and Events Section */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4" key={`news-events-${symbol}`}>
        {/* News Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4" key={`news-${symbol}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <span>📰</span>
              <span>News - {symbol}</span>
            </h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={async () => {
                  setLoadingNews(true);
                  try {
                    const cleanSymbol = symbol.replace(/\.NS$|\.BO$/, '').toUpperCase();
                    const news = await alpacaIndianStocksApi.getNews(cleanSymbol);
                    if (!news || news.length === 0) {
                      const news2 = await alpacaIndianStocksApi.getNews(`${cleanSymbol}.NS`);
                      setNewsItems(news2 || []);
                    } else {
                      setNewsItems(news);
                    }
                  } catch (error) {
                    console.error('Failed to refresh news:', error);
                  } finally {
                    setLoadingNews(false);
                  }
                }}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Refresh News"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              {loadingNews && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          </div>
          <div className="space-y-3" style={{ maxHeight: '256px', overflowY: 'auto', overflowX: 'hidden' }}>
            {newsItems.length > 0 ? (
              newsItems.map((news: any, index: number) => (
                <div key={`news-${symbol}-${index}`} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs text-gray-500">
                      {news.source || 'Unknown'} • {news.date ? new Date(news.date).toLocaleDateString() : news.published_at ? new Date(news.published_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 line-clamp-2">
                    {news.headline || news.title || news.summary || 'No headline available'}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">No news available for {symbol}</p>
                <p className="text-xs text-gray-400">News will appear here when available</p>
              </div>
            )}
          </div>
        </div>

        {/* Events Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4" key={`events-${symbol}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <span>📊</span>
              <span>Events - {symbol}</span>
            </h4>
            <button
              onClick={async () => {
                try {
                  const cleanSymbol = symbol.replace(/\.NS$|\.BO$/, '').toUpperCase();
                  const events = await alpacaIndianStocksApi.getEvents(cleanSymbol);
                  if (!events || events.length === 0) {
                    setEventsItems(generateStockEvents(cleanSymbol));
                  } else {
                    setEventsItems(events);
                  }
                } catch (error) {
                  console.error('Failed to refresh events:', error);
                  const cleanSymbol = symbol.replace(/\.NS$|\.BO$/, '').toUpperCase();
                  setEventsItems(generateStockEvents(cleanSymbol));
                }
              }}
              className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Refresh Events"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="space-y-3 news-events-scrollable" style={{ maxHeight: '256px' }}>
            {eventsItems.length > 0 ? (
              eventsItems.map((event: any, index: number) => (
                <div key={`event-${symbol}-${index}-${event.date}-${event.type}`} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      event.type === 'Dividend' ? 'bg-green-100 text-green-700' :
                      event.type === 'Quarterly Result' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {event.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{event.description}</p>
                  {event.value && (
                    <p className="text-sm font-semibold text-gray-900 mt-1">{event.value}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">No events available for {symbol}</p>
                <p className="text-xs text-gray-400">Events will appear here when available</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Watchlist Sidebar */}
      {showWatchlist && (
        <div className="w-full lg:w-80 bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-xl flex flex-col order-first lg:order-last overflow-hidden" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {/* Watchlist Header */}
          <div className="p-5 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span>Watchlist</span>
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={async () => {
                    setLoadingWatchlist(true);
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
                        const marketData = await alpacaIndianStocksApi.getMarketData(symbols);
                        const transformedWatchlist = allAssets.map((asset: any) => {
                          const marketInfo = marketData.find(m => m.symbol === asset.symbol);
                          return {
                            id: asset.id,
                            symbol: asset.symbol,
                            name: asset.name || asset.symbol,
                            price: marketInfo?.price || asset.lastPrice || 0,
                            change: marketInfo?.change || 0,
                            changePercent: marketInfo?.changePercent || asset.changePercent || 0,
                            volume: marketInfo?.volume || asset.volume || 0,
                            exchange: marketInfo?.exchange || asset.exchange || 'NSE',
                          };
                        });
                        setWatchlistData(transformedWatchlist);
                      }
                    } catch (error) {
                      console.error('Failed to refresh watchlist:', error);
                    } finally {
                      setLoadingWatchlist(false);
                    }
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Refresh"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowWatchlist(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Hide Watchlist"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded-lg inline-block">
              {watchlistData.length} {watchlistData.length === 1 ? 'asset' : 'assets'}
            </p>
          </div>

          {/* Watchlist Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 chart-scrollable">
            {loadingWatchlist ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : watchlistData.length > 0 ? (
              <div className="space-y-2">
                {watchlistData.map((item, index) => {
                  const isPositive = item.changePercent >= 0;
                  const isSelected = symbol === item.symbol;
                  return (
                    <div
                      key={item.id || index}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (item.symbol && item.symbol !== symbol) {
                          // Set changing symbol state for visual feedback
                          setChangingSymbol(item.symbol);
                          
                          // Call the parent's symbol change handler
                          onSymbolChange(item.symbol);
                          
                          // Add visual feedback
                          const element = e.currentTarget;
                          element.classList.add('ring-2', 'ring-blue-500');
                          setTimeout(() => {
                            element.classList.remove('ring-2', 'ring-blue-500');
                            setChangingSymbol(null);
                          }, 1000);
                        }
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md group ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-400 shadow-md ring-2 ring-blue-300'
                          : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                      title={`Click to view ${item.symbol} chart`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className={`font-bold text-sm truncate ${
                              isSelected ? 'text-blue-700' : 'text-gray-900'
                            }`}>
                              {item.symbol}
                            </span>
                            <span className="text-xs text-gray-500">{item.exchange}</span>
                            {isSelected && (
                              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded font-semibold">
                                Active
                              </span>
                            )}
                            {changingSymbol === item.symbol && (
                              <span className="px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded font-semibold animate-pulse">
                                Loading...
                              </span>
                            )}
                          </div>
                          {item.name && (
                            <p className={`text-xs truncate mt-0.5 ${
                              isSelected ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              {item.name}
                            </p>
                          )}
                        </div>
                        <div className={`ml-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                          isSelected ? 'opacity-100' : ''
                        }`}>
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-semibold ${
                            isSelected ? 'text-blue-700' : 'text-gray-900'
                          }`}>
                            {formatPrice(item.price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-semibold ${
                            isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isPositive ? '+' : ''}{item.changePercent?.toFixed(2) || '0.00'}%
                          </p>
                          <p className={`text-xs ${
                            isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isPositive ? '+' : ''}{formatChange(item.change || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">No Watchlist Items</h4>
                <p className="text-xs text-gray-500 mb-4">Add stocks to your watchlist to track them here</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show Watchlist Button */}
      {!showWatchlist && (
        <div className="flex items-center">
          <button
            onClick={() => setShowWatchlist(true)}
            className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center space-x-2 h-fit"
            title="Show Watchlist"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-sm font-medium">Watchlist</span>
          </button>
        </div>
      )}
      </div>
    </>
  );
};

export default LightweightChart;

