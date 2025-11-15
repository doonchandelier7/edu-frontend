import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tradingApi } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/shared/Card';
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  totalValue?: number;
  totalProfitLoss?: number;
  totalPnl?: number;
  totalReturnPercentage?: number | string;
  totalPnlPercent?: number;
  avatar?: string;
}

const LeaderboardPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('weekly');
  const [limit, setLimit] = useState(50);

  const { data: leaderboard, isLoading, refetch } = useQuery({
    queryKey: ['leaderboard', timeframe, limit],
    queryFn: () => tradingApi.getLeaderboard(limit),
    select: (response) => response.data,
  });

  const { data: myRank } = useQuery({
    queryKey: ['my-rank'],
    queryFn: () => tradingApi.getMyRank(),
    select: (response) => response.data,
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <Trophy className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
      default:
        return 'bg-gray-700 text-white';
    }
  };

  const getPnlColor = (pnl: number) => {
    return pnl >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getPnlIcon = (pnl: number) => {
    return pnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
          <p className="text-gray-400">Compete with other traders and climb the rankings</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* My Rank Card */}
      {myRank && (
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Your Rank</h3>
                  <p className="text-blue-100">#{myRank.rank} out of {myRank.totalPlayers} players</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">${myRank.totalValue.toLocaleString()}</p>
                <p className={`text-lg font-semibold ${getPnlColor(myRank.totalPnl)}`}>
                  {getPnlIcon(myRank.totalPnl)}
                  <span className="ml-1">
                    {myRank.totalPnl >= 0 ? '+' : ''}${myRank.totalPnl.toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as any)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Show Top</label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <BarChart3 className="w-4 h-4" />
              <span>Updated every 5 minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Top Traders - {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading leaderboard...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard?.map((entry: LeaderboardEntry, index: number) => {
                // Handle different data structures from API
                const username = entry.username || `${entry.firstName || ''} ${entry.lastName || ''}`.trim() || 'Trader';
                const displayName = username || 'Trader';
                const initials = displayName.charAt(0).toUpperCase() || 'T';
                
                const totalValue = entry.totalValue || 0;
                const totalPnl = entry.totalPnl || entry.totalProfitLoss || 0;
                const totalPnlPercent = typeof entry.totalPnlPercent === 'number' 
                  ? entry.totalPnlPercent 
                  : typeof entry.totalReturnPercentage === 'number'
                    ? entry.totalReturnPercentage
                    : typeof entry.totalReturnPercentage === 'string'
                      ? parseFloat(entry.totalReturnPercentage) || 0
                      : 0;
                
                return (
                  <div
                    key={entry.userId || index}
                    className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                      index < 3 ? getRankColor(entry.rank || index + 1) : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getRankIcon(entry.rank || index + 1)}
                        <span className="font-bold text-lg">#{entry.rank || index + 1}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {initials}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">{displayName}</p>
                          <p className="text-sm opacity-75">Trader</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm opacity-75">Portfolio Value</p>
                        <p className="font-semibold">${totalValue.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm opacity-75">P&L</p>
                        <div className="flex items-center gap-1">
                          {getPnlIcon(totalPnl)}
                          <span className={`font-semibold ${index < 3 ? 'text-white' : getPnlColor(totalPnl)}`}>
                            {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm opacity-75">P&L %</p>
                        <p className={`font-semibold ${index < 3 ? 'text-white' : getPnlColor(totalPnl)}`}>
                          {totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Players</p>
                <p className="text-2xl font-bold text-white">1,247</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active This Week</p>
                <p className="text-2xl font-bold text-white">892</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Top Performer</p>
                <p className="text-2xl font-bold text-white">+127.5%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaderboardPage;