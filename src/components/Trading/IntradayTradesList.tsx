import React, { useState, useEffect } from 'react';
import { tradingApi, IntradayTrade } from '../../services/tradingApi';

const IntradayTradesList: React.FC = () => {
  const [trades, setTrades] = useState<IntradayTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    fetchIntradayTrades();
  }, [selectedDate]);

  const fetchIntradayTrades = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tradingApi.getIntradayTrades(selectedDate);
      setTrades(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch intraday trades');
      console.error('Error fetching intraday trades:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getTotalProfitLoss = () => {
    const buyTrades = trades.filter(t => t.side === 'buy' && t.status === 'executed');
    const sellTrades = trades.filter(t => t.side === 'sell' && t.status === 'executed');
    
    const totalBuyAmount = buyTrades.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalSellAmount = sellTrades.reduce((sum, t) => sum + t.totalAmount, 0);
    
    return totalSellAmount - totalBuyAmount;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  const totalPnL = getTotalProfitLoss();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Intraday Trades</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Date:
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="ml-2 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              max={new Date().toISOString().split('T')[0]}
            />
          </label>
          <button
            onClick={fetchIntradayTrades}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {trades.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No intraday trades found for {formatDate(selectedDate)}</p>
        </div>
      ) : (
        <>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total P&L:</span>
              <span
                className={`text-lg font-bold ${
                  totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(totalPnL)}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Total Trades: {trades.length} | 
              Buy: {trades.filter(t => t.side === 'buy').length} | 
              Sell: {trades.filter(t => t.side === 'sell').length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Side
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(trade.executedAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {trade.symbol}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          trade.side === 'buy'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {trade.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {trade.tradeType.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {trade.quantity}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(trade.price)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(trade.totalAmount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          trade.status === 'executed'
                            ? 'bg-green-100 text-green-800'
                            : trade.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {trade.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default IntradayTradesList;

