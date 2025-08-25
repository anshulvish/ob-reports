import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { DateRangePicker } from '../components/common/DateRangePicker';
import { ScreenFlowVisualization } from '../components/journey/ScreenFlowVisualization';

export const ScreenFlow: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        🌊 Screen Flow Analysis
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Visualize user journey paths and screen-to-screen transitions in the onboarding process
      </Typography>

      {/* Date Range Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <DateRangePicker onDateRangeChange={handleDateRangeChange} />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Screen Flow Analysis Features:</strong>
        <br />
        • Interactive flow diagram with drag-and-drop nodes
        <br />
        • Screen visit counts and average time spent
        <br />
        • Conversion rates between screens
        <br />
        • Visual indicators for high/medium/low conversion paths
        <br />
        • Minimap for navigation in complex flows
      </Alert>

      {/* Screen Flow Visualization */}
      {startDate && endDate ? (
        <ScreenFlowVisualization startDate={startDate} endDate={endDate} />
      ) : (
        <Card>
          <CardContent>
            <Box textAlign="center" py={6}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Select Date Range to Begin
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a date range to analyze screen flow patterns
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ScreenFlow;