export enum EngagementLevel {
  MinimalEngagement = 'MinimalEngagement',
  LightlyEngaged = 'LightlyEngaged', 
  ModeratelyEngaged = 'ModeratelyEngaged',
  HighlyEngaged = 'HighlyEngaged'
}

export interface EngagementAnalysisResult {
  totalUsers: number;
  totalSessions: number;
  completionRate: number;
  averageEngagementScore: number;
  engagementBreakdown: Record<EngagementLevel, number>;
  furthestStageReached: Record<number, number>;
  averageTimeInvested: number; // seconds
  averageScreenRevisits: number;
}

export interface EngagementUserSummary {
  userId: string;
  userEmail: string;
  engagementLevel: EngagementLevel;
  engagementScore: number;
  timeInvested: number; // seconds
  furthestStage: number;
}

export interface ScreenMetrics {
  screenName: string;
  visitCount: number;
  uniqueUsers: number;
  averageTimeSpent: number; // seconds
  dropOffRate: number;
  revisitCount: number;
}