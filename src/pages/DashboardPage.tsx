import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tradingApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import OnboardingTour from '../components/Onboarding/OnboardingTour';
import {
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  TrophyIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  SparklesIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user should see onboarding
  useEffect(() => {
    if (user?.id) {
      const onboardingCompleted = localStorage.getItem(`onboardingCompleted_${user.id}`);
      const onboardingSkipped = localStorage.getItem(`onboardingSkipped_${user.id}`);
      
      // Show onboarding if user hasn't completed or skipped it
      if (!onboardingCompleted && !onboardingSkipped) {
        // Small delay to let page render first
        setTimeout(() => {
          setShowOnboarding(true);
        }, 500);
      }
    } else {
      // Fallback for users without ID
      const onboardingCompleted = localStorage.getItem('onboardingCompleted');
      const onboardingSkipped = localStorage.getItem('onboardingSkipped');
      
      if (!onboardingCompleted && !onboardingSkipped) {
        setTimeout(() => {
          setShowOnboarding(true);
        }, 500);
      }
    }
  }, [user]);

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => tradingApi.getPortfolio(),
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => tradingApi.getLeaderboard(10),
  });

  const { data: recentTrades } = useQuery({
    queryKey: ['recentTrades'],
    queryFn: () => tradingApi.getTrades(),
  });

  const { data: myRank } = useQuery({
    queryKey: ['myRank'],
    queryFn: () => tradingApi.getMyRank(),
  });

  const quickActions = [
    {
      name: 'Start Trading',
      description: 'Buy and sell crypto or stocks',
      icon: ChartBarIcon,
      href: '/trading',
      color: 'bg-gradient-to-r from-orange-500 to-red-500',
    },
    {
      name: 'Start Learning',
      description: 'Enroll in courses',
      icon: AcademicCapIcon,
      href: '/courses',
      color: 'bg-gradient-to-r from-green-500 to-teal-500',
    },
    {
      name: 'View Leaderboard',
      description: 'Check your ranking',
      icon: TrophyIcon,
      href: '/leaderboard',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    },
  ];

  const portfolioStats = [
    {
      name: 'Crypto Wallet',
      value: portfolio?.data?.cryptoWalletBalance || 0,
      format: 'currency',
      icon: CurrencyDollarIcon,
      color: 'text-orange-500',
    },
    {
      name: 'Stock Wallet',
      value: portfolio?.data?.stockWalletBalance || 0,
      format: 'currency',
      icon: CurrencyDollarIcon,
      color: 'text-blue-500',
    },
    {
      name: 'Total P&L',
      value: portfolio?.data?.totalProfitLoss || 0,
      format: 'currency',
      icon: portfolio?.data?.totalProfitLoss >= 0 ? ArrowUpIcon : ArrowDownIcon,
      color: portfolio?.data?.totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500',
    },
    {
      name: 'Return %',
      value: typeof portfolio?.data?.totalReturnPercentage === 'number' 
        ? portfolio.data.totalReturnPercentage 
        : parseFloat(portfolio?.data?.totalReturnPercentage || '0'),
      format: 'percentage',
      icon: ChartBarIcon,
      color: 'text-purple-500',
    },
  ];

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
      default:
        return value.toLocaleString('en-IN');
    }
  };

  const totalPortfolioValue = (portfolio?.data?.cryptoWalletBalance || 0) + (portfolio?.data?.stockWalletBalance || 0);
  const recentTradesList = recentTrades?.data?.slice(0, 5) || [];
  const topHoldings = portfolio?.data?.items?.slice(0, 5) || [];

  return (
    <>
      {showOnboarding && (
        <OnboardingTour
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
      
      <div className="space-y-6 pb-8">
        {/* Welcome Section - Enhanced */}
        <div 
          data-tour="dashboard"
          className="relative bg-gradient-to-br from-teal-600 via-blue-600 to-purple-600 rounded-2xl p-8 text-white overflow-hidden shadow-2xl"
        >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.firstName || 'Trader'}! 👋
              </h1>
              <p className="text-white/90 text-lg">
                Track your trading performance, continue learning, and compete on leaderboards.
              </p>
            </div>
            {myRank?.data && (
              <div className="hidden md:block bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/30">
                <div className="text-white/80 text-sm mb-1">Your Rank</div>
                <div className="text-3xl font-bold text-white">#{myRank.data.rank || 'N/A'}</div>
                <div className="text-white/70 text-xs mt-1">Out of {leaderboard?.data?.length || 0} traders</div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-white/80 text-sm mb-1">Total Portfolio Value</div>
              <div className="text-2xl font-bold text-white">
                ₹{totalPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-white/80 text-sm mb-1">Total P&L</div>
              <div className={`text-2xl font-bold ${(portfolio?.data?.totalProfitLoss || 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {formatValue(portfolio?.data?.totalProfitLoss || 0, 'currency')}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-white/80 text-sm mb-1">Return %</div>
              <div className={`text-2xl font-bold ${(portfolio?.data?.totalReturnPercentage || 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {formatValue(
                  typeof portfolio?.data?.totalReturnPercentage === 'number' 
                    ? portfolio.data.totalReturnPercentage 
                    : parseFloat(portfolio?.data?.totalReturnPercentage || '0'),
                  'percentage'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Stats - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {portfolioStats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.value >= 0;
          return (
            <div 
              key={stat.name} 
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                {stat.name === 'Total P&L' || stat.name === 'Return %' ? (
                  isPositive ? (
                    <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />
                  )
                ) : null}
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">{stat.name}</p>
                <p className={`text-3xl font-bold ${stat.name === 'Total P&L' || stat.name === 'Return %' ? (isPositive ? 'text-green-400' : 'text-red-400') : 'text-white'}`}>
                  {portfolioLoading ? (
                    <span className="inline-block w-20 h-8 bg-gray-700 rounded animate-pulse"></span>
                  ) : (
                    formatValue(stat.value, stat.format)
                  )}
                </p>
                {stat.name === 'Crypto Wallet' || stat.name === 'Stock Wallet' ? (
                  <p className="text-gray-500 text-xs mt-2">
                    {stat.name === 'Crypto Wallet' ? 'Cryptocurrency' : 'Stocks'} balance
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const isTradingAction = action.name === 'Start Trading';
          return (
            <Link
              key={action.name}
              to={action.href}
              data-tour={isTradingAction ? 'trading' : undefined}
              className={`${action.color} rounded-xl p-6 text-white hover:opacity-90 transition-all duration-300 hover:shadow-2xl hover:scale-105 group relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <Icon className="h-10 w-10" />
                  <ArrowRightIcon className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-xl font-bold mb-2">{action.name}</h3>
                <p className="text-white/90">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Leaderboard Preview & Portfolio Items - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard Preview - Enhanced */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden" data-tour="leaderboard">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrophyIcon className="h-6 w-6 text-white" />
                <h2 className="text-xl font-bold text-white">Top Traders</h2>
              </div>
              <FireIcon className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
          <div className="p-6">
            {leaderboardLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded animate-pulse mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {leaderboard?.data?.slice(0, 5).map((user: any, index: number) => {
                  const returnPercent = typeof user.totalReturnPercentage === 'number' 
                    ? user.totalReturnPercentage 
                    : parseFloat(user.totalReturnPercentage || '0');
                  const isTopThree = index < 3;
                  return (
                    <div 
                      key={user.userId} 
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-all hover:bg-gray-700/50 ${
                        isTopThree ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
                        'bg-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-sm font-medium ${returnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(2)}%
                          </span>
                          <span className="text-gray-500 text-xs">
                            ₹{(user.totalProfitLoss || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      {isTopThree && <SparklesIcon className="h-5 w-5 text-yellow-400" />}
                    </div>
                  );
                })}
              </div>
            )}
            <Link
              to="/leaderboard"
              className="block mt-6 text-center py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-teal-400 hover:text-teal-300 font-medium transition-colors"
            >
              View Full Leaderboard →
            </Link>
          </div>
        </div>

        {/* Portfolio Items Preview - Enhanced */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-6 w-6 text-white" />
                <h2 className="text-xl font-bold text-white">Your Holdings</h2>
              </div>
              <span className="text-white/80 text-sm">
                {topHoldings.length} {topHoldings.length === 1 ? 'asset' : 'assets'}
              </span>
            </div>
          </div>
          <div className="p-6">
            {portfolioLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-700 rounded-full animate-pulse"></div>
                      <div>
                        <div className="h-4 bg-gray-700 rounded w-20 animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-gray-700 rounded w-24 animate-pulse mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-20 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {topHoldings.length > 0 ? (
                  topHoldings.map((item: any) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                          item.assetType === 'crypto' 
                            ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        }`}>
                          {item.symbol.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{item.symbol}</div>
                          <div className="text-gray-400 text-sm">{item.quantity} {item.quantity === 1 ? 'share' : 'shares'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">
                          ₹{item.totalValue?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`text-sm font-medium flex items-center justify-end space-x-1 ${
                          item.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {item.profitLoss >= 0 ? (
                            <ArrowUpIcon className="h-4 w-4" />
                          ) : (
                            <ArrowDownIcon className="h-4 w-4" />
                          )}
                          <span>
                            {item.profitLoss >= 0 ? '+' : ''}₹{Math.abs(item.profitLoss || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    <ChartBarIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">No holdings yet</p>
                    <p className="text-sm mb-4">Start trading to build your portfolio</p>
                    <Link
                      to="/trading"
                      className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Start Trading
                    </Link>
                  </div>
                )}
              </div>
            )}
            {topHoldings.length > 0 && (
              <Link
                to="/portfolio"
                data-tour="portfolio"
                className="block mt-6 text-center py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-teal-400 hover:text-teal-300 font-medium transition-colors"
              >
                View Full Portfolio →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Recent Trades Section - New */}
      {recentTradesList.length > 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-6 w-6 text-white" />
                <h2 className="text-xl font-bold text-white">Recent Trades</h2>
              </div>
              <Link
                to="/portfolio"
                className="text-white/90 hover:text-white text-sm font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentTradesList.map((trade: any, index: number) => {
                const price = typeof trade.price === 'number' 
                  ? trade.price 
                  : typeof trade.price === 'string' 
                    ? parseFloat(trade.price) || 0 
                    : 0;
                const quantity = typeof trade.quantity === 'number' 
                  ? trade.quantity 
                  : typeof trade.quantity === 'string' 
                    ? parseFloat(trade.quantity) || 0 
                    : 0;
                
                return (
                  <div 
                    key={trade.id || index} 
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                        trade.side === 'buy' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {trade.side === 'buy' ? 'B' : 'S'}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{trade.symbol || 'N/A'}</div>
                        <div className="text-gray-400 text-sm">
                          {quantity} {quantity === 1 ? 'share' : 'shares'} @ ₹{price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        trade.side === 'buy' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.side === 'buy' ? 'Buy' : 'Sell'}
                      </div>
                      <div className="text-gray-400 text-xs mt-1">
                        {trade.createdAt ? new Date(trade.createdAt).toLocaleDateString() : 'Recently'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default DashboardPage;

