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

interface DeviceMultiVariableChartProps {
  height?: number;
  className?: string;
}

interface VariableDataset {
  variable: VariableRecord;
  data: SampleChartData[];
  color: string;
}

interface DeviceChartData {
  device: DatabaseDevice;
  datasets: VariableDataset[];
  loading: boolean;
  error: string | null;
}

interface ChartState {
  deviceCharts: DeviceChartData[];
  devices: DatabaseDevice[];
  variables: VariableRecord[];
  selectedDeviceIds: number[];
  loading: boolean;
  error: string | null;
}

const VARIABLE_COLORS = [
  "rgb(59, 130, 246)",
  "rgb(34, 197, 94)",
  "rgb(239, 68, 68)",
  "rgb(168, 85, 247)",
  "rgb(245, 158, 11)",
  "rgb(236, 72, 153)",
  "rgb(14, 165, 233)",
  "rgb(249, 115, 22)",
];

export default function DeviceMultiVariableChart({
  height = 400,
  className = "",
}: DeviceMultiVariableChartProps) {
  const [chartState, setChartState] = useState<ChartState>({
    deviceCharts: [],
    devices: [],
    variables: [],
    selectedDeviceIds: [],
    loading: false,
    error: null,
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

  const loadDevicesAndVariables = useCallback(async () => {
    setChartState((prev) => ({ ...prev, loading: true, error: null }));
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

        const deviceVariableMap = variables.reduce((acc, variable) => {
          if (!acc[variable.device_id]) acc[variable.device_id] = [];
          acc[variable.device_id].push(variable);
          return acc;
        }, {} as Record<number, VariableRecord[]>);

        const devicesWithVariables = devices.filter(
          (device) =>
            deviceVariableMap[device.id] &&
            deviceVariableMap[device.id].length > 0
        );

        const autoSelectedDeviceIds = devicesWithVariables
          .slice(0, 4)
          .map((d) => d.id);

        setChartState((prev) => ({
          ...prev,
          devices: devicesWithVariables,
          variables,
          selectedDeviceIds: autoSelectedDeviceIds,
          loading: false,
        }));
      } else {
        setChartState((prev) => ({
          ...prev,
          loading: false,
          error:
            devicesResponse.error ||
            variablesResponse.error ||
            "Failed to load data",
        }));
      }
    } catch {
      setChartState((prev) => ({
        ...prev,
        loading: false,
        error: "Network error while loading devices and variables",
      }));
    }
  }, []);

  const loadChartData = useCallback(async () => {
    if (chartState.selectedDeviceIds.length === 0) {
      setChartState((prev) => ({ ...prev, deviceCharts: [] }));
      return;
    }

    const params: ChartQueryParams = {
      startTime: customRange.startDate.toISOString(),
      endTime: customRange.endDate.toISOString(),
      period: aggregationPeriod,
    };

    const deviceChartsPromises = chartState.selectedDeviceIds.map(
      async (deviceId) => {
        const device = chartState.devices.find((d) => d.id === deviceId);
        const deviceVariables = chartState.variables.filter(
          (v) => v.device_id === deviceId
        );

        if (!device || deviceVariables.length === 0) {
          return {
            device: device!,
            datasets: [],
            loading: false,
            error: "No variables found for this device",
          };
        }

        try {
          const variableDataPromises = deviceVariables.map(
            async (variable, index) => {
              try {
                const response = await scadaAPI.getDeviceCharts(
                  variable.id,
                  params
                );
                if (response.success && response.data) {
                  return {
                    variable,
                    data: response.data,
                    color: VARIABLE_COLORS[index % VARIABLE_COLORS.length],
                  };
                }
              } catch {
                console.error(`Failed to load variable ${variable.id}`);
              }
              return null;
            }
          );

          const variableResults = await Promise.all(variableDataPromises);
          const validDatasets = variableResults.filter(
            (dataset): dataset is VariableDataset => dataset !== null
          );

          return {
            device,
            datasets: validDatasets,
            loading: false,
            error:
              validDatasets.length === 0
                ? "No data available for device variables"
                : null,
          };
        } catch {
          return {
            device,
            datasets: [],
            loading: false,
            error: "Failed to load device data",
          };
        }
      }
    );

    try {
      const deviceCharts = await Promise.all(deviceChartsPromises);
      setChartState((prev) => ({ ...prev, deviceCharts }));
    } catch {
      setChartState((prev) => ({
        ...prev,
        error: "Failed to load chart data",
      }));
    }
  }, [
    chartState.selectedDeviceIds,
    chartState.devices,
    chartState.variables,
    customRange,
    aggregationPeriod,
  ]);

  useEffect(() => {
    loadDevicesAndVariables();
  }, [loadDevicesAndVariables]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  const normalizeDataset = (data: SampleChartData[]) => {
    if (!normalizeData || data.length === 0) return data;
    const values = data.map((d) => d.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    if (range === 0) return data;
    return data.map((d) => ({ ...d, y: ((d.y - min) / range) * 100 }));
  };

  const createChartOptions = (
    deviceChart: DeviceChartData
  ): ChartOptions<"line"> => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: showLegend, position: "top" as const },
      title: {
        display: true,
        text: `${deviceChart.device.name} (${deviceChart.device.scada_id})`,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          title: (context) =>
            context[0]?.parsed?.x
              ? new Date(context[0].parsed.x).toLocaleString()
              : "",
          label: (context) => {
            const dataset = deviceChart.datasets[context.datasetIndex];
            if (!dataset) return "";
            const value =
              typeof context.parsed.y === "number"
                ? context.parsed.y.toFixed(2)
                : context.parsed.y;
            const unit = normalizeData
              ? "%"
              : dataset.variable.unit
              ? ` ${dataset.variable.unit}`
              : "";
            return `${
              dataset.variable.name || dataset.variable.var_code
            }: ${value}${unit}`;
          },
        },
      },
    },
    scales: {
      x: { type: "time", time: { tooltipFormat: "MMM dd, yyyy HH:mm:ss" } },
      y: {
        beginAtZero: normalizeData,
        title: {
          display: normalizeData,
          text: normalizeData ? "Normalized (%)" : "",
        },
      },
    },
  });

  const createChartData = (deviceChart: DeviceChartData) => ({
    datasets: deviceChart.datasets
      .map((dataset) => {
        const validData = normalizeDataset(dataset.data).filter(
          (p) => p.x && p.y !== undefined && !isNaN(p.y)
        );
        return {
          label: dataset.variable.name || dataset.variable.var_code,
          data: validData.map((p) => ({
            x: new Date(p.x).getTime(),
            y: Number(p.y),
          })),
          borderColor: dataset.color,
          backgroundColor: dataset.color + "20",
          fill: false,
        };
      })
      .filter((ds) => ds.data.length > 0),
  });

  const handleDeviceToggle = (deviceId: number) => {
    setChartState((prev) => {
      const isSelected = prev.selectedDeviceIds.includes(deviceId);
      const newSelectedIds = isSelected
        ? prev.selectedDeviceIds.filter((id) => id !== deviceId)
        : [...prev.selectedDeviceIds, deviceId];
      return { ...prev, selectedDeviceIds: newSelectedIds };
    });
  };

  return (
    <div className={`card-elevated ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Device-Based Variable Analysis
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-600">
                Start / End Date
              </label>
              <div className="flex items-center space-x-2">
                <DatePicker
                  selected={customRange.startDate}
                  onChange={(d) =>
                    setCustomRange((prev) => ({ ...prev, startDate: d! }))
                  }
                  selectsStart
                  startDate={customRange.startDate}
                  endDate={customRange.endDate}
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
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
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium text-gray-600">
                Aggregation Period
              </label>
              <select
                value={aggregationPeriod}
                onChange={(e) => setAggregationPeriod(e.target.value as any)}
                className="px-2 py-1 text-sm border border-gray-300 rounded"
              >
                <option value="hour">Hour</option>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>

            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showLegend}
                onChange={(e) => setShowLegend(e.target.checked)}
              />
              <span>Legend</span>
            </label>

            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={normalizeData}
                onChange={(e) => setNormalizeData(e.target.checked)}
              />
              <span>Normalize</span>
            </label>

            <button
              onClick={loadChartData}
              disabled={chartState.loading}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {chartState.loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
          {chartState.devices.map((device) => {
            const isSelected = chartState.selectedDeviceIds.includes(device.id);
            const variableCount = chartState.variables.filter(
              (v) => v.device_id === device.id
            ).length;
            return (
              <label
                key={device.id}
                className={`flex items-center space-x-2 p-3 rounded cursor-pointer text-sm ${
                  isSelected
                    ? "bg-green-100 text-green-900 border border-green-200"
                    : "bg-white hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleDeviceToggle(device.id)}
                />
                <div className="flex-1">
                  <div className="font-medium">{device.name}</div>
                  <div className="text-gray-500 text-xs">
                    {device.scada_id} • {variableCount} variables
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="p-6">
        {chartState.deviceCharts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {chartState.deviceCharts.map((deviceChart) => (
              <div
                key={deviceChart.device.id}
                className="card w-full h-[400px] p-2"
              >
                {deviceChart.loading ? (
                  <div className="flex justify-center items-center h-full text-gray-500">
                    Loading chart...
                  </div>
                ) : deviceChart.error ? (
                  <div className="text-red-500 text-center">
                    {deviceChart.error}
                  </div>
                ) : (
                  <Line
                    options={createChartOptions(deviceChart)}
                    data={createChartData(deviceChart)}
                    height={height}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          !chartState.loading && (
            <div className="text-gray-500 text-center py-10">
              No devices selected or no data available.
            </div>
          )
        )}
      </div>
    </div>
  );
}
