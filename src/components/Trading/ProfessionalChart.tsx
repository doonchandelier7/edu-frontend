import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChartBarIcon,
  Cog6ToothIcon,
  PencilIcon,
  PlusIcon,
  BoltIcon,
  ArrowPathIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  ArrowsPointingOutIcon,
  MinusIcon,
  Square2StackIcon
} from '@heroicons/react/24/outline';
import { CandlestickData } from '../../services/chartService';

interface ChartProps {
  symbol: string;
  data: CandlestickData[];
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  onSymbolChange: (symbol: string) => void;
}

const ProfessionalChart: React.FC<ChartProps> = ({
  symbol,
  data,
  timeframe,
  onTimeframeChange,
  onSymbolChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [hoveredCandle, setHoveredCandle] = useState<CandlestickData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showIndicators, setShowIndicators] = useState(true);
  const [selectedIndicator, setSelectedIndicator] = useState('COG');

  const timeframes = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'];
  const indicators = ['COG', 'RSI', 'MACD', 'SMA', 'EMA', 'BB'];

  // Generate mock data if none provided
  const generateMockData = useCallback((symbol: string, timeframe: string): CandlestickData[] => {
    const data: CandlestickData[] = [];
    const basePrice = symbol === 'INFY' ? 1486 : symbol === 'HDFC' ? 994 : 1000;
    const days = timeframe === '1D' ? 1 : timeframe === '5D' ? 5 : timeframe === '1M' ? 30 : 
                 timeframe === '3M' ? 90 : timeframe === '6M' ? 180 : timeframe === '1Y' ? 365 : 
                 timeframe === '5Y' ? 1825 : 365;
    
    let currentPrice = basePrice;
    const now = Date.now();
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000);
      const volatility = 0.02;
      const change = (Math.random() - 0.5) * volatility;
      
      const open = currentPrice;
      const close = open * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.random() * 1000000;
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume
      });
      
      currentPrice = close;
    }
    
    return data;
  }, []);

  const chartData = data.length > 0 ? data : generateMockData(symbol, timeframe);

  // Calculate price range
  const prices = chartData.flatMap(d => [d.high, d.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
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

  const cogData = calculateCOG(chartData);

  // Draw candlestick chart
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const candleSpacing = width / chartData.length;
    // Reduce candle width to 60% of spacing for better visual separation
    const candleWidth = Math.max(2, Math.min(8, candleSpacing * 0.6));

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = (height * i) / 10;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = (width * i) / 10;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw candlesticks
    chartData.forEach((candle, index) => {
      const x = index * candleSpacing + candleSpacing / 2;
      const isGreen = candle.close >= candle.open;
      
      // Draw wick
      ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, height - ((candle.high - minPrice + padding) / (priceRange + 2 * padding)) * height);
      ctx.lineTo(x, height - ((candle.low - minPrice + padding) / (priceRange + 2 * padding)) * height);
      ctx.stroke();

      // Draw body
      const bodyTop = height - ((Math.max(candle.open, candle.close) - minPrice + padding) / (priceRange + 2 * padding)) * height;
      const bodyBottom = height - ((Math.min(candle.open, candle.close) - minPrice + padding) / (priceRange + 2 * padding)) * height;
      const bodyHeight = bodyBottom - bodyTop;

      if (bodyHeight > 0) {
        ctx.fillStyle = isGreen ? '#10b981' : '#ef4444';
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      } else {
        // Doji - draw line
        ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - candleWidth / 2, bodyTop);
        ctx.lineTo(x + candleWidth / 2, bodyTop);
        ctx.stroke();
      }
    });

    // Draw COG indicator
    if (showIndicators && selectedIndicator === 'COG' && cogData.length > 0) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
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
    }

    // Draw current price line
    if (chartData.length > 0) {
      const lastPrice = chartData[chartData.length - 1].close;
      const y = height - ((lastPrice - minPrice + padding) / (priceRange + 2 * padding)) * height;
      
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw price label
      ctx.fillStyle = '#10b981';
      ctx.font = '12px Arial';
      ctx.fillText(lastPrice.toFixed(2), width - 60, y - 5);
    }

    // Draw hovered candle info
    if (hoveredCandle) {
      const index = chartData.indexOf(hoveredCandle);
      const x = index * candleSpacing + candleSpacing / 2;
      
      // Draw vertical line
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

  }, [chartData, dimensions, minPrice, maxPrice, priceRange, padding, hoveredCandle, showIndicators, selectedIndicator, cogData]);

  // Handle mouse events
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });

    // Find hovered candle
    const candleSpacing = dimensions.width / chartData.length;
    const candleIndex = Math.floor(x / candleSpacing);
    
    if (candleIndex >= 0 && candleIndex < chartData.length) {
      setHoveredCandle(chartData[candleIndex]);
    } else {
      setHoveredCandle(null);
    }
  }, [chartData, dimensions.width]);

  const handleMouseLeave = useCallback(() => {
    setHoveredCandle(null);
  }, []);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: width - 20, height: height - 100 });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redraw chart when data changes
  useEffect(() => {
    drawChart();
  }, [drawChart]);

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const formatChange = (change: number) => {
    return change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
  };

  const formatChangePercent = (changePercent: number) => {
    return changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
  };

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].close : 0;
  const previousPrice = chartData.length > 1 ? chartData[chartData.length - 2].close : currentPrice;
  const change = currentPrice - previousPrice;
  const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-white">{symbol}</span>
            <button className="text-blue-400 hover:text-blue-300 text-sm">
              + Compare...
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{formatPrice(currentPrice)}</div>
            <div className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatChange(change)} ({formatChangePercent(changePercent)})
            </div>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
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
        </div>
      </div>

      {/* Chart Container */}
      <div ref={containerRef} className="relative">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="border border-slate-600 rounded-lg cursor-crosshair"
        />
        
        {/* Chart Controls */}
        <div className="absolute bottom-2 right-2 flex space-x-1">
          <button className="p-1 bg-slate-700 text-slate-300 hover:text-white rounded">
            <MinusIcon className="w-3 h-3" />
          </button>
          <button className="p-1 bg-slate-700 text-slate-300 hover:text-white rounded">
            <PlusIcon className="w-3 h-3" />
          </button>
          <button className="p-1 bg-slate-700 text-slate-300 hover:text-white rounded">
            <Square2StackIcon className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Indicators Panel */}
      {showIndicators && (
        <div className="mt-4 bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-white">{selectedIndicator} (10)</span>
            </div>
            <div className="flex items-center space-x-1">
              <button className="p-1 text-slate-400 hover:text-white">
                <Cog6ToothIcon className="w-3 h-3" />
              </button>
              <button className="p-1 text-slate-400 hover:text-white">
                <ArrowsPointingOutIcon className="w-3 h-3" />
              </button>
              <button 
                onClick={() => setShowIndicators(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
          
          {/* Indicator selector */}
          <div className="flex space-x-2 mb-2">
            {indicators.map((indicator) => (
              <button
                key={indicator}
                onClick={() => setSelectedIndicator(indicator)}
                className={`px-2 py-1 text-xs rounded ${
                  selectedIndicator === indicator
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-600 text-slate-300 hover:text-white'
                }`}
              >
                {indicator}
              </button>
            ))}
          </div>
          
          {/* Indicator value */}
          <div className="text-sm text-slate-300">
            Current {selectedIndicator}: {cogData.length > 0 ? cogData[cogData.length - 1].toFixed(2) : 'N/A'}
          </div>
        </div>
      )}

      {/* Hover Info */}
      {hoveredCandle && (
        <div className="absolute bg-slate-900 border border-slate-600 rounded-lg p-3 shadow-lg pointer-events-none"
             style={{ left: mousePosition.x + 10, top: mousePosition.y - 10 }}>
          <div className="text-sm text-white">
            <div>Open: {formatPrice(hoveredCandle.open)}</div>
            <div>High: {formatPrice(hoveredCandle.high)}</div>
            <div>Low: {formatPrice(hoveredCandle.low)}</div>
            <div>Close: {formatPrice(hoveredCandle.close)}</div>
            <div>Volume: {hoveredCandle.volume.toLocaleString()}</div>
            <div className="text-xs text-slate-400">
              {new Date(hoveredCandle.timestamp).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Info */}
      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <div className="flex items-center space-x-4">
          <span>Chg. {formatChangePercent(changePercent)}</span>
        </div>
        <div className="flex space-x-2">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2 py-1 text-xs rounded ${
                timeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalChart;
