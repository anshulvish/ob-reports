import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import { DateRangePicker } from '../components/common/DateRangePicker';
import { UserJourneySearch } from '../components/journey/UserJourneySearch';

export const UserJourneys: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        👤 User Journey Analysis
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        Search and analyze individual user journeys through the onboarding process
      </Typography>

      {/* Date Range Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <DateRangePicker onDateRangeChange={handleDateRangeChange} />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>How to use User Journey Search:</strong>
        <br />
        1. Select a date range above
        <br />
        2. Enter a user pseudo ID (partial matches work)
        <br />
        3. Browse found sessions and click for detailed analytics
        <br />
        4. View session timeline, engagement metrics, and user behavior patterns
      </Alert>

      {/* User Journey Search */}
      {startDate && endDate ? (
        <UserJourneySearch startDate={startDate} endDate={endDate} />
      ) : (
        <Card>
          <CardContent>
            <Box textAlign="center" py={6}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Select Date Range to Begin
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a date range to start searching for user journeys
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default UserJourneys;