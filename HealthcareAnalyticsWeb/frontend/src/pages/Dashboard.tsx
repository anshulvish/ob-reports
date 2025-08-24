import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Box,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { apiService } from '../services/api';

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

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const health = await apiService.getHealth();
      setHealthStatus(health);
      
      const bigQuery = await apiService.testBigQuery();
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'connected':
        return 'success' as const;
      case 'failed':
        return 'error' as const;
      default:
        return 'warning' as const;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        🏥 Aya Healthcare Analytics Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        System status and onboarding analytics overview
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" onClick={checkHealth}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* API Health Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🚀 Backend API Status
              </Typography>
              {loading ? (
                <Box display="flex" alignItems="center" gap={2}>
                  <CircularProgress size={24} />
                  <Typography>Checking API health...</Typography>
                </Box>
              ) : healthStatus ? (
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {getStatusIcon(healthStatus.status)}
                    <Chip 
                      label={healthStatus.status}
                      color={getStatusColor(healthStatus.status)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Service: {healthStatus.service}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Version: {healthStatus.version}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Environment: {healthStatus.environment}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Timestamp: {new Date(healthStatus.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              ) : (
                <Typography color="text.secondary">No data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* BigQuery Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 BigQuery Connection
              </Typography>
              {loading ? (
                <Box display="flex" alignItems="center" gap={2}>
                  <CircularProgress size={24} />
                  <Typography>Testing BigQuery connection...</Typography>
                </Box>
              ) : bigQueryStatus ? (
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {getStatusIcon(bigQueryStatus.status)}
                    <Chip 
                      label={bigQueryStatus.status}
                      color={getStatusColor(bigQueryStatus.status)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Project: {bigQueryStatus.projectId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Target Dataset: {bigQueryStatus.targetDataset}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Datasets Found: {bigQueryStatus.datasetCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Message: {bigQueryStatus.message}
                  </Typography>
                </Box>
              ) : (
                <Typography color="text.secondary">No data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🛠️ Quick Actions
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button 
                  variant="contained" 
                  onClick={checkHealth}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : null}
                >
                  {loading ? 'Checking...' : 'Refresh Status'}
                </Button>
                <Button variant="outlined" disabled>
                  View Engagement Analysis
                </Button>
                <Button variant="outlined" disabled>
                  Search User Journeys
                </Button>
                <Button variant="outlined" disabled>
                  Analyze Screen Flow
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Feature Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Feature Availability
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <CheckIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2" fontWeight="bold">Backend API</Typography>
                    <Typography variant="caption" color="text.secondary">Ready</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <CheckIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2" fontWeight="bold">BigQuery Integration</Typography>
                    <Typography variant="caption" color="text.secondary">Configured</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <WarningIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2" fontWeight="bold">Dashboard UI</Typography>
                    <Typography variant="caption" color="text.secondary">In Development</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <WarningIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body2" fontWeight="bold">Data Visualization</Typography>
                    <Typography variant="caption" color="text.secondary">Coming Soon</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};