"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  scadaAPI,
  SampleChartData,
  ChartQueryParams,
  VariableRecord,
  DatabaseDevice,
} from "@/lib/api";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

interface MultiVariableChartProps {
  height?: number;
  className?: string;
  maxVariables?: number;
  preselectedVariable?: VariableRecord;
  preselectedDevice?: DatabaseDevice;
  singleVariableMode?: boolean;
}

interface ChartDataset {
  variable: VariableRecord;
  data: SampleChartData[];
  color: string;
  device: DatabaseDevice;
}

interface ChartState {
  datasets: ChartDataset[];
  loading: boolean;
  error: string | null;
  devices: DatabaseDevice[];
  variables: VariableRecord[];
  selectedVariableIds: number[];
}

// Predefined colors for different variables
const CHART_COLORS = [
  "rgb(59, 130, 246)", // blue
  "rgb(34, 197, 94)", // green
  "rgb(239, 68, 68)", // red
  "rgb(168, 85, 247)", // purple
  "rgb(245, 158, 11)", // amber
  "rgb(236, 72, 153)", // pink
  "rgb(14, 165, 233)", // sky
  "rgb(34, 197, 94)", // emerald
  "rgb(249, 115, 22)", // orange
  "rgb(139, 92, 246)", // violet
  "rgb(6, 182, 212)", // cyan
  "rgb(132, 204, 22)", // lime
];

