import React, { useState, useEffect } from 'react';
import { ChartStockData, AlpacaAccount } from '../types';
import { alpacaIndianStocksApi } from '../../../../services/alpacaIndianStocksApi';
import { sanitizeSymbol } from '../utils';

interface TradeModalProps {
  stock: ChartStockData;
  tradeSide: 'buy' | 'sell';
  orderType: 'market' | 'limit';
  orderQuantity: number;
  orderLimitPrice: number | undefined;
  orderTab: 'quick' | 'regular';
  isIntraday: boolean;
  alpacaAccount: AlpacaAccount | null;
  portfolioHoldings?: Record<string, number>;
  onClose: () => void;
  onOrderTypeChange: (type: 'market' | 'limit') => void;
  onQuantityChange: (quantity: number) => void;
  onLimitPriceChange: (price: number | undefined) => void;
  onTabChange: (tab: 'quick' | 'regular') => void;
  onIntradayChange: (intraday: boolean) => void;
  onSubmit: (side: 'buy' | 'sell') => void;
  onPriceUpdate?: (price: number, change: number, changePercent: number) => void;
  isLoading?: boolean;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  stock,
  tradeSide,
  orderType,
  orderQuantity,
  orderLimitPrice,
  orderTab,
  isIntraday,
  alpacaAccount,
  portfolioHoldings = {},
  onClose,
  onOrderTypeChange,
  onQuantityChange,
  onLimitPriceChange,
  onTabChange,
  onIntradayChange,
  onSubmit,
  onPriceUpdate,
  isLoading = false,
}) => {
  const [currentPrice, setCurrentPrice] = useState<number>(stock.price || 0);
  const [priceChange, setPriceChange] = useState<number>(stock.change || 0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(stock.changePercent || 0);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  // Real-time price updates
  useEffect(() => {
    if (!stock.symbol) return;

    const updatePrice = async () => {
      try {
        setIsUpdatingPrice(true);
        const baseSymbol = sanitizeSymbol(stock.symbol);
        const trySymbols = [baseSymbol, `${baseSymbol}.NS`];

        // Try to get quote
        if ((alpacaIndianStocksApi as any).getQuote) {
          for (const trySym of trySymbols) {
            try {
              const q = await (alpacaIndianStocksApi as any).getQuote(trySym);
              const latestPrice = q?.ltp ?? q?.price ?? q?.lastPrice ?? q?.c ?? q?.close ?? null;
              const changeVal = q?.change ?? (latestPrice && q?.prevClose ? latestPrice - q.prevClose : undefined);
              const changePct =
                q?.changePercent ??
                (latestPrice && q?.prevClose ? ((latestPrice - q.prevClose) / q.prevClose) * 100 : undefined);

              if (latestPrice != null) {
                setCurrentPrice(latestPrice);
                setPriceChange(changeVal ?? 0);
                setPriceChangePercent(changePct ?? 0);
                onPriceUpdate?.(latestPrice, changeVal ?? 0, changePct ?? 0);
                return;
              }
            } catch (_) {
              // try next symbol format
            }
          }
        }

        // Fallback to market data
        const md = await alpacaIndianStocksApi.getMarketData(trySymbols);
        const first = Array.isArray(md)
          ? md.find((m: any) => trySymbols.includes((m.symbol || '').toUpperCase()))
          : null;
        if (first && first.price != null) {
          setCurrentPrice(first.price);
          setPriceChange(first.change ?? 0);
          setPriceChangePercent(first.changePercent ?? 0);
          onPriceUpdate?.(first.price, first.change ?? 0, first.changePercent ?? 0);
        }
      } catch (error) {
        console.error('Error updating price:', error);
      } finally {
        setIsUpdatingPrice(false);
      }
    };

    updatePrice();
    const interval = setInterval(updatePrice, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [stock.symbol, onPriceUpdate]);

  // Update current price when stock prop changes
  useEffect(() => {
    if (stock.price) {
      setCurrentPrice(stock.price);
      setPriceChange(stock.change || 0);
      setPriceChangePercent(stock.changePercent || 0);
    }
  }, [stock.price, stock.change, stock.changePercent]);

  const availableQuantity = portfolioHoldings[stock.symbol?.toUpperCase() || ''] || 0;
  const maxQuantity = tradeSide === 'sell' ? availableQuantity : Infinity;
  const effectivePrice = orderType === 'market' ? currentPrice : orderLimitPrice || currentPrice;
  const requiredAmount = effectivePrice * orderQuantity;
  const availableBalance = alpacaAccount?.buying_power ? parseFloat(alpacaAccount.buying_power) : 0;
  const canAfford = tradeSide === 'buy' ? requiredAmount <= availableBalance : true;
  const hasEnoughQuantity = tradeSide === 'sell' ? orderQuantity <= availableQuantity : true;
  const isValidOrder = canAfford && hasEnoughQuantity && orderQuantity > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-2xl w-full max-w-xl mx-4 shadow-2xl border border-slate-700/60 overflow-hidden">
        <div
          className={`p-4 flex items-center justify-between ${
            tradeSide === 'buy' ? 'bg-emerald-700/30' : 'bg-rose-700/30'
          } border-b border-slate-700/60`}
        >
          <div className="flex-1">
            <div className="text-white text-lg font-semibold flex items-center gap-2">
              {tradeSide === 'buy' ? 'Buy' : 'Sell'} {stock.symbol}
              {isUpdatingPrice && (
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              )}
            </div>
            <div className="text-slate-300 text-xs flex items-center gap-2">
              <span>NSE</span>
              <span>•</span>
              <span className={`font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {priceChange !== 0 && (
                <>
                  <span className={priceChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}
                  </span>
                  <span className={priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}>
                    ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                  </span>
                </>
              )}
            </div>
            {tradeSide === 'sell' && availableQuantity > 0 && (
              <div className="text-slate-400 text-xs mt-1">
                Available: {availableQuantity} {stock.symbol}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-3">
              <button
                onClick={() => onTabChange('quick')}
                className={`text-sm px-3 py-1 rounded-md ${
                  orderTab === 'quick' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Quick
              </button>
              <button
                onClick={() => onTabChange('regular')}
                className={`text-sm px-3 py-1 rounded-md ${
                  orderTab === 'regular' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Regular
              </button>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="accent-blue-500"
                  checked={isIntraday}
                  onChange={(e) => onIntradayChange(e.target.checked)}
                />
                Intraday
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Order Type</label>
              <div className="flex items-center gap-3 bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-sm text-slate-100">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="trade-ordertype"
                    checked={orderType === 'market'}
                    onChange={() => onOrderTypeChange('market')}
                  />
                  Market
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="trade-ordertype"
                    checked={orderType === 'limit'}
                    onChange={() => onOrderTypeChange('limit')}
                  />
                  Limit
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Qty. {tradeSide === 'sell' && maxQuantity < Infinity && (
                  <span className="text-slate-400">(Max: {maxQuantity})</span>
                )}
              </label>
              <div className="flex items-center bg-slate-800 text-slate-100 border border-slate-600 rounded-md">
                <button
                  className="px-3 py-2 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => onQuantityChange(Math.max(1, orderQuantity - 1))}
                  disabled={orderQuantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={maxQuantity}
                  className="bg-transparent px-3 py-2 text-sm w-20 text-center"
                  value={orderQuantity}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(maxQuantity, Number(e.target.value) || 1));
                    onQuantityChange(val);
                  }}
                />
                <button
                  className="px-3 py-2 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => onQuantityChange(Math.min(maxQuantity, orderQuantity + 1))}
                  disabled={orderQuantity >= maxQuantity}
                >
                  +
                </button>
              </div>
              {tradeSide === 'sell' && orderQuantity > availableQuantity && (
                <div className="text-red-400 text-xs mt-1">Insufficient holdings</div>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Price {orderType === 'market' && (
                  <span className="text-slate-400">(Market: ₹{currentPrice.toFixed(2)})</span>
                )}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="bg-slate-800 text-slate-100 border border-slate-600 rounded-md px-3 py-2 text-sm w-full disabled:opacity-50"
                disabled={orderType === 'market'}
                value={orderType === 'market' ? currentPrice.toFixed(2) : orderLimitPrice ?? ''}
                onChange={(e) => onLimitPriceChange(Number(e.target.value) || undefined)}
                placeholder={orderType === 'market' ? 'Market Price' : 'Enter limit price'}
              />
            </div>
            <div className="flex items-end justify-end gap-3">
              <div className="text-right mr-2">
                <div className="text-xs text-slate-400">Required</div>
                <div className={`text-sm font-medium ${!canAfford && tradeSide === 'buy' ? 'text-red-400' : 'text-slate-200'}`}>
                  ₹{requiredAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {tradeSide === 'buy' && (
                  <>
                    <div className="text-xs text-slate-400 mt-1">Available</div>
                    <div className={`text-sm ${requiredAmount > availableBalance ? 'text-red-400' : 'text-slate-200'}`}>
                      {alpacaAccount?.buying_power ? `₹${parseFloat(alpacaAccount.buying_power).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                    </div>
                  </>
                )}
                {tradeSide === 'sell' && (
                  <>
                    <div className="text-xs text-slate-400 mt-1">You'll Receive</div>
                    <div className="text-sm text-green-400 font-medium">
                      ₹{requiredAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => onSubmit(tradeSide)}
                disabled={!isValidOrder || isLoading}
                className={`px-5 py-2 rounded-lg text-white font-medium transition-all flex items-center gap-2 ${
                  tradeSide === 'buy'
                    ? isValidOrder && !isLoading
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-emerald-600/50 cursor-not-allowed'
                    : isValidOrder && !isLoading
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-rose-600/50 cursor-not-allowed'
                }`}
              >
                {isLoading && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isLoading ? (tradeSide === 'buy' ? 'Buying...' : 'Selling...') : (tradeSide === 'buy' ? 'Buy' : 'Sell')}
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

