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
import {
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Button,
  Chip
} from '@mui/material';
import {
  AccountTree,
  Visibility,
  TouchApp
} from '@mui/icons-material';

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
          <Box sx={{ p: 2, minWidth: 150 }}>
            <Typography variant="subtitle2" fontWeight="bold" textAlign="center">
              {node.screenName}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Chip 
                size="small" 
                label={`${node.visitCount} visits`}
                color="primary"
                icon={<Visibility />}
              />
              <Chip 
                size="small" 
                label={`${node.averageDuration}s avg`}
                color="secondary"
                icon={<TouchApp />}
              />
              <Chip 
                size="small" 
                label={`${node.exitRate}% exit`}
                color={node.exitRate > 25 ? 'error' : 'success'}
              />
            </Box>
          </Box>
        )
      },
      style: {
        background: '#ffffff',
        border: '2px solid #667eea',
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
    <Box>
      <Typography variant="h5" gutterBottom>
        🌊 Screen Flow Analysis
      </Typography>

      {/* Load Data Button */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" gutterBottom>
                Onboarding Screen Flow
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Visualize user journey paths through onboarding screens
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={loadScreenFlow}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <AccountTree />}
            >
              {loading ? 'Analyzing...' : 'Analyze Screen Flow'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Flow Visualization */}
      {flowData && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Flow Diagram
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Interactive flow diagram showing user progression through onboarding screens.
              Thicker arrows indicate higher traffic volume.
            </Typography>
            
            <Box sx={{ height: 500, border: '1px solid #e0e0e0', borderRadius: 1 }}>
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
                    background: '#f5f5f5',
                    border: '1px solid #ddd'
                  }}
                />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              </ReactFlow>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 4, height: 20, bgcolor: '#4caf50', borderRadius: 1 }} />
                <Typography variant="caption">High Conversion (&gt;70%)</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 4, height: 20, bgcolor: '#ff9800', borderRadius: 1 }} />
                <Typography variant="caption">Medium Conversion (50-70%)</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 4, height: 20, bgcolor: '#f44336', borderRadius: 1 }} />
                <Typography variant="caption">Low Conversion (&lt;50%)</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && !flowData && (
        <Card>
          <CardContent>
            <Box textAlign="center" py={6}>
              <AccountTree sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Screen Flow Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click "Analyze Screen Flow" to visualize user journey paths through onboarding screens
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ScreenFlowVisualization;