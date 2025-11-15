export interface RealTimePrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
  bid?: number;
  ask?: number;
  high24h?: number;
  low24h?: number;
}

export interface MarketUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
  type: 'price_update' | 'trade_executed' | 'market_open' | 'market_close';
}

export interface LiveCandlestick {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isComplete: boolean;
}

class RealTimeDataService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private subscriptions = new Set<string>();
  private callbacks = new Map<string, (data: any) => void>();
  private isConnected = false;
  private currentPrices = new Map<string, number>();
  private mockStreams = new Map<string, () => void>();

  // WebSocket connection management
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem('token');
        const wsUrl = `ws://localhost:3000/api/realtime/ws?token=${token}`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('Real-time WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.resubscribeAll();
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
        
        this.ws.onclose = () => {
          console.log('Real-time WebSocket disconnected');
          this.isConnected = false;
          this.scheduleReconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('Real-time WebSocket error:', error);
          reject(error);
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private resubscribeAll() {
    this.subscriptions.forEach(symbol => {
      this.subscribeToSymbol(symbol);
    });
  }

  private handleMessage(message: any) {
    const { type, data } = message;
    
    switch (type) {
      case 'price_update':
        this.notifyCallbacks('price_update', data);
        break;
      case 'candlestick_update':
        this.notifyCallbacks('candlestick_update', data);
        break;
      case 'market_update':
        this.notifyCallbacks('market_update', data);
        break;
      case 'trade_executed':
        this.notifyCallbacks('trade_executed', data);
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  private notifyCallbacks(type: string, data: any) {
    const callback = this.callbacks.get(type);
    if (callback) {
      callback(data);
    }
  }

  // Subscribe to real-time price updates for a symbol
  subscribeToSymbol(symbol: string) {
    if (!this.isConnected || !this.ws) {
      console.warn('WebSocket not connected, will subscribe when connected');
      this.subscriptions.add(symbol);
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'subscribe',
      symbol: symbol.toUpperCase()
    }));
    
    this.subscriptions.add(symbol);
    console.log(`Subscribed to real-time updates for ${symbol}`);
  }

  // Unsubscribe from symbol updates
  unsubscribeFromSymbol(symbol: string) {
    const upperSymbol = symbol.toUpperCase();
    
    if (!this.isConnected || !this.ws) {
      this.subscriptions.delete(upperSymbol);
      // Stop mock stream
      const existingStream = this.mockStreams.get(upperSymbol);
      if (existingStream) {
        existingStream();
        this.mockStreams.delete(upperSymbol);
      }
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'unsubscribe',
      symbol: upperSymbol
    }));
    
    this.subscriptions.delete(upperSymbol);
    
    // Stop mock stream
    const existingStream = this.mockStreams.get(upperSymbol);
    if (existingStream) {
      existingStream();
      this.mockStreams.delete(upperSymbol);
    }
    
    console.log(`Unsubscribed from real-time updates for ${symbol}`);
  }

  // Register callback for specific event types
  onPriceUpdate(callback: (data: RealTimePrice) => void) {
    this.callbacks.set('price_update', callback);
  }

  onCandlestickUpdate(callback: (data: LiveCandlestick) => void) {
    this.callbacks.set('candlestick_update', callback);
  }

  onMarketUpdate(callback: (data: MarketUpdate) => void) {
    this.callbacks.set('market_update', callback);
  }

  onTradeExecuted(callback: (data: any) => void) {
    this.callbacks.set('trade_executed', callback);
  }

  // Generate mock real-time data for testing
  generateMockRealTimeData(symbol: string): RealTimePrice {
    const upperSymbol = symbol.toUpperCase();
    
    // Get base price for symbol or use default
    const basePrices: Record<string, number> = {
      'INFY': 1486,
      'HDFC': 994,
      'TCS': 3500,
      'RELIANCE': 2500,
      'WIPRO': 400,
      'ITC': 450,
      'SBIN': 600,
      'BHARTIARTL': 800
    };
    
    const basePrice = basePrices[upperSymbol] || 1000;
    
    // Get current price or initialize with base price
    const currentPrice = this.currentPrices.get(upperSymbol) || basePrice;
    
    // Generate realistic price movement
    const volatility = 0.002; // 0.2% volatility
    const trend = (Math.random() - 0.5) * 0.001; // Small trend bias
    const randomChange = (Math.random() - 0.5) * volatility;
    const totalChange = trend + randomChange;
    
    const newPrice = currentPrice * (1 + totalChange);
    const priceChange = newPrice - currentPrice;
    const changePercent = (priceChange / currentPrice) * 100;
    
    // Update current price for this symbol
    this.currentPrices.set(upperSymbol, newPrice);

    return {
      symbol: upperSymbol,
      price: newPrice,
      change: priceChange,
      changePercent: changePercent,
      volume: Math.random() * 10000 + 1000,
      timestamp: Date.now(),
      bid: newPrice * 0.999,
      ask: newPrice * 1.001,
      high24h: newPrice * (1 + Math.random() * 0.05),
      low24h: newPrice * (1 - Math.random() * 0.05)
    };
  }

  // Generate mock candlestick updates
  generateMockCandlestickUpdate(symbol: string): LiveCandlestick {
    const upperSymbol = symbol.toUpperCase();
    const currentPrice = this.currentPrices.get(upperSymbol) || 1000;
    const volatility = 0.005; // 0.5% volatility for candlesticks
    
    const open = currentPrice;
    const close = open * (1 + (Math.random() - 0.5) * volatility);
    const high = Math.max(open, close) * (1 + Math.random() * 0.002);
    const low = Math.min(open, close) * (1 - Math.random() * 0.002);
    const volume = Math.random() * 100000 + 10000;

    // Update current price
    this.currentPrices.set(upperSymbol, close);

    return {
      symbol: upperSymbol,
      timestamp: Date.now(),
      open,
      high,
      low,
      close,
      volume,
      isComplete: Math.random() > 0.7 // 30% chance of being complete
    };
  }

  // Start mock data streaming for testing
  startMockDataStream(symbol: string, interval: number = 1000) {
    const upperSymbol = symbol.toUpperCase();
    
    // Stop existing stream for this symbol if it exists
    const existingStream = this.mockStreams.get(upperSymbol);
    if (existingStream) {
      existingStream();
    }
    
    const streamInterval = setInterval(() => {
      if (this.isConnected) {
        // Generate price update
        const priceUpdate = this.generateMockRealTimeData(upperSymbol);
        this.notifyCallbacks('price_update', priceUpdate);

        // Occasionally generate candlestick update
        if (Math.random() > 0.8) { // 20% chance
          const candlestickUpdate = this.generateMockCandlestickUpdate(upperSymbol);
          this.notifyCallbacks('candlestick_update', candlestickUpdate);
        }
      }
    }, interval);

    // Store cleanup function
    this.mockStreams.set(upperSymbol, () => clearInterval(streamInterval));
    
    return () => clearInterval(streamInterval);
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Get subscribed symbols
  getSubscribedSymbols(): string[] {
    return Array.from(this.subscriptions);
  }
}

export const realTimeDataService = new RealTimeDataService();
