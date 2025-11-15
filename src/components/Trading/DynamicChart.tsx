import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChartBarIcon,
  Cog6ToothIcon,
  PencilIcon,
  PlusIcon,
  BoltIcon,
  ArrowPathIcon,
  ShareIcon,
  MinusIcon,
  Square2StackIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  XMarkIcon,
  WifiIcon,
  SignalSlashIcon
} from '@heroicons/react/24/outline';
import { CandlestickData } from '../../services/chartService';
import { realTimeDataService, RealTimePrice, LiveCandlestick } from '../../services/realTimeDataService';

interface DynamicChartProps {
  symbol: string;
  data: CandlestickData[];
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  onSymbolChange: (symbol: string) => void;
  chartType?: 'candles' | 'line' | 'bars';
  onPriceUpdate?: (price: number, change: number, changePercent: number) => void;
}

const DynamicChart: React.FC<DynamicChartProps> = ({
  symbol,
  data,
  timeframe,
  onTimeframeChange,
  onSymbolChange,
  chartType = 'candles',
  onPriceUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [hoveredCandle, setHoveredCandle] = useState<CandlestickData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showIndicators, setShowIndicators] = useState(true);
  const [selectedIndicator, setSelectedIndicator] = useState('COG');
  const [isConnected, setIsConnected] = useState(false);
  const [livePrice, setLivePrice] = useState<RealTimePrice | null>(null);
  const [chartData, setChartData] = useState<CandlestickData[]>(data);
  const [animationData, setAnimationData] = useState<CandlestickData[]>(data);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // Scrolling and zooming states
  const [visibleCandleCount, setVisibleCandleCount] = useState(50); // Number of candles to show
  const [scrollOffset, setScrollOffset] = useState(0); // Offset from the end of data
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, offset: 0 });

  const timeframes = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'];
  const indicators = ['COG', 'RSI', 'MACD', 'SMA', 'EMA', 'BB'];

  // Initialize real-time data service
  useEffect(() => {
    const initializeRealTime = async () => {
      try {
        await realTimeDataService.connect();
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect to real-time service:', error);
        setIsConnected(false);
      }
    };

    initializeRealTime();
  }, []);

  // Handle symbol changes
  useEffect(() => {
    if (isConnected) {
      // Subscribe to new symbol
      realTimeDataService.subscribeToSymbol(symbol);
      
      // Start mock data stream for testing
      const stopMockStream = realTimeDataService.startMockDataStream(symbol, 2000);
      
      return () => {
        stopMockStream();
        realTimeDataService.unsubscribeFromSymbol(symbol);
      };
    }
  }, [symbol, isConnected]);

  // Set up callbacks (only once)
  useEffect(() => {
    realTimeDataService.onPriceUpdate((priceData: RealTimePrice) => {
      if (priceData.symbol === symbol.toUpperCase()) {
        setLivePrice(priceData);
      }
    });
    
    realTimeDataService.onCandlestickUpdate((candlestickData: LiveCandlestick) => {
      if (candlestickData.symbol === symbol.toUpperCase()) {
        // Update chart data with new candlestick
        setChartData(prev => {
          const newData = [...prev];
          const lastIndex = newData.length - 1;
          
          if (lastIndex >= 0) {
            // Update the last candlestick or add new one
            if (candlestickData.isComplete) {
              newData[lastIndex] = {
                timestamp: candlestickData.timestamp,
                open: candlestickData.open,
                high: candlestickData.high,
                low: candlestickData.low,
                close: candlestickData.close,
                volume: candlestickData.volume
              };
            } else {
              // Update current candlestick
              newData[lastIndex] = {
                ...newData[lastIndex],
                high: Math.max(newData[lastIndex].high, candlestickData.high),
                low: Math.min(newData[lastIndex].low, candlestickData.low),
                close: candlestickData.close,
                volume: newData[lastIndex].volume + candlestickData.volume
              };
            }
          }
          
          return newData;
        });
      }
    });
  }, [symbol]);

  // Update chart data when props change
  useEffect(() => {
    setChartData(data);
    setAnimationData(data);
    // Reset scroll to show latest data
    setScrollOffset(0);
  }, [data]);

  // Calculate visible data range
  const getVisibleData = () => {
    const endIndex = chartData.length - scrollOffset;
    const startIndex = Math.max(0, endIndex - visibleCandleCount);
    return chartData.slice(startIndex, endIndex);
  };

  const visibleData = getVisibleData();
  const visibleAnimationData = animationData.slice(
    Math.max(0, animationData.length - scrollOffset - visibleCandleCount),
    animationData.length - scrollOffset
  );

  // Calculate price range based on visible data
  const prices = visibleData.flatMap(d => [d.high, d.low]);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 100;
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;

  // Calculate COG indicator
  const calculateCOG = (data: CandlestickData[], period: number = 10) => {
    const cog: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      let weightSum = 0;
      for (let j = 0; j < period; j++) {
        const weight = period - j;
        sum += data[i - j].close * weight;
        weightSum += weight;
      }
      cog.push(sum / weightSum);
    }
    return cog;
  };

  const cogData = calculateCOG(visibleData);

  // Animate price changes
  const animatePriceChange = useCallback((newData: CandlestickData[]) => {
    const startTime = Date.now();
    const duration = 1000; // 1 second animation
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      setAnimationData(prev => {
        return prev.map((candle, index) => {
          const newCandle = newData[index];
          if (!newCandle) return candle;
          
          return {
            ...candle,
            open: candle.open + (newCandle.open - candle.open) * easeOutCubic,
            high: candle.high + (newCandle.high - candle.high) * easeOutCubic,
            low: candle.low + (newCandle.low - candle.low) * easeOutCubic,
            close: candle.close + (newCandle.close - candle.close) * easeOutCubic,
            volume: candle.volume + (newCandle.volume - candle.volume) * easeOutCubic
          };
        });
      });
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, []);

  // Draw candlestick chart with animations
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const rightPadding = 80; // Space for price labels
    const chartWidth = width - rightPadding;
    const candleSpacing = chartWidth / visibleAnimationData.length;
    // Reduce candle width to 60% of spacing for better visual separation
    const candleWidth = Math.max(2, Math.min(8, candleSpacing * 0.6));

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    // Price labels on right side (Y-axis)
    const priceLabelCount = 10;
    const priceStep = priceRange / (priceLabelCount - 1);
    const calculatedMaxPrice = minPrice + priceRange;

    // Horizontal grid lines with price labels
    for (let i = 0; i < priceLabelCount; i++) {
      const price = calculatedMaxPrice - (priceStep * i);
      const y = (i * height) / (priceLabelCount - 1);

      // Draw subtle grid line
      ctx.strokeStyle = i % 2 === 0 ? '#2d3748' : '#1e293b';
      ctx.lineWidth = i % 2 === 0 ? 1 : 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Draw price label on right side with background
      const priceText = `₹${price.toFixed(2)}`;
      ctx.font = 'bold 11px Inter, system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      const textHeight = 16;

      // Background for label
      ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
      ctx.fillRect(chartWidth + 8, y - textHeight / 2, rightPadding - 16, textHeight);

      // Price text
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(priceText, chartWidth + 12, y);
    }

    // Vertical grid lines (fewer for cleaner look)
    const verticalGridCount = 8;
    for (let i = 0; i <= verticalGridCount; i++) {
      const x = (chartWidth * i) / verticalGridCount;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw series depending on chart type
    if (chartType === 'line') {
      // Line chart through close prices with gradient fill
      const lineGradient = ctx.createLinearGradient(0, 0, 0, height);
      lineGradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
      lineGradient.addColorStop(1, 'rgba(34, 197, 94, 0.0)');

      ctx.beginPath();
      ctx.moveTo(0, height);
      visibleAnimationData.forEach((candle, index) => {
        const x = index * candleSpacing + candleSpacing / 2;
        const y = height - ((candle.close - minPrice + padding) / (priceRange + 2 * padding)) * height;
        if (index === 0) {
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.lineTo(chartWidth, height);
      ctx.fillStyle = lineGradient;
      ctx.fill();

      // Draw line on top
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      visibleAnimationData.forEach((candle, index) => {
        const x = index * candleSpacing + candleSpacing / 2;
        const y = height - ((candle.close - minPrice + padding) / (priceRange + 2 * padding)) * height;
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    } else if (chartType === 'bars') {
      // OHLC bars with improved styling
      visibleAnimationData.forEach((candle, index) => {
        const x = index * candleSpacing + candleSpacing / 2;
        const isGreen = candle.close >= candle.open;
        ctx.strokeStyle = isGreen ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 1.5;
        const yHigh = height - ((candle.high - minPrice + padding) / (priceRange + 2 * padding)) * height;
        const yLow = height - ((candle.low - minPrice + padding) / (priceRange + 2 * padding)) * height;
        const yOpen = height - ((candle.open - minPrice + padding) / (priceRange + 2 * padding)) * height;
        const yClose = height - ((candle.close - minPrice + padding) / (priceRange + 2 * padding)) * height;
        ctx.beginPath();
        ctx.moveTo(x, yHigh); ctx.lineTo(x, yLow);
        ctx.moveTo(x - candleWidth / 1.5, yOpen); ctx.lineTo(x, yOpen);
        ctx.moveTo(x, yClose); ctx.lineTo(x + candleWidth / 1.5, yClose);
        ctx.stroke();
      });
    } else {
      // Candlesticks (default) with professional styling
      visibleAnimationData.forEach((candle, index) => {
        const x = index * candleSpacing + candleSpacing / 2;
        const isGreen = candle.close >= candle.open;

        // Draw wick with better visibility
        ctx.strokeStyle = isGreen ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, height - ((candle.high - minPrice + padding) / (priceRange + 2 * padding)) * height);
        ctx.lineTo(x, height - ((candle.low - minPrice + padding) / (priceRange + 2 * padding)) * height);
        ctx.stroke();

        // Draw body with rounded corners effect
        const bodyTop = height - ((Math.max(candle.open, candle.close) - minPrice + padding) / (priceRange + 2 * padding)) * height;
        const bodyBottom = height - ((Math.min(candle.open, candle.close) - minPrice + padding) / (priceRange + 2 * padding)) * height;
        const bodyHeight = bodyBottom - bodyTop;

        if (bodyHeight > 1) {
          // Add shadow for depth
          ctx.shadowColor = isGreen ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 2;

          ctx.fillStyle = isGreen ? '#22c55e' : '#ef4444';
          ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;

          // Add border for definition
          ctx.strokeStyle = isGreen ? '#16a34a' : '#dc2626';
          ctx.lineWidth = 1;
          ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
        } else {
          // Doji - draw prominent line
          ctx.strokeStyle = isGreen ? '#22c55e' : '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x - candleWidth / 2, bodyTop);
          ctx.lineTo(x + candleWidth / 2, bodyTop);
          ctx.stroke();
        }
      });
    }

    // Draw COG indicator with smooth curve
    if (showIndicators && selectedIndicator === 'COG' && cogData.length > 0) {
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(96, 165, 250, 0.5)';
      ctx.shadowBlur = 6;
      ctx.beginPath();

      cogData.forEach((value, index) => {
        const x = (index + 9) * candleSpacing + candleSpacing / 2;
        const y = height - ((value - minPrice + padding) / (priceRange + 2 * padding)) * height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    // Draw current price line with live updates
    const currentPrice = livePrice?.price || (chartData.length > 0 ? chartData[chartData.length - 1].close : 0);
    const y = height - ((currentPrice - minPrice + padding) / (priceRange + 2 * padding)) * height;

    // Animated dashed line
    const pulseIntensity = Math.sin(Date.now() / 500) * 0.2 + 0.8;
    ctx.strokeStyle = `rgba(34, 197, 94, ${pulseIntensity})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(chartWidth, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw current price label on right side with enhanced visibility
    const priceText = `₹${currentPrice.toFixed(2)}`;
    ctx.font = 'bold 13px Inter, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const textWidth = ctx.measureText(priceText).width;

    // Animated background for price label
    const bgPulse = Math.sin(Date.now() / 500) * 0.15 + 0.85;
    ctx.fillStyle = `rgba(34, 197, 94, ${bgPulse * 0.9})`;
    ctx.shadowColor = 'rgba(34, 197, 94, 0.6)';
    ctx.shadowBlur = 10;
    const labelHeight = 24;
    const labelPadding = 8;
    ctx.fillRect(
      chartWidth + 8,
      y - labelHeight / 2,
      textWidth + labelPadding * 2,
      labelHeight
    );
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Border for price label
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      chartWidth + 8,
      y - labelHeight / 2,
      textWidth + labelPadding * 2,
      labelHeight
    );

    // Price text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(priceText, chartWidth + 8 + labelPadding, y);

    // Draw hovered candle info with enhanced crosshair
    if (hoveredCandle) {
      const index = visibleData.indexOf(hoveredCandle);
      const x = index * candleSpacing + candleSpacing / 2;

      // Vertical crosshair line
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Add glowing dot at intersection
      const candleY = height - ((hoveredCandle.close - minPrice + padding) / (priceRange + 2 * padding)) * height;
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = 'rgba(251, 191, 36, 0.8)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x, candleY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

  }, [visibleData, visibleAnimationData, dimensions, minPrice, maxPrice, priceRange, padding, hoveredCandle, showIndicators, selectedIndicator, cogData, livePrice, chartType]);

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, offset: scrollOffset });
  }, [scrollOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });

    // Handle dragging
    if (isDragging) {
      const deltaX = dragStart.x - e.clientX;
      const rightPadding = 80;
      const chartWidth = dimensions.width - rightPadding;
      const candleWidth = chartWidth / visibleCandleCount;
      const candlesMoved = Math.round(deltaX / candleWidth);

      const newOffset = Math.max(0, Math.min(chartData.length - visibleCandleCount, dragStart.offset + candlesMoved));
      setScrollOffset(newOffset);
    } else {
      // Find hovered candle
      const rightPadding = 80;
      const chartWidth = dimensions.width - rightPadding;
      const candleSpacing = chartWidth / visibleData.length;
      const candleIndex = Math.floor(x / candleSpacing);

      if (candleIndex >= 0 && candleIndex < visibleData.length) {
        setHoveredCandle(visibleData[candleIndex]);
      } else {
        setHoveredCandle(null);
      }
    }
  }, [isDragging, dragStart, scrollOffset, visibleCandleCount, chartData.length, dimensions.width, visibleData]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredCandle(null);
    setIsDragging(false);
  }, []);

  // Handle mouse wheel for zooming
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 5 : -5;
    setVisibleCandleCount(prev => Math.max(20, Math.min(200, prev + delta)));
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setVisibleCandleCount(prev => Math.max(20, prev - 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setVisibleCandleCount(prev => Math.min(200, prev + 10));
  }, []);

  const handleResetZoom = useCallback(() => {
    setVisibleCandleCount(50);
    setScrollOffset(0);
  }, []);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (isFullscreen) {
          // In fullscreen, use most of the space
          setDimensions({ width: width - 40, height: height - 40 });
        } else {
          // Normal mode
          setDimensions({ width: width - 40, height: Math.max(400, height - 80) });
        }
      }
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [isFullscreen]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      drawChart();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawChart]);

  // Animate when chart data changes
  useEffect(() => {
    if (chartData.length > 0) {
      animatePriceChange(chartData);
    }
  }, [chartData, animatePriceChange]);

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const formatChange = (change: number) => {
    return change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
  };

  const formatChangePercent = (changePercent: number) => {
    return changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
  };

  const currentPrice = livePrice?.price || (chartData.length > 0 ? chartData[chartData.length - 1].close : 0);
  const previousPrice = chartData.length > 1 ? chartData[chartData.length - 2].close : currentPrice;
  const change = livePrice?.change || (currentPrice - previousPrice);
  const changePercent = livePrice?.changePercent || (previousPrice !== 0 ? (change / previousPrice) * 100 : 0);

  // Keep parent header price in sync with chart
  useEffect(() => {
    if (onPriceUpdate) {
      onPriceUpdate(currentPrice, change, changePercent);
    }
  }, [currentPrice, change, changePercent, onPriceUpdate]);

  // Fullscreen functionality
  const toggleFullscreen = useCallback(async () => {
    if (!fullscreenRef.current) return;

    try {
      if (!isFullscreen) {
        if (fullscreenRef.current.requestFullscreen) {
          await fullscreenRef.current.requestFullscreen();
        } else if ((fullscreenRef.current as any).webkitRequestFullscreen) {
          await (fullscreenRef.current as any).webkitRequestFullscreen();
        } else if ((fullscreenRef.current as any).mozRequestFullScreen) {
          await (fullscreenRef.current as any).mozRequestFullScreen();
        } else if ((fullscreenRef.current as any).msRequestFullscreen) {
          await (fullscreenRef.current as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);


  const chartContent = (
    <>
      {/* Chart Header with Live Status */}
      {!isFullscreen && (
        <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-white">{symbol}</span>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-1 text-green-400">
                  <WifiIcon className="w-4 h-4" />
                  <span className="text-xs">LIVE</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-400">
                  <SignalSlashIcon className="w-4 h-4" />
                  <span className="text-xs">OFFLINE</span>
                </div>
              )}
            </div>
            <button className="text-blue-400 hover:text-blue-300 text-sm">
              + Compare...
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-2xl font-bold text-white flex items-center space-x-2">
              <span>{formatPrice(currentPrice)}</span>
              {livePrice && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </div>
            <div className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatChange(change)} ({formatChangePercent(changePercent)})
            </div>
            {livePrice && (
              <div className="text-xs text-slate-400">
                Volume: {livePrice.volume.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Fullscreen Header */}
      {isFullscreen && (
        <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white">{symbol}</span>
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <div className="flex items-center space-x-1 text-green-400">
                    <WifiIcon className="w-4 h-4" />
                    <span className="text-xs">LIVE</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-red-400">
                    <SignalSlashIcon className="w-4 h-4" />
                    <span className="text-xs">OFFLINE</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-white flex items-center space-x-2">
                <span>{formatPrice(currentPrice)}</span>
                {livePrice && (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                )}
              </div>
              <div className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatChange(change)} ({formatChangePercent(changePercent)})
              </div>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Exit Fullscreen"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Chart Controls */}
      {!isFullscreen && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {/* Timeframe buttons */}
            <div className="flex bg-slate-700 rounded-lg p-1">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange(tf)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    timeframe === tf
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-600'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Chart tools */}
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
              <ChartBarIcon className="w-4 h-4" />
            </button>
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
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
              <ArrowPathIcon className="w-4 h-4" />
            </button>
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
              <ShareIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={toggleFullscreen}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="w-4 h-4" />
              ) : (
                <ArrowsPointingOutIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div ref={containerRef} className={isFullscreen ? "flex-1 relative" : "relative min-h-[500px]"}>
        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-slate-700/50 overflow-hidden shadow-2xl">
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            className={isDragging ? "cursor-grabbing" : "cursor-crosshair"}
            style={{ display: 'block' }}
          />
          
          {/* Time-based X-axis labels below chart */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-900 to-slate-800 border-t border-slate-700/50 flex items-center justify-between px-4">
            {(() => {
              if (visibleData.length === 0) return null;

              const labelCount = 6;
              const labels: string[] = [];

              // Determine label format based on timeframe
              const getTimeLabel = (timestamp: number, index: number, total: number) => {
                const date = new Date(timestamp);
                const isDay = timeframe === '1D' || timeframe === '5D';
                const isMonth = timeframe === '1M' || timeframe === '3M' || timeframe === '6M';
                const isYear = timeframe === '1Y' || timeframe === '5Y' || timeframe === 'YTD';

                if (isDay) {
                  // Show hours for days
                  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                } else if (isMonth) {
                  // Show month and day for months
                  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                } else if (isYear) {
                  // Show month and year for years
                  return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
                } else {
                  // Show full date for 'All'
                  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
                }
              };

              // Generate evenly spaced labels from visible data
              for (let i = 0; i < labelCount; i++) {
                const index = Math.floor((i / (labelCount - 1)) * (visibleData.length - 1));
                if (index < visibleData.length) {
                  labels.push(getTimeLabel(visibleData[index].timestamp, index, visibleData.length));
                }
              }

              return labels.map((label, idx) => (
                <span key={idx} className="text-xs text-slate-300 font-semibold tracking-wide">
                  {label}
                </span>
              ));
            })()}
          </div>

          {/* Chart Controls */}
          <div className="absolute bottom-12 right-4 flex space-x-2 bg-slate-800/95 backdrop-blur-md rounded-lg p-1.5 border border-slate-700/50 shadow-lg">
            <button
              onClick={handleZoomOut}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-all duration-200"
              title="Zoom Out (Show More Data)"
            >
              <MinusIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-all duration-200"
              title="Zoom In (Show Less Data)"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-all duration-200"
              title="Reset View"
            >
              <Square2StackIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Data Range Indicator */}
          {scrollOffset > 0 && (
            <div className="absolute top-4 right-4 bg-blue-600/90 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg border border-blue-500/50">
              Viewing Historical Data ({chartData.length - scrollOffset - visibleCandleCount + 1} - {chartData.length - scrollOffset})
            </div>
          )}
        </div>
        {isFullscreen && (
          <div className="absolute top-2 left-2 flex items-center space-x-2">
            {/* Timeframe buttons in fullscreen */}
            <div className="flex bg-slate-700/90 backdrop-blur-sm rounded-lg p-1">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange(tf)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    timeframe === tf
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-600'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Indicators Panel */}
      {showIndicators && !isFullscreen && (
        <div className="mt-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 border-2 border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-base font-bold text-white">{selectedIndicator} (10)</span>
              {isConnected && (
                <div className="flex items-center space-x-2 bg-green-500/20 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-green-400">Real-time</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Settings">
                <Cog6ToothIcon className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Expand">
                <ArrowsPointingOutIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowIndicators(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Close"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Indicator selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {indicators.map((indicator) => (
              <button
                key={indicator}
                onClick={() => setSelectedIndicator(indicator)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  selectedIndicator === indicator
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
                    : 'bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600'
                }`}
              >
                {indicator}
              </button>
            ))}
          </div>

          {/* Indicator value */}
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Current {selectedIndicator}:</span>
              <span className="text-lg font-bold text-blue-400">
                {cogData.length > 0 ? `₹${cogData[cogData.length - 1].toFixed(2)}` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hover Info */}
      {hoveredCandle && (
        <div
          className="absolute bg-slate-900/95 backdrop-blur-md border-2 border-slate-700/50 rounded-xl p-4 shadow-2xl pointer-events-none z-20"
          style={{
            left: Math.min(mousePosition.x + 15, dimensions.width - 200),
            top: Math.max(mousePosition.y - 120, 10)
          }}
        >
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 border-b border-slate-700 pb-2 mb-2">
              {new Date(hoveredCandle.timestamp).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <span className="text-slate-400 font-medium">Open:</span>
              <span className="text-white font-semibold">₹{formatPrice(hoveredCandle.open)}</span>

              <span className="text-slate-400 font-medium">High:</span>
              <span className="text-green-400 font-semibold">₹{formatPrice(hoveredCandle.high)}</span>

              <span className="text-slate-400 font-medium">Low:</span>
              <span className="text-red-400 font-semibold">₹{formatPrice(hoveredCandle.low)}</span>

              <span className="text-slate-400 font-medium">Close:</span>
              <span className={`font-semibold ${hoveredCandle.close >= hoveredCandle.open ? 'text-green-400' : 'text-red-400'}`}>
                ₹{formatPrice(hoveredCandle.close)}
              </span>

              <span className="text-slate-400 font-medium">Volume:</span>
              <span className="text-blue-400 font-semibold">{hoveredCandle.volume.toLocaleString()}</span>
            </div>
            <div className={`mt-2 pt-2 border-t border-slate-700 text-xs font-semibold ${hoveredCandle.close >= hoveredCandle.open ? 'text-green-400' : 'text-red-400'}`}>
              Change: {((hoveredCandle.close - hoveredCandle.open) / hoveredCandle.open * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      {/* Bottom Info */}
      {!isFullscreen && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center space-x-4">
            <span>Chg. {formatChangePercent(changePercent)}</span>
            {isConnected && (
              <span className="text-green-400">● Live Data</span>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div
      ref={fullscreenRef}
      className={
        isFullscreen
          ? "fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden"
          : "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700/50"
      }
    >
      {chartContent}
    </div>
  );
};

export default DynamicChart;
