import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import {
  TrendingUp,
  Users,
  Activity,
  Clock,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { apiClient, EngagementMetricsRequest, EngagementMetricsResponse } from '../../services/generated-api-client';

interface SimpleEngagementPanelProps {
  startDate: Date;
  endDate: Date;
}

export const SimpleEngagementPanel: React.FC<SimpleEngagementPanelProps> = ({
  startDate,
  endDate
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (startDate && endDate) {
      fetchEngagementMetrics();
    }
  }, [startDate, endDate]);

  const fetchEngagementMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiClient.getEngagementMetrics({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });
      
      setMetrics(data.metrics);
    } catch (err: any) {
      console.error('Failed to fetch engagement metrics:', err);
      setError(err.message || 'Failed to fetch engagement metrics');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatNumber = (num: number, decimals: number = 1): string => {
    return num.toFixed(decimals);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm text-muted-foreground">Calculating engagement metrics...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchEngagementMetrics}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-6">
            <h3 className="text-lg font-medium mb-2">Engagement Metrics</h3>
            <p className="text-muted-foreground mb-4">
              Select a date range to view engagement analytics
            </p>
            <Button onClick={fetchEngagementMetrics} disabled={!startDate || !endDate}>
              Load Engagement Metrics
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">📊 Engagement Analytics</h2>
        <p className="text-muted-foreground mt-1">
          {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">
                  {metrics.totalUsers?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total Users
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(metrics.averageSessionsPerUser || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Avg Sessions/User
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {formatNumber(metrics.averageEventsPerUser || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Avg Events/User
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatDuration(metrics.averageSessionDurationSeconds || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Avg Session Duration
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>📈 Detailed Engagement Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xl font-bold text-primary">
                  {formatNumber(metrics.averageUniqueEventsPerUser || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Unique Events/User
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-purple-600">
                  {formatNumber(metrics.averagePagesPerUser || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Pages/User
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-600">
                  {formatNumber(metrics.averageScreenViewsPerUser || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Screen Views/User
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-orange-600">
                  {formatNumber(metrics.averageAifpInteractionsPerUser || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  AIFP Interactions/User
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Engagement Time Metrics</h4>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Avg Engagement Time:
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                  {formatDuration(metrics.averageEngagementTimeSeconds || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🎯 Engagement Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.engagementDistribution && metrics.engagementDistribution.length > 0 ? (
              <div className="space-y-3">
                {metrics.engagementDistribution.map((dist: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="font-medium">
                      {dist.level} Engagement:
                    </span>
                    <span className={`px-2 py-1 text-sm rounded ${
                      dist.level === 'High' 
                        ? 'bg-green-100 text-green-800'
                        : dist.level === 'Medium'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {dist.userCount} users
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No engagement distribution data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleEngagementPanel;