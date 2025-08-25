import { useState, useEffect } from 'react';

interface DeviceAnalyticsRequest {
  startDate: Date;
  endDate: Date;
}

interface DeviceBreakdown {
  category: string;
  uniqueUsers: number;
  totalSessions: number;
  totalEvents: number;
  averageEventsPerSession: number;
  averageSessionDurationSeconds: number;
  percentage: number;
}

interface DeviceMetrics {
  totalUsers: number;
  deviceBreakdown: DeviceBreakdown[];
  operatingSystemBreakdown: DeviceBreakdown[];
  browserBreakdown: DeviceBreakdown[];
}

interface DeviceAnalyticsResponse {
  success: boolean;
  deviceMetrics: DeviceMetrics;
  dateRange: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
  tablesUsed: Array<{
    tableName: string;
    tableId: string;
    rowCount: number;
  }>;
  message: string;
}

const fetchDeviceAnalytics = async (request: DeviceAnalyticsRequest): Promise<DeviceAnalyticsResponse> => {
  const response = await fetch('/api/engagement/device-analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate: request.startDate.toISOString(),
      endDate: request.endDate.toISOString(),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch device analytics: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

export const useDeviceAnalytics = (request: DeviceAnalyticsRequest) => {
  const [data, setData] = useState<DeviceAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!request.startDate || !request.endDate) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetchDeviceAnalytics(request);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch device analytics'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [request.startDate, request.endDate]);

  return { data, isLoading, error };
};

// Export types for use in components
export type { DeviceAnalyticsRequest, DeviceMetrics, DeviceBreakdown, DeviceAnalyticsResponse };