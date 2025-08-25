import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { ExpandMore, ExpandLess, PlayArrow, TableView } from '@mui/icons-material';
import { format } from 'date-fns';
import { DateRangePicker } from '../common/DateRangePicker';
import { apiClient, AnalyticsQueryRequest, AnalyticsQueryResponse, ApiException } from '../../services/generated-api-client';

export const AnalyticsQueryPanel: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [queryType, setQueryType] = useState<'sample' | 'engagement' | 'user_journeys'>('sample');
  const [limit, setLimit] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyticsQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    setError(null);
  };

  const executeQuery = async () => {
    if (!startDate || !endDate) {
      setError('Please select a date range');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const request: AnalyticsQueryRequest = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        queryType,
        limit
      };

      const response = await apiClient.executeAnalyticsQuery(request);
      setResult(response);
      setExpanded(true);
    } catch (err: any) {
      console.error('Query failed:', err);
      if (err instanceof ApiException) {
        setError(`API Error (${err.status}): ${err.message}`);
      } else {
        setError(err.message || 'Query execution failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const getQueryDescription = () => {
    switch (queryType) {
      case 'sample':
        return 'Retrieve raw data samples from the selected date range';
      case 'engagement':
        return 'Analyze user engagement metrics including event counts and session data';
      case 'user_journeys':
        return 'Track individual user journeys with step-by-step navigation paths';
      default:
        return '';
    }
  };

  const formatTableData = (data: any[]) => {
    if (!data || data.length === 0) return { headers: [], rows: [] };

    // Get all unique keys from the data
    const allKeys = new Set<string>();
    data.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key));
    });

    const headers = Array.from(allKeys);
    
    const rows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      });
    });

    return { headers, rows };
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Analytics Query Builder
        </Typography>

        <Stack spacing={3}>
          {/* Date Range Selection */}
          <DateRangePicker
            onDateRangeChange={handleDateRangeChange}
            disabled={loading}
          />

          {/* Query Configuration */}
          <Stack direction="row" spacing={2} alignItems="flex-end">
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Query Type</InputLabel>
              <Select
                value={queryType}
                onChange={(e) => setQueryType(e.target.value as any)}
                disabled={loading}
              >
                <MenuItem value="sample">Sample Data</MenuItem>
                <MenuItem value="engagement">Engagement Metrics</MenuItem>
                <MenuItem value="user_journeys">User Journeys</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Limit"
              type="number"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              disabled={loading}
              inputProps={{ min: 1, max: 10000 }}
              sx={{ width: 120 }}
            />

            <Button
              variant="contained"
              onClick={executeQuery}
              disabled={loading || !startDate || !endDate}
              startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
            >
              {loading ? 'Executing...' : 'Run Query'}
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            {getQueryDescription()}
          </Typography>

          {/* Error Display */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Results */}
          {result && (
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="h6">
                      Query Results
                    </Typography>
                    <Chip 
                      label={`${result.rowCount} rows`} 
                      color="primary" 
                      size="small" 
                    />
                    <Chip 
                      label={result.queryType} 
                      color="secondary" 
                      size="small" 
                    />
                  </Stack>
                  <IconButton onClick={() => setExpanded(!expanded)}>
                    {expanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Date Range: {format(new Date(result.dateRange.startDate), 'MMM dd, yyyy')} to {format(new Date(result.dateRange.endDate), 'MMM dd, yyyy')}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  {result.tablesUsed.map((table, index) => (
                    <Chip
                      key={index}
                      label={`${table.tableId}${table.isIntraday ? ' (intraday)' : ''}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {result.message}
                </Typography>

                <Collapse in={expanded}>
                  <Box sx={{ mt: 2 }}>
                    {result.data && result.data.length > 0 ? (
                      (() => {
                        const { headers, rows } = formatTableData(result.data);
                        return (
                          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                            <Table size="small" stickyHeader>
                              <TableHead>
                                <TableRow>
                                  {headers.map((header, index) => (
                                    <TableCell key={index}>{header}</TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {rows.map((row, rowIndex) => (
                                  <TableRow key={rowIndex}>
                                    {row.map((cell, cellIndex) => (
                                      <TableCell key={cellIndex}>
                                        {cell.length > 100 ? `${cell.substring(0, 100)}...` : cell}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        );
                      })()
                    ) : (
                      <Alert severity="info">No data returned from query</Alert>
                    )}
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AnalyticsQueryPanel;