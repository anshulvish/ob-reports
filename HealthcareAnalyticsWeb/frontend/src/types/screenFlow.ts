export interface ScreenFlowAnalysis {
  screens: ScreenNode[];
  connections: FlowConnection[];
  dropOffPoints: Record<string, number>;
  mostCommonPaths: string[];
  screenRetentionRates: Record<string, number>;
}

export interface ScreenNode {
  screenName: string;
  displayName: string;
  visitCount: number;
  uniqueUsers: number;
  averageTimeSpent: number; // seconds
  dropOffRate: number;
}

export interface FlowConnection {
  from: string;
  to: string;
  count: number;
  percentage: number;
  isBackward: boolean;
}

export interface CommonPath {
  path: string;
  count: number;
  percentage: number;
}