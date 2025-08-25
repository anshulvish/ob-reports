import { useState, useEffect } from 'react';

interface StageProgressionRequest {
  startDate: Date;
  endDate: Date;
}

interface StageInfo {
  stageNumber: number;
  stageName: string;
  usersReached: number;
  totalVisits: number;
  averageTimeSpentSeconds: number;
  retentionRate: number;
}

interface DropOffInfo {
  stageNumber: number;
  usersDropped: number;
  stageName: string;
}

interface StageMetrics {
  totalUsers: number;
  completedUsers: number;
  completionRate: number;
  averageStagesVisited: number;
  averageJourneyDurationSeconds: number;
  stagesSummary: StageInfo[];
  dropOffPoints: DropOffInfo[];
}

interface StageProgressionResponse {
  success: boolean;
  stageMetrics: StageMetrics;
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

const fetchStageProgression = async (request: StageProgressionRequest): Promise<StageProgressionResponse> => {
  console.log('🔗 Fetching stage progression:', request);
  
  const response = await fetch('/api/engagement/stage-progression', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate: request.startDate.toISOString(),
      endDate: request.endDate.toISOString(),
    }),
  });

  console.log('📡 Stage progression response:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Stage progression error:', errorText);
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: errorText };
    }
    throw new Error(errorData.error || `Failed to fetch stage progression: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ Stage progression data:', data);
  console.log('🔍 StageMetrics structure:', data.stageMetrics);
  console.log('🔍 StagesSummary:', data.stageMetrics?.stagesSummary);
  console.log('🔍 DropOffPoints:', data.stageMetrics?.dropOffPoints);
  return data;
};

export const useStageProgression = (request: StageProgressionRequest) => {
  const [data, setData] = useState<StageProgressionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!request.startDate || !request.endDate) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetchStageProgression(request);
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch stage progression'));
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
  StageProgressionRequest, 
  StageMetrics, 
  StageInfo, 
  DropOffInfo, 
  StageProgressionResponse 
};