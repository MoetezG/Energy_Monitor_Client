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
import { FileSpreadsheetIcon } from "lucide-react";
import { useChartReportGeneration } from "@/hooks/useChartReportGeneration";
import {
  scadaAPI,
  SampleChartData,
  ChartQueryParams,
  VariableRecord,
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

interface SampleChartProps {
  variable: VariableRecord;
  height?: number;
  className?: string;
}

interface ChartState {
  data: SampleChartData[];
  loading: boolean;
  error: string | null;
}

// Helper function to calculate appropriate time range for sparse data
const calculateTimeRange = (
  data: SampleChartData[]
): { min?: string; max?: string } => {
  if (data.length === 0) return {};

  const times = data.map((point) => new Date(point.x).getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  // If we only have a few points, add padding to show a meaningful time range
  if (data.length <= 5) {
    const timeDiff = maxTime - minTime;
    const padding = Math.max(12 * 60 * 60 * 1000, timeDiff * 0.2); // At least 12 hours or 20% of range

    return {
      min: new Date(minTime - padding).toISOString(),
      max: new Date(maxTime + padding).toISOString(),
    };
  }

  return {};
};

export default function SampleChart({
  variable,
  height = 400,
  className = "",
}: SampleChartProps) {
  const [chartState, setChartState] = useState<ChartState>({
    data: [],
    loading: true,
    error: null,
  });
  const {
    generateChartReport,
    generateVariableReport,
    loading: reportLoading,
  } = useChartReportGeneration();

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

  // Load chart data
  const loadChartData = useCallback(async () => {
    if (!variable.id) return;

    setChartState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const params: ChartQueryParams = {
        startTime: customRange.startDate.toISOString(),
        endTime: customRange.endDate.toISOString(),
        period: aggregationPeriod,
      };

      const response = await scadaAPI.getDeviceCharts(variable.id, params);

      if (response.success && response.data) {
        setChartState({
          data: response.data,
          loading: false,
          error: null,
        });
      } else {
        setChartState({
          data: [],
          loading: false,
          error: response.error || "Failed to load chart data",
        });
      }
    } catch {
      setChartState({
        data: [],
        loading: false,
        error: "Network error while loading chart data",
      });
    }
  }, [variable.id, customRange, aggregationPeriod]);

  // Load data when variable or time range changes
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!variable.id || !mounted) return;

      setChartState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const params: ChartQueryParams = {
          startTime: customRange.startDate.toISOString(),
          endTime: customRange.endDate.toISOString(),
          period: aggregationPeriod,
        };

        const response = await scadaAPI.getDeviceCharts(variable.id, params);

        if (!mounted) return;

        if (response.success && response.data) {
          setChartState({
            data: response.data,
            loading: false,
            error: null,
          });
        } else {
          setChartState({
            data: [],
            loading: false,
            error: response.error || "Failed to load chart data",
          });
        }
      } catch {
        if (!mounted) return;

        setChartState({
          data: [],
          loading: false,
          error: "Network error while loading chart data",
        });
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [variable.id, customRange, aggregationPeriod]);

  // Chart configuration
  const timeRangeConfig = calculateTimeRange(chartState.data);
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: `${variable.name || variable.var_code} - ${
          aggregationPeriod.charAt(0).toUpperCase() + aggregationPeriod.slice(1)
        } Trends`,
        font: {
          size: 16,
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
          label: function (context) {
            const value =
              typeof context.parsed.y === "number"
                ? context.parsed.y.toFixed(2)
                : context.parsed.y;
            const unit = variable.unit ? ` ${variable.unit}` : "";
            return `${context.dataset.label}: ${value}${unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        ...timeRangeConfig, // Apply calculated min/max if available
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
        beginAtZero: false,
        grid: {
          display: true,
          color: "#f3f4f6",
        },
        ticks: {
          color: "#6b7280",
          callback: function (value) {
            const numValue =
              typeof value === "number" ? value : parseFloat(value as string);
            const unit = variable.unit ? ` ${variable.unit}` : "";
            return `${numValue.toFixed(2)}${unit}`;
          },
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
        tension: 0.1,
      },
      point: {
        radius: 3,
        hoverRadius: 6,
      },
    },
  };

  // Chart data configuration
  const chartData = {
    datasets: [
      {
        label: variable.name || variable.var_code,
        data: chartState.data
          .filter(
            (point) =>
              point &&
              point.x !== undefined &&
              point.x !== null &&
              point.y !== undefined &&
              point.y !== null &&
              !isNaN(Number(point.y))
          )
          .map((point) => ({
            x: new Date(point.x).getTime(), // Convert to timestamp for Chart.js
            y: Number(point.y), // Ensure numeric value
          })),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        fill: true,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "rgb(255, 255, 255)",
        pointBorderWidth: 2,
        pointHoverBackgroundColor: "rgb(37, 99, 235)",
        pointHoverBorderColor: "rgb(255, 255, 255)",
      },
    ],
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Chart Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-linear-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">
              Historical Trends
            </h3>
            <span className="text-sm text-gray-500">({variable.var_code})</span>
          </div>

          {/* Date Range and Period Selectors */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-600">
              Start Date:
            </label>
            <DatePicker
              selected={customRange.startDate}
              onChange={(d) =>
                setCustomRange((prev) => ({ ...prev, startDate: d! }))
              }
              selectsStart
              startDate={customRange.startDate}
              endDate={customRange.endDate}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <span className="text-gray-500">to</span>

            <DatePicker
              selected={customRange.endDate}
              onChange={(d) =>
                setCustomRange((prev) => ({ ...prev, endDate: d! }))
              }
              selectsEnd
              startDate={customRange.startDate}
              endDate={customRange.endDate}
              minDate={customRange.startDate}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <label className="text-sm font-medium text-gray-600 ml-4">
              Period:
            </label>
            <select
              value={aggregationPeriod}
              onChange={(e) =>
                setAggregationPeriod(
                  e.target.value as "hour" | "day" | "week" | "month"
                )
              }
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="hour">Hour</option>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>

          {/* Legend Toggle */}
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showLegend}
                onChange={(e) => setShowLegend(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-600">Show Legend</span>
            </label>

            <button
              onClick={loadChartData}
              disabled={chartState.loading}
              className="ml-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-1"
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

            <button
              onClick={() => {
                const reportData = chartState.data.map((point) => ({
                  variable: variable.var_code,
                  timestamp: point.x,
                  value: point.y,
                  unit: variable.unit || "",
                }));
                generateChartReport(
                  reportData,
                  `Historical Trends - ${variable.var_code}`
                );
              }}
              disabled={reportLoading || chartState.data.length === 0}
              className="ml-2 px-3 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 flex items-center space-x-1"
              title="Générer rapport Excel"
            >
              <FileSpreadsheetIcon className="w-4 h-4" />
              <span>{reportLoading ? "Export..." : "Excel"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        {chartState.loading && (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Loading chart data...</span>
            </div>
          </div>
        )}

        {chartState.error && (
          <div className="flex items-center justify-center" style={{ height }}>
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!chartState.loading && !chartState.error && (
          <>
            {chartState.data.length === 0 ? (
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
                    No Data Available
                  </h3>
                  <p className="text-gray-600">
                    No sample data found for the selected time range.
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
                      chartData.datasets.length === 0 ||
                      chartData.datasets[0].data.length === 0
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
        chartState.data.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>Data Points: {chartState.data.length}</span>
                {variable.unit && <span>Unit: {variable.unit}</span>}
              </div>
              <div>Last Updated: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        )}
    </div>
  );
}
