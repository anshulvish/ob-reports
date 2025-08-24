import { EngagementLevel } from './engagement';

export interface UserJourney {
  userId: string;
  userEmail: string;
  sessions: UserSession[];
  firstVisit: string;
  lastActivity: string;
  totalTimeInvested: number; // seconds
  totalSessions: number;
  everCompleted: boolean;
  overallEngagement: EngagementLevel;
  steps: JourneyStep[];
  allTransitions: ScreenTransition[];
  dropOffPoint: string;
  problematicScreens: string[];
  revisitedScreens: string[];
}

export interface UserSession {
  sessionId: string;
  userId: string;
  userEmail: string;
  startTime: string;
  endTime: string;
  duration: number; // seconds
  screensViewed: string[];
  screenVisitCounts: Record<string, number>;
  deviceType: DeviceType;
  country: string;
  region: string;
  city: string;
  furthestStageReached: number;
  completed: boolean;
  exitPoint: string;
  timeInvested: number; // seconds
  totalScreenRevisits: number;
  engagementLevel: EngagementLevel;
}

export interface JourneyStep {
  screenName: string;
  displayName: string;
  firstVisit: string;
  lastVisit: string;
  visitCount: number;
  totalTimeSpent: number; // seconds
  sessionId: string;
  isDropOffPoint: boolean;
}

export interface ScreenTransition {
  from: string;
  to: string;
  timestamp: string;
  duration: number; // seconds
  isBackward: boolean;
}

export enum DeviceType {
  Unknown = 'Unknown',
  Mobile = 'Mobile',
  Desktop = 'Desktop', 
  Tablet = 'Tablet'
}