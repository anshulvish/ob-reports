import React from 'react';
import { AnalyticsQueryPanel } from '../components/dashboard/AnalyticsQueryPanel';

export const Diagnostics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">🔧 System Diagnostics</h1>
        <p className="text-muted-foreground mt-2">
          Raw analytics queries and system diagnostics
        </p>
      </div>

      <AnalyticsQueryPanel />
    </div>
  );
};