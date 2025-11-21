import { useState, useEffect, useCallback } from "react";
import { scadaAPI, SampleChartData, ChartQueryParams } from "@/lib/api";

export interface UseChartDataOptions {
  variableId: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  defaultDateRange?: {
    startDate: Date;
    endDate: Date;
  };
  defaultAggregationPeriod?: "hour" | "day" | "week" | "month";
}

export interface UseChartDataReturn {
  data: SampleChartData[];
  loading: boolean;
  error: string | null;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  aggregationPeriod: "hour" | "day" | "week" | "month";
  setDateRange: (range: { startDate: Date; endDate: Date }) => void;
  setAggregationPeriod: (period: "hour" | "day" | "week" | "month") => void;
  refresh: () => Promise<void>;
  lastUpdate: Date | null;
}

export function useChartData({
  variableId,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
  defaultDateRange = {
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
    endDate: new Date(),
  },
  defaultAggregationPeriod = "day",
}: UseChartDataOptions): UseChartDataReturn {
  const [data, setData] = useState<SampleChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [aggregationPeriod, setAggregationPeriod] = useState(
    defaultAggregationPeriod
  );
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!variableId) return;

    setLoading(true);
    setError(null);

    try {
      const params: ChartQueryParams = {
        startTime: dateRange.startDate.toISOString(),
        endTime: dateRange.endDate.toISOString(),
        period: aggregationPeriod,
      };

      const response = await scadaAPI.getDeviceCharts(variableId, params);

      if (response.success && response.data) {
        setData(response.data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError(response.error || "Failed to load chart data");
      }
    } catch {
      setError("Network error while loading chart data");
    } finally {
      setLoading(false);
    }
  }, [variableId, dateRange, aggregationPeriod]);

  // Initial data load and when dependencies change
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!variableId || !mounted) return;

      setLoading(true);
      setError(null);

      try {
        const params: ChartQueryParams = {
          startTime: dateRange.startDate.toISOString(),
          endTime: dateRange.endDate.toISOString(),
          period: aggregationPeriod,
        };

        const response = await scadaAPI.getDeviceCharts(variableId, params);

        if (!mounted) return;

        if (response.success && response.data) {
          setData(response.data);
          setLastUpdate(new Date());
          setError(null);
        } else {
          setError(response.error || "Failed to load chart data");
        }
      } catch {
        if (!mounted) return;
        setError("Network error while loading chart data");
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
  }, [variableId, dateRange, aggregationPeriod]);

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
    dateRange,
    aggregationPeriod,
    setDateRange,
    setAggregationPeriod,
    refresh: fetchData,
    lastUpdate,
  };
}

// Utility hook for managing multiple chart data sources
export interface UseMultipleChartsOptions {
  variableIds: number[];
  autoRefresh?: boolean;
  refreshInterval?: number;
  defaultDateRange?: {
    startDate: Date;
    endDate: Date;
  };
  defaultAggregationPeriod?: "hour" | "day" | "week" | "month";
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
  defaultDateRange = {
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
    endDate: new Date(),
  },
  defaultAggregationPeriod = "day",
}: UseMultipleChartsOptions) {
  const [chartsData, setChartsData] = useState<ChartDataState>({});
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [aggregationPeriod, setAggregationPeriod] = useState(
    defaultAggregationPeriod
  );

  const fetchAllData = useCallback(async () => {
    if (variableIds.length === 0) return;

    // Set loading state for all variables
    setChartsData((prev) => {
      const updated = { ...prev };
      variableIds.forEach((id) => {
        updated[id] = {
          ...updated[id],
          loading: true,
          error: null,
        };
      });
      return updated;
    });

    // Fetch data for all variables concurrently
    const promises = variableIds.map(async (variableId) => {
      try {
        const params: ChartQueryParams = {
          startTime: dateRange.startDate.toISOString(),
          endTime: dateRange.endDate.toISOString(),
          period: aggregationPeriod,
        };

        const response = await scadaAPI.getDeviceCharts(variableId, params);

        return {
          variableId,
          success: response.success,
          data: response.data || [],
          error: response.error || null,
        };
      } catch {
        return {
          variableId,
          success: false,
          data: [],
          error: "Network error",
        };
      }
    });

    const results = await Promise.all(promises);

    // Update state with results
    setChartsData((prev) => {
      const updated = { ...prev };
      results.forEach((result) => {
        updated[result.variableId] = {
          data: result.data,
          loading: false,
          error: result.error,
          lastUpdate: result.success
            ? new Date()
            : prev[result.variableId]?.lastUpdate || null,
        };
      });
      return updated;
    });
  }, [variableIds, dateRange, aggregationPeriod]);

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
    dateRange,
    aggregationPeriod,
    setDateRange,
    setAggregationPeriod,
    refresh: fetchAllData,
    isLoading: Object.values(chartsData).some((chart) => chart.loading),
    hasError: Object.values(chartsData).some((chart) => chart.error !== null),
  };
}
