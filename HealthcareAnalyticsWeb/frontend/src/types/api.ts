export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface FilterCriteria {
  excludeTestUsers?: boolean;
  schemaVersion?: string;
  country?: string;
  deviceType?: string;
  userIds?: string[];
  sessionIds?: string[];
}

export interface AnalysisRequest {
  startDate: Date;
  endDate: Date;
  filters?: FilterCriteria;
}

export interface AnalyticsQueryRequest {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  queryType: 'sample' | 'engagement' | 'user_journeys';
  limit?: number;
  filters?: Record<string, any>;
}

export interface AnalyticsQueryResponse {
  success: boolean;
  queryType: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  tablesUsed: Array<{
    tableId: string;
    date: string;
    isIntraday: boolean;
  }>;
  rowCount: number;
  data: any[];
  message: string;
}

export interface DateRangeInfo {
  available: boolean;
  earliestDate?: string;
  latestDate?: string;
  totalDays?: number;
  dailyTables?: number;
  intradayTables?: number;
  message?: string;
}