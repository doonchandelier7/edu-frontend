import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ChartBarIcon,
  AcademicCapIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      name: 'Paper Trading',
      description: 'Practice cryptocurrency and stock trading with virtual money',
      icon: ChartBarIcon,
      color: 'text-orange-500',
    },
    {
      name: 'Learn & Earn',
      description: 'Structured courses with videos, quizzes, and certifications',
      icon: AcademicCapIcon,
      color: 'text-green-500',
    },
    {
      name: 'Leaderboards',
      description: 'Compete with other traders and earn badges',
      icon: TrophyIcon,
      color: 'text-purple-500',
    },
    {
      name: 'Real-time Data',
      description: 'Live market prices from major exchanges',
      icon: ArrowTrendingUpIcon,
      color: 'text-blue-500',
    },
    {
      name: 'Portfolio Management',
      description: 'Track your investments and performance',
      icon: CurrencyDollarIcon,
      color: 'text-yellow-500',
    },
    {
      name: 'Risk-free Environment',
      description: 'Learn without financial risk',
      icon: ShieldCheckIcon,
      color: 'text-teal-500',
    },
  ];

  const stats = [
    { name: 'Active Learners', value: '10,000+' },
    { name: 'Total Trades', value: '1M+' },
    { name: 'Courses Completed', value: '50,000+' },
    { name: 'Avg. Portfolio Growth', value: '25%' },
  ];

  return (
    <>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Master Crypto & Stock Trading
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Learn to trade cryptocurrencies and stocks in a risk-free environment. 
              Practice with virtual money, take structured courses, and compete on leaderboards.
            </p>
            <div className="space-x-4">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/register"
                    className="inline-block bg-gradient-to-r from-teal-500 to-blue-600 text-white font-semibold py-3 px-8 rounded-lg text-lg hover:from-teal-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    to="/login"
                    className="inline-block border border-gray-400 text-white font-semibold py-3 px-8 rounded-lg text-lg hover:bg-gray-700 transition-all duration-200"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <Link
                  to="/dashboard"
                  className="inline-block bg-gradient-to-r from-teal-500 to-blue-600 text-white font-semibold py-3 px-8 rounded-lg text-lg hover:from-teal-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.name} className="text-center">
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need to Master Trading
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              From paper trading simulations to comprehensive educational content, 
              EduCrypto provides everything you need to become a successful trader.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
                <div className={`w-12 h-12 ${feature.color} mb-4`}>
                  <feature.icon className="w-full h-full" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.name}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-800 to-blue-800 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Trading Journey?
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            Join thousands of learners who are mastering trading with EduCrypto
          </p>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="inline-block bg-white text-purple-800 font-semibold py-3 px-8 rounded-lg text-lg hover:bg-gray-100 transition-colors duration-200"
            >
              Join EduCrypto Today
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default HomePage;