export default function MultiVariableChart({
  height = 500,
  className = "",
  maxVariables = 8,
  preselectedVariable,
  preselectedDevice,
  singleVariableMode = false,
}: MultiVariableChartProps) {
  const [chartState, setChartState] = useState<ChartState>({
    datasets: [],
    loading: false,
    error: null,
    devices: [],
    variables: [],
    selectedVariableIds: [],
  });
  const [customRange, setCustomRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
    endDate: new Date(),
  });

  const [aggregationPeriod, setAggregationPeriod] = useState<
    "hour" | "day" | "week" | "month"
  >("day");

  const [showLegend, setShowLegend] = useState(true);
  const [normalizeData, setNormalizeData] = useState(false);

  // Load devices and variables
  const loadDevicesAndVariables = useCallback(async () => {
    try {
      const [devicesResponse, variablesResponse] = await Promise.all([
        scadaAPI.getDatabaseDevices(),
        scadaAPI.getVariableList(),
      ]);

      if (devicesResponse.success && variablesResponse.success) {
        const devices = Array.isArray(devicesResponse.data)
          ? devicesResponse.data
          : [];
        const variables = Array.isArray(variablesResponse.data)
          ? variablesResponse.data.filter((v) => v.enabled !== false)
          : [];

        // Handle preselected variable or auto-select first few variables
        let autoSelectedIds: number[];
        if (preselectedVariable && singleVariableMode) {
          // In single variable mode with preselected variable
          autoSelectedIds = [preselectedVariable.id];
          // Add the preselected variable and device if they're not already in the lists
          if (!variables.find((v) => v.id === preselectedVariable.id)) {
            variables.push(preselectedVariable);
          }
          if (
            preselectedDevice &&
            !devices.find((d) => d.id === preselectedDevice.id)
          ) {
            devices.push(preselectedDevice);
          }
        } else {
          // Auto-select first few variables
          autoSelectedIds = variables
            .slice(0, Math.min(maxVariables, 4))
            .map((v) => v.id);
        }

        setChartState((prev) => ({
          ...prev,
          devices,
          variables,
          selectedVariableIds: autoSelectedIds,
        }));
      }
    } catch {
      setChartState((prev) => ({
        ...prev,
        error: "Failed to load devices and variables",
      }));
    }
  }, [
    maxVariables,
    preselectedVariable,
    preselectedDevice,
    singleVariableMode,
  ]);

  // Load chart data for selected variables
  const loadChartData = useCallback(async () => {
    if (chartState.selectedVariableIds.length === 0) {
      setChartState((prev) => ({ ...prev, datasets: [] }));
      return;
    }

    setChartState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const params: ChartQueryParams = {
        startTime: customRange.startDate.toISOString(),
        endTime: customRange.endDate.toISOString(),
        period: aggregationPeriod,
      };

      // Load data for all selected variables in parallel
      const dataPromises = chartState.selectedVariableIds.map(
        async (variableId, index) => {
          const variable = chartState.variables.find(
            (v) => v.id === variableId
          );
          const device = chartState.devices.find(
            (d) => d.id === variable?.device_id
          );

          if (!variable || !device) return null;

          try {
            const response = await scadaAPI.getDeviceCharts(variableId, params);

            if (response.success && response.data) {
              return {
                variable,
                device,
                data: response.data,
                color: CHART_COLORS[index % CHART_COLORS.length],
              };
            }
          } catch {
            console.error(`Failed to load data for variable ${variableId}`);
          }

          return null;
        }
      );

      const results = await Promise.all(dataPromises);
      const validDatasets = results.filter(
        (dataset): dataset is ChartDataset => dataset !== null
      );

      setChartState((prev) => ({
        ...prev,
        datasets: validDatasets,
        loading: false,
        error:
          validDatasets.length === 0
            ? "No data available for selected variables"
            : null,
      }));
    } catch {
      setChartState((prev) => ({
        ...prev,
        datasets: [],
        loading: false,
        error: "Network error while loading chart data",
      }));
    }
  }, [
    chartState.selectedVariableIds,
    chartState.variables,
    chartState.devices,
    customRange,
    aggregationPeriod,
  ]);

  // Initialize component
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!mounted) return;
      await loadDevicesAndVariables();
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [loadDevicesAndVariables]);

  // Load chart data when variables or time range changes
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!mounted || chartState.selectedVariableIds.length === 0) return;
      await loadChartData();
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [loadChartData, chartState.selectedVariableIds.length]);

  // Get device name by ID
  const getDeviceName = (deviceId: number): string => {
    const device = chartState.devices.find((d) => d.id === deviceId);
    return device?.name || `Device ${deviceId}`;
  };

  // Normalize data if enabled
  const normalizeDataset = (data: SampleChartData[]) => {
    if (!normalizeData || data.length === 0) return data;

    const values = data.map((d) => d.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    if (range === 0) return data;

    return data.map((d) => ({
      ...d,
      y: ((d.y - min) / range) * 100, // Normalize to 0-100 scale
    }));
  };

  // Chart configuration
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          generateLabels: (chart) => {
            const original =
              ChartJS.defaults.plugins.legend.labels.generateLabels;
            const labels = original(chart);

            return labels.map((label, index) => {
              const dataset = chartState.datasets[index];
              if (dataset) {
                label.text = `${dataset.device.name} - ${
                  dataset.variable.name || dataset.variable.var_code
                }`;
                if (dataset.variable.unit && !normalizeData) {
                  label.text += ` (${dataset.variable.unit})`;
                }
              }
              return label;
            });
          },
        },
      },
      title: {
        display: true,
        text: `Multi-Variable Analysis - Trends`,
        font: {
          size: 18,
          weight: "bold",
        },
        padding: 20,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#374151",
        bodyColor: "#374151",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          title: function (context) {
            const xValue = context[0]?.parsed?.x;
            return xValue ? new Date(xValue).toLocaleString() : "";
          },
          label: function (context) {
            const dataset = chartState.datasets[context.datasetIndex];
            if (!dataset) return "";

            const value =
              typeof context.parsed.y === "number"
                ? context.parsed.y.toFixed(2)
                : context.parsed.y;

            let unit = "";
            if (normalizeData) {
              unit = "%";
            } else if (dataset.variable.unit) {
              unit = ` ${dataset.variable.unit}`;
            }

            const deviceName = dataset.device.name;
            const variableName =
              dataset.variable.name || dataset.variable.var_code;

            return `${deviceName} - ${variableName}: ${value}${unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          displayFormats: {
            millisecond: "HH:mm:ss.SSS",
            second: "HH:mm:ss",
            minute: "HH:mm",
            hour: "MMM dd, HH:mm",
            day: "MMM dd",
            week: "MMM dd",
            month: "MMM yyyy",
            quarter: "MMM yyyy",
            year: "yyyy",
          },
          tooltipFormat: "MMM dd, yyyy HH:mm:ss",
        },
        adapters: {
          date: {},
        },
        min: (() => {
          // Calculate min time from all datasets
          const allTimes = chartState.datasets.flatMap((dataset) =>
            dataset.data.map((point) => new Date(point.x).getTime())
          );
          if (allTimes.length === 0) return undefined;
          const minTime = Math.min(...allTimes);
          // Add some padding before the first point
          return new Date(minTime - 12 * 60 * 60 * 1000).toISOString(); // 12 hours before
        })(),
        max: (() => {
          // Calculate max time from all datasets
          const allTimes = chartState.datasets.flatMap((dataset) =>
            dataset.data.map((point) => new Date(point.x).getTime())
          );
          if (allTimes.length === 0) return undefined;
          const maxTime = Math.max(...allTimes);
          // Add some padding after the last point
          return new Date(maxTime + 12 * 60 * 60 * 1000).toISOString(); // 12 hours after
        })(),
        grid: {
          display: true,
          color: "#f3f4f6",
        },
        ticks: {
          color: "#6b7280",
          maxTicksLimit: 8,
          autoSkip: true,
          maxRotation: 45,
        },
      },
      y: {
        beginAtZero: normalizeData,
        grid: {
          display: true,
          color: "#f3f4f6",
        },
        ticks: {
          color: "#6b7280",
          callback: function (value) {
            const numValue =
              typeof value === "number" ? value : parseFloat(value as string);
            const unit = normalizeData ? "%" : "";
            return `${numValue.toFixed(1)}${unit}`;
          },
        },
        title: {
          display: normalizeData,
          text: normalizeData ? "Normalized Value (%)" : "",
          color: "#6b7280",
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
    elements: {
      line: {
        tension: 0.2,
        borderWidth: 2,
      },
      point: {
        radius: 3,
        hoverRadius: 6,
        borderWidth: 2,
      },
    },
  };

  // Chart data configuration
  const chartData = {
    datasets: chartState.datasets
      .filter(
        (dataset) => dataset && dataset.data && Array.isArray(dataset.data)
      )
      .map((dataset) => {
        const processedData = normalizeDataset(dataset.data);

        // Validate data points have required x and y properties
        const validData = processedData.filter(
          (point) =>
            point &&
            point.x !== undefined &&
            point.x !== null &&
            point.y !== undefined &&
            point.y !== null &&
            !isNaN(Number(point.y))
        );

        return {
          label: `${dataset.device.name} - ${
            dataset.variable.name || dataset.variable.var_code
          }`,
          data: validData.map((point) => ({
            x: new Date(point.x).getTime(), // Convert to timestamp for Chart.js
            y: Number(point.y), // Ensure numeric value
          })),
          borderColor: dataset.color,
          backgroundColor: dataset.color + "20", // Add transparency
          borderWidth: 2,
          fill: false,
          pointBackgroundColor: dataset.color,
          pointBorderColor: "rgb(255, 255, 255)",
          pointBorderWidth: 2,
          pointHoverBackgroundColor: dataset.color,
          pointHoverBorderColor: "rgb(255, 255, 255)",
          tension: 0.2,
        };
      })
      .filter((dataset) => dataset.data.length > 0), // Remove datasets with no valid data
  };

  // Handle variable selection
  const handleVariableToggle = (variableId: number) => {
    setChartState((prev) => {
      const isSelected = prev.selectedVariableIds.includes(variableId);
      let newSelectedIds;

      if (isSelected) {
        newSelectedIds = prev.selectedVariableIds.filter(
          (id) => id !== variableId
        );
      } else {
        if (prev.selectedVariableIds.length >= maxVariables) {
          // Replace oldest selection
          newSelectedIds = [...prev.selectedVariableIds.slice(1), variableId];
        } else {
          newSelectedIds = [...prev.selectedVariableIds, variableId];
        }
      }

      return {
        ...prev,
        selectedVariableIds: newSelectedIds,
      };
    });
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Chart Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-linear-to-r from-blue-50 to-indigo-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">
              Multi-Variable Comparison
            </h3>
            <span className="text-sm text-gray-500">
              ({chartState.datasets.length} variables)
            </span>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Time Range */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-600">Time:</label>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Start Date */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-600">
                    Start:
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      customRange.startDate
                        ? customRange.startDate.toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) => {
                      setCustomRange((prev) => ({
                        ...prev,
                        startDate: e.target.value
                          ? new Date(e.target.value)
                          : new Date(),
                      }));
                    }}
                    className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* End Date */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-600">
                    End:
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      customRange.endDate
                        ? customRange.endDate.toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) => {
                      setCustomRange((prev) => ({
                        ...prev,
                        endDate: e.target.value
                          ? new Date(e.target.value)
                          : new Date(),
                      }));
                    }}
                    className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Period */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-600">
                    Period:
                  </label>
                  <select
                    value={aggregationPeriod}
                    onChange={(e) =>
                      setAggregationPeriod(
                        e.target.value as "hour" | "day" | "week" | "month"
                      )
                    }
                    className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="hour">Hour</option>
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>

                  {/* Refresh Button */}
                  <button
                    onClick={loadChartData}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Toggle Controls */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showLegend}
                    onChange={(e) => setShowLegend(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-600">Legend</span>
                </label>

                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={normalizeData}
                    onChange={(e) => setNormalizeData(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-600">Normalize</span>
                </label>
              </div>

              {/* Refresh Button */}
              <button
                onClick={loadChartData}
                disabled={chartState.loading}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
              >
                <svg
                  className={`w-4 h-4 ${
                    chartState.loading ? "animate-spin" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{chartState.loading ? "Loading..." : "Refresh"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Variable Selection */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">
                Select Variables to Compare (max {maxVariables})
              </h4>
              <span className="text-sm text-gray-500">
                {chartState.selectedVariableIds.length} of {maxVariables}{" "}
                selected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {chartState.variables.map((variable) => {
                const isSelected = chartState.selectedVariableIds.includes(
                  variable.id
                );
                const deviceName = getDeviceName(variable.device_id);

                return (
                  <label
                    key={variable.id}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer text-sm ${
                      isSelected
                        ? "bg-blue-100 text-blue-900 border border-blue-200"
                        : "bg-white hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleVariableToggle(variable.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="flex-1 truncate">
                      <span className="font-medium">{deviceName}</span>
                      <span className="text-gray-600 ml-1">
                        - {variable.name || variable.var_code}
                      </span>
                      {variable.unit && !normalizeData && (
                        <span className="text-gray-500 ml-1">
                          ({variable.unit})
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart Content */}
        <div className="p-6">
          {chartState.loading && (
            <div
              className="flex items-center justify-center"
              style={{ height }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading chart data...</span>
              </div>
            </div>
          )}

          {chartState.error && (
            <div
              className="flex items-center justify-center"
              style={{ height }}
            >
              <div className="text-center">
                <svg
                  className="w-12 h-12 text-red-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-9-7a9 9 0 1118 0 9 9 0 01-18 0z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chart Error
                </h3>
                <p className="text-gray-600 mb-4">{chartState.error}</p>
                <button
                  onClick={loadChartData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!chartState.loading && !chartState.error && (
            <>
              {chartState.datasets.length === 0 ? (
                <div
                  className="flex items-center justify-center"
                  style={{ height }}
                >
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Select Variables
                    </h3>
                    <p className="text-gray-600">
                      Choose variables from the list above to start comparing
                      their trends.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ height }}>
                  {(() => {
                    try {
                      // Ensure we have valid data before rendering
                      if (
                        !chartData.datasets ||
                        chartData.datasets.length === 0
                      ) {
                        return (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <svg
                                className="w-8 h-8 text-gray-400 mx-auto mb-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                              </svg>
                              <p className="text-sm text-gray-600">
                                No valid chart data
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return <Line data={chartData} options={chartOptions} />;
                    } catch (error) {
                      console.error("Chart rendering error:", error);
                      return (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <svg
                              className="w-8 h-8 text-red-400 mx-auto mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-9-7a9 9 0 1118 0 9 9 0 01-18 0z"
                              />
                            </svg>
                            <p className="text-sm text-red-600">
                              Chart rendering error
                            </p>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </>
          )}
        </div>

        {/* Chart Footer */}
        {!chartState.loading &&
          !chartState.error &&
          chartState.datasets.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span>Variables: {chartState.datasets.length}</span>
                  <span>
                    Data Points:{" "}
                    {chartState.datasets.reduce(
                      (sum, d) => sum + d.data.length,
                      0
                    )}
                  </span>
                  {normalizeData && (
                    <span className="text-purple-600 font-medium">
                      Normalized View
                    </span>
                  )}
                </div>
                <div>Last Updated: {new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
