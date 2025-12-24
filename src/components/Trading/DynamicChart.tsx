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
  SignalSlashIcon,
  EyeIcon,
  EyeSlashIcon,
  LockOpenIcon,
  LockClosedIcon,
  MagnifyingGlassPlusIcon,
  HeartIcon,
  ChevronLeftIcon,
  ChevronRightIcon
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
  const rsiCanvasRef = useRef<HTMLCanvasElement>(null);
  const macdCanvasRef = useRef<HTMLCanvasElement>(null);
  const volumeCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [indicatorPanelHeight] = useState(120);
  const [volumePanelHeight] = useState(100);
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

  // Drawing tools states
  type DrawingTool = 'none' | 'line' | 'horizontal' | 'circle' | 'text' | 'fibonacci' | 'rectangle';
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('none');
  const [drawings, setDrawings] = useState<Array<{
    type: DrawingTool;
    id: string;
    points: Array<{ x: number; y: number; price?: number; time?: number }>;
    color?: string;
    locked?: boolean;
    visible?: boolean;
  }>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<{
    type: DrawingTool;
    points: Array<{ x: number; y: number; price?: number; time?: number }>;
  } | null>(null);
  const [showDrawings, setShowDrawings] = useState(true);
  const [drawingStart, setDrawingStart] = useState<{ x: number; y: number } | null>(null);

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

  // Calculate visible data range - properly handle historical data
  const getVisibleData = () => {
    if (chartData.length === 0) return [];
    
    // scrollOffset = 0 means showing latest data
    // scrollOffset > 0 means scrolling back in history
    const endIndex = chartData.length - scrollOffset;
    const startIndex = Math.max(0, endIndex - visibleCandleCount);
    
    // Ensure we always return at least some data
    if (startIndex >= endIndex) {
      return chartData.slice(Math.max(0, chartData.length - visibleCandleCount), chartData.length);
    }
    
    return chartData.slice(startIndex, endIndex);
  };

  const visibleData = getVisibleData();
  const visibleAnimationData = (() => {
    if (animationData.length === 0) return [];
    const endIndex = animationData.length - scrollOffset;
    const startIndex = Math.max(0, endIndex - visibleCandleCount);
    if (startIndex >= endIndex) {
      return animationData.slice(Math.max(0, animationData.length - visibleCandleCount), animationData.length);
    }
    return animationData.slice(startIndex, endIndex);
  })();

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

  // Calculate SMA (Simple Moving Average)
  const calculateSMA = (data: CandlestickData[], period: number = 20) => {
    const sma: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      sma.push(sum / period);
    }
    return sma;
  };

  // Calculate EMA (Exponential Moving Average)
  const calculateEMA = (data: CandlestickData[], period: number = 20) => {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA for first value
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i].close;
    }
    ema.push(sum / period);
    
    // Calculate EMA for rest
    for (let i = period; i < data.length; i++) {
      const value = (data[i].close - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(value);
    }
    return ema;
  };

  // Calculate RSI (Relative Strength Index)
  const calculateRSI = (data: CandlestickData[], period: number = 14) => {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Calculate price changes
    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    // Calculate initial average gain and loss
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 0; i < period; i++) {
      avgGain += gains[i];
      avgLoss += losses[i];
    }
    avgGain /= period;
    avgLoss /= period;
    
    // Calculate RSI
    for (let i = period; i < gains.length; i++) {
      if (i === period) {
        // First RSI value
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      } else {
        // Subsequent RSI values using Wilder's smoothing
        avgGain = (avgGain * (period - 1) + gains[i]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
    
    return rsi;
  };

  // Calculate MACD (Moving Average Convergence Divergence)
  const calculateMACD = (data: CandlestickData[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => {
    const fastEMA = calculateEMA(data, fastPeriod);
    const slowEMA = calculateEMA(data, slowPeriod);
    
    // Adjust for different lengths
    const macdLine: number[] = [];
    const startIndex = slowPeriod - fastPeriod;
    
    for (let i = 0; i < slowEMA.length; i++) {
      const fastIndex = i + startIndex;
      if (fastIndex >= 0 && fastIndex < fastEMA.length) {
        macdLine.push(fastEMA[fastIndex] - slowEMA[i]);
      }
    }
    
    // Calculate signal line (EMA of MACD line)
    const signalLine: number[] = [];
    if (macdLine.length >= signalPeriod) {
      const multiplier = 2 / (signalPeriod + 1);
      let sum = 0;
      for (let i = 0; i < signalPeriod; i++) {
        sum += macdLine[i];
      }
      signalLine.push(sum / signalPeriod);
      
      for (let i = signalPeriod; i < macdLine.length; i++) {
        const value = (macdLine[i] - signalLine[signalLine.length - 1]) * multiplier + signalLine[signalLine.length - 1];
        signalLine.push(value);
      }
    }
    
    // Calculate histogram
    const histogram: number[] = [];
    const signalStartIndex = macdLine.length - signalLine.length;
    for (let i = 0; i < signalLine.length; i++) {
      histogram.push(macdLine[signalStartIndex + i] - signalLine[i]);
    }
    
    return { macdLine, signalLine, histogram };
  };

  // Calculate Bollinger Bands
  const calculateBB = (data: CandlestickData[], period: number = 20, stdDev: number = 2) => {
    const sma = calculateSMA(data, period);
    const bands: { upper: number; middle: number; lower: number }[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      // Calculate standard deviation
      let variance = 0;
      for (let j = 0; j < period; j++) {
        variance += Math.pow(data[i - j].close - sma[i - (period - 1)], 2);
      }
      const standardDev = Math.sqrt(variance / period);
      
      const middle = sma[i - (period - 1)];
      const upper = middle + (standardDev * stdDev);
      const lower = middle - (standardDev * stdDev);
      
      bands.push({ upper, middle, lower });
    }
    
    return bands;
  };

  // Calculate Volume SMA
  const calculateVolumeSMA = (data: CandlestickData[], period: number = 9) => {
    const volumeSMA: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].volume;
      }
      volumeSMA.push(sum / period);
    }
    return volumeSMA;
  };

  // Calculate all indicators
  const cogData = calculateCOG(visibleData);
  const smaData = calculateSMA(visibleData, 20);
  const emaData = calculateEMA(visibleData, 20);
  const rsiData = calculateRSI(visibleData, 14);
  const macdData = calculateMACD(visibleData, 12, 26, 9);
  const bbData = calculateBB(visibleData, 20, 2);
  const volumeSMAData = calculateVolumeSMA(visibleData, 9);

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

    // Professional light chart background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid lines (light theme)
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Price labels on right side (Y-axis)
    const priceLabelCount = 10;
    const priceStep = priceRange / (priceLabelCount - 1);
    const calculatedMaxPrice = minPrice + priceRange;

    // Horizontal grid lines with price labels
    for (let i = 0; i < priceLabelCount; i++) {
      const price = calculatedMaxPrice - (priceStep * i);
      const y = (i * height) / (priceLabelCount - 1);

      // Draw subtle grid line (light theme)
      ctx.strokeStyle = i % 2 === 0 ? '#e5e7eb' : '#f3f4f6';
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

      // Background for label (light theme)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(chartWidth + 8, y - textHeight / 2, rightPadding - 16, textHeight);

      // Price text (light theme)
      ctx.fillStyle = '#374151';
      ctx.fillText(priceText, chartWidth + 12, y);
    }

    // Vertical grid lines (fewer for cleaner look)
    const verticalGridCount = 8;
    for (let i = 0; i <= verticalGridCount; i++) {
      const x = (chartWidth * i) / verticalGridCount;
      ctx.strokeStyle = '#f3f4f6';
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

    // Draw indicators based on selection
    if (showIndicators) {
      // COG Indicator
      if (selectedIndicator === 'COG' && cogData.length > 0) {
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

      // SMA Indicator
      if (selectedIndicator === 'SMA' && smaData.length > 0) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
        ctx.shadowBlur = 4;
        ctx.beginPath();

        smaData.forEach((value, index) => {
          const x = (index + 19) * candleSpacing + candleSpacing / 2;
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

      // EMA Indicator
      if (selectedIndicator === 'EMA' && emaData.length > 0) {
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(139, 92, 246, 0.4)';
        ctx.shadowBlur = 4;
        ctx.beginPath();

        emaData.forEach((value, index) => {
          const x = (index + 19) * candleSpacing + candleSpacing / 2;
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

      // Bollinger Bands
      if (selectedIndicator === 'BB' && bbData.length > 0) {
        // Upper band
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        bbData.forEach((band, index) => {
          const x = (index + 19) * candleSpacing + candleSpacing / 2;
          const y = height - ((band.upper - minPrice + padding) / (priceRange + 2 * padding)) * height;
          if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Middle band (SMA)
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        bbData.forEach((band, index) => {
          const x = (index + 19) * candleSpacing + candleSpacing / 2;
          const y = height - ((band.middle - minPrice + padding) / (priceRange + 2 * padding)) * height;
          if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Lower band
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        bbData.forEach((band, index) => {
          const x = (index + 19) * candleSpacing + candleSpacing / 2;
          const y = height - ((band.lower - minPrice + padding) / (priceRange + 2 * padding)) * height;
          if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Fill between bands
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.beginPath();
        bbData.forEach((band, index) => {
          const x = (index + 19) * candleSpacing + candleSpacing / 2;
          const yUpper = height - ((band.upper - minPrice + padding) / (priceRange + 2 * padding)) * height;
          const yLower = height - ((band.lower - minPrice + padding) / (priceRange + 2 * padding)) * height;
          if (index === 0) {
            ctx.moveTo(x, yUpper);
          } else {
            ctx.lineTo(x, yUpper);
          }
          if (index === bbData.length - 1) {
            for (let i = bbData.length - 1; i >= 0; i--) {
              const x2 = (i + 19) * candleSpacing + candleSpacing / 2;
              const yLower2 = height - ((bbData[i].lower - minPrice + padding) / (priceRange + 2 * padding)) * height;
              ctx.lineTo(x2, yLower2);
            }
            ctx.closePath();
            ctx.fill();
          }
        });
      }
    }

    // Draw current price line with live updates (professional style - dashed line)
    const currentPrice = livePrice?.price || (chartData.length > 0 ? chartData[chartData.length - 1].close : 0);
    const y = height - ((currentPrice - minPrice + padding) / (priceRange + 2 * padding)) * height;

    // Professional dashed price line (red like in trading platforms)
    const isPriceUp = chartData.length > 1 ? currentPrice >= chartData[chartData.length - 2].close : true;
    ctx.strokeStyle = '#ef4444'; // Red dashed line like professional charts
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(chartWidth, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw current price label on right side (professional style - light theme)
    const priceText = currentPrice.toFixed(2);
    ctx.font = '12px Inter, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // Background for price label (light theme)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    const labelHeight = 20;
    const labelPadding = 6;
    const textWidth = ctx.measureText(priceText).width;
    ctx.fillRect(
      chartWidth + 8,
      y - labelHeight / 2,
      textWidth + labelPadding * 2,
      labelHeight
    );
    ctx.strokeRect(
      chartWidth + 8,
      y - labelHeight / 2,
      textWidth + labelPadding * 2,
      labelHeight
    );

    // Price text
    ctx.fillStyle = '#ef4444';
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

    // Draw all drawings/annotations
    if (showDrawings) {
      const rightPadding = 80;
      const chartWidth = width - rightPadding;
      const candleSpacing = chartWidth / visibleAnimationData.length;

      drawings.forEach((drawing) => {
        if (!drawing.visible && drawing.visible !== undefined) return;
        
        ctx.strokeStyle = drawing.color || '#3b82f6';
        ctx.fillStyle = drawing.color || '#3b82f6';
        ctx.lineWidth = 2;

        if (drawing.type === 'line' && drawing.points.length >= 2) {
          // Draw trend line
          ctx.beginPath();
          drawing.points.forEach((point, idx) => {
            const x = point.x;
            const y = point.y;
            if (idx === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.stroke();

          // Draw circles at endpoints
          drawing.points.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });
        } else if (drawing.type === 'horizontal' && drawing.points.length >= 1) {
          // Draw horizontal line
          const y = drawing.points[0].y;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(chartWidth, y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw circle at start
          ctx.beginPath();
          ctx.arc(0, y, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (drawing.type === 'circle' && drawing.points.length >= 2) {
          // Draw circle
          const center = drawing.points[0];
          const radius = Math.sqrt(
            Math.pow(drawing.points[1].x - center.x, 2) + 
            Math.pow(drawing.points[1].y - center.y, 2)
          );
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
          ctx.stroke();

          // Draw center point
          ctx.beginPath();
          ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (drawing.type === 'rectangle' && drawing.points.length >= 2) {
          // Draw rectangle
          const start = drawing.points[0];
          const end = drawing.points[1];
          const width = end.x - start.x;
          const height = end.y - start.y;
          ctx.strokeRect(start.x, start.y, width, height);
        }
      });

      // Draw current drawing in progress
      if (currentDrawing && isDrawing) {
        ctx.strokeStyle = '#3b82f6';
        ctx.fillStyle = '#3b82f6';
        ctx.lineWidth = 2;

        if (currentDrawing.type === 'line' && currentDrawing.points.length >= 1) {
          ctx.beginPath();
          currentDrawing.points.forEach((point, idx) => {
            if (idx === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          if (mousePosition.x > 0 && mousePosition.y > 0) {
            ctx.lineTo(mousePosition.x, mousePosition.y);
          }
          ctx.stroke();

          // Draw circles
          currentDrawing.points.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fill();
          });
        } else if (currentDrawing.type === 'horizontal' && currentDrawing.points.length >= 1) {
          const y = currentDrawing.points[0].y;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(chartWidth, y);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (currentDrawing.type === 'circle' && currentDrawing.points.length >= 1) {
          const center = currentDrawing.points[0];
          const radius = Math.sqrt(
            Math.pow(mousePosition.x - center.x, 2) + 
            Math.pow(mousePosition.y - center.y, 2)
          );
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        } else if (currentDrawing.type === 'rectangle' && currentDrawing.points.length >= 1) {
          const start = currentDrawing.points[0];
          const width = mousePosition.x - start.x;
          const height = mousePosition.y - start.y;
          ctx.strokeRect(start.x, start.y, width, height);
        }
      }
    }

  }, [visibleData, visibleAnimationData, dimensions, minPrice, maxPrice, priceRange, padding, hoveredCandle, showIndicators, selectedIndicator, cogData, smaData, emaData, bbData, livePrice, chartType, drawings, showDrawings, currentDrawing, isDrawing, mousePosition]);

  // Draw RSI indicator panel
  const drawRSI = useCallback(() => {
    const canvas = rsiCanvasRef.current;
    if (!canvas || selectedIndicator !== 'RSI' || !showIndicators) return;

    const ctx = canvas.getContext('2d');
    if (!ctx || rsiData.length === 0) return;

    const { width, height } = { width: dimensions.width, height: indicatorPanelHeight };
    const rightPadding = 80;
    const chartWidth = width - rightPadding;
    const candleSpacing = chartWidth / visibleData.length;

    ctx.clearRect(0, 0, width, height);

    // Background - Light Theme
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // RSI range is 0-100
    const rsiMin = 0;
    const rsiMax = 100;
    const rsiRange = rsiMax - rsiMin;

    // Draw reference lines at 30, 50, 70 - Light Theme
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    [30, 50, 70].forEach((level) => {
      const y = height - ((level - rsiMin) / rsiRange) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();
    });

    // Draw RSI line
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(236, 72, 153, 0.5)';
    ctx.shadowBlur = 4;
    ctx.beginPath();

    rsiData.forEach((value, index) => {
      const x = (index + 14) * candleSpacing + candleSpacing / 2;
      const y = height - ((value - rsiMin) / rsiRange) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Fill overbought/oversold regions
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
    ctx.fillRect(0, 0, chartWidth, height - ((70 - rsiMin) / rsiRange) * height);

    ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
    ctx.fillRect(0, height - ((30 - rsiMin) / rsiRange) * height, chartWidth, height);

    // Labels - Light Theme
    ctx.font = '11px Inter, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#374151';
    [0, 30, 50, 70, 100].forEach((level) => {
      const y = height - ((level - rsiMin) / rsiRange) * height;
      ctx.fillText(level.toString(), chartWidth + 12, y);
    });

    // Current RSI value
    if (rsiData.length > 0) {
      const currentRSI = rsiData[rsiData.length - 1];
      const y = height - ((currentRSI - rsiMin) / rsiRange) * height;
      ctx.fillStyle = '#ec4899';
      ctx.fillText(`RSI: ${currentRSI.toFixed(2)}`, chartWidth + 12, y - 20);
    }
  }, [rsiData, visibleData, dimensions.width, selectedIndicator, showIndicators, indicatorPanelHeight]);

  // Draw MACD indicator panel
  const drawMACD = useCallback(() => {
    const canvas = macdCanvasRef.current;
    if (!canvas || selectedIndicator !== 'MACD' || !showIndicators) return;

    const ctx = canvas.getContext('2d');
    if (!ctx || macdData.macdLine.length === 0) return;

    const { width, height } = { width: dimensions.width, height: indicatorPanelHeight };
    const rightPadding = 80;
    const chartWidth = width - rightPadding;
    const candleSpacing = chartWidth / visibleData.length;

    ctx.clearRect(0, 0, width, height);

    // Background - Light Theme
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Calculate MACD range
    const allMACDValues = [...macdData.macdLine, ...macdData.signalLine];
    const macdMin = Math.min(...allMACDValues);
    const macdMax = Math.max(...allMACDValues);
    const macdRange = macdMax - macdMin || 1;
    const centerY = height / 2;

    // Draw zero line - Light Theme
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(chartWidth, centerY);
    ctx.stroke();

    // Draw MACD line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
    ctx.shadowBlur = 4;
    ctx.beginPath();

    const macdStartIndex = 25; // MACD starts after slow period
    macdData.macdLine.forEach((value, index) => {
      const x = (index + macdStartIndex) * candleSpacing + candleSpacing / 2;
      const y = centerY - ((value / macdRange) * (height * 0.4));

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw signal line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const signalStartIndex = macdStartIndex + (macdData.macdLine.length - macdData.signalLine.length);
    macdData.signalLine.forEach((value, index) => {
      const x = (index + signalStartIndex) * candleSpacing + candleSpacing / 2;
      const y = centerY - ((value / macdRange) * (height * 0.4));

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw histogram
    macdData.histogram.forEach((value, index) => {
      const x = (index + signalStartIndex) * candleSpacing + candleSpacing / 2;
      const barHeight = Math.abs((value / macdRange) * (height * 0.4));
      const y = value >= 0 ? centerY - barHeight : centerY;

      ctx.fillStyle = value >= 0 ? '#22c55e' : '#ef4444';
      ctx.fillRect(x - candleSpacing * 0.2, y, candleSpacing * 0.4, barHeight);
    });

    // Labels - Light Theme
    ctx.font = '11px Inter, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#374151';
    ctx.fillText('0', chartWidth + 12, centerY);
  }, [macdData, visibleData, dimensions.width, selectedIndicator, showIndicators, indicatorPanelHeight]);

  // Draw Volume bars
  const drawVolume = useCallback(() => {
    const canvas = volumeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx || visibleData.length === 0) return;

    const { width, height } = { width: dimensions.width, height: volumePanelHeight };
    const rightPadding = 80;
    const chartWidth = width - rightPadding;
    const candleSpacing = chartWidth / visibleData.length;

    ctx.clearRect(0, 0, width, height);

    // Background - Light Theme
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Calculate max volume for scaling
    const volumes = visibleData.map(d => d.volume);
    const maxVolume = Math.max(...volumes, ...volumeSMAData);
    const volumeRange = maxVolume || 1;

    // Draw volume bars
    visibleData.forEach((candle, index) => {
      const x = index * candleSpacing + candleSpacing / 2;
      const isGreen = candle.close >= candle.open;
      const barWidth = Math.max(1, candleSpacing * 0.6);
      const barHeight = (candle.volume / volumeRange) * height * 0.9;
      const y = height - barHeight;

      ctx.fillStyle = isGreen ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';
      ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);
    });

    // Draw Volume SMA line
    if (volumeSMAData.length > 0) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      volumeSMAData.forEach((value, index) => {
        const x = (index + 8) * candleSpacing + candleSpacing / 2;
        const barHeight = (value / volumeRange) * height * 0.9;
        const y = height - barHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Volume label on right
    if (visibleData.length > 0) {
      const currentVolume = visibleData[visibleData.length - 1].volume;
      const volumeText = currentVolume >= 1000000 
        ? `${(currentVolume / 1000000).toFixed(2)}M`
        : currentVolume >= 1000
        ? `${(currentVolume / 1000).toFixed(2)}K`
        : currentVolume.toFixed(0);
      
      ctx.font = '11px Inter, system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#374151';
      ctx.fillText(`Volume: ${volumeText}`, chartWidth + 12, height / 2);
    }
  }, [visibleData, volumeSMAData, dimensions.width, volumePanelHeight]);

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle drawing tools
    if (selectedTool !== 'none') {
      setIsDrawing(true);
      setDrawingStart({ x, y });
      
      if (selectedTool === 'line' || selectedTool === 'circle' || selectedTool === 'rectangle') {
        setCurrentDrawing({
          type: selectedTool,
          points: [{ x, y }]
        });
      } else if (selectedTool === 'horizontal') {
        setCurrentDrawing({
          type: selectedTool,
          points: [{ x, y }]
        });
        // Complete horizontal line immediately
        const newDrawing = {
          type: selectedTool as DrawingTool,
          id: `drawing-${Date.now()}`,
          points: [{ x: 0, y }],
          color: '#3b82f6',
          visible: true,
          locked: false
        };
        setDrawings(prev => [...prev, newDrawing]);
        setIsDrawing(false);
        setCurrentDrawing(null);
        setDrawingStart(null);
      }
      return;
    }

    // Handle chart dragging
    setIsDragging(true);
    setDragStart({ x: e.clientX, offset: scrollOffset });
  }, [scrollOffset, selectedTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });

    // Handle drawing
    if (isDrawing && currentDrawing && drawingStart) {
      if (selectedTool === 'line' && currentDrawing.points.length === 1) {
        setCurrentDrawing({
          ...currentDrawing,
          points: [...currentDrawing.points, { x, y }]
        });
      } else if (selectedTool === 'circle' || selectedTool === 'rectangle') {
        // Keep updating with mouse position
        setCurrentDrawing({
          ...currentDrawing,
          points: currentDrawing.points.length === 1 
            ? [...currentDrawing.points, { x, y }]
            : [currentDrawing.points[0], { x, y }]
        });
      }
      return;
    }

    // Handle dragging to scroll through historical data
    if (isDragging && selectedTool === 'none') {
      const deltaX = dragStart.x - e.clientX;
      const rightPadding = 80;
      const chartWidth = dimensions.width - rightPadding;
      const candleWidth = chartWidth / Math.max(1, visibleCandleCount);
      const candlesMoved = Math.round(deltaX / candleWidth);

      const maxOffset = Math.max(0, chartData.length - visibleCandleCount);
      const newOffset = Math.max(0, Math.min(maxOffset, dragStart.offset + candlesMoved));
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
  }, [isDragging, dragStart, scrollOffset, visibleCandleCount, chartData.length, dimensions.width, visibleData, isDrawing, currentDrawing, drawingStart, selectedTool]);

  const handleMouseUp = useCallback(() => {
    // Complete drawing
    if (isDrawing && currentDrawing && selectedTool !== 'none') {
      if (currentDrawing.points.length >= 2 || selectedTool === 'horizontal') {
        const newDrawing = {
          type: selectedTool as DrawingTool,
          id: `drawing-${Date.now()}`,
          points: currentDrawing.points,
          color: '#3b82f6',
          visible: true,
          locked: false
        };
        setDrawings(prev => [...prev, newDrawing]);
      }
      setIsDrawing(false);
      setCurrentDrawing(null);
      setDrawingStart(null);
      setSelectedTool('none'); // Reset tool after drawing
    }
    
    setIsDragging(false);
  }, [isDrawing, currentDrawing, selectedTool]);

  const handleMouseLeave = useCallback(() => {
    setHoveredCandle(null);
    setIsDragging(false);
    if (isDrawing) {
      setIsDrawing(false);
      setCurrentDrawing(null);
      setDrawingStart(null);
    }
  }, [isDrawing]);

  // Handle mouse wheel for zooming
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (selectedTool !== 'none') return; // Don't zoom when drawing
    
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9; // Zoom out or in
    setVisibleCandleCount(prev => {
      const newCount = Math.max(10, Math.min(500, Math.round(prev * zoomFactor)));
      // Adjust scroll offset to maintain view position
      const maxOffset = Math.max(0, chartData.length - newCount);
      setScrollOffset(current => Math.min(maxOffset, current));
      return newCount;
    });
  }, [selectedTool, chartData.length]);

  // Navigation controls
  const handleScrollLeft = useCallback(() => {
    setScrollOffset(prev => {
      const maxOffset = Math.max(0, chartData.length - visibleCandleCount);
      return Math.min(maxOffset, prev + 10);
    });
  }, [chartData.length, visibleCandleCount]);

  const handleScrollRight = useCallback(() => {
    setScrollOffset(prev => Math.max(0, prev - 10));
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setVisibleCandleCount(prev => {
      const newCount = Math.max(10, prev - 10);
      // Adjust scroll offset when zooming in
      const maxOffset = Math.max(0, chartData.length - newCount);
      setScrollOffset(current => Math.min(maxOffset, current));
      return newCount;
    });
  }, [chartData.length]);

  const handleZoomOut = useCallback(() => {
    setVisibleCandleCount(prev => {
      const newCount = Math.min(500, prev + 10);
      // Adjust scroll offset when zooming out
      const maxOffset = Math.max(0, chartData.length - newCount);
      setScrollOffset(current => Math.min(maxOffset, current));
      return newCount;
    });
  }, [chartData.length]);

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
          // Normal mode - account for volume panel
          const availableHeight = height - 80 - volumePanelHeight - 20; // 20 for spacing
          setDimensions({ width: width - 40, height: Math.max(350, availableHeight) });
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
      drawRSI();
      drawMACD();
      drawVolume();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawChart, drawRSI, drawMACD, drawVolume]);

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
      {/* Professional Chart Header */}
      {!isFullscreen && (
        <div className="mb-3 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          {/* Top Row: Symbol, Timeframe, Exchange */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-gray-900">{symbol}</span>
                <span className="text-gray-400">·</span>
                <span className="text-sm font-medium text-gray-600">{timeframe}</span>
                <span className="text-gray-400">·</span>
                <span className="text-sm font-medium text-gray-600">NSE</span>
                {isConnected && (
                  <div className="flex items-center space-x-1.5 text-green-600 ml-3 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    <WifiIcon className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">LIVE</span>
                  </div>
                )}
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span>₹{formatPrice(currentPrice)}</span>
                {livePrice && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div className={`text-sm font-semibold mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatChange(change)} ({formatChangePercent(changePercent)})
              </div>
            </div>
          </div>

          {/* OHLC Row */}
          {chartData.length > 0 && (() => {
            const lastCandle = chartData[chartData.length - 1];
            const high = Math.max(...chartData.map(d => d.high));
            const low = Math.min(...chartData.map(d => d.low));
            return (
              <div className="flex items-center space-x-6 text-sm mt-2">
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500 font-medium">O</span>
                  <span className="text-gray-900 font-semibold">{formatPrice(lastCandle.open)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500 font-medium">H</span>
                  <span className="text-green-600 font-semibold">{formatPrice(high)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500 font-medium">L</span>
                  <span className="text-red-600 font-semibold">{formatPrice(low)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500 font-medium">C</span>
                  <span className={`font-semibold ${lastCandle.close >= lastCandle.open ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPrice(lastCandle.close)}
                  </span>
                </div>
                <div className={`text-sm font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatChange(change)} ({formatChangePercent(changePercent)})
                </div>
                {/* Volume SMA */}
                {visibleData.length > 0 && volumeSMAData.length > 0 && (
                  <div className="flex items-center space-x-2 ml-auto">
                    <span className="text-gray-500 font-medium">Volume SMA 9</span>
                    <span className="text-gray-900 font-semibold">
                      {(() => {
                        const vol = volumeSMAData[volumeSMAData.length - 1];
                        if (vol >= 1000000) return `${(vol / 1000000).toFixed(2)}M`;
                        if (vol >= 1000) return `${(vol / 1000).toFixed(2)}K`;
                        return vol.toFixed(0);
                      })()}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Fullscreen Header - Light Theme */}
      {isFullscreen && (
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">{symbol}</span>
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <WifiIcon className="w-4 h-4" />
                    <span className="text-xs">LIVE</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-red-600">
                    <SignalSlashIcon className="w-4 h-4" />
                    <span className="text-xs">OFFLINE</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span>₹{formatPrice(currentPrice)}</span>
                {livePrice && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <div className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatChange(change)} ({formatChangePercent(changePercent)})
              </div>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Exit Fullscreen"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Chart Controls - Light Theme */}
      {!isFullscreen && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {/* Timeframe buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange(tf)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    timeframe === tf
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Chart tools */}
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <ChartBarIcon className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Cog6ToothIcon className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <PencilIcon className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <PlusIcon className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <BoltIcon className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowPathIcon className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <ShareIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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

      {/* Bottom Timeframe Selector Bar - Light Theme */}
      {!isFullscreen && (
        <div className="mt-3 bg-white border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {['5y', '1y', '3m', '1m', '5d', '1d'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange(tf)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    timeframe === tf
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' })}</span>
            </div>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div ref={containerRef} className={isFullscreen ? "flex-1 relative" : "relative min-h-[500px] w-full"}>
        {/* Drawing Toolbar - Left Side - Always Visible - Light Theme */}
        <div className="absolute left-3 top-3 z-[100] flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 gap-1">
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
            onClick={() => setSelectedTool(selectedTool === 'horizontal' ? 'none' : 'horizontal')}
            className={`p-2 rounded transition-colors ${
              selectedTool === 'horizontal' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Horizontal Line"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" />
              <circle cx="3" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </button>

          {/* Circle */}
          <button
            onClick={() => setSelectedTool(selectedTool === 'circle' ? 'none' : 'circle')}
            className={`p-2 rounded transition-colors ${
              selectedTool === 'circle' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Circle"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" strokeWidth={2} />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
          </button>

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

          {/* Divider */}
          <div className="h-px bg-gray-200 my-1"></div>

          {/* Show/Hide Drawings */}
          <button
            onClick={() => setShowDrawings(!showDrawings)}
            className={`p-2 rounded transition-colors ${
              showDrawings 
                ? 'text-blue-600 hover:text-blue-700 hover:bg-gray-100' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title={showDrawings ? "Hide Drawings" : "Show Drawings"}
          >
            {showDrawings ? (
              <EyeIcon className="w-4 h-4" />
            ) : (
              <EyeSlashIcon className="w-4 h-4" />
            )}
          </button>

          {/* Clear All Drawings */}
          <button
            onClick={() => setDrawings([])}
            className="p-2 rounded transition-colors text-gray-600 hover:text-red-600 hover:bg-gray-100"
            title="Clear All Drawings"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm w-full h-full">
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            className={
              selectedTool !== 'none' 
                ? "cursor-crosshair" 
                : isDragging 
                ? "cursor-grabbing" 
                : "cursor-crosshair"
            }
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
          
          {/* Time-based X-axis labels below chart */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-white border-t border-gray-200 flex items-center justify-between px-4">
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
                <span key={idx} className="text-xs text-gray-600 font-medium tracking-wide">
                  {label}
                </span>
              ));
            })()}
          </div>

          {/* Navigation Controls - Top Right - Light Theme */}
          <div className="absolute top-4 right-4 flex items-center space-x-2 z-40">
            {/* Scroll Left (View Older Data) */}
            <button
              onClick={handleScrollLeft}
              disabled={scrollOffset >= chartData.length - visibleCandleCount}
              className="p-2 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-200 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Scroll Left (View Older Data)"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            
            {/* Scroll Right (View Newer Data) */}
            <button
              onClick={handleScrollRight}
              disabled={scrollOffset <= 0}
              className="p-2 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-200 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Scroll Right (View Newer Data)"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Zoom Controls - Bottom Right - Light Theme */}
          <div className="absolute bottom-12 right-4 flex space-x-1 bg-white rounded-lg p-1 border border-gray-200 shadow-lg z-40">
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-all duration-200"
              title="Zoom Out (Show More Data)"
            >
              <MinusIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-all duration-200"
              title="Zoom In (Show Less Data)"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-all duration-200"
              title="Reset View"
            >
              <Square2StackIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Data Range Indicator - Light Theme */}
          {scrollOffset > 0 && (
            <div className="absolute top-4 left-4 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm border border-blue-200 z-40">
              Viewing Historical Data ({Math.max(1, chartData.length - scrollOffset - visibleCandleCount + 1)}) - {chartData.length - scrollOffset} of {chartData.length}
            </div>
          )}
          
          {/* Current Position Indicator - Light Theme */}
          {scrollOffset === 0 && chartData.length > visibleCandleCount && (
            <div className="absolute top-4 left-4 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm border border-green-200 z-40">
              Showing Latest {visibleCandleCount} of {chartData.length} candles
            </div>
          )}
        </div>
        {isFullscreen && (
          <div className="absolute top-2 left-2 flex items-center space-x-2">
            {/* Timeframe buttons in fullscreen - Light Theme */}
            <div className="flex bg-white/95 backdrop-blur-sm rounded-lg p-1 border border-gray-200 shadow-lg">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange(tf)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    timeframe === tf
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Volume Panel - Always visible - Light Theme */}
      {!isFullscreen && (
        <div className="mt-2 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <canvas
            ref={volumeCanvasRef}
            width={dimensions.width}
            height={volumePanelHeight}
            className="block"
          />
        </div>
      )}

      {/* RSI Indicator Panel - Light Theme */}
      {showIndicators && selectedIndicator === 'RSI' && !isFullscreen && (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-semibold text-pink-600">RSI (14)</span>
          </div>
          <canvas
            ref={rsiCanvasRef}
            width={dimensions.width}
            height={indicatorPanelHeight}
            className="block"
          />
        </div>
      )}

      {/* MACD Indicator Panel - Light Theme */}
      {showIndicators && selectedIndicator === 'MACD' && !isFullscreen && (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-semibold text-blue-600">MACD (12, 26, 9)</span>
          </div>
          <canvas
            ref={macdCanvasRef}
            width={dimensions.width}
            height={indicatorPanelHeight}
            className="block"
          />
        </div>
      )}

      {/* Indicators Panel - Light Theme */}
      {showIndicators && !isFullscreen && (
        <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-base font-bold text-gray-900">
                {selectedIndicator === 'COG' ? 'COG (10)' :
                 selectedIndicator === 'SMA' ? 'SMA (20)' :
                 selectedIndicator === 'EMA' ? 'EMA (20)' :
                 selectedIndicator === 'RSI' ? 'RSI (14)' :
                 selectedIndicator === 'MACD' ? 'MACD (12, 26, 9)' :
                 selectedIndicator === 'BB' ? 'Bollinger Bands (20, 2)' :
                 selectedIndicator}
              </span>
              {isConnected && (
                <div className="flex items-center space-x-2 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-green-600">Real-time</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Settings">
                <Cog6ToothIcon className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Expand">
                <ArrowsPointingOutIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowIndicators(false)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                {indicator}
              </button>
            ))}
          </div>

          {/* Indicator value */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Current {selectedIndicator}:</span>
              <span className="text-lg font-bold text-blue-600">
                {(() => {
                  if (selectedIndicator === 'COG' && cogData.length > 0) {
                    return `₹${cogData[cogData.length - 1].toFixed(2)}`;
                  } else if (selectedIndicator === 'SMA' && smaData.length > 0) {
                    return `₹${smaData[smaData.length - 1].toFixed(2)}`;
                  } else if (selectedIndicator === 'EMA' && emaData.length > 0) {
                    return `₹${emaData[emaData.length - 1].toFixed(2)}`;
                  } else if (selectedIndicator === 'RSI' && rsiData.length > 0) {
                    const rsiValue = rsiData[rsiData.length - 1];
                    return `${rsiValue.toFixed(2)}`;
                  } else if (selectedIndicator === 'MACD' && macdData.macdLine.length > 0) {
                    const macdValue = macdData.macdLine[macdData.macdLine.length - 1];
                    return `${macdValue.toFixed(2)}`;
                  } else if (selectedIndicator === 'BB' && bbData.length > 0) {
                    const bb = bbData[bbData.length - 1];
                    return `Upper: ₹${bb.upper.toFixed(2)} | Lower: ₹${bb.lower.toFixed(2)}`;
                  }
                  return 'N/A';
                })()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hover Info - Light Theme */}
      {hoveredCandle && (
        <div
          className="absolute bg-white border-2 border-gray-300 rounded-lg p-3 shadow-xl pointer-events-none z-20"
          style={{
            left: Math.min(mousePosition.x + 15, dimensions.width - 200),
            top: Math.max(mousePosition.y - 120, 10)
          }}
        >
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 border-b border-gray-200 pb-2 mb-2">
              {new Date(hoveredCandle.timestamp).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <span className="text-gray-600 font-medium">Open:</span>
              <span className="text-gray-900 font-semibold">₹{formatPrice(hoveredCandle.open)}</span>

              <span className="text-gray-600 font-medium">High:</span>
              <span className="text-green-600 font-semibold">₹{formatPrice(hoveredCandle.high)}</span>

              <span className="text-gray-600 font-medium">Low:</span>
              <span className="text-red-600 font-semibold">₹{formatPrice(hoveredCandle.low)}</span>

              <span className="text-gray-600 font-medium">Close:</span>
              <span className={`font-semibold ${hoveredCandle.close >= hoveredCandle.open ? 'text-green-600' : 'text-red-600'}`}>
                ₹{formatPrice(hoveredCandle.close)}
              </span>

              <span className="text-gray-600 font-medium">Volume:</span>
              <span className="text-blue-600 font-semibold">{hoveredCandle.volume.toLocaleString()}</span>
            </div>
            <div className={`mt-2 pt-2 border-t border-gray-200 text-xs font-semibold ${hoveredCandle.close >= hoveredCandle.open ? 'text-green-600' : 'text-red-600'}`}>
              Change: {((hoveredCandle.close - hoveredCandle.open) / hoveredCandle.open * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      {/* Bottom Info - Light Theme */}
      {!isFullscreen && (
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600 bg-white rounded-lg p-2 border border-gray-200">
          <div className="flex items-center space-x-4">
            <span>Chg. {formatChangePercent(changePercent)}</span>
            {isConnected && (
              <span className="text-green-600">● Live Data</span>
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
          ? "fixed inset-0 z-50 bg-white flex flex-col overflow-hidden"
          : "bg-white rounded-lg p-4 shadow-sm border border-gray-200"
      }
    >
      {chartContent}
    </div>
  );
};

export default DynamicChart;
