import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import { apiClient, DateRangeResponse } from '../../services/generated-api-client';

interface DateRangePickerProps {
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
  disabled?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onDateRangeChange,
  initialStartDate,
  initialEndDate,
  disabled = false
}) => {
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate || null);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate || null);
  const [dateRangeInfo, setDateRangeInfo] = useState<DateRangeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableDateRanges();
  }, []);

  const loadAvailableDateRanges = async () => {
    try {
      setLoading(true);
      const info = await apiClient.getAnalyticsDateRanges();
      setDateRangeInfo(info);
      
      // Set default dates to the last 7 days if no initial dates provided
      if (!initialStartDate && !initialEndDate && info.available) {
        const latest = parseISO(info.latestDate!);
        const earliest = parseISO(info.earliestDate!);
        
        // Default to last 7 days or available range if less than 7 days
        const defaultEnd = latest;
        const sevenDaysBack = new Date(latest);
        sevenDaysBack.setDate(sevenDaysBack.getDate() - 7);
        const defaultStart = sevenDaysBack < earliest ? earliest : sevenDaysBack;
        
        setStartDate(defaultStart);
        setEndDate(defaultEnd);
        onDateRangeChange(defaultStart, defaultEnd);
      }
    } catch (err) {
      console.error('Failed to load available date ranges:', err);
      setError('Failed to load available date ranges');
    } finally {
      setLoading(false);
    }
  };

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setStartDate(date);
      if (endDate && date <= endDate) {
        onDateRangeChange(date, endDate);
      }
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      setEndDate(date);
      if (startDate && startDate <= date) {
        onDateRangeChange(startDate, date);
      }
    }
  };

  const isDateDisabled = (date: Date) => {
    if (!dateRangeInfo?.available) return true;
    
    const earliest = parseISO(dateRangeInfo.earliestDate!);
    const latest = parseISO(dateRangeInfo.latestDate!);
    
    return date < earliest || date > latest;
  };

  const getDateRangeSummary = () => {
    if (!startDate || !endDate) return null;
    
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${daysDiff} day${daysDiff !== 1 ? 's' : ''} selected`;
  };

  const setQuickRange = (days: number) => {
    if (!dateRangeInfo?.available) return;
    
    const latest = parseISO(dateRangeInfo.latestDate!);
    const earliest = parseISO(dateRangeInfo.earliestDate!);
    
    const end = latest;
    const start = new Date(latest);
    start.setDate(start.getDate() - (days - 1));
    
    const actualStart = start < earliest ? earliest : start;
    
    setStartDate(actualStart);
    setEndDate(end);
    onDateRangeChange(actualStart, end);
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={2}>
        <CircularProgress size={20} />
        <Typography>Loading available date ranges...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!dateRangeInfo?.available) {
    return <Alert severity="warning">No data available for analysis</Alert>;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Select Date Range
        </Typography>
        
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Available data: {format(parseISO(dateRangeInfo.earliestDate!), 'MMM dd, yyyy')} to {format(parseISO(dateRangeInfo.latestDate!), 'MMM dd, yyyy')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dateRangeInfo.totalDays} days • {dateRangeInfo.dailyTables} daily tables • {dateRangeInfo.intradayTables} intraday tables
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip label="Last 7 days" onClick={() => setQuickRange(7)} size="small" />
            <Chip label="Last 30 days" onClick={() => setQuickRange(30)} size="small" />
            <Chip label="All available" onClick={() => {
              const earliest = parseISO(dateRangeInfo.earliestDate!);
              const latest = parseISO(dateRangeInfo.latestDate!);
              setStartDate(earliest);
              setEndDate(latest);
              onDateRangeChange(earliest, latest);
            }} size="small" />
          </Stack>
          
          <Stack direction="row" spacing={2}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={handleStartDateChange}
              shouldDisableDate={isDateDisabled}
              disabled={disabled}
              slots={{ textField: TextField }}
            />
            
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={handleEndDateChange}
              shouldDisableDate={isDateDisabled}
              disabled={disabled}
              slots={{ textField: TextField }}
            />
          </Stack>
          
          {getDateRangeSummary() && (
            <Typography variant="body2" color="text.secondary">
              {getDateRangeSummary()}
            </Typography>
          )}
        </Stack>
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangePicker;