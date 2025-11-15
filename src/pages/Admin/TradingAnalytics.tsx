import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tradingApi } from '../../services/api';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const TradingAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [assetType, setAssetType] = useState('all');

  const { data: trades } = useQuery({
    queryKey: ['admin-trades', timeRange, assetType],
    queryFn: () => tradingApi.getTrades(assetType === 'all' ? undefined : assetType),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['admin-leaderboard'],
    queryFn: () => tradingApi.getLeaderboard(50),
  });

  // Calculate analytics
  const totalTrades = trades?.data?.length || 0;
  const cryptoTrades = trades?.data?.filter((trade: any) => trade.assetType === 'crypto').length || 0;
  const stockTrades = trades?.data?.filter((trade: any) => trade.assetType === 'stock').length || 0;
  const buyTrades = trades?.data?.filter((trade: any) => trade.side === 'buy').length || 0;
  const sellTrades = trades?.data?.filter((trade: any) => trade.side === 'sell').length || 0;

  const totalVolume = trades?.data?.reduce((sum: number, trade: any) => sum + (trade.totalAmount || 0), 0) || 0;
  // const avgTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;

  const stats = [
    {
      name: 'Total Trades',
      value: totalTrades.toLocaleString(),
      change: '+12%',
      changeType: 'positive',
      icon: ChartBarIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      name: 'Crypto Trades',
      value: cryptoTrades.toLocaleString(),
      change: '+8%',
      changeType: 'positive',
      icon: ArrowTrendingUpIcon,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      name: 'Stock Trades',
      value: stockTrades.toLocaleString(),
      change: '+15%',
      changeType: 'positive',
      icon: ArrowTrendingDownIcon,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      name: 'Total Volume',
      value: `$${totalVolume.toLocaleString()}`,
      change: '+22%',
      changeType: 'positive',
      icon: CurrencyDollarIcon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  const tradeTypes = [
    { name: 'Buy Orders', value: buyTrades, color: 'bg-green-500' },
    { name: 'Sell Orders', value: sellTrades, color: 'bg-red-500' },
  ];

  const assetTypes = [
    { name: 'Cryptocurrency', value: cryptoTrades, color: 'bg-orange-500' },
    { name: 'Stocks', value: stockTrades, color: 'bg-blue-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trading Analytics</h1>
          <p className="text-gray-400">Monitor trading activity and performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Assets</option>
            <option value="crypto">Cryptocurrency</option>
            <option value="stock">Stocks</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{stat.name}</p>
                  <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.changeType === 'positive' ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-400 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-400 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-gray-400 text-sm ml-1">from last period</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trade Types Distribution */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Trade Types Distribution</h3>
          <div className="space-y-4">
            {tradeTypes.map((type) => (
              <div key={type.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${type.color}`}></div>
                  <span className="text-gray-300">{type.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-white font-semibold">{type.value}</span>
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${type.color}`}
                      style={{ width: `${totalTrades > 0 ? (type.value / totalTrades) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asset Types Distribution */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Asset Types Distribution</h3>
          <div className="space-y-4">
            {assetTypes.map((type) => (
              <div key={type.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${type.color}`}></div>
                  <span className="text-gray-300">{type.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-white font-semibold">{type.value}</span>
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${type.color}`}
                      style={{ width: `${totalTrades > 0 ? (type.value / totalTrades) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Recent Trading Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Side
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {trades?.data?.slice(0, 10).map((trade: any) => (
                <tr key={trade.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {trade.user?.firstName?.charAt(0)}{trade.user?.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-white">
                          {trade.user?.firstName} {trade.user?.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      trade.assetType === 'crypto' 
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {trade.symbol}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">
                    {trade.tradeType?.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      trade.side === 'buy' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {trade.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    ${trade.price?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    ${trade.totalAmount?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(trade.executedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Traders */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Top Traders This Period</h3>
        <div className="space-y-3">
          {leaderboard?.data?.slice(0, 5).map((user: any, index: number) => (
            <div key={user.userId} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  index === 0 ? 'bg-yellow-500' : 
                  index === 1 ? 'bg-gray-400' : 
                  index === 2 ? 'bg-orange-500' : 'bg-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Rank #{user.rank}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-medium">
                  +{(() => {
                    const returnPercent = typeof user.totalReturnPercentage === 'number' 
                      ? user.totalReturnPercentage 
                      : parseFloat(user.totalReturnPercentage || '0');
                    return returnPercent.toFixed(2);
                  })()}%
                </p>
                <p className="text-gray-400 text-sm">
                  ${(() => {
                    const profitLoss = typeof user.totalProfitLoss === 'number' 
                      ? user.totalProfitLoss 
                      : parseFloat(user.totalProfitLoss || '0');
                    return profitLoss.toFixed(2);
                  })()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TradingAnalytics;
