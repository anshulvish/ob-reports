import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Button,
  Stack,
  TablePagination,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Schedule,
  TouchApp,
  Visibility,
  TrendingUp
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { UserSession, UserSessionsResponse } from '../../services/generated-api-client';



interface UserSessionsPanelProps {
  startDate: Date;
  endDate: Date;
}

export const UserSessionsPanel: React.FC<UserSessionsPanelProps> = ({
  startDate,
  endDate
}) => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  useEffect(() => {
    if (startDate && endDate) {
      fetchUserSessions();
    }
  }, [startDate, endDate]);

  const fetchUserSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the generated API client
      const { apiClient } = await import('../../services/generated-api-client');
      
      const data = await apiClient.getUserSessions({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        limit: 100,
      });
      
      setSessions(data.sessions);
    } catch (err: any) {
      console.error('Failed to fetch user sessions:', err);
      setError(err.message || 'Failed to fetch user sessions');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getEngagementLevelColor = (level: string) => {
    switch (level) {
      case 'High': return 'success';
      case 'Medium': return 'warning';
      case 'Low': return 'error';
      default: return 'default';
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExpandSession = (sessionId: number) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  const truncateUserId = (userId: string): string => {
    return userId.length > 12 ? `${userId.substring(0, 12)}...` : userId;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <Stack alignItems="center" spacing={2}>
              <CircularProgress />
              <Typography>Loading user sessions...</Typography>
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
            <Button color="inherit" size="small" onClick={fetchUserSessions}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const paginatedSessions = sessions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        👤 User Sessions
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')} • {sessions.length} sessions
      </Typography>

      {/* Summary Stats */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ minWidth: 150 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="primary">
              {sessions.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Sessions
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 150 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="success.main">
              {sessions.filter(s => s.engagementLevel === 'High').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              High Engagement
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 150 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="info.main">
              {sessions.length > 0 ? formatDuration(sessions.reduce((sum, s) => sum + s.sessionDurationSeconds, 0) / sessions.length) : '0s'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Duration
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 150 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="warning.main">
              {sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.eventCount, 0) / sessions.length) : 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Events
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Sessions Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width="40px"></TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell>Session Start</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell align="right">Events</TableCell>
                  <TableCell align="right">Page Views</TableCell>
                  <TableCell align="right">Screen Views</TableCell>
                  <TableCell>Engagement</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSessions.map((session) => (
                  <React.Fragment key={session.sessionId}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleExpandSession(session.sessionId)}
                        >
                          {expandedSession === session.sessionId ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {truncateUserId(session.userPseudoId)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(session.sessionStart), 'MMM dd, HH:mm')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(session.sessionStart), { addSuffix: true })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Schedule fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {formatDuration(session.sessionDurationSeconds)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center" justifyContent="flex-end">
                          <TrendingUp fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {session.eventCount}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center" justifyContent="flex-end">
                          <Visibility fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {session.pageViews}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center" justifyContent="flex-end">
                          <TouchApp fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {session.screenViews}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={session.engagementLevel}
                          color={getEngagementLevelColor(session.engagementLevel) as any}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Row */}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                        <Collapse in={expandedSession === session.sessionId} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                              Session Details
                            </Typography>
                            
                            <Stack direction="row" spacing={4}>
                              <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                  Session Info
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Session ID: {session.sessionId}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Full User ID: {session.userPseudoId}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Started: {format(new Date(session.sessionStart), 'PPpp')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Ended: {format(new Date(session.sessionEnd), 'PPpp')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Unique Events: {session.uniqueEvents}
                                </Typography>
                              </Box>

                              {session.eventsInSession && session.eventsInSession.length > 0 && (
                                <Box sx={{ maxWidth: 300 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Events in Session
                                  </Typography>
                                  <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                                    <List dense>
                                      {session.eventsInSession.map((event, index) => (
                                        <ListItem key={index} sx={{ py: 0.5 }}>
                                          <Chip label={event} size="small" variant="outlined" />
                                        </ListItem>
                                      ))}
                                    </List>
                                  </Box>
                                </Box>
                              )}

                              {session.screensVisited && session.screensVisited.length > 0 && (
                                <Box sx={{ maxWidth: 300 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Screens Visited
                                  </Typography>
                                  <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                                    <List dense>
                                      {session.screensVisited.map((screen, index) => (
                                        <ListItem key={index} sx={{ py: 0.5 }}>
                                          <ListItemText 
                                            primary={screen || 'Unknown Screen'}
                                            primaryTypographyProps={{ variant: 'body2' }}
                                          />
                                        </ListItem>
                                      ))}
                                    </List>
                                  </Box>
                                </Box>
                              )}
                            </Stack>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={sessions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserSessionsPanel;