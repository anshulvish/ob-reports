import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const AnalyticsQueryPanel: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>🔧 Analytics Query Builder</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Analytics query functionality will be available in a future update.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsQueryPanel;