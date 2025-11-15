import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  XMarkIcon,
  StarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { watchlistApi, Watchlist, SearchAssetResult } from '../../services/watchlistApi';

interface WatchlistManagerProps {
  onClose: () => void;
}

const WatchlistManager: React.FC<WatchlistManagerProps> = ({ onClose }) => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchAssetResult[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const loadWatchlists = useCallback(async () => {
    try {
      setLoading(true);
      const data = await watchlistApi.getUserWatchlists();
      setWatchlists(data);
      if (data.length > 0 && !selectedWatchlist) {
        setSelectedWatchlist(data[0]);
      }
    } catch (err) {
      setError('Failed to load watchlists');
      console.error('Error loading watchlists:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedWatchlist]);

  useEffect(() => {
    loadWatchlists();
  }, [loadWatchlists]);

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const newWatchlist = await watchlistApi.createWatchlist(formData);
      setWatchlists([newWatchlist, ...watchlists]);
      setSelectedWatchlist(newWatchlist);
      setShowCreateForm(false);
      setFormData({ name: '', description: '' });
    } catch (err) {
      setError('Failed to create watchlist');
      console.error('Error creating watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWatchlist = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this watchlist?')) {
      return;
    }

    try {
      setLoading(true);
      await watchlistApi.deleteWatchlist(id);
      setWatchlists(watchlists.filter(w => w.id !== id));
      if (selectedWatchlist?.id === id) {
        setSelectedWatchlist(watchlists.length > 1 ? watchlists[1] : null);
      }
    } catch (err) {
      setError('Failed to delete watchlist');
      console.error('Error deleting watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAssets = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const results = await watchlistApi.searchAssets(query);
      console.log('Search results:', results); // Debug log
      if (results.length > 0) {
        console.log('First result object:', results[0]); // Debug individual result
        console.log('First result keys:', Object.keys(results[0])); // Show all available properties
        console.log('Price-related fields:');
        console.log('  - lastPrice:', results[0].lastPrice);
        console.log('  - changePercent:', results[0].changePercent);
        console.log('  - volume:', results[0].volume);
        console.log('  - marketCap:', results[0].marketCap);
      }
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching assets:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce the search
    searchTimeoutRef.current = setTimeout(() => {
      handleSearchAssets(query);
    }, 300);
  };

  const handleAddAsset = async (asset: SearchAssetResult) => {
    if (!selectedWatchlist) return;

    try {
      setLoading(true);
      await watchlistApi.addAssetToWatchlist(selectedWatchlist.id, {
        symbol: asset.symbol,
        name: asset.name,
        exchange: asset.exchange,
        assetClass: asset.assetClass,
        metadata: {
          lastPrice: asset.lastPrice,
          changePercent: asset.changePercent,
          volume: asset.volume,
          marketCap: asset.marketCap,
        },
      });
      
      // Reload the selected watchlist
      const updatedWatchlist = await watchlistApi.getWatchlistById(selectedWatchlist.id);
      setSelectedWatchlist(updatedWatchlist);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      setError('Failed to add asset to watchlist');
      console.error('Error adding asset:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAsset = async (symbol: string) => {
    if (!selectedWatchlist) return;

    try {
      setLoading(true);
      await watchlistApi.removeAssetFromWatchlist(selectedWatchlist.id, symbol);
      
      // Reload the selected watchlist
      const updatedWatchlist = await watchlistApi.getWatchlistById(selectedWatchlist.id);
      setSelectedWatchlist(updatedWatchlist);
    } catch (err) {
      setError('Failed to remove asset from watchlist');
      console.error('Error removing asset:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getChangeBgColor = (change: number) => {
    if (change > 0) return 'bg-green-100 dark:bg-green-900/30';
    if (change < 0) return 'bg-red-100 dark:bg-red-900/30';
    return 'bg-gray-100 dark:bg-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Watchlist Manager</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Watchlists */}
            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Watchlists</h3>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  title="Create Watchlist"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {watchlists.length > 0 ? (
                  watchlists.map((watchlist) => (
                    <div
                      key={watchlist.id}
                      className={`p-3 rounded-lg cursor-pointer transition ${
                        selectedWatchlist?.id === watchlist.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                          : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => setSelectedWatchlist(watchlist)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">{watchlist.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {watchlist.assets?.length || 0} assets
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWatchlist(watchlist.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 ml-2"
                          title="Delete Watchlist"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No watchlists yet</p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="mt-2 px-3 py-1 text-sm bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600"
                    >
                      Create One
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Content - Watchlist Details */}
            <div className="lg:col-span-3">
              {selectedWatchlist ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedWatchlist.name}</h3>
                      {selectedWatchlist.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedWatchlist.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowSearch(true)}
                      className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center space-x-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Add Asset</span>
                    </button>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    {selectedWatchlist.assets && selectedWatchlist.assets.length > 0 ? (
                      <div className="divide-y dark:divide-gray-700">
                        {selectedWatchlist.assets.map((asset) => (
                          <div
                            key={asset.symbol}
                            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <span className="font-medium text-gray-900 dark:text-white">{asset.symbol}</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">{asset.name}</span>
                              </div>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {asset.metadata?.lastPrice ? watchlistApi.formatPrice(asset.metadata.lastPrice, 'INR') : '₹0.00'}
                                </span>
                                <span className={`px-2 py-1 text-sm rounded-full ${getChangeBgColor(asset.metadata?.changePercent || 0)} ${getChangeColor(asset.metadata?.changePercent || 0)}`}>
                                  {asset.metadata?.changePercent !== null && asset.metadata?.changePercent !== undefined ? watchlistApi.formatChange(asset.metadata.changePercent) : '+0.00%'}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{asset.exchange || 'NSE'}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveAsset(asset.symbol)}
                              className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                              title="Remove Asset"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                        }
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Assets</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Add assets to your watchlist to track their performance</p>
                        <button
                          onClick={() => setShowSearch(true)}
                          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
                        >
                          Add Assets
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                  <StarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Watchlist Selected</h3>
                  <p className="text-gray-600 dark:text-gray-400">Select a watchlist from the list to view details</p>
                </div>
              )}
            </div>
          </div>

          {/* Create Watchlist Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
              <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md mx-4">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Watchlist</h3>
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleCreateWatchlist}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                          placeholder="Enter watchlist name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                          placeholder="Enter description (optional)"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
                      >
                        {loading ? 'Creating...' : 'Create Watchlist'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Search Assets Modal */}
          {showSearch && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
              <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Search Assets</h3>
                    <button
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchQueryChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                        placeholder="Search for stocks, ETFs, or other assets..."
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Search Status/Results Header */}
                  {searchQuery.length >= 2 && (
                    <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                      {searchLoading && <span>Searching for "{searchQuery}"...</span>}
                      {!searchLoading && searchResults.length > 0 && (
                        <span>Found {searchResults.length} result(s) for "{searchQuery}"</span>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    {searchResults.map((asset) => (
                      <div
                        key={asset.symbol}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 dark:text-white">{asset.symbol}</span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">{asset.name || 'Asset Name N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {asset.lastPrice ? watchlistApi.formatPrice(asset.lastPrice, 'INR') : '₹--'}
                              </span>
                              <span className={`px-2 py-1 text-sm rounded-full ${getChangeBgColor(asset.changePercent)} ${getChangeColor(asset.changePercent)}`}>
                                {asset.changePercent !== null && asset.changePercent !== undefined ? watchlistApi.formatChange(asset.changePercent) : '+0.00%'}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">{asset.exchange || 'NSE'}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddAsset(asset)}
                            className="px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white text-sm rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                    {searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
                      <div className="p-8 text-center">
                        <p className="text-gray-600 dark:text-gray-400">No assets found for "{searchQuery}"</p>
                      </div>
                    )}
                    {searchQuery.length < 2 && (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <p>Enter at least 2 characters to search</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchlistManager;