import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  symbols: string[];
  isActive: boolean;
  alpacaAccountId?: string;
  userId: string;
  assets?: WatchlistAsset[];
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistAsset {
  id: string;
  symbol: string;
  name?: string;
  exchange?: string;
  assetClass?: string;
  isActive: boolean;
  lastPrice?: number;
  changePercent?: number;
  volume?: number;
  marketCap?: number;
  metadata?: any;
  watchlistId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWatchlistRequest {
  name: string;
  description?: string;
  symbols?: string[];
  alpacaAccountId?: string;
}

export interface UpdateWatchlistRequest {
  name?: string;
  description?: string;
  symbols?: string[];
}

export interface AddAssetRequest {
  symbol: string;
  name?: string;
  exchange?: string;
  assetClass?: string;
  metadata?: any;
}

export interface SearchAssetResult {
  symbol: string;
  name: string;
  exchange: string;
  assetClass: string;
  lastPrice: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

class WatchlistApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async createWatchlist(data: CreateWatchlistRequest): Promise<Watchlist> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/trading/watchlists`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating watchlist:', error);
      throw error;
    }
  }

  async getUserWatchlists(): Promise<Watchlist[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/trading/watchlists`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching watchlists:', error);
      throw error;
    }
  }

  async getWatchlistById(id: string): Promise<Watchlist> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/trading/watchlists/${id}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      throw error;
    }
  }

  async updateWatchlist(id: string, data: UpdateWatchlistRequest): Promise<Watchlist> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/trading/watchlists/${id}`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating watchlist:', error);
      throw error;
    }
  }

  async deleteWatchlist(id: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/v1/trading/watchlists/${id}`,
        { headers: this.getAuthHeaders() }
      );
    } catch (error) {
      console.error('Error deleting watchlist:', error);
      throw error;
    }
  }

  async addAssetToWatchlist(watchlistId: string, data: AddAssetRequest): Promise<WatchlistAsset> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/trading/watchlists/${watchlistId}/assets`,
        data,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding asset to watchlist:', error);
      throw error;
    }
  }

  async removeAssetFromWatchlist(watchlistId: string, symbol: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/v1/trading/watchlists/${watchlistId}/assets/${symbol}`,
        { headers: this.getAuthHeaders() }
      );
    } catch (error) {
      console.error('Error removing asset from watchlist:', error);
      throw error;
    }
  }

  async getWatchlistAssets(watchlistId: string): Promise<WatchlistAsset[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/trading/watchlists/${watchlistId}/assets`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching watchlist assets:', error);
      throw error;
    }
  }

  async searchAssets(query: string, limit: number = 10): Promise<SearchAssetResult[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/trading/watchlists/search/assets`,
        {
          params: { q: query, limit },
          headers: this.getAuthHeaders()
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error searching assets:', error);
      throw error;
    }
  }

  formatPrice(price: number | null, currency: string = 'USD'): string {
    if (price === null || price === undefined) return currency === 'INR' ? '₹0.00' : '$0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(price);
  }

  formatChange(change: number | null): string {
    if (change === null || change === undefined) return '+0.00%';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  formatVolume(volume: number | null): string {
    if (volume === null || volume === undefined) return '0';
    if (volume >= 1e9) {
      return `${(volume / 1e9).toFixed(1)}B`;
    } else if (volume >= 1e6) {
      return `${(volume / 1e6).toFixed(1)}M`;
    } else if (volume >= 1e3) {
      return `${(volume / 1e3).toFixed(1)}K`;
    }
    return volume.toString();
  }

  formatMarketCap(marketCap: number | null): string {
    if (marketCap === null || marketCap === undefined) return '$0';
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(1)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(1)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(1)}M`;
    }
    return `$${marketCap.toLocaleString()}`;
  }

  // Get Top Gainers
  async getTopGainers(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/trading/watchlists/market/top-gainers`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching top gainers:', error);
      throw error;
    }
  }

  // Get Top Losers
  async getTopLosers(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/trading/watchlists/market/top-losers`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching top losers:', error);
      throw error;
    }
  }

  // Get Indian Indices
  async getIndianIndices(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/trading/watchlists/market/indices`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Indian indices:', error);
      throw error;
    }
  }
}

export const watchlistApi = new WatchlistApiService();
