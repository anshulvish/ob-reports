import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { getDefaultChartOptions } from '../../utils/chartDefaults';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface DeviceBreakdown {
  category: string;
  uniqueUsers: number;
  totalSessions: number;
  totalEvents: number;
  averageEventsPerSession: number;
  averageSessionDurationSeconds: number;
  percentage: number;
}

interface DeviceMetrics {
  totalUsers: number;
  deviceBreakdown: DeviceBreakdown[];
  operatingSystemBreakdown: DeviceBreakdown[];
  browserBreakdown: DeviceBreakdown[];
}

interface DeviceChartProps {
  data: DeviceMetrics | null;
  type?: 'device' | 'os' | 'browser';
  chartType?: 'doughnut' | 'bar';
  height?: number;
}

const DEVICE_COLORS = {
  mobile: '#10b981', // emerald-500
  desktop: '#3b82f6', // blue-500
  tablet: '#f59e0b', // amber-500
  unknown: '#6b7280', // gray-500
};

const OS_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#f97316', // orange-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
];

const BROWSER_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#f97316', // orange-500
];

export const DeviceChart: React.FC<DeviceChartProps> = ({ 
  data, 
  type = 'device', 
  chartType = 'doughnut',
  height = 300 
}) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No device data available</div>
      </div>
    );
  }

  const getBreakdownData = () => {
    switch (type) {
      case 'device':
        return data.deviceBreakdown;
      case 'os':
        return data.operatingSystemBreakdown.slice(0, 8); // Top 8 OS
      case 'browser':
        return data.browserBreakdown.slice(0, 6); // Top 6 browsers
      default:
        return data.deviceBreakdown;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'device':
        return getBreakdownData().map(item => 
          DEVICE_COLORS[item.category.toLowerCase() as keyof typeof DEVICE_COLORS] || DEVICE_COLORS.unknown
        );
      case 'os':
        return OS_COLORS.slice(0, getBreakdownData().length);
      case 'browser':
        return BROWSER_COLORS.slice(0, getBreakdownData().length);
      default:
        return OS_COLORS.slice(0, getBreakdownData().length);
    }
  };

  const breakdownData = getBreakdownData();
  const colors = getColors();

  const getTitle = () => {
    switch (type) {
      case 'device':
        return 'Device Types';
      case 'os':
        return 'Operating Systems';
      case 'browser':
        return 'Browsers';
      default:
        return 'Device Analytics';
    }
  };

  const chartData = {
    labels: breakdownData.map(item => {
      const displayName = item.category.charAt(0).toUpperCase() + item.category.slice(1);
      return chartType === 'doughnut' 
        ? `${displayName} (${item.percentage.toFixed(1)}%)`
        : displayName;
    }),
    datasets: [
      {
        label: 'Users',
        data: breakdownData.map(item => item.uniqueUsers),
        backgroundColor: colors,
        borderColor: colors.map(color => color),
        borderWidth: 1,
        hoverBackgroundColor: colors.map(color => color + 'CC'),
        hoverBorderColor: colors,
        hoverBorderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    ...getDefaultChartOptions(),
    plugins: {
      ...getDefaultChartOptions().plugins,
      legend: {
        ...getDefaultChartOptions().plugins.legend,
        position: 'right' as const,
        labels: {
          ...getDefaultChartOptions().plugins.legend.labels,
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        ...getDefaultChartOptions().plugins.tooltip,
        callbacks: {
          label: function(context: any) {
            const item = breakdownData[context.dataIndex];
            return [
              `${context.label}`,
              `Users: ${item.uniqueUsers.toLocaleString()}`,
              `Percentage: ${item.percentage.toFixed(1)}%`,
              ...(item.totalSessions ? [`Sessions: ${item.totalSessions.toLocaleString()}`] : []),
              ...(item.averageEventsPerSession ? [`Avg Events/Session: ${item.averageEventsPerSession.toFixed(1)}`] : []),
            ];
          },
        },
      },
    },
  };

  const barOptions = {
    ...getDefaultChartOptions(),
    plugins: {
      ...getDefaultChartOptions().plugins,
      legend: {
        display: false,
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
            const item = breakdownData[context.dataIndex];
            return [
              `Users: ${item.uniqueUsers.toLocaleString()}`,
              `Percentage: ${item.percentage.toFixed(1)}%`,
              ...(item.totalSessions ? [`Sessions: ${item.totalSessions.toLocaleString()}`] : []),
              ...(item.averageEventsPerSession ? [`Avg Events/Session: ${item.averageEventsPerSession.toFixed(1)}`] : []),
            ];
          },
        },
      },
    },
    scales: {
      ...getDefaultChartOptions().scales,
      y: {
        ...getDefaultChartOptions().scales.y,
        ticks: {
          ...getDefaultChartOptions().scales.y.ticks,
          callback: function(value: any) {
            return value.toLocaleString();
          },
        },
      },
    },
  };

  return (
    <div style={{ height: `${height}px` }}>
      {chartType === 'doughnut' ? (
        <Doughnut data={chartData} options={doughnutOptions} />
      ) : (
        <Bar data={chartData} options={barOptions} />
      )}
    </div>
  );
};