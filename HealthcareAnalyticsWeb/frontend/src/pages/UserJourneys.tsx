import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">👤 User Journey Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Search and analyze individual user journeys through the onboarding process
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
          <strong>How to use User Journey Search:</strong>
          <br />
          1. Select a date range above
          <br />
          2. Enter a user pseudo ID (partial matches work)
          <br />
          3. Browse found sessions and click for detailed analytics
          <br />
          4. View session timeline, engagement metrics, and user behavior patterns
        </AlertDescription>
      </Alert>

      {/* User Journey Search */}
      {startDate && endDate ? (
        <UserJourneySearch startDate={startDate} endDate={endDate} />
      ) : (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Select Date Range to Begin
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose a date range to start searching for user journeys
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserJourneys;