import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { DateRangePicker } from '../components/common/DateRangePicker';
import { EngagementMetricsPanel } from '../components/engagement/EngagementMetricsPanel';
import { UserSessionsPanel } from '../components/engagement/UserSessionsPanel';


export const EngagementAnalytics: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleDateRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">📊 Engagement Analytics</h1>
        <p className="text-xl text-muted-foreground mt-2">
          Comprehensive user engagement analysis for healthcare onboarding
        </p>
      </div>

      {/* Date Range Picker */}
      <Card>
        <CardContent>
          <DateRangePicker onDateRangeChange={handleDateRangeChange} />
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="metrics">📈 Engagement Metrics</TabsTrigger>
          <TabsTrigger value="sessions">👤 User Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="mt-6">
          {startDate && endDate ? (
            <EngagementMetricsPanel 
              startDate={startDate} 
              endDate={endDate} 
            />
          ) : (
            <Card>
              <CardContent>
                <div className="text-center py-16">
                  <h3 className="text-xl font-medium text-muted-foreground mb-2">
                    Select a Date Range
                  </h3>
                  <p className="text-muted-foreground">
                    Choose start and end dates above to view engagement metrics
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          {startDate && endDate ? (
            <UserSessionsPanel 
              startDate={startDate} 
              endDate={endDate} 
            />
          ) : (
            <Card>
              <CardContent>
                <div className="text-center py-16">
                  <h3 className="text-xl font-medium text-muted-foreground mb-2">
                    Select a Date Range
                  </h3>
                  <p className="text-muted-foreground">
                    Choose start and end dates above to view user sessions
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Help Text */}
      <Card className="bg-muted/50">
        <CardContent>
          <h3 className="text-lg font-semibold mb-4">📋 About Engagement Analytics</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-primary mb-1">
                Engagement Metrics
              </h4>
              <p className="text-sm text-muted-foreground">
                Comprehensive analytics including user counts, session statistics, interaction patterns, 
                and engagement level distribution. View average and median values to understand user behavior patterns.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-primary mb-1">
                User Sessions
              </h4>
              <p className="text-sm text-muted-foreground">
                Detailed session-level data showing individual user journeys, event sequences, 
                and screen navigation patterns. Expandable rows reveal complete session details.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-primary mb-1">
                Engagement Levels
              </h4>
              <p className="text-sm text-muted-foreground">
                <strong>High:</strong> 20+ events per session • 
                <strong> Medium:</strong> 5-19 events per session • 
                <strong> Low:</strong> Less than 5 events per session
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EngagementAnalytics;