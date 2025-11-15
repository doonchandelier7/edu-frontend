import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ChartBarIcon,
  NewspaperIcon,
  CalendarIcon,
  LightBulbIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlayIcon,
  CheckCircleIcon,
  StarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  TrophyIcon,
  ShieldCheckIcon,
  BoltIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  WalletIcon,
  ClipboardDocumentListIcon,
  PresentationChartLineIcon,
  BookOpenIcon,
  CogIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

// Enhanced Chart Component
const StockChartVisual: React.FC<{ isPositive: boolean; height?: number }> = ({ isPositive, height = 200 }) => {
  const points = 50;
  const width = 100;
  const chartHeight = height - 20;
  const padding = 10;
  
  const data = Array.from({ length: points }, (_, i) => {
    const base = isPositive ? 0.3 : 0.7;
    const variation = (Math.sin(i / 5) + Math.random() * 0.3) * 0.4;
    return base + variation;
  });

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pathData = data.map((value, i) => {
    const x = (i / (points - 1)) * (width - padding * 2) + padding;
    const y = chartHeight - ((value - min) / range) * (chartHeight - padding * 2) - padding;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const fillPath = `${pathData} L ${width - padding} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`;

  return (
    <svg width="100%" height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${isPositive ? 'green' : 'red'}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isPositive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'} />
          <stop offset="100%" stopColor={isPositive ? 'rgba(34, 197, 94, 0)' : 'rgba(239, 68, 68, 0)'} />
        </linearGradient>
      </defs>
      <path
        d={fillPath}
        fill={`url(#gradient-${isPositive ? 'green' : 'red'})`}
      />
      <path
        d={pathData}
        fill="none"
        stroke={isPositive ? '#22c55e' : '#ef4444'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const LandingPage: React.FC = () => {
  const { isAuthenticated, user, refreshAuth } = useAuth();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [animatedItems, setAnimatedItems] = useState<boolean[]>([]);
  const [isTradeMenuOpen, setIsTradeMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Fetch user profile when authenticated
  useEffect(() => {
    if (isAuthenticated && !user) {
      // User is authenticated but profile not loaded, fetch it
      refreshAuth();
    }
  }, [isAuthenticated, user, refreshAuth]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Animate items sequentially
            const items = [true, false, false, false];
            items.forEach((_, index) => {
              setTimeout(() => {
                setAnimatedItems((prev) => {
                  const newItems = [...prev];
                  newItems[index] = true;
                  return newItems;
                });
              }, index * 200);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('paper-trading-section');
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isTradeMenuOpen && !target.closest('.trade-dropdown-container')) {
        setIsTradeMenuOpen(false);
      }
    };

    if (isTradeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTradeMenuOpen]);

  const stats = [
    { label: 'Active Traders', value: '50,000+', icon: UserGroupIcon, color: 'text-blue-600' },
    { label: 'Total Trades', value: '2.5M+', icon: ChartBarIcon, color: 'text-green-600' },
    { label: 'Courses Completed', value: '100K+', icon: AcademicCapIcon, color: 'text-purple-600' },
    { label: 'Avg. Returns', value: '35%', icon: TrophyIcon, color: 'text-orange-600' },
  ];

  const indianIndices = [
    { name: 'Nifty 50', value: '22,456.78', change: '+1.45%', positive: true, volume: '₹45.2B' },
    { name: 'Sensex', value: '73,892.45', change: '+1.23%', positive: true, volume: '₹38.5B' },
    { name: 'Nifty Bank', value: '48,234.12', change: '-0.34%', positive: false, volume: '₹12.3B' },
    { name: 'Nifty IT', value: '35,678.90', change: '+2.12%', positive: true, volume: '₹8.9B' },
  ];

  const topNews = [
    { title: 'Indian Markets Rally on Strong Economic Data', time: '2h ago', category: 'Markets', trending: true },
    { title: 'Nifty 50 Hits New All-Time High', time: '4h ago', category: 'Indices', trending: true },
    { title: 'IT Stocks Surge on Positive Earnings Outlook', time: '6h ago', category: 'Technology', trending: false },
    { title: 'RBI Policy Decision Expected This Week', time: '8h ago', category: 'Economy', trending: false },
  ];

  const indianStocks = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', price: '₹2,456.78', change: '+1.23%', positive: true, volume: '12.5M', sector: 'Energy' },
    { symbol: 'TCS', name: 'Tata Consultancy', price: '₹3,678.45', change: '+2.34%', positive: true, volume: '8.2M', sector: 'IT' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', price: '₹1,678.90', change: '-0.45%', positive: false, volume: '15.3M', sector: 'Banking' },
    { symbol: 'INFY', name: 'Infosys', price: '₹1,456.23', change: '+1.89%', positive: true, volume: '9.7M', sector: 'IT' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank', price: '₹1,023.45', change: '+0.67%', positive: true, volume: '11.2M', sector: 'Banking' },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', price: '₹2,345.67', change: '-0.23%', positive: false, volume: '5.8M', sector: 'FMCG' },
  ];

  const bitcoinData = {
    symbol: 'BTC/INR',
    name: 'Bitcoin',
    price: '₹34,56,789',
    change: '+2.45%',
    positive: true,
    marketCap: '₹68.2T',
    volume24h: '₹1.2T',
    high24h: '₹35,12,000',
    low24h: '₹33,89,500',
  };

  const tradingIdeas = [
    {
      title: 'Bullish Pattern on RELIANCE',
      description: 'Strong support at ₹2,400 with potential breakout above ₹2,500. RSI indicates oversold conditions.',
      type: 'Bullish',
      symbol: 'RELIANCE',
      confidence: 'High',
    },
    {
      title: 'TCS Shows Momentum',
      description: 'Technical indicators suggest continued upward movement. MACD crossover confirms bullish trend.',
      type: 'Bullish',
      symbol: 'TCS',
      confidence: 'Medium',
    },
    {
      title: 'Bitcoin Consolidation Phase',
      description: 'Range-bound trading expected between ₹33L-35L. Watch for breakout signals above resistance.',
      type: 'Neutral',
      symbol: 'BTC',
      confidence: 'Medium',
    },
  ];

  const economicEvents = [
    { date: 'Today', time: '14:30', country: 'IN', event: 'RBI Policy Decision', impact: 'High', description: 'Interest rate announcement' },
    { date: 'Tomorrow', time: '10:00', country: 'IN', event: 'GDP Growth Rate', impact: 'High', description: 'Q4 2024 GDP data release' },
    { date: 'Tomorrow', time: '15:00', country: 'IN', event: 'Inflation Data', impact: 'Medium', description: 'CPI and WPI figures' },
  ];

  const features = [
    {
      icon: ChartBarIcon,
      title: 'Real-Time Market Data',
      description: 'Live updates on Indian stocks and Bitcoin prices with professional-grade charts and technical indicators',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: AcademicCapIcon,
      title: 'Learn While Trading',
      description: 'Comprehensive educational resources, video tutorials, and interactive courses to master trading strategies',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Risk-Free Environment',
      description: 'Practice trading with virtual money before investing real capital. Learn from mistakes without financial loss',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: BoltIcon,
      title: 'Advanced Analytics',
      description: 'Professional technical indicators, market analysis tools, and AI-powered insights at your fingertips',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: TrophyIcon,
      title: 'Competitive Leaderboards',
      description: 'Compete with traders worldwide, earn badges, and track your performance against the best',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: GlobeAltIcon,
      title: 'Global Market Access',
      description: 'Trade Indian stocks and cryptocurrencies with real-time data from major exchanges worldwide',
      color: 'from-indigo-500 to-purple-500',
    },
  ];

  const testimonials = [
    { name: 'Rajesh Kumar', role: 'Day Trader', text: 'EduCrypto helped me understand market dynamics without risking real money. My returns improved by 40%!', rating: 5 },
    { name: 'Priya Sharma', role: 'Investor', text: 'The educational content is excellent. I learned technical analysis and now trade confidently.', rating: 5 },
    { name: 'Amit Patel', role: 'Beginner', text: 'Perfect platform for beginners. The risk-free environment let me practice until I was ready.', rating: 5 },
  ];

  // Navigation items for sidebar
  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Markets', href: '#markets', icon: ChartBarIcon },
    { name: 'Portfolio', href: '/portfolio', icon: WalletIcon },
    { name: 'Orders', href: '/trading', icon: ClipboardDocumentListIcon },
    { name: 'Analysis', href: '/portfolio', icon: PresentationChartLineIcon },
    { name: 'Leaderboard', href: '/leaderboard', icon: TrophyIcon },
    { name: 'Learn', href: '/learn', icon: BookOpenIcon },
    { name: 'Settings', href: '/profile', icon: CogIcon },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 ${isAuthenticated ? 'flex' : ''}`}>
      {isAuthenticated ? (
        <>
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="fixed top-4 left-4 z-[60] md:hidden bg-white p-2 rounded-lg shadow-lg hover:bg-gray-100 transition"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
              <XMarkIcon className="w-6 h-6 text-gray-800" />
            ) : (
              <Bars3Icon className="w-6 h-6 text-gray-800" />
            )}
          </button>

          {/* Sidebar */}
          <aside
            className={`
              fixed md:static top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-40
              transform transition-transform duration-300 ease-in-out
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
              ${isSidebarCollapsed ? 'w-20' : 'w-64'}
            `}
          >
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <Link to="/dashboard" className="flex items-center space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                        <Bars3Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    {!isSidebarCollapsed && (
                      <span className="text-xl font-bold text-purple-600">EduCrypto</span>
                    )}
                  </Link>
                  <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="hidden md:block p-1 rounded hover:bg-gray-100 transition"
                    aria-label="Toggle sidebar"
                  >
                    {isSidebarCollapsed ? (
                      <ChevronDownIcon className="w-5 h-5 text-gray-500 rotate-[-90deg]" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-500 rotate-90" />
                    )}
                  </button>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href || 
                    (item.href === '/dashboard' && location.pathname === '/');
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`
                        flex items-center ${isSidebarCollapsed ? 'justify-center px-3' : 'px-4'} py-3 text-sm font-medium rounded-lg transition-colors
                        ${isActive 
                          ? 'bg-purple-50 text-purple-600' 
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                      title={isSidebarCollapsed ? item.name : ''}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-purple-600' : 'text-gray-500'}`} />
                      {!isSidebarCollapsed && <span className="ml-3">{item.name}</span>}
                    </Link>
                  );
                })}
              </nav>

              {/* User Profile Section */}
              <div className="p-4 border-t border-gray-200">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
                      </span>
                    </div>
                    {!isSidebarCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {user?.firstName || 'User'} {user?.lastName || ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user?.subscriptionPlan ? `${user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1)} Plan` : 'Free Plan'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Overlay for mobile */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </>
      ) : (
        /* Top Navigation for non-authenticated users */
        <nav className="bg-white/10 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <Link to="/" className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">E</span>
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    EduCrypto
                  </span>
                </Link>
                <div className="hidden md:flex space-x-6 items-center">
                  <a href="#markets" className="text-white hover:text-blue-400 transition font-medium">Markets</a>
                  
                  {/* Trade Dropdown Menu */}
                  <div className="relative trade-dropdown-container">
                    <button
                      onClick={() => setIsTradeMenuOpen(!isTradeMenuOpen)}
                      className="flex items-center space-x-1 text-white hover:text-blue-400 transition font-medium"
                    >
                      <span>Trade</span>
                      {isTradeMenuOpen ? (
                        <ChevronUpIcon className="w-4 h-4 transition-transform" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4 transition-transform" />
                      )}
                    </button>
                    
                    {/* Dropdown Menu */}
                    {isTradeMenuOpen && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 py-2 z-50 transform transition-all duration-200 ease-out opacity-100 translate-y-0">
                        <a
                          href="#stocks"
                          onClick={() => setIsTradeMenuOpen(false)}
                          className="block px-4 py-2 text-white hover:bg-white/10 hover:text-blue-400 transition font-medium"
                        >
                          Trade Stocks
                        </a>
                        <a
                          href="#crypto"
                          onClick={() => setIsTradeMenuOpen(false)}
                          className="block px-4 py-2 text-white hover:bg-white/10 hover:text-blue-400 transition font-medium"
                        >
                          Trade Crypto
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <a href="#features" className="text-white hover:text-blue-400 transition font-medium">Features</a>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="hidden sm:block px-5 py-2 text-sm font-medium text-white hover:text-blue-400 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition transform hover:scale-105"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <div className={`flex-1 min-h-screen ${isAuthenticated ? 'md:ml-0' : ''}`}>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)'
          }}></div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            <div className="inline-block mb-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              🚀 Start Trading Today - No Risk, All Learning
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
              Look First<br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Then Leap
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto px-4">
              Master Indian stocks and Bitcoin trading in a risk-free environment with real-time data, professional tools, and expert guidance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4 mb-12">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:shadow-2xl transition transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <span>Start Free Trial</span>
                    <ArrowTrendingUpIcon className="w-5 h-5 rotate-45" />
                  </Link>
                  <button className="w-full sm:w-auto px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition flex items-center justify-center space-x-2">
                    <PlayIcon className="w-5 h-5" />
                    <span>Watch Demo</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:shadow-2xl transition transform hover:scale-105"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto px-4">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <Icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-xs text-white/80">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Wave Shape Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(17, 24, 39)"/>
          </svg>
        </div>
      </div>

      {/* Educational Paper Trading Section with Animations */}
      <div id="paper-trading-section" className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-16 sm:py-20 lg:py-24 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white text-sm font-medium animate-pulse">
              📚 Learn Without Risk
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              What is <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Paper Trading</span>?
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
              Master the art of trading stocks and crypto in a completely risk-free environment
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-12">
            {/* Left Side - Animated Content */}
            <div className="space-y-6">
              {[
                {
                  icon: ShieldCheckIcon,
                  title: 'Risk-Free Learning',
                  description: 'Practice trading with virtual money. No real capital at risk while you learn the fundamentals of stock and crypto trading.',
                  delay: 0,
                },
                {
                  icon: ChartBarIcon,
                  title: 'Real Market Data',
                  description: 'Trade with live market prices and real-time data from Indian stock exchanges and global crypto markets.',
                  delay: 1,
                },
                {
                  icon: AcademicCapIcon,
                  title: 'Learn by Doing',
                  description: 'Apply trading strategies, test your skills, and build confidence before investing real money in the markets.',
                  delay: 2,
                },
                {
                  icon: TrophyIcon,
                  title: 'Track Your Progress',
                  description: 'Monitor your performance, analyze your trades, and improve your strategies with detailed analytics and insights.',
                  delay: 3,
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                const isAnimated = animatedItems[idx] || false;
                return (
                  <div
                    key={idx}
                    className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border-2 border-white/20 hover:border-blue-400/50 transition-all duration-500 transform ${
                      isAnimated
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-10'
                    }`}
                    style={{ transitionDelay: `${idx * 200}ms` }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform transition-all duration-500 ${
                        isAnimated ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
                      }`} style={{ transitionDelay: `${idx * 200 + 100}ms` }}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-gray-300 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Side - Animated Visual */}
            <div className={`relative transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-ping"></div>
                  <div className="absolute bottom-10 right-10 w-24 h-24 bg-white rounded-full animate-pulse"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <div className="inline-block mb-4 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-white text-lg font-semibold">
                      💰 Virtual Trading Portfolio
                    </div>
                    <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                      Start with ₹1,00,000
                    </h3>
                    <p className="text-white/90 text-lg">
                      Virtual money to practice and learn
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                      <div className="text-white/80 text-sm mb-1">Stocks</div>
                      <div className="text-2xl font-bold text-white">₹60,000</div>
                      <div className="text-green-300 text-xs mt-1">+12.5%</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                      <div className="text-white/80 text-sm mb-1">Crypto</div>
                      <div className="text-2xl font-bold text-white">₹40,000</div>
                      <div className="text-green-300 text-xs mt-1">+8.3%</div>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/90 text-sm">Total Portfolio Value</span>
                      <ArrowTrendingUpIcon className="w-5 h-5 text-green-300" />
                    </div>
                    <div className="text-3xl font-bold text-white">₹1,08,400</div>
                    <div className="text-green-300 text-sm mt-1">+8.4% Overall</div>
                  </div>

                  <div className="mt-6 flex items-center justify-center space-x-2 text-white/80 text-sm">
                    <CheckCircleIcon className="w-5 h-5 text-green-300" />
                    <span>Real-time market prices</span>
                  </div>
                </div>
              </div>

              {/* Floating Animation Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full opacity-80 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }}></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-green-400 rounded-full opacity-80 animate-bounce" style={{ animationDelay: '1s', animationDuration: '2.5s' }}></div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mt-16">
            <h3 className="text-2xl sm:text-3xl font-bold text-center text-white mb-8">
              How Paper Trading Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  step: '01',
                  title: 'Sign Up & Get Started',
                  description: 'Create your free account and receive virtual capital to start trading immediately.',
                  color: 'from-blue-500 to-cyan-500',
                },
                {
                  step: '02',
                  title: 'Practice Trading',
                  description: 'Buy and sell stocks and crypto using real market data. Learn technical analysis and trading strategies.',
                  color: 'from-purple-500 to-pink-500',
                },
                {
                  step: '03',
                  title: 'Learn & Improve',
                  description: 'Track your performance, learn from mistakes, and build confidence before trading with real money.',
                  color: 'from-orange-500 to-red-500',
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 lg:p-8 border-2 border-white/20 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${idx * 150}ms` }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mb-4 text-white text-2xl font-bold`}>
                    {step.step}
                  </div>
                  <h4 className="text-xl font-bold text-white mb-3">{step.title}</h4>
                  <p className="text-gray-300 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <div className={`text-center mt-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {!isAuthenticated ? (
              <Link
                to="/register"
                className="inline-block px-8 py-4 lg:px-12 lg:py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-2xl transition transform hover:scale-105 text-lg"
              >
                Start Paper Trading Now - It's Free!
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className="inline-block px-8 py-4 lg:px-12 lg:py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-2xl transition transform hover:scale-105 text-lg"
              >
                Go to Your Trading Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 sm:py-16 lg:py-20" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Why Choose EduCrypto?</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Everything you need to become a successful trader, all in one platform
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 lg:p-8 border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Market Overview Section */}
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 sm:py-16 lg:py-20" id="markets">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 lg:mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">Indian Market Overview</h2>
              <p className="text-gray-300">Real-time market data and insights</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-green-400 font-semibold mt-4 sm:mt-0">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live Market Data</span>
            </div>
          </div>
          
          {/* Main Chart Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
            <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-6 lg:p-8 border-2 border-white/20 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">Nifty 50</h3>
                  <p className="text-sm text-gray-300 mt-1">NSE India • Last updated: 2 min ago</p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1">22,456.78</div>
                  <div className="flex items-center space-x-2 text-green-400 font-semibold text-lg">
                    <ArrowTrendingUpIcon className="w-5 h-5" />
                    <span>+1.45% (+321.23)</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Volume: ₹45.2B</div>
                </div>
              </div>
              <div className="h-64 sm:h-80 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <StockChartVisual isPositive={true} height={280} />
              </div>
            </div>
            
            {/* Top News Sidebar */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <NewspaperIcon className="w-6 h-6 text-blue-400 mr-2" />
                  <h3 className="text-xl font-bold text-white">Top News</h3>
                </div>
                <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">View All</button>
              </div>
              <div className="space-y-4">
                {topNews.map((news, idx) => (
                  <div key={idx} className="border-b border-white/20 pb-4 last:border-0 hover:bg-white/10 rounded-lg p-3 transition cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-white flex-1 pr-2">{news.title}</h4>
                      {news.trending && <span className="text-xs text-orange-400">🔥</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2 py-1 bg-blue-500/30 text-blue-300 rounded-full font-medium">{news.category}</span>
                      <p className="text-xs text-gray-400">{news.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Indian Market Indices */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {indianIndices.map((index, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-lg rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-gray-300">{index.name}</div>
                  {index.positive ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="text-xl lg:text-2xl font-bold text-white mb-2">{index.value}</div>
                <div className={`flex items-center space-x-1 text-sm font-bold mb-3 ${index.positive ? 'text-green-400' : 'text-red-400'}`}>
                  {index.positive ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                  <span>{index.change}</span>
                </div>
                <div className="text-xs text-gray-400 mb-2">Vol: {index.volume}</div>
                <div className="h-16 bg-white/5 rounded-lg border border-white/20 p-2">
                  <StockChartVisual isPositive={index.positive} height={60} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Indian Stocks Section */}
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 sm:py-16 lg:py-20" id="stocks">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 lg:mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">Popular Indian Stocks</h2>
              <p className="text-gray-300">Top performing stocks on NSE & BSE</p>
            </div>
            <ChartBarIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 mt-4 sm:mt-0" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {indianStocks.map((stock, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-lg rounded-xl lg:rounded-2xl p-5 lg:p-6 border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg lg:text-xl font-bold text-white">{stock.symbol}</h3>
                      <span className="text-xs px-2 py-1 bg-white/20 text-gray-300 rounded-full">{stock.sector}</span>
                    </div>
                    <p className="text-sm text-gray-400">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl lg:text-2xl font-bold text-white">{stock.price}</div>
                    <div className={`flex items-center justify-end space-x-1 text-sm font-bold ${stock.positive ? 'text-green-400' : 'text-red-400'}`}>
                      {stock.positive ? <ArrowTrendingUpIcon className="w-4 h-4" /> : <ArrowTrendingDownIcon className="w-4 h-4" />}
                      <span>{stock.change}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Vol: {stock.volume}</div>
                  </div>
                </div>
                <div className="h-32 lg:h-40 bg-white/5 rounded-lg border border-white/20 p-2">
                  <StockChartVisual isPositive={stock.positive} height={140} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bitcoin Section */}
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 sm:py-16 lg:py-20" id="crypto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">Bitcoin Trading</h2>
            <p className="text-lg text-gray-300">Trade the world's leading cryptocurrency</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Bitcoin Main Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl lg:rounded-3xl p-6 lg:p-10 border-2 border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <span className="text-white font-bold text-2xl lg:text-3xl">₿</span>
                  </div>
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-white">{bitcoinData.symbol}</h3>
                    <p className="text-base text-gray-300">{bitcoinData.name}</p>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">{bitcoinData.price}</div>
                <div className={`flex items-center space-x-2 text-xl lg:text-2xl font-bold mb-4 ${bitcoinData.positive ? 'text-green-400' : 'text-red-400'}`}>
                  <ArrowTrendingUpIcon className="w-6 h-6" />
                  <span>{bitcoinData.change}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-xs text-gray-300 mb-1">Market Cap</div>
                    <div className="text-lg font-bold text-white">{bitcoinData.marketCap}</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-xs text-gray-300 mb-1">24h Volume</div>
                    <div className="text-lg font-bold text-white">{bitcoinData.volume24h}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="text-xs text-gray-300 mb-1">24h High</div>
                    <div className="text-sm font-semibold text-white">{bitcoinData.high24h}</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="text-xs text-gray-300 mb-1">24h Low</div>
                    <div className="text-sm font-semibold text-white">{bitcoinData.low24h}</div>
                  </div>
                </div>
              </div>
              <div className="h-48 lg:h-56 bg-white/5 rounded-xl border border-white/20 p-3">
                <StockChartVisual isPositive={bitcoinData.positive} height={200} />
              </div>
            </div>

            {/* Trading Ideas */}
            <div>
              <div className="flex items-center mb-6">
                <LightBulbIcon className="w-7 h-7 text-yellow-400 mr-2" />
                <h2 className="text-2xl lg:text-3xl font-bold text-white">Trading Ideas</h2>
              </div>
              <div className="space-y-4 lg:space-y-6">
                {tradingIdeas.map((idea, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-lg rounded-xl lg:rounded-2xl p-5 lg:p-6 border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg lg:text-xl font-bold text-white mb-1">{idea.title}</h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <p className="text-sm text-gray-400">{idea.symbol}</p>
                          <span className="text-xs px-2 py-1 bg-white/20 text-gray-300 rounded-full">Confidence: {idea.confidence}</span>
                        </div>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap ml-2 ${
                        idea.type === 'Bullish' ? 'bg-green-500/30 text-green-300' : 'bg-white/20 text-gray-300'
                      }`}>
                        {idea.type}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{idea.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">What Our Traders Say</h2>
            <p className="text-lg text-gray-300">Join thousands of successful traders</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 lg:p-8 border border-white/20 hover:shadow-xl transition">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-400">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Economic Calendar */}
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8 lg:mb-12">
            <CalendarIcon className="w-7 h-7 text-blue-400 mr-3" />
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Economic Calendar</h2>
              <p className="text-gray-300">Upcoming market-moving events</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden shadow-xl">
            {economicEvents.map((event, idx) => (
              <div key={idx} className="p-5 lg:p-6 border-b border-white/20 last:border-0 hover:bg-white/10 transition">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-white">{event.date}</span>
                      <span className="text-sm text-gray-300">{event.time}</span>
                      <span className="text-xs px-2 py-1 bg-blue-500/30 text-blue-300 rounded-full font-semibold">{event.country}</span>
                    </div>
                    <div className="text-lg lg:text-xl text-white font-bold mb-1">{event.event}</div>
                    <div className="text-sm text-gray-300">{event.description}</div>
                  </div>
                  <span className={`text-xs px-4 py-2 rounded-full font-bold whitespace-nowrap ${
                    event.impact === 'High' ? 'bg-red-500/30 text-red-300' : 'bg-yellow-500/30 text-yellow-300'
                  }`}>
                    {event.impact} Impact
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Ready to Start Your Trading Journey?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8 lg:mb-12">
            Join thousands of traders learning and earning with EduCrypto. Start risk-free today!
          </p>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="inline-block px-8 py-4 lg:px-12 lg:py-5 bg-white text-blue-600 font-bold rounded-xl hover:shadow-2xl transition transform hover:scale-105 text-lg"
            >
              Get Started for Free
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8 mb-8 lg:mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">E</span>
                </div>
                <span className="text-xl font-bold">EduCrypto</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">Trade smarter, learn faster. Master the markets with confidence.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm sm:text-base">Products</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li><button type="button" className="hover:text-white transition text-left">Trading Platform</button></li>
                <li><button type="button" className="hover:text-white transition text-left">Market Data</button></li>
                <li><button type="button" className="hover:text-white transition text-left">Analytics</button></li>
                <li><button type="button" className="hover:text-white transition text-left">Mobile App</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm sm:text-base">Markets</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li><button type="button" className="hover:text-white transition text-left">Indian Stocks</button></li>
                <li><button type="button" className="hover:text-white transition text-left">Bitcoin</button></li>
                <li><button type="button" className="hover:text-white transition text-left">Indices</button></li>
                <li><button type="button" className="hover:text-white transition text-left">Forex</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm sm:text-base">Education</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li><button type="button" className="hover:text-white transition text-left">Courses</button></li>
                <li><button type="button" className="hover:text-white transition text-left">Tutorials</button></li>
                <li><button type="button" className="hover:text-white transition text-left">Resources</button></li>
                <li><button type="button" className="hover:text-white transition text-left">Webinars</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm sm:text-base">Support</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                <li><button type="button" className="hover:text-white transition text-left">Help Center</button></li>
                <li><button type="button" className="hover:text-white transition text-left">Contact</button></li>
                <li><button type="button" className="hover:text-white transition text-left">Community</button></li>
                <li><button type="button" className="hover:text-white transition text-left">FAQ</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 text-xs sm:text-sm mb-4">© 2024 EduCrypto. All rights reserved.</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-wider">LOOK FIRST / THEN LEAP</p>
          </div>
        </div>
      </footer>
      </div>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
