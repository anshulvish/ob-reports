import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">🌊 Screen Flow Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Visualize user journey paths and screen-to-screen transitions in the onboarding process
        </p>
      </div>

      {/* Date Range Selection */}
      <Card>
        <CardContent>
          <DateRangePicker onDateRangeChange={handleDateRangeChange} />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
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
        </AlertDescription>
      </Alert>

      {/* Screen Flow Visualization */}
      {startDate && endDate ? (
        <ScreenFlowVisualization startDate={startDate} endDate={endDate} />
      ) : (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Select Date Range to Begin
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose a date range to analyze screen flow patterns
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScreenFlow;