import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Stack,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  People,
  Timeline,
  AccessTime,
  TouchApp,
  Visibility
} from '@mui/icons-material';
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
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <Stack alignItems="center" spacing={2}>
              <CircularProgress />
              <Typography>Calculating engagement metrics...</Typography>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={fetchEngagementMetrics}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent>
          <Box textAlign="center" py={3}>
            <Typography variant="h6" gutterBottom>
              Engagement Metrics
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              Select a date range to view engagement analytics
            </Typography>
            <Button variant="contained" onClick={fetchEngagementMetrics} disabled={!startDate || !endDate}>
              Load Engagement Metrics
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const distributionChartData = getEngagementDistributionChartData();
  const comparisonChartData = getEngagementComparisonChartData();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        📊 Engagement Analytics
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
      </Typography>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <People color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {metrics.totalUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Timeline color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4" color="success.main">
                    {formatNumber(metrics.averageSessionsPerUser)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Sessions/User
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {formatNumber(metrics.averageEventsPerUser)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Events/User
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccessTime color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h4" color="info.main">
                    {formatDuration(metrics.averageSessionDurationSeconds)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Session Duration
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Detailed Engagement Metrics
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="primary">
                      {formatNumber(metrics.averageUniqueEventsPerUser)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Unique Events/User
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="secondary">
                      {formatNumber(metrics.averagePagesPerUser)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pages/User
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="success.main">
                      {formatNumber(metrics.averageScreenViewsPerUser)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Screen Views/User
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="warning.main">
                      {formatNumber(metrics.averageAifpInteractionsPerUser)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      AIFP Interactions/User
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Engagement Time Metrics
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Avg Engagement Time:
                </Typography>
                <Chip 
                  label={formatDuration(metrics.averageEngagementTimeSeconds)}
                  color="info"
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 Engagement Distribution
              </Typography>
              {distributionChartData && (
                <Box sx={{ position: 'relative', height: 300 }}>
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
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Comparison Chart */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Average vs Median Comparison
              </Typography>
              {comparisonChartData && (
                <Box sx={{ position: 'relative', height: 400 }}>
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
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EngagementMetricsPanel;