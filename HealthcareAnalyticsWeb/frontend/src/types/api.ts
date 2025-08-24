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