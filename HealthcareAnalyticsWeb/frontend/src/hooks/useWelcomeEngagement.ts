import { useState, useEffect } from 'react';

interface WelcomeEngagementRequest {
  startDate: Date;
  endDate: Date;
}

interface WelcomeActionBreakdown {
  action: string; // begin_profile_setup, skip_for_now, exit_onboarding, viewed_welcome_only, other
  userCount: number;
  usersProgressed: number;
  usersExited: number;
  progressionRate: number;
  exitRate: number;
  averageWelcomeEvents: number;
}

interface WelcomeMetrics {
  totalUsers: number;
  totalProgressed: number;
  totalExited: number;
  beginProfileClicks: number;
  skipForNowClicks: number;
  progressionRate: number; // Percentage who progressed beyond welcome
  exitRate: number; // Percentage who exited during onboarding
  beginProfileRate: number; // Percentage who clicked "Begin profile setup"
  skipForNowRate: number; // Percentage who clicked "Skip for now"
  averageEventsPerUser: number;
  actionBreakdown: WelcomeActionBreakdown[];
}

interface WelcomeEngagementResponse {
  success: boolean;
  welcomeMetrics: WelcomeMetrics;
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

const fetchWelcomeEngagement = async (request: WelcomeEngagementRequest): Promise<WelcomeEngagementResponse> => {
  console.log('🔗 Fetching welcome engagement:', request);
  
  const response = await fetch('/api/engagement/welcome-engagement', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate: request.startDate.toISOString(),
      endDate: request.endDate.toISOString(),
    }),
  });

  console.log('📡 Welcome engagement response:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Welcome engagement error:', errorText);
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: errorText };
    }
    throw new Error(errorData.error || `Failed to fetch welcome engagement: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ Welcome engagement data:', data);
  return data;
};

export const useWelcomeEngagement = (request: WelcomeEngagementRequest) => {
  const [data, setData] = useState<WelcomeEngagementResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!request.startDate || !request.endDate) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetchWelcomeEngagement(request);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch welcome engagement'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [request.startDate, request.endDate]);

  return { data, isLoading, error };
};

// Export types for use in components
export type { 
  WelcomeEngagementRequest, 
  WelcomeMetrics, 
  WelcomeActionBreakdown, 
  WelcomeEngagementResponse 
};