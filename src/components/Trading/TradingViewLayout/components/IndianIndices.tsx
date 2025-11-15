import React from 'react';
import { SelectedStockData } from '../types';

interface IndianIndicesProps {
  onStockClick: (stock: SelectedStockData) => void;
}

export const IndianIndices: React.FC<IndianIndicesProps> = ({ onStockClick }) => {
  const indices = [
    {
      symbol: 'NIFTY50',
      name: 'Nifty 50',
      exchange: 'NSE',
      sector: 'Index',
      price: 25795.15,
      change: -95.20,
      changePercent: -0.37,
      description: "Nifty 50 is India's premier stock market index representing the weighted average of 50 of the largest Indian companies.",
      keyStats: {
        nextEarnings: 'N/A',
        volume: 'N/A',
        avgVolume: 'N/A',
        marketCap: '₹200T+'
      }
    },
    {
      symbol: 'SENSEX',
      name: 'Sensex',
      exchange: 'BSE',
      sector: 'Index',
      price: 84658.60,
      change: -312.35,
      changePercent: -0.37,
    },
    {
      symbol: 'BANKNIFTY',
      name: 'Bank Nifty',
      exchange: 'NSE',
      sector: 'Banking Sector',
      price: 57699.60,
      change: -375.20,
      changePercent: -0.65,
    },
    {
      symbol: 'NIFTYIT',
      name: 'Nifty IT',
      exchange: 'NSE',
      sector: 'IT Sector',
      price: 35986.35,
      change: -95.20,
      changePercent: -0.26,
    },
    {
      symbol: 'NIFTYPHARMA',
      name: 'Nifty Pharma',
      exchange: 'NSE',
      sector: 'Pharmaceutical',
      price: 22357.35,
      change: -123.45,
      changePercent: -0.55,
    },
    {
      symbol: 'NIFTYMETAL',
      name: 'Nifty Metal',
      exchange: 'NSE',
      sector: 'Metals & Mining',
      price: 10347.45,
      change: 105.20,
      changePercent: 1.03,
    },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Indian Indices</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-400">Live Data</span>
        </div>
      </div>
      <div className="space-y-3">
        {indices.map((index, idx) => (
          <div
            key={index.symbol || idx}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-2xl border border-slate-600/60 hover:shadow-md cursor-pointer transition-all duration-200"
            onClick={() =>
              onStockClick({
                symbol: index.symbol,
                name: index.name,
                exchange: index.exchange,
                sector: index.sector,
                price: index.price,
                change: index.change,
                changePercent: index.changePercent,
                marketStatus: 'Market Open',
                lastUpdate: 'Last update at 15:30 IST',
                description: index.description || `${index.name} is an Indian index.`,
                keyStats: index.keyStats || {
                  nextEarnings: 'N/A',
                  volume: 'N/A',
                  avgVolume: 'N/A',
                  marketCap: 'N/A'
                }
              })
            }
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                <span className="text-xs font-bold text-white">
                  {index.symbol === 'NIFTY50' ? 'N50' : index.symbol === 'SENSEX' ? 'SX' : index.symbol.charAt(0)}
                </span>
              </div>
              <div>
                <div className="font-semibold text-white">{index.name}</div>
                <div className="text-xs text-slate-400">{index.exchange}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-white text-lg">₹{index.price.toLocaleString()}</div>
              <div
                className={`text-sm font-semibold ${index.change >= 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {index.change >= 0 ? '+' : ''}
                {index.change.toFixed(2)} ({index.changePercent >= 0 ? '+' : ''}
                {index.changePercent.toFixed(2)}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

