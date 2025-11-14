'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { scadaAPI, SampleChartData, ChartQueryParams, VariableRecord, DatabaseDevice } from '@/lib/api';

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

// Predefined colors for different variables within each device
const VARIABLE_COLORS = [
  'rgb(59, 130, 246)',   // blue
  'rgb(34, 197, 94)',    // green
  'rgb(239, 68, 68)',    // red
  'rgb(168, 85, 247)',   // purple
  'rgb(245, 158, 11)',   // amber
  'rgb(236, 72, 153)',   // pink
  'rgb(14, 165, 233)',   // sky
  'rgb(249, 115, 22)',   // orange
];

export default function DeviceMultiVariableChart({ 
  height = 400, 
  className = ''
}: DeviceMultiVariableChartProps) {
  const [chartState, setChartState] = useState<ChartState>({
    deviceCharts: [],
    devices: [],
    variables: [],
    selectedDeviceIds: [],
    loading: false,
    error: null
  });

  const [timeRange, setTimeRange] = useState<{
    period: 'day' | 'week' | 'month';
    days: number;
  }>({
    period: 'day',
    days: 7
  });

  const [showLegend, setShowLegend] = useState(true);
  const [normalizeData, setNormalizeData] = useState(false);

  // Load devices and variables
  const loadDevicesAndVariables = useCallback(async () => {
    setChartState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [devicesResponse, variablesResponse] = await Promise.all([
        scadaAPI.getDatabaseDevices(),
        scadaAPI.getVariableList(),
      ]);

      if (devicesResponse.success && variablesResponse.success) {
        const devices = Array.isArray(devicesResponse.data) ? devicesResponse.data : [];
        const variables = Array.isArray(variablesResponse.data) 
          ? variablesResponse.data.filter(v => v.enabled !== false)
          : [];
        
        // Group variables by device to find devices with variables
        const deviceVariableMap = variables.reduce((acc, variable) => {
          if (!acc[variable.device_id]) {
            acc[variable.device_id] = [];
          }
          acc[variable.device_id].push(variable);
          return acc;
        }, {} as Record<number, VariableRecord[]>);

        // Only include devices that have variables
        const devicesWithVariables = devices.filter(device => 
          deviceVariableMap[device.id] && deviceVariableMap[device.id].length > 0
        );

        // Auto-select first few devices
        const autoSelectedDeviceIds = devicesWithVariables.slice(0, 4).map(d => d.id);

        setChartState(prev => ({
          ...prev,
          devices: devicesWithVariables,
          variables,
          selectedDeviceIds: autoSelectedDeviceIds,
          loading: false
        }));
      } else {
        setChartState(prev => ({
          ...prev,
          loading: false,
          error: devicesResponse.error || variablesResponse.error || 'Failed to load data'
        }));
      }
    } catch {
      setChartState(prev => ({
        ...prev,
        loading: false,
        error: 'Network error while loading devices and variables'
      }));
    }
  }, []);

  // Load chart data for selected devices
  const loadChartData = useCallback(async () => {
    if (chartState.selectedDeviceIds.length === 0) {
      setChartState(prev => ({ ...prev, deviceCharts: [] }));
      return;
    }

    const endTime = new Date();
    const startTime = new Date();
    startTime.setDate(endTime.getDate() - timeRange.days);

    const params: ChartQueryParams = {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      period: timeRange.period
    };

    // Process each selected device
    const deviceChartsPromises = chartState.selectedDeviceIds.map(async (deviceId) => {
      const device = chartState.devices.find(d => d.id === deviceId);
      const deviceVariables = chartState.variables.filter(v => v.device_id === deviceId);

      if (!device || deviceVariables.length === 0) {
        return {
          device: device!,
          datasets: [],
          loading: false,
          error: 'No variables found for this device'
        };
      }

      // Set initial loading state for the device
      try {
        // Load data for all variables of this device in parallel
        const variableDataPromises = deviceVariables.map(async (variable, index) => {
          try {
            const response = await scadaAPI.getDeviceCharts(variable.id, params);
            
            if (response.success && response.data) {
              return {
                variable,
                data: response.data,
                color: VARIABLE_COLORS[index % VARIABLE_COLORS.length]
              };
            }
          } catch {
            console.error(`Failed to load data for variable ${variable.id}`);
          }
          return null;
        });

        const variableResults = await Promise.all(variableDataPromises);
        const validDatasets = variableResults.filter((dataset): dataset is VariableDataset => dataset !== null);

        return {
          device,
          datasets: validDatasets,
          loading: false,
          error: validDatasets.length === 0 ? 'No data available for device variables' : null
        };

      } catch {
        return {
          device,
          datasets: [],
          loading: false,
          error: 'Failed to load device data'
        };
      }
    });

    try {
      const deviceCharts = await Promise.all(deviceChartsPromises);
      
      setChartState(prev => ({
        ...prev,
        deviceCharts
      }));
    } catch {
      setChartState(prev => ({
        ...prev,
        error: 'Failed to load chart data'
      }));
    }
  }, [chartState.selectedDeviceIds, chartState.devices, chartState.variables, timeRange]);

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

  // Load chart data when devices or time range changes
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!mounted || chartState.selectedDeviceIds.length === 0) return;
      await loadChartData();
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [loadChartData, chartState.selectedDeviceIds.length]);

  // Normalize data if enabled
  const normalizeDataset = (data: SampleChartData[]) => {
    if (!normalizeData || data.length === 0) return data;
    
    const values = data.map(d => d.y);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    if (range === 0) return data;
    
    return data.map(d => ({
      ...d,
      y: ((d.y - min) / range) * 100 // Normalize to 0-100 scale
    }));
  };

  // Create chart options for each device
  const createChartOptions = (deviceChart: DeviceChartData): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 10,
          font: {
            size: 12
          }
        },
      },
      title: {
        display: true,
        text: `${deviceChart.device.name} (${deviceChart.device.scada_id})`,
        font: {
          size: 16,
          weight: 'bold',
        },
        padding: 15,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#374151',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          title: function(context) {
            const xValue = context[0]?.parsed?.x;
            return xValue ? new Date(xValue).toLocaleString() : '';
          },
          label: function(context) {
            const dataset = deviceChart.datasets[context.datasetIndex];
            if (!dataset) return '';
            
            const value = typeof context.parsed.y === 'number' 
              ? context.parsed.y.toFixed(2) 
              : context.parsed.y;
            
            let unit = '';
            if (normalizeData) {
              unit = '%';
            } else if (dataset.variable.unit) {
              unit = ` ${dataset.variable.unit}`;
            }
            
            const variableName = dataset.variable.name || dataset.variable.var_code;
            return `${variableName}: ${value}${unit}`;
          }
        }
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            millisecond: 'HH:mm:ss.SSS',
            second: 'HH:mm:ss',
            minute: 'HH:mm',
            hour: 'MMM dd, HH:mm',
            day: 'MMM dd',
            week: 'MMM dd',
            month: 'MMM yyyy',
            quarter: 'MMM yyyy',
            year: 'yyyy'
          },
          tooltipFormat: 'MMM dd, yyyy HH:mm:ss',
        },
        adapters: {
          date: {}
        },
        grid: {
          display: true,
          color: '#f3f4f6',
        },
        ticks: {
          color: '#6b7280',
          maxTicksLimit: 8,
          font: {
            size: 11
          },
          autoSkip: true,
          maxRotation: 45,
        },
      },
      y: {
        beginAtZero: normalizeData,
        grid: {
          display: true,
          color: '#f3f4f6',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11
          },
          callback: function(value) {
            const numValue = typeof value === 'number' ? value : parseFloat(value as string);
            const unit = normalizeData ? '%' : '';
            return `${numValue.toFixed(1)}${unit}`;
          }
        },
        title: {
          display: normalizeData,
          text: normalizeData ? 'Normalized (%)' : '',
          color: '#6b7280',
          font: {
            size: 12
          }
        }
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    elements: {
      line: {
        tension: 0.2,
        borderWidth: 2,
      },
      point: {
        radius: 2,
        hoverRadius: 5,
        borderWidth: 1,
      },
    },
  });

  // Create chart data for each device
  const createChartData = (deviceChart: DeviceChartData) => {
    // Ensure datasets exist and are valid
    if (!deviceChart.datasets || deviceChart.datasets.length === 0) {
      return { datasets: [] };
    }

    return {
      datasets: deviceChart.datasets
        .filter(dataset => dataset && dataset.data && Array.isArray(dataset.data))
        .map((dataset) => {
          const processedData = normalizeDataset(dataset.data);
          
          // Validate data points have required x and y properties
          const validData = processedData.filter(point => 
            point && 
            point.x !== undefined && 
            point.x !== null && 
            point.y !== undefined && 
            point.y !== null &&
            !isNaN(point.y)
          );

          return {
            label: dataset.variable.name || dataset.variable.var_code,
            data: validData.map(point => ({
              x: new Date(point.x).getTime(), // Convert to timestamp for Chart.js
              y: Number(point.y) // Ensure numeric value
            })),
            borderColor: dataset.color,
            backgroundColor: dataset.color + '20',
            borderWidth: 2,
            fill: false,
            pointBackgroundColor: dataset.color,
            pointBorderColor: 'rgb(255, 255, 255)',
            pointBorderWidth: 1,
            pointHoverBackgroundColor: dataset.color,
            pointHoverBorderColor: 'rgb(255, 255, 255)',
            tension: 0.2,
          };
        })
        .filter(dataset => dataset.data.length > 0), // Remove datasets with no valid data
    };
  };

  // Time range options
  const timeRangeOptions = [
    { label: 'Last 24 Hours', period: 'day' as const, days: 1 },
    { label: 'Last 3 Days', period: 'day' as const, days: 3 },
    { label: 'Last Week', period: 'day' as const, days: 7 },
    { label: 'Last Month', period: 'week' as const, days: 30 },
    { label: 'Last 3 Months', period: 'month' as const, days: 90 },
  ];

  // Handle device selection
  const handleDeviceToggle = (deviceId: number) => {
    setChartState(prev => {
      const isSelected = prev.selectedDeviceIds.includes(deviceId);
      let newSelectedIds;
      
      if (isSelected) {
        newSelectedIds = prev.selectedDeviceIds.filter(id => id !== deviceId);
      } else {
        newSelectedIds = [...prev.selectedDeviceIds, deviceId];
      }
      
      return {
        ...prev,
        selectedDeviceIds: newSelectedIds
      };
    });
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-linear-to-r from-green-50 to-emerald-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">
              Device-Based Variable Analysis
            </h3>
            <span className="text-sm text-gray-500">
              ({chartState.deviceCharts.length} devices)
            </span>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Time Range */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-600">Time:</label>
              <select
                value={`${timeRange.period}-${timeRange.days}`}
                onChange={(e) => {
                  const [period, days] = e.target.value.split('-');
                  setTimeRange({
                    period: period as 'day' | 'week' | 'month',
                    days: parseInt(days)
                  });
                }}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {timeRangeOptions.map((option) => (
                  <option
                    key={`${option.period}-${option.days}`}
                    value={`${option.period}-${option.days}`}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle Controls */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showLegend}
                  onChange={(e) => setShowLegend(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-gray-600">Legend</span>
              </label>
              
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={normalizeData}
                  onChange={(e) => setNormalizeData(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-gray-600">Normalize</span>
              </label>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadChartData}
              disabled={chartState.loading}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1"
            >
              <svg 
                className={`w-4 h-4 ${chartState.loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{chartState.loading ? 'Loading...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Device Selection */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">
              Select Devices to Analyze
            </h4>
            <span className="text-sm text-gray-500">
              {chartState.selectedDeviceIds.length} of {chartState.devices.length} selected
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
            {chartState.devices.map((device) => {
              const isSelected = chartState.selectedDeviceIds.includes(device.id);
              const variableCount = chartState.variables.filter(v => v.device_id === device.id).length;
              
              return (
                <label 
                  key={device.id}
                  className={`flex items-center space-x-2 p-3 rounded cursor-pointer text-sm ${
                    isSelected 
                      ? 'bg-green-100 text-green-900 border border-green-200' 
                      : 'bg-white hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleDeviceToggle(device.id)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
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
      </div>

      {/* Charts Content */}
      <div className="p-6">
        {chartState.loading && chartState.deviceCharts.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Loading device data...</span>
            </div>
          </div>
        )}

        {chartState.error && chartState.deviceCharts.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-9-7a9 9 0 1118 0 9 9 0 01-18 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-gray-600 mb-4">{chartState.error}</p>
              <button
                onClick={loadDevicesAndVariables}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {chartState.deviceCharts.length === 0 && !chartState.loading && !chartState.error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select Devices</h3>
              <p className="text-gray-600">Choose devices from the list above to view their variable trends.</p>
            </div>
          </div>
        )}

        {/* Device Charts Grid */}
        {chartState.deviceCharts.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {chartState.deviceCharts.map((deviceChart) => (
              <div 
                key={deviceChart.device.id}
                className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* Individual Device Chart */}
                {deviceChart.loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600">Loading {deviceChart.device.name}...</span>
                    </div>
                  </div>
                )}

                {deviceChart.error && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <svg className="w-8 h-8 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-9-7a9 9 0 1118 0 9 9 0 01-18 0z" />
                      </svg>
                      <p className="text-sm text-red-600">{deviceChart.error}</p>
                    </div>
                  </div>
                )}

                {!deviceChart.loading && !deviceChart.error && (
                  <>
                    {deviceChart.datasets.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p className="text-sm text-gray-600">No data for {deviceChart.device.name}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4">
                        <div style={{ height }}>
                          {(() => {
                            try {
                              const chartData = createChartData(deviceChart);
                              const chartOptions = createChartOptions(deviceChart);
                              
                              // Ensure we have valid data before rendering
                              if (!chartData.datasets || chartData.datasets.length === 0) {
                                return (
                                  <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                      </svg>
                                      <p className="text-sm text-gray-600">No valid chart data</p>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <Line 
                                  data={chartData} 
                                  options={chartOptions}
                                />
                              );
                            } catch (error) {
                              console.error('Chart rendering error:', error);
                              return (
                                <div className="flex items-center justify-center h-full">
                                  <div className="text-center">
                                    <svg className="w-8 h-8 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-9-7a9 9 0 1118 0 9 9 0 01-18 0z" />
                                    </svg>
                                    <p className="text-sm text-red-600">Chart rendering error</p>
                                  </div>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Device Chart Footer */}
                {!deviceChart.loading && !deviceChart.error && deviceChart.datasets.length > 0 && (
                  <div className="px-4 py-2 bg-white border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Variables: {deviceChart.datasets.length}</span>
                      <span>Data Points: {deviceChart.datasets.reduce((sum, d) => sum + d.data.length, 0)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overall Footer */}
      {chartState.deviceCharts.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Total Devices: {chartState.deviceCharts.length}</span>
              <span>Total Variables: {chartState.deviceCharts.reduce((sum, dc) => sum + dc.datasets.length, 0)}</span>
              {normalizeData && (
                <span className="text-green-600 font-medium">Normalized View</span>
              )}
            </div>
            <div>
              Last Updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}