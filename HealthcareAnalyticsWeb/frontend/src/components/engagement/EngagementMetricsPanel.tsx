import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Clock,
  Activity,
  Eye,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { format } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

interface EngagementMetrics {
  totalUsers: number;
  averageSessionsPerUser: number;
  averageEventsPerUser: number;
  averageUniqueEventsPerUser: number;
  averagePagesPerUser: number;
  averageSessionDurationSeconds: number;
  averageEngagementTimeSeconds: number;
  averageScreenViewsPerUser: number;
  averageAifpInteractionsPerUser: number;
  medianSessionsPerUser: number;
  medianEventsPerUser: number;
  engagementDistribution: Array<{
    level: string;
    userCount: number;
  }>;
}

interface EngagementMetricsResponse {
  success: boolean;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  tablesUsed: Array<{
    tableId: string;
    date: string;
    isIntraday: boolean;
  }>;
  metrics: EngagementMetrics;
  message: string;
}

interface EngagementMetricsPanelProps {
  startDate: Date;
  endDate: Date;
}

export const EngagementMetricsPanel: React.FC<EngagementMetricsPanelProps> = ({
  startDate,
  endDate
}) => {
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
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

      // Use the generated API client
      const { apiClient } = await import('../../services/generated-api-client');
      
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

  const getEngagementDistributionChartData = () => {
    if (!metrics?.engagementDistribution) return null;

    const colors = {
      High: '#4caf50',
      Medium: '#ff9800', 
      Low: '#f44336'
    };

    return {
      labels: metrics.engagementDistribution.map(d => d.level),
      datasets: [
        {
          data: metrics.engagementDistribution.map(d => d.userCount),
          backgroundColor: metrics.engagementDistribution.map(d => colors[d.level as keyof typeof colors]),
          borderColor: metrics.engagementDistribution.map(d => colors[d.level as keyof typeof colors]),
          borderWidth: 2,
        },
      ],
    };
  };

  const getEngagementComparisonChartData = () => {
    if (!metrics) return null;

    return {
      labels: ['Sessions', 'Events', 'Pages', 'Screen Views', 'Interactions'],
      datasets: [
        {
          label: 'Average per User',
          data: [
            metrics.averageSessionsPerUser,
            metrics.averageEventsPerUser,
            metrics.averagePagesPerUser,
            metrics.averageScreenViewsPerUser,
            metrics.averageAifpInteractionsPerUser,
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
        },
        {
          label: 'Median per User',
          data: [
            metrics.medianSessionsPerUser,
            metrics.medianEventsPerUser,
            0, // No median for pages
            0, // No median for screen views
            0, // No median for interactions
          ],
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
        },
      ],
    };
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

  const distributionChartData = getEngagementDistributionChartData();
  const comparisonChartData = getEngagementComparisonChartData();

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
                  {metrics.totalUsers.toLocaleString()}
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
                  {formatNumber(metrics.averageSessionsPerUser)}
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
                  {formatNumber(metrics.averageEventsPerUser)}
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
                  {formatDuration(metrics.averageSessionDurationSeconds)}
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
                  {formatNumber(metrics.averageUniqueEventsPerUser)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Unique Events/User
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-purple-600">
                  {formatNumber(metrics.averagePagesPerUser)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Pages/User
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-600">
                  {formatNumber(metrics.averageScreenViewsPerUser)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Screen Views/User
                </p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-orange-600">
                  {formatNumber(metrics.averageAifpInteractionsPerUser)}
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
                  {formatDuration(metrics.averageEngagementTimeSeconds)}
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
            {distributionChartData && (
              <div className="relative h-[300px]">
                <Doughnut 
                  data={distributionChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const total = context.dataset.data.reduce((a: any, b: any) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} users (${percentage}%)`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Average vs Median Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {comparisonChartData && (
            <div className="relative h-[400px]">
              <Bar 
                data={comparisonChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Count per User'
                      }
                    }
                  }
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EngagementMetricsPanel;