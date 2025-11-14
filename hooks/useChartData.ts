import { useState, useEffect, useCallback } from 'react';
import { scadaAPI, SampleChartData, ChartQueryParams } from '@/lib/api';

export interface UseChartDataOptions {
  variableId: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  defaultTimeRange?: {
    period: 'day' | 'week' | 'month';
    days: number;
  };
}

export interface UseChartDataReturn {
  data: SampleChartData[];
  loading: boolean;
  error: string | null;
  timeRange: {
    period: 'day' | 'week' | 'month';
    days: number;
  };
  setTimeRange: (range: { period: 'day' | 'week' | 'month'; days: number }) => void;
  refresh: () => Promise<void>;
  lastUpdate: Date | null;
}

export function useChartData({
  variableId,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
  defaultTimeRange = { period: 'day', days: 7 }
}: UseChartDataOptions): UseChartDataReturn {
  const [data, setData] = useState<SampleChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(defaultTimeRange);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!variableId) return;

    setLoading(true);
    setError(null);

    try {
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(endTime.getDate() - timeRange.days);

      const params: ChartQueryParams = {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        period: timeRange.period
      };

      const response = await scadaAPI.getDeviceCharts(variableId, params);

      if (response.success && response.data) {
        setData(response.data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError(response.error || 'Failed to load chart data');
      }
    } catch {
      setError('Network error while loading chart data');
    } finally {
      setLoading(false);
    }
  }, [variableId, timeRange]);

  // Initial data load and when dependencies change
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!variableId || !mounted) return;

      setLoading(true);
      setError(null);

      try {
        const endTime = new Date();
        const startTime = new Date();
        startTime.setDate(endTime.getDate() - timeRange.days);

        const params: ChartQueryParams = {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          period: timeRange.period
        };

        const response = await scadaAPI.getDeviceCharts(variableId, params);

        if (!mounted) return;

        if (response.success && response.data) {
          setData(response.data);
          setLastUpdate(new Date());
          setError(null);
        } else {
          setError(response.error || 'Failed to load chart data');
        }
      } catch {
        if (!mounted) return;
        setError('Network error while loading chart data');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [variableId, timeRange]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !variableId) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData, variableId]);

  return {
    data,
    loading,
    error,
    timeRange,
    setTimeRange,
    refresh: fetchData,
    lastUpdate
  };
}

// Utility hook for managing multiple chart data sources
export interface UseMultipleChartsOptions {
  variableIds: number[];
  autoRefresh?: boolean;
  refreshInterval?: number;
  defaultTimeRange?: {
    period: 'day' | 'week' | 'month';
    days: number;
  };
}

export interface ChartDataState {
  [variableId: number]: {
    data: SampleChartData[];
    loading: boolean;
    error: string | null;
    lastUpdate: Date | null;
  };
}

export function useMultipleCharts({
  variableIds,
  autoRefresh = false,
  refreshInterval = 30000,
  defaultTimeRange = { period: 'day', days: 7 }
}: UseMultipleChartsOptions) {
  const [chartsData, setChartsData] = useState<ChartDataState>({});
  const [timeRange, setTimeRange] = useState(defaultTimeRange);

  const fetchAllData = useCallback(async () => {
    if (variableIds.length === 0) return;

    // Set loading state for all variables
    setChartsData(prev => {
      const updated = { ...prev };
      variableIds.forEach(id => {
        updated[id] = {
          ...updated[id],
          loading: true,
          error: null
        };
      });
      return updated;
    });

    // Fetch data for all variables concurrently
    const promises = variableIds.map(async (variableId) => {
      try {
        const endTime = new Date();
        const startTime = new Date();
        startTime.setDate(endTime.getDate() - timeRange.days);

        const params: ChartQueryParams = {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          period: timeRange.period
        };

        const response = await scadaAPI.getDeviceCharts(variableId, params);

        return {
          variableId,
          success: response.success,
          data: response.data || [],
          error: response.error || null
        };
      } catch {
        return {
          variableId,
          success: false,
          data: [],
          error: 'Network error'
        };
      }
    });

    const results = await Promise.all(promises);

    // Update state with results
    setChartsData(prev => {
      const updated = { ...prev };
      results.forEach(result => {
        updated[result.variableId] = {
          data: result.data,
          loading: false,
          error: result.error,
          lastUpdate: result.success ? new Date() : prev[result.variableId]?.lastUpdate || null
        };
      });
      return updated;
    });
  }, [variableIds, timeRange]);

  // Load data when variables or time range changes
  useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      if (variableIds.length === 0 || !mounted) return;

      await fetchAllData();
    };

    initializeData();

    return () => {
      mounted = false;
    };
  }, [fetchAllData, variableIds.length]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || variableIds.length === 0) return;

    const interval = setInterval(() => {
      fetchAllData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAllData, variableIds.length]);

  return {
    chartsData,
    timeRange,
    setTimeRange,
    refresh: fetchAllData,
    isLoading: Object.values(chartsData).some(chart => chart.loading),
    hasError: Object.values(chartsData).some(chart => chart.error !== null)
  };
}