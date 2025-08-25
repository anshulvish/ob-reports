import React, { useEffect, useState } from 'react';
import {
  CheckCircle as CheckIcon,
  AlertCircle as ErrorIcon,
  AlertTriangle as WarningIcon,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { apiClient } from '../services/generated-api-client';
import { DateRangePicker } from '../components/common/DateRangePicker';
import { EngagementMetricsPanel } from '../components/engagement/EngagementMetricsPanel';

interface HealthStatus {
  service: string;
  status: string;
  version: string;
  timestamp: string;
  environment: string;
}

interface BigQueryStatus {
  status: string;
  projectId: string;
  datasetCount: number;
  targetDataset: string;
  message: string;
}

export const Dashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [bigQueryStatus, setBigQueryStatus] = useState<BigQueryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Set default date range to last 30 days
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => new Date());

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const health = await apiClient.getHealth();
      setHealthStatus(health);
      
      const bigQuery = await apiClient.testBigQueryConnection();
      setBigQueryStatus(bigQuery);
      
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend API');
      console.error('Health check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleDateRangeChange = (start: Date, end: Date) => {
    console.log('📅 Date range changed:', start.toDateString(), 'to', end.toDateString());
    setStartDate(start);
    setEndDate(end);
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'connected':
        return <CheckIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">📊 Onboarding Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          System status and onboarding analytics overview
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <ErrorIcon className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {error}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={checkHealth}
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Date Range Selection */}
        <Card>
          <CardContent>
            <DateRangePicker onDateRangeChange={handleDateRangeChange} />
          </CardContent>
        </Card>

        {/* Engagement Analytics */}
        {startDate && endDate && (
          <EngagementMetricsPanel startDate={startDate} endDate={endDate} />
        )}

        {/* Health Status Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* API Health Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🚀 Analytics API Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Checking API health...</span>
                </div>
              ) : healthStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(healthStatus.status)}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      healthStatus.status === 'Healthy' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {healthStatus.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Service: {healthStatus.service}</p>
                    <p>Version: {healthStatus.version}</p>
                    <p>Environment: {healthStatus.environment}</p>
                    <p>Timestamp: {new Date(healthStatus.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* BigQuery Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 BigQuery Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Testing BigQuery connection...</span>
                </div>
              ) : bigQueryStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(bigQueryStatus.status)}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      bigQueryStatus.status === 'Connected' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {bigQueryStatus.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Project: {bigQueryStatus.projectId}</p>
                    <p>Target Dataset: {bigQueryStatus.targetDataset}</p>
                    <p>Datasets Found: {bigQueryStatus.datasetCount}</p>
                    <p>Message: {bigQueryStatus.message}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>🛠️ Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={checkHealth}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Checking...' : 'Refresh Status'}
              </Button>
              <Button variant="outline" asChild>
                <a href="/diagnostics">System Diagnostics</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/user-journeys">Search User Journeys</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/screen-flow">Analyze Screen Flow</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Date Range Selection and Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>📅 Analytics Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <DateRangePicker
              initialStartDate={startDate || undefined}
              initialEndDate={endDate || undefined}
              onDateRangeChange={handleDateRangeChange}
            />
          </CardContent>
        </Card>

        {/* Analytics Dashboard */}
        {startDate && endDate ? (
          <div>
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                📊 Showing analytics for: {startDate.toDateString()} to {endDate.toDateString()}
              </p>
            </div>
            <EngagementMetricsPanel startDate={startDate} endDate={endDate} />
          </div>
        ) : (
          <div className="p-8 text-center bg-muted rounded-lg">
            <p className="text-muted-foreground">
              📅 Select a date range above to view analytics charts
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Debug: startDate={startDate?.toString() || 'null'}, endDate={endDate?.toString() || 'null'}
            </p>
          </div>
        )}

        {/* Feature Status */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Feature Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="text-center">
                <CheckIcon className="h-10 w-10 mx-auto mb-2 text-green-600" />
                <p className="font-medium text-sm">Backend API</p>
                <p className="text-xs text-muted-foreground">Ready</p>
              </div>
              <div className="text-center">
                <CheckIcon className="h-10 w-10 mx-auto mb-2 text-green-600" />
                <p className="font-medium text-sm">BigQuery Integration</p>
                <p className="text-xs text-muted-foreground">Configured</p>
              </div>
              <div className="text-center">
                <CheckIcon className="h-10 w-10 mx-auto mb-2 text-green-600" />
                <p className="font-medium text-sm">Date-Driven Analytics</p>
                <p className="text-xs text-muted-foreground">Ready</p>
              </div>
              <div className="text-center">
                <CheckIcon className="h-10 w-10 mx-auto mb-2 text-green-600" />
                <p className="font-medium text-sm">Data Visualization</p>
                <p className="text-xs text-muted-foreground">Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};