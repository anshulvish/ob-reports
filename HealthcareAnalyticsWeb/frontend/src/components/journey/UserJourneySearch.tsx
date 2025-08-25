import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Stack
} from '@mui/material';
import {
  Search,
  Person,
  Timeline,
  AccessTime,
  Visibility
} from '@mui/icons-material';
import { format } from 'date-fns';

interface UserJourney {
  userPseudoId: string;
  sessionId: number;
  sessionStart: string;
  sessionEnd: string;
  sessionDurationSeconds: number;
  eventCount: number;
  uniqueEvents: number;
  pageViews: number;
  screenViews: number;
  engagementLevel: string;
  eventsInSession: string[];
  screensVisited: string[];
}

interface UserJourneySearchProps {
  startDate: Date;
  endDate: Date;
}

export const UserJourneySearch: React.FC<UserJourneySearchProps> = ({
  startDate,
  endDate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userJourneys, setUserJourneys] = useState<UserJourney[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<UserJourney | null>(null);

  const searchUserJourneys = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a user ID or email to search');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use the user sessions API to get session data
      const { apiClient } = await import('../../services/generated-api-client');
      
      const response = await apiClient.getUserSessions({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 50
      });

      // Filter sessions by user ID (simplified search)
      const filteredSessions = response.sessions.filter(session =>
        session.userPseudoId.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setUserJourneys(filteredSessions);

      if (filteredSessions.length === 0) {
        setError(`No user journeys found for "${searchTerm}" in the selected date range`);
      }
    } catch (err: any) {
      console.error('Failed to search user journeys:', err);
      setError(err.message || 'Failed to search user journeys');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getEngagementColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'error';
      default: return 'default';
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      searchUserJourneys();
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        🔍 User Journey Search
      </Typography>

      {/* Search Interface */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Search by User ID or Email"
                placeholder="Enter user pseudo ID or email address"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />
                }}
                helperText="Search within selected date range"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="contained"
                onClick={searchUserJourneys}
                disabled={loading || !searchTerm.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : <Search />}
              >
                {loading ? 'Searching...' : 'Search Journeys'}
              </Button>
            </Grid>
          </Grid>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Date Range: {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
          </Typography>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Results */}
      {userJourneys.length > 0 && (
        <Grid container spacing={3}>
          {/* Journey List */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Found {userJourneys.length} Session(s)
                </Typography>
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {userJourneys.map((journey, index) => (
                    <React.Fragment key={`${journey.userPseudoId}-${journey.sessionId}`}>
                      <ListItem
                        button
                        selected={selectedJourney?.sessionId === journey.sessionId}
                        onClick={() => setSelectedJourney(journey)}
                        sx={{ borderRadius: 1 }}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Person fontSize="small" />
                              <Typography variant="subtitle2">
                                User: {journey.userPseudoId.slice(0, 12)}...
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                              <Chip
                                size="small"
                                label={journey.engagementLevel}
                                color={getEngagementColor(journey.engagementLevel) as any}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {journey.eventCount} events • {formatDuration(journey.sessionDurationSeconds)}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItem>
                      {index < userJourneys.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Journey Details */}
          <Grid item xs={12} md={6}>
            {selectedJourney ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Session Details
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary">
                          {selectedJourney.eventCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Events
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main">
                          {selectedJourney.uniqueEvents}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Unique Events
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="warning.main">
                          {selectedJourney.pageViews}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Page Views
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="info.main">
                          {selectedJourney.screenViews}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Screen Views
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Session Timeline
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <AccessTime fontSize="small" color="action" />
                      <Typography variant="body2">
                        Start: {format(new Date(selectedJourney.sessionStart), 'MMM dd, HH:mm:ss')}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <AccessTime fontSize="small" color="action" />
                      <Typography variant="body2">
                        End: {format(new Date(selectedJourney.sessionEnd), 'MMM dd, HH:mm:ss')}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Total Duration:
                      </Typography>
                      <Chip 
                        label={formatDuration(selectedJourney.sessionDurationSeconds)}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Session Engagement
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Engagement Level:
                      </Typography>
                      <Chip 
                        label={selectedJourney.engagementLevel}
                        color={getEngagementColor(selectedJourney.engagementLevel) as any}
                        size="small"
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <Box textAlign="center" py={4}>
                    <Timeline sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Select a Session
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Choose a session from the list to view detailed journey information
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {/* Empty State */}
      {!loading && !error && userJourneys.length === 0 && searchTerm && (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Person sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No User Journeys Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try searching with a different user ID or adjust your date range
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default UserJourneySearch;