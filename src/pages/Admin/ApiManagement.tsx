import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Badge } from '../../components/shared/Badge';
import { Switch } from '../../components/shared/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/shared/Tabs';
import { Alert, AlertDescription } from '../../components/shared/Alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Activity,
  TrendingUp,
  Database,
  Shield
} from 'lucide-react';

interface ApiConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  secretKey?: string;
  isActive: boolean;
  priority: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  features: string[];
  type: 'crypto' | 'stock';
  supportedAssets: string[];
  tradingEnabled: boolean;
  paperTradingEnabled: boolean;
  status: 'connected' | 'disconnected' | 'error';
  lastChecked?: Date;
  errorMessage?: string;
}

interface ApiStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  rateLimitRemaining: number;
}

const ApiManagement: React.FC = () => {
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [apiStats, setApiStats] = useState<Record<string, ApiStats>>({});
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchApiConfigs();
    fetchApiStats();
  }, []);

  const fetchApiConfigs = async () => {
    try {
      const response = await fetch('/api/admin/api-configs');
      const configs = await response.json();
      setApiConfigs(configs);
    } catch (error) {
      console.error('Error fetching API configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApiStats = async () => {
    try {
      const response = await fetch('/api/admin/api-stats');
      const stats = await response.json();
      setApiStats(stats);
    } catch (error) {
      console.error('Error fetching API stats:', error);
    }
  };

  const testApiConnection = async (configName: string) => {
    try {
      const response = await fetch(`/api/admin/test-api/${configName}`, {
        method: 'POST',
      });
      const result = await response.json();
      setTestResults(prev => ({
        ...prev,
        [configName]: result
      }));
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [configName]: { success: false, error: error.message }
      }));
    }
  };

  const updateApiConfig = async (configName: string, updates: Partial<ApiConfig>) => {
    try {
      const response = await fetch(`/api/admin/api-configs/${configName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        await fetchApiConfigs();
      }
    } catch (error) {
      console.error('Error updating API config:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      case 'error':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Management</h1>
          <p className="text-gray-400">Configure and monitor external API integrations</p>
        </div>
        <Button onClick={fetchApiStats} className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Refresh Stats
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="crypto">Crypto APIs</TabsTrigger>
          <TabsTrigger value="stock">Stock APIs</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Active APIs</p>
                    <p className="text-2xl font-bold text-white">
                      {apiConfigs.filter(c => c.isActive).length}
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Connected APIs</p>
                    <p className="text-2xl font-bold text-white">
                      {apiConfigs.filter(c => c.status === 'connected').length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Requests</p>
                    <p className="text-2xl font-bold text-white">
                      {Object.values(apiStats).reduce((sum, stats) => sum + stats.totalRequests, 0)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  API Health Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {apiConfigs.map((config) => (
                  <div key={config.name} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(config.status)}
                      <div>
                        <p className="font-medium text-white">{config.name}</p>
                        <p className="text-sm text-gray-400">{config.type.toUpperCase()}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(config.status)}>
                      {config.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(apiStats).map(([apiName, stats]) => (
                  <div key={apiName} className="p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-white">{apiName}</p>
                      <p className="text-sm text-gray-400">
                        {stats.averageResponseTime}ms avg
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-400">
                        {stats.successfulRequests} success
                      </span>
                      <span className="text-red-400">
                        {stats.failedRequests} failed
                      </span>
                      <span className="text-blue-400">
                        {stats.rateLimitRemaining} remaining
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="crypto" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {apiConfigs.filter(c => c.type === 'crypto').map((config) => (
              <Card key={config.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(config.status)}
                      {config.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.isActive}
                        onCheckedChange={(checked: boolean) => 
                          updateApiConfig(config.name, { isActive: checked })
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testApiConnection(config.name)}
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Base URL</label>
                      <Input
                        value={config.baseUrl}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          updateApiConfig(config.name, { baseUrl: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Priority</label>
                      <Input
                        type="number"
                        value={config.priority}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          updateApiConfig(config.name, { priority: parseInt(e.target.value) })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">API Key</label>
                      <Input
                        type="password"
                        value={config.apiKey || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          updateApiConfig(config.name, { apiKey: e.target.value })
                        }
                        className="mt-1"
                        placeholder="Enter API key"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Secret Key</label>
                      <Input
                        type="password"
                        value={config.secretKey || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          updateApiConfig(config.name, { secretKey: e.target.value })
                        }
                        className="mt-1"
                        placeholder="Enter secret key"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.tradingEnabled}
                        onCheckedChange={(checked: boolean) => 
                          updateApiConfig(config.name, { tradingEnabled: checked })
                        }
                      />
                      <label className="text-sm text-gray-400">Trading Enabled</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.paperTradingEnabled}
                        onCheckedChange={(checked: boolean) => 
                          updateApiConfig(config.name, { paperTradingEnabled: checked })
                        }
                      />
                      <label className="text-sm text-gray-400">Paper Trading</label>
                    </div>
                  </div>

                  {testResults[config.name] && (
                    <Alert className={testResults[config.name].success ? 'border-green-500' : 'border-red-500'}>
                      <AlertDescription>
                        {testResults[config.name].success 
                          ? 'Connection test successful' 
                          : `Connection failed: ${testResults[config.name].error}`
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {apiConfigs.filter(c => c.type === 'stock').map((config) => (
              <Card key={config.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(config.status)}
                      {config.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.isActive}
                        onCheckedChange={(checked: boolean) => 
                          updateApiConfig(config.name, { isActive: checked })
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testApiConnection(config.name)}
                      >
                        Test
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Base URL</label>
                      <Input
                        value={config.baseUrl}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          updateApiConfig(config.name, { baseUrl: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Priority</label>
                      <Input
                        type="number"
                        value={config.priority}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          updateApiConfig(config.name, { priority: parseInt(e.target.value) })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">API Key</label>
                      <Input
                        type="password"
                        value={config.apiKey || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          updateApiConfig(config.name, { apiKey: e.target.value })
                        }
                        className="mt-1"
                        placeholder="Enter API key"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Secret Key</label>
                      <Input
                        type="password"
                        value={config.secretKey || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          updateApiConfig(config.name, { secretKey: e.target.value })
                        }
                        className="mt-1"
                        placeholder="Enter secret key"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.tradingEnabled}
                        onCheckedChange={(checked: boolean) => 
                          updateApiConfig(config.name, { tradingEnabled: checked })
                        }
                      />
                      <label className="text-sm text-gray-400">Trading Enabled</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config.paperTradingEnabled}
                        onCheckedChange={(checked: boolean) => 
                          updateApiConfig(config.name, { paperTradingEnabled: checked })
                        }
                      />
                      <label className="text-sm text-gray-400">Paper Trading</label>
                    </div>
                  </div>

                  {testResults[config.name] && (
                    <Alert className={testResults[config.name].success ? 'border-green-500' : 'border-red-500'}>
                      <AlertDescription>
                        {testResults[config.name].success 
                          ? 'Connection test successful' 
                          : `Connection failed: ${testResults[config.name].error}`
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time API Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(apiStats).map(([apiName, stats]) => (
                  <div key={apiName} className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">{apiName}</h3>
                      <Badge className="bg-blue-100 text-blue-800">
                        {stats.totalRequests} total requests
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Success Rate</p>
                        <p className="text-white font-semibold">
                          {((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Avg Response Time</p>
                        <p className="text-white font-semibold">{stats.averageResponseTime}ms</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Failed Requests</p>
                        <p className="text-red-400 font-semibold">{stats.failedRequests}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Rate Limit Remaining</p>
                        <p className="text-green-400 font-semibold">{stats.rateLimitRemaining}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiManagement;
