import React from 'react';
import { Box, Typography } from '@mui/material';
import { AnalyticsQueryPanel } from '../components/dashboard/AnalyticsQueryPanel';

export const Diagnostics: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        🔧 System Diagnostics
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Raw analytics queries and system diagnostics
      </Typography>

      <AnalyticsQueryPanel />
    </Box>
  );
};