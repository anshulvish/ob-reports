import axios, { AxiosResponse } from 'axios';
import { ApiResponse, AnalysisRequest, AnalyticsQueryRequest, AnalyticsQueryResponse } from '../types/api';
import { EngagementAnalysisResult } from '../types/engagement';
import { UserJourney } from '../types/journey';
import { ScreenFlowAnalysis } from '../types/screenFlow';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:64547/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and auth
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error);
    
    if (error.response?.status === 401) {
      // Handle authentication errors
      console.log('Authentication required');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.log('Server error occurred');
    }
    
    return Promise.reject(error);
  }
);

export const apiService = {
  // Health check
  async getHealth(): Promise<any> {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // BigQuery test
  async testBigQuery(): Promise<any> {
    const response = await apiClient.get('/test/testbigquery/test-connection');
    return response.data;
  },

  // BigQuery Tables
  async getBigQueryTables(): Promise<any> {
    const response = await apiClient.get('/bigquerytables');
    return response.data;
  },

  async getAvailableDateRanges(): Promise<any> {
    const response = await apiClient.get('/analytics/date-ranges');
    return response.data;
  },

  // Analytics Queries
  async executeAnalyticsQuery(request: AnalyticsQueryRequest): Promise<AnalyticsQueryResponse> {
    const response = await apiClient.post('/analytics/query', request);
    return response.data;
  },

  // Legacy endpoints (keeping for backward compatibility)
  // Engagement Analysis
  async getEngagementAnalysis(request: AnalysisRequest): Promise<EngagementAnalysisResult> {
    const response = await apiClient.post('/engagement/analysis', request);
    return response.data;
  },

  // User Journey
  async getUserJourney(userIdentifier: string): Promise<UserJourney> {
    const response = await apiClient.get(`/userjourney/${encodeURIComponent(userIdentifier)}`);
    return response.data;
  },

  async searchUserJourneys(searchTerm: string, limit: number = 50): Promise<UserJourney[]> {
    const response = await apiClient.get(`/userjourney/search`, {
      params: { q: searchTerm, limit }
    });
    return response.data;
  },

  // Screen Flow
  async getScreenFlowAnalysis(request: AnalysisRequest): Promise<ScreenFlowAnalysis> {
    const response = await apiClient.post('/screenflow/analysis', request);
    return response.data;
  },
};

export default apiService;