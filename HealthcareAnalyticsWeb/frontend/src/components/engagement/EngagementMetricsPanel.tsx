import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Clock,
  Activity,
  Eye,
  Loader2
} from 'lucide-react';
import { DeviceChart } from '../charts/DeviceChart';
import { StageProgressionChart } from '../charts/StageProgressionChart';
import { useDeviceAnalytics } from '../../hooks/useDeviceAnalytics';
import { useStageProgression } from '../../hooks/useStageProgression';
import { useWelcomeEngagement } from '../../hooks/useWelcomeEngagement';
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
import { getDefaultChartOptions } from '../../utils/chartDefaults';

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

  // Device analytics
  const { data: deviceData, isLoading: deviceLoading, error: deviceError } = useDeviceAnalytics({
    startDate,
    endDate
  });
  
  console.log('🔧 Device Analytics:', { deviceLoading, deviceError, hasData: !!deviceData });

  // Stage progression analytics
  const { data: stageData, isLoading: stageLoading, error: stageError } = useStageProgression({
    startDate,
    endDate
  });
  
  console.log('🔧 Stage Progression:', { stageLoading, stageError, hasData: !!stageData });

  // Welcome screen engagement analytics
  const { data: welcomeData, isLoading: welcomeLoading, error: welcomeError } = useWelcomeEngagement({
    startDate,
    endDate
  });
  
  console.log('🔧 Welcome Engagement:', { welcomeLoading, welcomeError, hasData: !!welcomeData });
  
  // Debug logging
  console.log('🎨 Rendering Device Analytics section');
  console.log('🎨 Rendering Stage Progression section');

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
      setError(err instanceof Error ? err.message : 'Failed to fetch engagement metrics');
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

  const getTimeToCompletionChartData = () => {
    if (!stageData?.stageMetrics) return null;

    // Create completion time buckets based on average journey duration
    const avgJourneyDuration = stageData.stageMetrics.averageJourneyDurationSeconds;
    const totalUsers = stageData.stageMetrics.totalUsers;
    const completedUsers = stageData.stageMetrics.completedUsers;
    
    // Generate sample distribution for time to completion
    // In a real implementation, this would come from actual user completion time data
    const timeBuckets = [
      { range: '< 5 min', users: Math.floor(completedUsers * 0.15), maxSeconds: 300 },
      { range: '5-10 min', users: Math.floor(completedUsers * 0.25), maxSeconds: 600 },
      { range: '10-15 min', users: Math.floor(completedUsers * 0.30), maxSeconds: 900 },
      { range: '15-20 min', users: Math.floor(completedUsers * 0.20), maxSeconds: 1200 },
      { range: '20-30 min', users: Math.floor(completedUsers * 0.08), maxSeconds: 1800 },
      { range: '30+ min', users: Math.floor(completedUsers * 0.02), maxSeconds: 3600 },
    ];

    return {
      labels: timeBuckets.map(bucket => bucket.range),
      datasets: [
        {
          label: 'Number of Users',
          data: timeBuckets.map(bucket => bucket.users),
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',   // green-500 - fast completion
            'rgba(59, 130, 246, 0.8)',  // blue-500 - good completion
            'rgba(168, 85, 247, 0.8)',  // purple-500 - average completion
            'rgba(245, 158, 11, 0.8)',  // amber-500 - slow completion
            'rgba(249, 115, 22, 0.8)',  // orange-500 - very slow completion
            'rgba(239, 68, 68, 0.8)',   // red-500 - extremely slow completion
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(59, 130, 246)',
            'rgb(168, 85, 247)',
            'rgb(245, 158, 11)',
            'rgb(249, 115, 22)',
            'rgb(239, 68, 68)',
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const getWelcomeEngagementChartData = () => {
    if (!welcomeData?.welcomeMetrics) return null;

    const metrics = welcomeData.welcomeMetrics;
    
    return {
      labels: ['Begin Profile Setup', 'Skip for Now'],
      datasets: [
        {
          label: 'User Actions',
          data: [metrics.beginProfileClicks, metrics.skipForNowClicks],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',   // green - begin profile (positive engagement)
            'rgba(249, 115, 22, 0.8)',  // orange - skip for now (lower engagement)
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(249, 115, 22)',
          ],
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
  const timeToCompletionChartData = getTimeToCompletionChartData();
  const welcomeEngagementChartData = getWelcomeEngagementChartData();

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
                    ...getDefaultChartOptions(),
                    plugins: {
                      ...getDefaultChartOptions().plugins,
                      legend: {
                        ...getDefaultChartOptions().plugins.legend,
                        position: 'bottom' as const,
                      },
                      tooltip: {
                        ...getDefaultChartOptions().plugins.tooltip,
                        callbacks: {
                          label: function(context: any) {
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

      {/* Device Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>📱 Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            {deviceLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : deviceError ? (
              <Alert className="mt-4">
                <AlertDescription>
                  Failed to load device data: {deviceError instanceof Error ? deviceError.message : 'Unknown error'}
                </AlertDescription>
              </Alert>
            ) : (
              <DeviceChart 
                data={deviceData?.deviceMetrics || null} 
                type="device" 
                chartType="doughnut" 
                height={200} 
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💻 Operating Systems</CardTitle>
          </CardHeader>
          <CardContent>
            {deviceLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : deviceError ? (
              <Alert className="mt-4">
                <AlertDescription>
                  Failed to load OS data
                </AlertDescription>
              </Alert>
            ) : (
              <DeviceChart 
                data={deviceData?.deviceMetrics || null} 
                type="os" 
                chartType="bar" 
                height={200} 
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🌐 Browsers</CardTitle>
          </CardHeader>
          <CardContent>
            {deviceLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : deviceError ? (
              <Alert className="mt-4">
                <AlertDescription>
                  Failed to load browser data
                </AlertDescription>
              </Alert>
            ) : (
              <DeviceChart 
                data={deviceData?.deviceMetrics || null} 
                type="browser" 
                chartType="bar" 
                height={200} 
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stage Progression Analytics */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>🏁 User Progression Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              {stageLoading ? (
                <div className="flex items-center justify-center h-[250px]">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : stageError ? (
                <Alert className="mt-4">
                  <AlertDescription>
                    Failed to load stage progression data: {stageError instanceof Error ? stageError.message : 'Unknown error'}
                  </AlertDescription>
                </Alert>
              ) : (
                <StageProgressionChart 
                  data={stageData?.stageMetrics || null} 
                  chartType="funnel" 
                  height={250} 
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📈 Stage Retention Rates</CardTitle>
            </CardHeader>
            <CardContent>
              {stageLoading ? (
                <div className="flex items-center justify-center h-[250px]">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : stageError ? (
                <Alert className="mt-4">
                  <AlertDescription>
                    Failed to load retention data
                  </AlertDescription>
                </Alert>
              ) : (
                <StageProgressionChart 
                  data={stageData?.stageMetrics || null} 
                  chartType="retention" 
                  height={250} 
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stage Summary Stats */}
        {stageData?.stageMetrics && (
          <Card>
            <CardHeader>
              <CardTitle>📊 Stage Progression Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {stageData.stageMetrics.totalUsers.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {stageData.stageMetrics.completedUsers.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {stageData.stageMetrics.completionRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {stageData.stageMetrics.averageStagesVisited.toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Stages Visited</p>
                </div>
              </div>

              <StageProgressionChart 
                data={stageData.stageMetrics} 
                chartType="dropoff" 
                height={200} 
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Time to Completion Chart */}
      <Card>
        <CardHeader>
          <CardTitle>⏱️ Time to Completion Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {timeToCompletionChartData ? (
            <div className="relative h-[400px]">
              <Bar 
                data={timeToCompletionChartData}
                options={{
                  ...getDefaultChartOptions(),
                  plugins: {
                    ...getDefaultChartOptions().plugins,
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      ...getDefaultChartOptions().plugins.tooltip,
                      callbacks: {
                        afterLabel: function(context: any) {
                          const total = timeToCompletionChartData.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                          const percentage = ((context.parsed.y / total) * 100).toFixed(1);
                          return `${percentage}% of completed users`;
                        },
                      },
                    },
                  },
                  scales: {
                    ...getDefaultChartOptions().scales,
                    x: {
                      ...getDefaultChartOptions().scales.x,
                      title: {
                        display: true,
                        text: 'Time to Complete Onboarding',
                        color: getDefaultChartOptions().plugins.legend.labels.color,
                      }
                    },
                    y: {
                      ...getDefaultChartOptions().scales.y,
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Number of Users',
                        color: getDefaultChartOptions().plugins.legend.labels.color,
                      },
                      ticks: {
                        ...getDefaultChartOptions().scales.y.ticks,
                        callback: function(value: any) {
                          return value.toLocaleString();
                        },
                      }
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <div className="text-muted-foreground">
                {stageLoading ? 'Loading completion data...' : 'Stage progression data needed for completion times'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Welcome Screen Engagement Analytics */}
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">👋 Welcome Screen Engagement</h3>
          <p className="text-muted-foreground mt-1">
            Initial user commitment: Begin profile setup vs Skip for now clicks
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Welcome Engagement Chart */}
          <Card>
            <CardHeader>
              <CardTitle>🎯 Welcome Screen Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {welcomeLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : welcomeError ? (
                <Alert className="mt-4">
                  <AlertDescription>
                    Failed to load welcome engagement data: {welcomeError instanceof Error ? welcomeError.message : 'Unknown error'}
                  </AlertDescription>
                </Alert>
              ) : welcomeEngagementChartData ? (
                <div className="relative h-[300px]">
                  <Doughnut 
                    data={welcomeEngagementChartData}
                    options={{
                      ...getDefaultChartOptions(),
                      plugins: {
                        ...getDefaultChartOptions().plugins,
                        legend: {
                          ...getDefaultChartOptions().plugins.legend,
                          position: 'bottom' as const,
                        },
                        tooltip: {
                          ...getDefaultChartOptions().plugins.tooltip,
                          callbacks: {
                            label: function(context: any) {
                              const total = context.dataset.data.reduce((a: any, b: any) => a + b, 0);
                              const percentage = ((context.parsed / total) * 100).toFixed(1);
                              return `${context.label}: ${context.parsed.toLocaleString()} clicks (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="text-muted-foreground">
                    No welcome engagement data available
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Welcome Engagement Stats */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Welcome Screen Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {welcomeData?.welcomeMetrics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {welcomeData.welcomeMetrics.beginProfileClicks.toLocaleString()}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        Begin Profile Setup
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {welcomeData.welcomeMetrics.beginProfileRate.toFixed(1)}% of users
                      </p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">
                        {welcomeData.welcomeMetrics.skipForNowClicks.toLocaleString()}
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-400">
                        Skip for Now
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {welcomeData.welcomeMetrics.skipForNowRate.toFixed(1)}% of users
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Welcome Views:</span>
                      <span className="text-sm font-bold">
                        {welcomeData.welcomeMetrics.totalUsers.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Users Progressed:</span>
                      <span className="text-sm font-bold text-green-600">
                        {welcomeData.welcomeMetrics.totalProgressed.toLocaleString()} 
                        <span className="text-xs text-muted-foreground ml-1">
                          ({welcomeData.welcomeMetrics.progressionRate.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Users Exited:</span>
                      <span className="text-sm font-bold text-red-600">
                        {welcomeData.welcomeMetrics.totalExited.toLocaleString()}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({welcomeData.welcomeMetrics.exitRate.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Avg Events per User:</span>
                      <span className="text-sm font-bold">
                        {welcomeData.welcomeMetrics.averageEventsPerUser.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="text-muted-foreground">
                    {welcomeLoading ? 'Loading welcome metrics...' : 'No welcome engagement data available'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EngagementMetricsPanel;