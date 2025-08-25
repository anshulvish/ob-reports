// Generated TypeScript API Client
// Based on Aya Healthcare Analytics API OpenAPI Specification

export interface AnalyticsQueryRequest {
  startDate: string;
  endDate: string;
  queryType: string;
  limit?: number;
  filters?: Record<string, any>;
}

export interface EngagementMetricsRequest {
  startDate: string;
  endDate: string;
  eventFilter?: string[];
}

export interface UserSessionsRequest {
  startDate: string;
  endDate: string;
  limit?: number;
}

export interface DateRangeResponse {
  available: boolean;
  earliestDate?: string;
  latestDate?: string;
  totalDays?: number;
  dailyTables?: number;
  intradayTables?: number;
  message?: string;
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

export interface BigQueryTablesResponse {
  totalTables: number;
  eventTables: number;
  userTables: number;
  latestEventTable?: {
    tableId: string;
    date: string;
    isIntraday: boolean;
    rowCount?: number;
    sizeMB?: number;
  };
  latestUserTable?: {
    tableId: string;
    date: string;
    rowCount?: number;
    sizeMB?: number;
  };
  dateRange?: {
    earliest: string;
    latest: string;
  };
}

export interface EngagementMetrics {
  totalUsers: number;
  averageSessionsPerUser: number;
  averageEventsPerUser: number;
  averageUniqueEventsPerUser: number;
  averagePagesPerUser: number;
  averageSessionDurationSeconds: number;
  averageEngagementTimeSeconds: number;
  averageScreenViewsPerUser: number;
  averageAifpInteractionsPerUser: number;
  medianSessionsPerUser: number;
  medianEventsPerUser: number;
  engagementDistribution: EngagementDistribution[];
}

export interface EngagementDistribution {
  level: string;
  userCount: number;
}

export interface EngagementMetricsResponse {
  success: boolean;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  tablesUsed: Array<{
    tableId: string;
    date: string;
    isIntraday: boolean;
  }>;
  metrics: EngagementMetrics;
  message: string;
}

export interface UserSession {
  userPseudoId: string;
  sessionId: number;
  sessionStart: string;
  sessionEnd: string;
  sessionDurationSeconds: number;
  eventCount: number;
  uniqueEvents: number;
  pageViews: number;
  screenViews: number;
  engagementLevel: string;
  eventsInSession: string[];
  screensVisited: string[];
}

export interface UserSessionsResponse {
  success: boolean;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  sessions: UserSession[];
  totalSessions: number;
  message: string;
}

export class ApiException extends Error {
  public status: number;
  public response: string;

  constructor(message: string, status: number, response: string) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.response = response;
  }
}

export class HealthcareAnalyticsApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || '/api';
  }

  private async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiException(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorText
      );
    }

    return response.json();
  }

  // Analytics endpoints
  async getAnalyticsDateRanges(): Promise<DateRangeResponse> {
    return this.fetchJson<DateRangeResponse>(`${this.baseUrl}/Analytics/date-ranges`);
  }

  async executeAnalyticsQuery(request: AnalyticsQueryRequest): Promise<AnalyticsQueryResponse> {
    return this.fetchJson<AnalyticsQueryResponse>(`${this.baseUrl}/Analytics/query`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // BigQuery Tables endpoints
  async getBigQueryTables(): Promise<BigQueryTablesResponse> {
    return this.fetchJson<BigQueryTablesResponse>(`${this.baseUrl}/BigQueryTables`);
  }

  async getBigQueryTableDetails(): Promise<any> {
    return this.fetchJson(`${this.baseUrl}/BigQueryTables/details`);
  }

  async getBigQueryTablesForDateRange(
    startDate: string,
    endDate: string,
    tableType: string = 'Events'
  ): Promise<any> {
    const params = new URLSearchParams({
      startDate,
      endDate,
      tableType,
    });
    return this.fetchJson(`${this.baseUrl}/BigQueryTables/date-range?${params}`);
  }

  async refreshBigQueryTables(): Promise<any> {
    return this.fetchJson(`${this.baseUrl}/BigQueryTables/refresh`, {
      method: 'POST',
    });
  }

  // Health endpoints
  async getHealth(): Promise<any> {
    return this.fetchJson(`${this.baseUrl}/Health`);
  }

  async getHealthReady(): Promise<any> {
    return this.fetchJson(`${this.baseUrl}/Health/ready`);
  }

  // Test endpoints
  async getTestBigQueryConfig(): Promise<any> {
    return this.fetchJson(`${this.baseUrl}/test/TestBigQuery/config`);
  }

  async testBigQueryConnection(): Promise<any> {
    return this.fetchJson(`${this.baseUrl}/test/TestBigQuery/test-connection`);
  }

  async listBigQueryTables(): Promise<any> {
    return this.fetchJson(`${this.baseUrl}/test/TestBigQuery/list-tables`);
  }

  async testBigQueryQuery(date?: string): Promise<any> {
    const params = date ? `?date=${date}` : '';
    return this.fetchJson(`${this.baseUrl}/test/TestBigQuery/test-query${params}`);
  }

  // Engagement endpoints
  async getEngagementMetrics(request: EngagementMetricsRequest): Promise<EngagementMetricsResponse> {
    return this.fetchJson<EngagementMetricsResponse>(`${this.baseUrl}/Engagement/metrics`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getUserSessions(request: UserSessionsRequest): Promise<UserSessionsResponse> {
    return this.fetchJson<UserSessionsResponse>(`${this.baseUrl}/Engagement/user-sessions`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

// Create default client instance
export const apiClient = new HealthcareAnalyticsApiClient();