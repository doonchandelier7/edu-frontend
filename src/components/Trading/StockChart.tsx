import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  time: string;
  price: number;
  volume?: number;
}

interface StockChartProps {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}

const StockChart: React.FC<StockChartProps> = ({ symbol, name, currentPrice, change, changePercent }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('1D');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('StockChart: Generating chart data for', symbol, 'timeframe:', timeframe, 'price:', currentPrice);
    generateChartData();
  }, [currentPrice, timeframe]);

  const generateChartData = () => {
    try {
      setLoading(true);
      setError(null);
      
      const data: ChartData[] = [];
      const now = new Date();
      let points = 24; // Default to 24 hours
      
      switch (timeframe) {
        case '1D':
          points = 24;
          break;
        case '1W':
          points = 7;
          break;
        case '1M':
          points = 30;
          break;
        case '3M':
          points = 90;
          break;
        case '1Y':
          points = 365;
          break;
      }

      for (let i = points; i >= 0; i--) {
        const time = new Date(now.getTime() - i * (24 * 60 * 60 * 1000) / points);
        const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
        const price = currentPrice * (1 + variation);
        
        data.push({
          time: time.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            ...(timeframe === '1W' || timeframe === '1M' || timeframe === '3M' || timeframe === '1Y' ? {
              month: 'short',
              day: 'numeric'
            } : {})
          }),
          price: Math.round(price * 100) / 100,
          volume: Math.floor(Math.random() * 1000000) + 100000
        });
      }
      
      console.log('StockChart: Generated', data.length, 'data points');
      setChartData(data);
    } catch (err) {
      console.error('Error generating chart data:', err);
      setError('Failed to generate chart data');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString()}`;
  };

  const formatChange = (change: number) => {
    return change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
  };

  const formatChangePercent = (changePercent: number) => {
    return changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 h-96 border border-slate-700/60 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 h-96 border border-slate-700/60 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={generateChartData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/60">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Price Chart</h3>
        <div className="flex items-center space-x-2">
          {['1D', '1W', '1M', '3M', '1Y'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                timeframe === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatPrice}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: any) => [formatPrice(value), 'Price']}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={change >= 0 ? '#10B981' : '#EF4444'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: change >= 0 ? '#10B981' : '#EF4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="bg-slate-700/50 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Open</p>
          <p className="font-bold text-white">{formatPrice(chartData[0]?.price || currentPrice)}</p>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">High</p>
          <p className="font-bold text-white">{formatPrice(Math.max(...chartData.map(d => d.price)))}</p>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Low</p>
          <p className="font-bold text-white">{formatPrice(Math.min(...chartData.map(d => d.price)))}</p>
        </div>
        <div className="bg-slate-700/50 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Volume</p>
          <p className="font-bold text-white">{chartData[chartData.length - 1]?.volume?.toLocaleString() || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default StockChart;