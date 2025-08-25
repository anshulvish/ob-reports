import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import {
  GitBranch,
  Eye,
  Clock,
  Loader2
} from 'lucide-react';

interface ScreenFlowNode {
  id: string;
  screenName: string;
  visitCount: number;
  averageDuration: number;
  exitRate: number;
  position: { x: number; y: number };
}

interface ScreenFlowEdge {
  id: string;
  source: string;
  target: string;
  transitionCount: number;
  conversionRate: number;
}

interface ScreenFlowVisualizationProps {
  startDate: Date;
  endDate: Date;
}

export const ScreenFlowVisualization: React.FC<ScreenFlowVisualizationProps> = ({
  startDate,
  endDate
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flowData, setFlowData] = useState<{nodes: ScreenFlowNode[], edges: ScreenFlowEdge[]} | null>(null);

  // Sample data for demonstration (replace with real API call)
  const sampleFlowData = useMemo(() => ({
    nodes: [
      {
        id: '1',
        screenName: 'Welcome Screen',
        visitCount: 1500,
        averageDuration: 45,
        exitRate: 15,
        position: { x: 100, y: 100 }
      },
      {
        id: '2',
        screenName: 'Profile Setup',
        visitCount: 1275,
        averageDuration: 120,
        exitRate: 20,
        position: { x: 300, y: 200 }
      },
      {
        id: '3',
        screenName: 'Document Upload',
        visitCount: 1020,
        averageDuration: 180,
        exitRate: 35,
        position: { x: 500, y: 100 }
      },
      {
        id: '4',
        screenName: 'Verification',
        visitCount: 663,
        averageDuration: 90,
        exitRate: 10,
        position: { x: 700, y: 200 }
      },
      {
        id: '5',
        screenName: 'Completion',
        visitCount: 597,
        averageDuration: 60,
        exitRate: 5,
        position: { x: 900, y: 100 }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: '1',
        target: '2',
        transitionCount: 1275,
        conversionRate: 85
      },
      {
        id: 'e2-3',
        source: '2',
        target: '3',
        transitionCount: 1020,
        conversionRate: 80
      },
      {
        id: 'e3-4',
        source: '3',
        target: '4',
        transitionCount: 663,
        conversionRate: 65
      },
      {
        id: 'e4-5',
        source: '4',
        target: '5',
        transitionCount: 597,
        conversionRate: 90
      }
    ]
  }), []);

  const createFlowNodes = (nodeData: ScreenFlowNode[]): Node[] => {
    return nodeData.map((node) => ({
      id: node.id,
      type: 'default',
      position: node.position,
      data: {
        label: (
          <div className="p-4 min-w-[150px]">
            <p className="font-semibold text-center text-sm mb-2">
              {node.screenName}
            </p>
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                <Eye className="h-3 w-3" />
                {node.visitCount} visits
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                <Clock className="h-3 w-3" />
                {node.averageDuration}s avg
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                node.exitRate > 25 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {node.exitRate}% exit
              </span>
            </div>
          </div>
        )
      },
      style: {
        background: '#ffffff',
        border: '2px solid hsl(var(--primary))',
        borderRadius: 8,
        width: 180,
        fontSize: 12,
      }
    }));
  };

  const createFlowEdges = (edgeData: ScreenFlowEdge[]): Edge[] => {
    return edgeData.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: true,
      label: `${edge.transitionCount} users (${edge.conversionRate}%)`,
      style: {
        strokeWidth: Math.max(2, Math.min(8, edge.transitionCount / 200)),
        stroke: edge.conversionRate > 70 ? '#4caf50' : edge.conversionRate > 50 ? '#ff9800' : '#f44336',
      },
      labelStyle: {
        fontSize: 11,
        fontWeight: 'bold',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    }));
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(createFlowNodes(sampleFlowData.nodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(createFlowEdges(sampleFlowData.edges));

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const loadScreenFlow = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with real API call to get screen flow data
      // For now, use sample data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setFlowData(sampleFlowData);
      setNodes(createFlowNodes(sampleFlowData.nodes));
      setEdges(createFlowEdges(sampleFlowData.edges));

    } catch (err: any) {
      console.error('Failed to load screen flow:', err);
      setError(err.message || 'Failed to load screen flow data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">🌊 Screen Flow Analysis</h2>

      {/* Load Data Button */}
      <Card>
        <CardContent className="flex justify-between items-center p-6">
          <div>
            <h3 className="text-lg font-semibold mb-1">
              Onboarding Screen Flow
            </h3>
            <p className="text-muted-foreground text-sm">
              Visualize user journey paths through onboarding screens
            </p>
          </div>
          <Button
            onClick={loadScreenFlow}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <GitBranch className="h-4 w-4" />
                Analyze Screen Flow
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex justify-between items-center">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>×</Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Flow Visualization */}
      {flowData && (
        <Card>
          <CardHeader>
            <CardTitle>User Flow Diagram</CardTitle>
            <p className="text-sm text-muted-foreground">
              Interactive flow diagram showing user progression through onboarding screens.
              Thicker arrows indicate higher traffic volume.
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] border rounded border-border">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                attributionPosition="bottom-right"
              >
                <Controls />
                <MiniMap 
                  style={{
                    background: 'hsl(var(--muted))',
                    border: '1px solid hsl(var(--border))'
                  }}
                />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              </ReactFlow>
            </div>

            <div className="mt-4 flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-green-600 rounded" />
                <span className="text-xs text-muted-foreground">High Conversion (&gt;70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-orange-600 rounded" />
                <span className="text-xs text-muted-foreground">Medium Conversion (50-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 bg-red-600 rounded" />
                <span className="text-xs text-muted-foreground">Low Conversion (&lt;50%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && !flowData && (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <GitBranch className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Screen Flow Analysis
              </h3>
              <p className="text-sm text-muted-foreground">
                Click "Analyze Screen Flow" to visualize user journey paths through onboarding screens
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScreenFlowVisualization;