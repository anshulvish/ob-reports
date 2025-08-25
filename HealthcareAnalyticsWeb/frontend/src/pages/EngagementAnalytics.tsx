import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Stack
} from '@mui/material';
import { DateRangePicker } from '../components/common/DateRangePicker';
import { EngagementMetricsPanel } from '../components/engagement/EngagementMetricsPanel';
import { UserSessionsPanel } from '../components/engagement/UserSessionsPanel';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`engagement-tabpanel-${index}`}
      aria-labelledby={`engagement-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `engagement-tab-${index}`,
    'aria-controls': `engagement-tabpanel-${index}`,
  };
}

export const EngagementAnalytics: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Typography variant="h3" component="h1" gutterBottom>
          📊 Engagement Analytics
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Comprehensive user engagement analysis for healthcare onboarding
        </Typography>

        {/* Date Range Picker */}
        <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <DateRangePicker
            onDateRangeChange={handleDateRangeChange}
            disabled={false}
          />
        </Paper>

        {/* Content Tabs */}
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="engagement analytics tabs">
              <Tab 
                label="Engagement Metrics" 
                icon="📈" 
                iconPosition="start"
                {...a11yProps(0)} 
              />
              <Tab 
                label="User Sessions" 
                icon="👤" 
                iconPosition="start"
                {...a11yProps(1)} 
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            {startDate && endDate ? (
              <EngagementMetricsPanel 
                startDate={startDate} 
                endDate={endDate} 
              />
            ) : (
              <Box textAlign="center" py={8}>
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  Select a Date Range
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Choose start and end dates above to view engagement metrics
                </Typography>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {startDate && endDate ? (
              <UserSessionsPanel 
                startDate={startDate} 
                endDate={endDate} 
              />
            ) : (
              <Box textAlign="center" py={8}>
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  Select a Date Range
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Choose start and end dates above to view user sessions
                </Typography>
              </Box>
            )}
          </TabPanel>
        </Box>

        {/* Help Text */}
        <Paper elevation={0} sx={{ mt: 4, p: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            📋 About Engagement Analytics
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="primary">
                Engagement Metrics
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comprehensive analytics including user counts, session statistics, interaction patterns, 
                and engagement level distribution. View average and median values to understand user behavior patterns.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="primary">
                User Sessions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Detailed session-level data showing individual user journeys, event sequences, 
                and screen navigation patterns. Expandable rows reveal complete session details.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="primary">
                Engagement Levels
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>High:</strong> 20+ events per session • 
                <strong> Medium:</strong> 5-19 events per session • 
                <strong> Low:</strong> Less than 5 events per session
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};

export default EngagementAnalytics;