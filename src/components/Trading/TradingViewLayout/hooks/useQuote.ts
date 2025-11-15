import { useState, useEffect, useRef } from 'react';
import { alpacaIndianStocksApi } from '../../../../services/alpacaIndianStocksApi';
import { sanitizeSymbol } from '../utils';
import { ChartStockData } from '../types';

export const useQuote = (symbol: string | null, isActive: boolean) => {
  const [stockData, setStockData] = useState<ChartStockData | null>(null);
  const quoteTimerRef = useRef<any>(null);

  const refreshQuote = async (sym: string) => {
    try {
      if (!sym) return;
      const base = sanitizeSymbol(sym);
      const trySymbols = [base, `${base}.NS`];
      let updated = false;

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
              setStockData((prev: any) => ({
                ...prev,
                symbol: base,
                price: latestPrice,
                change: changeVal ?? prev?.change ?? 0,
                changePercent: changePct ?? prev?.changePercent ?? 0,
              }));
              updated = true;
              break;
            }
          } catch (_) {
            // try next symbol format
          }
        }
      }

      if (!updated) {
        for (const batch of [trySymbols, [sym.toUpperCase()]]) {
          try {
            const md = await alpacaIndianStocksApi.getMarketData(batch);
            const first = Array.isArray(md)
              ? md.find((m: any) => trySymbols.includes((m.symbol || '').toUpperCase()))
              : null;
            if (first && first.price != null) {
              setStockData((prev: any) => ({
                ...prev,
                symbol: base,
                price: first.price,
                change: first.change ?? prev?.change ?? 0,
                changePercent: first.changePercent ?? prev?.changePercent ?? 0,
              }));
              updated = true;
              break;
            }
          } catch (_) {
            // continue trying
          }
        }
      }
    } catch (_) {
      // ignore quote failures
    }
  };

  useEffect(() => {
    if (isActive && symbol) {
      refreshQuote(symbol);
      quoteTimerRef.current && clearInterval(quoteTimerRef.current);
      quoteTimerRef.current = setInterval(() => refreshQuote(symbol), 5000);
      return () => {
        quoteTimerRef.current && clearInterval(quoteTimerRef.current);
        quoteTimerRef.current = null;
      };
    }
    quoteTimerRef.current && clearInterval(quoteTimerRef.current);
    quoteTimerRef.current = null;
  }, [isActive, symbol]);

  return { stockData, setStockData, refreshQuote };
};

