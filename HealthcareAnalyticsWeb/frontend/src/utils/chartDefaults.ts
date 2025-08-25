// Function to get computed CSS variable value
const getCSSVariable = (variable: string): string => {
  if (typeof window !== 'undefined') {
    try {
      const computed = getComputedStyle(document.documentElement).getPropertyValue(variable);
      return computed.trim() ? `hsl(${computed.trim()})` : '#666666';
    } catch {
      return '#666666';
    }
  }
  return '#666666';
};

// Get theme-aware colors
export const getThemeColors = () => {
  return {
    foreground: getCSSVariable('--foreground'),
    mutedForeground: getCSSVariable('--muted-foreground'),
    border: getCSSVariable('--border'),
    popover: getCSSVariable('--popover'),
    popoverForeground: getCSSVariable('--popover-foreground'),
  };
};

// Get default chart options with proper theming
export const getDefaultChartOptions = () => {
  const colors = getThemeColors();
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: colors.foreground,
        },
      },
      tooltip: {
        backgroundColor: colors.popover,
        titleColor: colors.popoverForeground,
        bodyColor: colors.popoverForeground,
        borderColor: colors.border,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: colors.mutedForeground,
        },
        grid: {
          color: colors.border,
        },
      },
      y: {
        ticks: {
          color: colors.mutedForeground,
        },
        grid: {
          color: colors.border,
        },
      },
    },
  };
};

// Placeholder functions for backward compatibility
export const configureChartDefaults = () => {
  // No-op now, using getDefaultChartOptions instead
};

export const refreshChartDefaults = () => {
  // No-op now, using getDefaultChartOptions instead
};