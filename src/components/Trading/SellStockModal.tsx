import React, { useState } from 'react';
import { X, TrendingDown } from 'lucide-react';
import { tradingApi } from '../../services/api';
import { toast } from 'react-toastify';

interface SellStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  holding: {
    symbol: string;
    name: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    assetType: 'crypto' | 'stock';
    isSynthetic?: boolean; // Flag for synthetic holdings (intraday stocks not yet in portfolio)
  };
  onSuccess: () => void;
}

const SellStockModal: React.FC<SellStockModalProps> = ({
  isOpen,
  onClose,
  holding,
  onSuccess,
}) => {
  const [quantity, setQuantity] = useState<number>(holding.quantity);
  const [price, setPrice] = useState<number>(holding.currentPrice);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const maxQuantity = holding.quantity;
  const totalValue = quantity * price;
  const estimatedProfit = (price - holding.averagePrice) * quantity;
  const estimatedProfitPercent = holding.averagePrice > 0 
    ? ((price - holding.averagePrice) / holding.averagePrice) * 100 
    : 0;

  const handleQuantityChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= maxQuantity) {
      setQuantity(numValue);
    }
  };

  const handleSellAll = () => {
    setQuantity(maxQuantity);
  };

  const handleSellHalf = () => {
    setQuantity(Math.floor(maxQuantity / 2));
  };

  const handleSellQuarter = () => {
    setQuantity(Math.floor(maxQuantity / 4));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (quantity > maxQuantity) {
      toast.error(`You can only sell up to ${maxQuantity} ${holding.assetType === 'crypto' ? 'coins' : 'shares'}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // For synthetic holdings (intraday stocks), always pass isIntraday flag
      // This ensures the backend uses intraday trade validation
      const isIntradayTrade = holding.isSynthetic || false;
      
      if (isIntradayTrade) {
        toast.info('Processing intraday trade...');
      }

      await tradingApi.createTrade({
        symbol: holding.symbol,
        assetType: holding.assetType,
        side: 'sell',
        tradeType: 'market',
        quantity: quantity,
        price: price,
        isIntraday: isIntradayTrade, // Pass flag for intraday trades
      });

      toast.success(`Successfully sold ${quantity} ${holding.assetType === 'crypto' ? 'coins' : 'shares'} of ${holding.symbol}`);
      onSuccess();
      onClose();
      setQuantity(holding.quantity);
      setPrice(holding.currentPrice);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to sell stock';
      toast.error(errorMessage);
      
      // If it's a synthetic holding and we get insufficient holdings error, suggest refresh
      if (holding.isSynthetic && errorMessage.includes('Insufficient holdings')) {
        toast.info('Please refresh the portfolio and try again. The stock may need to be updated in your portfolio first.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Sell {holding.symbol}</h2>
              <p className="text-sm text-gray-400">{holding.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Holdings Info */}
          <div className="bg-gray-700 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Available to Sell</span>
              <span className="text-white font-semibold">
                {maxQuantity} {holding.assetType === 'crypto' ? 'coins' : 'shares'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Avg Buy Price</span>
              <span className="text-white">${holding.averagePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Current Price</span>
              <span className="text-white">${holding.currentPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quantity to Sell
            </label>
            <input
              type="number"
              step="0.00000001"
              min="0"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={handleSellQuarter}
                className="flex-1 px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                25%
              </button>
              <button
                type="button"
                onClick={handleSellHalf}
                className="flex-1 px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                50%
              </button>
              <button
                type="button"
                onClick={handleSellAll}
                className="flex-1 px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                100%
              </button>
            </div>
          </div>

          {/* Price Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sell Price (Market Price)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              onClick={() => setPrice(holding.currentPrice)}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300"
            >
              Use Current Market Price
            </button>
          </div>

          {/* Estimated Results */}
          <div className="bg-gray-700 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Value</span>
              <span className="text-white font-semibold">${totalValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Estimated P&L</span>
              <span className={`font-semibold ${estimatedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {estimatedProfit >= 0 ? '+' : ''}${estimatedProfit.toFixed(2)} ({estimatedProfitPercent >= 0 ? '+' : ''}{estimatedProfitPercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || quantity <= 0 || quantity > maxQuantity}
            >
              {isSubmitting ? 'Selling...' : `Sell ${quantity} ${holding.assetType === 'crypto' ? 'coins' : 'shares'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellStockModal;

