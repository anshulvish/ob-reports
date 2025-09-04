import React, { useState, useEffect } from 'react';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Alert, AlertDescription } from '../ui/alert';
import { cn } from '../../lib/utils';
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
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading available date ranges...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dateRangeInfo?.available) {
    return (
      <Alert>
        <AlertDescription>No data available for analysis</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Date Range</h3>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Available data: {format(parseISO(dateRangeInfo.earliestDate!), 'MMM dd, yyyy')} to {format(parseISO(dateRangeInfo.latestDate!), 'MMM dd, yyyy')}
          </p>
          <p className="text-sm text-muted-foreground">
            {dateRangeInfo.totalDays} days • {dateRangeInfo.dailyTables} daily tables • {dateRangeInfo.intradayTables} intraday tables
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setQuickRange(7)}
        >
          Last 7 days
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setQuickRange(30)}
        >
          Last 30 days
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            const earliest = parseISO(dateRangeInfo.earliestDate!);
            const latest = parseISO(dateRangeInfo.latestDate!);
            setStartDate(earliest);
            setEndDate(latest);
            onDateRangeChange(earliest, latest);
          }}
        >
          All available
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Start Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate || undefined}
                onSelect={(date) => handleStartDateChange(date || null)}
                disabled={(date) => isDateDisabled(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">End Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate || undefined}
                onSelect={(date) => handleEndDateChange(date || null)}
                disabled={(date) => isDateDisabled(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {getDateRangeSummary() && (
        <p className="text-sm text-muted-foreground">
          {getDateRangeSummary()}
        </p>
      )}
    </div>
  );
};

export default DateRangePicker;