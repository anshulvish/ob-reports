import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface UserSessionsPanelProps {
  startDate: Date;
  endDate: Date;
}

export const UserSessionsPanel: React.FC<UserSessionsPanelProps> = ({
  startDate,
  endDate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>👥 User Sessions Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-2">
            User sessions data for {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </p>
          <p className="text-sm text-muted-foreground">
            Detailed session analysis will be available in a future update.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSessionsPanel;