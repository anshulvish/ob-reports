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
  AccessTime
} from '@mui/icons-material';
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
                    {metrics.totalUsers?.toLocaleString() || '0'}
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
                    {formatNumber(metrics.averageSessionsPerUser || 0)}
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
                    {formatNumber(metrics.averageEventsPerUser || 0)}
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
                    {formatDuration(metrics.averageSessionDurationSeconds || 0)}
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
                      {formatNumber(metrics.averageUniqueEventsPerUser || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Unique Events/User
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="secondary">
                      {formatNumber(metrics.averagePagesPerUser || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pages/User
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="success.main">
                      {formatNumber(metrics.averageScreenViewsPerUser || 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Screen Views/User
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h5" color="warning.main">
                      {formatNumber(metrics.averageAifpInteractionsPerUser || 0)}
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
                  label={formatDuration(metrics.averageEngagementTimeSeconds || 0)}
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
              {metrics.engagementDistribution && metrics.engagementDistribution.length > 0 ? (
                <Stack spacing={2}>
                  {metrics.engagementDistribution.map((dist: any, index: number) => (
                    <Box key={index} display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1">
                        {dist.level} Engagement:
                      </Typography>
                      <Chip 
                        label={`${dist.userCount} users`}
                        color={dist.level === 'High' ? 'success' : dist.level === 'Medium' ? 'warning' : 'error'}
                        size="small"
                      />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No engagement distribution data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SimpleEngagementPanel;