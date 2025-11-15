import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeysApi } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Badge } from '../../components/shared/Badge';
import { Alert, AlertDescription } from '../../components/shared/Alert';
import { 
  Key, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Save,
  TestTube,
  Settings,
  Database,
  TrendingUp,
  Shield
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  displayName: string;
  apiKey?: string;
  secretKey?: string;
  baseUrl?: string;
  isActive: boolean;
  status: 'active' | 'inactive' | 'error' | 'testing';
  lastTested?: Date;
  errorMessage?: string;
  rateLimit: number;
  requestsUsed: number;
  type: 'crypto' | 'stock' | 'general';
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeysManagement: React.FC = () => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ApiKey>>({});
  const [testingKeys, setTestingKeys] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'saving' | 'saved' | 'error' | undefined }>({});

  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading, refetch, error } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiKeysApi.getAllApiKeys(),
    select: (response) => response.data,
    retry: false,
  });

  const updateApiKeyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiKeysApi.updateApiKey(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setSaveStatus(prev => ({ ...prev, [id]: 'saved' }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [id]: undefined }));
      }, 2000);
    },
    onError: (_, { id }) => {
      setSaveStatus(prev => ({ ...prev, [id]: 'error' }));
    },
  });

  const testApiKeyMutation = useMutation({
    mutationFn: (id: string) => apiKeysApi.testApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const initializeDefaultKeysMutation = useMutation({
    mutationFn: () => apiKeysApi.initializeDefaultApiKeys(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  useEffect(() => {
    if (apiKeys && Array.isArray(apiKeys) && apiKeys.length === 0) {
      initializeDefaultKeysMutation.mutate();
    }
  }, [apiKeys, initializeDefaultKeysMutation]);

  const handleEdit = (apiKey: ApiKey) => {
    setEditingKey(apiKey.id);
    setFormData({
      apiKey: apiKey.apiKey || '',
      secretKey: apiKey.secretKey || '',
      baseUrl: apiKey.baseUrl || '',
      rateLimit: apiKey.rateLimit,
      isActive: apiKey.isActive,
    });
  };

  const handleSave = (id: string) => {
    setSaveStatus(prev => ({ ...prev, [id]: 'saving' }));
    updateApiKeyMutation.mutate({ id, data: formData });
    setEditingKey(null);
  };

  const handleTest = async (id: string) => {
    setTestingKeys(prev => new Set(prev).add(id));
    try {
      await testApiKeyMutation.mutateAsync(id);
    } finally {
      setTestingKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'testing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'testing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'crypto':
        return <TrendingUp className="w-4 h-4" />;
      case 'stock':
        return <Database className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'crypto':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'stock':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to load API Keys</h3>
          <p className="text-gray-400 mb-4">
            {(error as any)?.response?.data?.message || 'Unable to fetch API keys. Please check your connection.'}
          </p>
          <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">API Keys Management</h1>
          <p className="text-gray-400">Configure and manage external API integrations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => refetch()} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button 
            onClick={() => initializeDefaultKeysMutation.mutate()}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Shield className="w-4 h-4" />
            Initialize Defaults
          </Button>
        </div>
      </div>

      {/* API Keys Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.isArray(apiKeys) && apiKeys.map((apiKey: ApiKey) => (
          <Card key={apiKey.id} className="border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  {apiKey.displayName}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(apiKey.status)}>
                    {getStatusIcon(apiKey.status)}
                    <span className="ml-1 capitalize">{apiKey.status}</span>
                  </Badge>
                  <Badge className={getTypeColor(apiKey.type)}>
                    {getTypeIcon(apiKey.type)}
                    <span className="ml-1 capitalize">{apiKey.type}</span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* API Key Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key
                </label>
                {editingKey === apiKey.id ? (
                  <Input
                    type="password"
                    value={formData.apiKey || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter API key"
                    className="w-full"
                  />
                ) : (
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <p className="text-gray-300">
                      {apiKey.apiKey ? '••••••••••••••••' : 'Not configured'}
                    </p>
                  </div>
                )}
              </div>

              {/* Secret Key Field (for APIs that need it) */}
              {(apiKey.name === 'binance' || apiKey.name === 'alpha-vantage') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Secret Key
                  </label>
                  {editingKey === apiKey.id ? (
                    <Input
                      type="password"
                      value={formData.secretKey || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, secretKey: e.target.value }))}
                      placeholder="Enter secret key"
                      className="w-full"
                    />
                  ) : (
                    <div className="p-3 bg-gray-700 rounded-lg">
                      <p className="text-gray-300">
                        {apiKey.secretKey ? '••••••••••••••••' : 'Not configured'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Base URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Base URL
                </label>
                {editingKey === apiKey.id ? (
                  <Input
                    value={formData.baseUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="Enter base URL"
                    className="w-full"
                  />
                ) : (
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <p className="text-gray-300">{apiKey.baseUrl || 'Not configured'}</p>
                  </div>
                )}
              </div>

              {/* Rate Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rate Limit (requests per minute)
                </label>
                {editingKey === apiKey.id ? (
                  <Input
                    type="number"
                    value={formData.rateLimit || 1000}
                    onChange={(e) => setFormData(prev => ({ ...prev, rateLimit: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                ) : (
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <p className="text-gray-300">{apiKey.rateLimit} requests/min</p>
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Active</label>
                {editingKey === apiKey.id ? (
                  <input
                    type="checkbox"
                    checked={formData.isActive || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                  />
                ) : (
                  <div className={`w-4 h-4 rounded-full ${apiKey.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                )}
              </div>

              {/* Error Message */}
              {apiKey.errorMessage && (
                <Alert className="border-red-500">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <AlertDescription className="text-red-400">
                    {apiKey.errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              {/* Last Tested */}
              {apiKey.lastTested && (
                <div className="text-sm text-gray-400">
                  Last tested: {new Date(apiKey.lastTested).toLocaleString()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {editingKey === apiKey.id ? (
                  <>
                    <Button
                      onClick={() => handleSave(apiKey.id)}
                      disabled={updateApiKeyMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saveStatus[apiKey.id] === 'saving' ? 'Saving...' : 
                       saveStatus[apiKey.id] === 'saved' ? 'Saved!' : 
                       saveStatus[apiKey.id] === 'error' ? 'Error' : 'Save'}
                    </Button>
                    <Button
                      onClick={() => setEditingKey(null)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => handleEdit(apiKey)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleTest(apiKey.id)}
                      disabled={testingKeys.has(apiKey.id)}
                      className="flex items-center gap-2"
                    >
                      <TestTube className="w-4 h-4" />
                      {testingKeys.has(apiKey.id) ? 'Testing...' : 'Test'}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No API Keys Message */}
      {Array.isArray(apiKeys) && apiKeys.length === 0 && (
        <div className="text-center py-12">
          <Key className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No API Keys Found</h3>
          <p className="text-gray-400 mb-4">Initialize default API keys to get started</p>
          <Button onClick={() => initializeDefaultKeysMutation.mutate()}>
            Initialize Default API Keys
          </Button>
        </div>
      )}
    </div>
  );
};

export default ApiKeysManagement;

