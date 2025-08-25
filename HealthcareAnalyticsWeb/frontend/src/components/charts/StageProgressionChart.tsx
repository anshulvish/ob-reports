import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { getDefaultChartOptions } from '../../utils/chartDefaults';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

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

interface StageProgressionChartProps {
  data: StageMetrics | null;
  chartType?: 'funnel' | 'retention' | 'dropoff';
  height?: number;
}

const STAGE_COLORS = [
  '#3b82f6', // blue-500 - Welcome
  '#10b981', // emerald-500 - DY Quiz 1
  '#06b6d4', // cyan-500 - DY Quiz 2
  '#8b5cf6', // violet-500 - Job Desires 1
  '#f59e0b', // amber-500 - Job Desires 2
  '#ef4444', // red-500 - Job Desires 3
  '#f97316', // orange-500 - Job Suggestions 1
  '#84cc16', // lime-500 - Job Suggestions 2
  '#22c55e', // green-500 - Complete
];

export const StageProgressionChart: React.FC<StageProgressionChartProps> = ({
  data,
  chartType = 'funnel',
  height = 300,
}) => {
  if (!data || !data.stagesSummary.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No stage progression data available</div>
      </div>
    );
  }

  const stages = data.stagesSummary.sort((a, b) => a.stageNumber - b.stageNumber);

  const getChartData = () => {
    switch (chartType) {
      case 'funnel':
        return {
          labels: stages.map(stage => stage.stageName),
          datasets: [
            {
              label: 'Users Reached',
              data: stages.map(stage => stage.usersReached),
              backgroundColor: STAGE_COLORS.slice(0, stages.length),
              borderColor: STAGE_COLORS.slice(0, stages.length),
              borderWidth: 1,
            },
          ],
        };

      case 'retention':
        return {
          labels: stages.map(stage => `Stage ${stage.stageNumber}`),
          datasets: [
            {
              label: 'Retention Rate (%)',
              data: stages.map(stage => stage.retentionRate),
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
              borderColor: 'rgb(59, 130, 246)',
              borderWidth: 2,
              fill: false,
              tension: 0.1,
            },
          ],
        };

      case 'dropoff':
        const dropOffData = data.dropOffPoints.map(dropOff => {
          const stage = stages.find(s => s.stageNumber === dropOff.stageNumber);
          return {
            stageName: stage?.stageName || dropOff.stageName,
            usersDropped: dropOff.usersDropped,
          };
        });

        return {
          labels: dropOffData.map(item => item.stageName),
          datasets: [
            {
              label: 'Users Dropped Off',
              data: dropOffData.map(item => item.usersDropped),
              backgroundColor: 'rgba(239, 68, 68, 0.6)',
              borderColor: 'rgb(239, 68, 68)',
              borderWidth: 1,
            },
          ],
        };

      default:
        return null;
    }
  };

  const getChartOptions = () => {
    const baseOptions = {
      ...getDefaultChartOptions(),
      plugins: {
        ...getDefaultChartOptions().plugins,
        legend: {
          ...getDefaultChartOptions().plugins.legend,
          position: 'top' as const,
        },
        title: {
          display: true,
          text: getTitle(),
          color: getDefaultChartOptions().plugins.legend.labels.color,
          font: {
            size: 14,
            weight: 'bold' as const,
          },
        },
        tooltip: {
          ...getDefaultChartOptions().plugins.tooltip,
          callbacks: {
            label: function(context: any) {
              return getTooltipLabel(context);
            },
          },
        },
      },
      scales: {
        ...getDefaultChartOptions().scales,
        x: {
          ...getDefaultChartOptions().scales.x,
          ticks: {
            ...getDefaultChartOptions().scales.x.ticks,
            maxRotation: 45,
          },
        },
        y: {
          ...getDefaultChartOptions().scales.y,
          ticks: {
            ...getDefaultChartOptions().scales.y.ticks,
            callback: function(value: any) {
              return chartType === 'retention' ? `${value.toFixed(1)}%` : value.toLocaleString();
            },
          },
          beginAtZero: true,
        },
      },
    };

    return baseOptions;
  };

  const getTitle = () => {
    switch (chartType) {
      case 'funnel':
        return 'User Progression Through Stages';
      case 'retention':
        return 'Stage Retention Rates';
      case 'dropoff':
        return 'Drop-off Points Analysis';
      default:
        return 'Stage Analysis';
    }
  };

  const getTooltipLabel = (context: any) => {
    const dataIndex = context.dataIndex;
    const stage = stages[dataIndex];

    switch (chartType) {
      case 'funnel':
        return [
          `Users: ${stage.usersReached.toLocaleString()}`,
          `Total Visits: ${stage.totalVisits.toLocaleString()}`,
          `Retention Rate: ${stage.retentionRate.toFixed(1)}%`,
          `Avg Time: ${formatDuration(stage.averageTimeSpentSeconds)}`,
        ];

      case 'retention':
        return [
          `Retention Rate: ${stage.retentionRate.toFixed(1)}%`,
          `Users Reached: ${stage.usersReached.toLocaleString()}`,
          `Total Users: ${data.totalUsers.toLocaleString()}`,
        ];

      case 'dropoff':
        const dropOffItem = data.dropOffPoints[dataIndex];
        return [
          `Users Dropped: ${dropOffItem.usersDropped.toLocaleString()}`,
          `At Stage: ${dropOffItem.stageName}`,
        ];

      default:
        return context.formattedValue;
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const chartData = getChartData();
  const chartOptions = getChartOptions();

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Invalid chart configuration</div>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px` }}>
      {chartType === 'retention' ? (
        <Line data={chartData} options={chartOptions} />
      ) : (
        <Bar data={chartData} options={chartOptions} />
      )}
    </div>
  );
};