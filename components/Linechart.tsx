'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { scadaAPI, ChartDataPoint } from '@/lib/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface LinechartProps {
  variableId: number;
  variableName?: string;
  unit?: string;
  startTime?: string;
  endTime?: string;
  period?: string;
  height?: number;
  showControls?: boolean;
}

export default function Linechart({
  variableId,
  variableName = 'Variable',
  unit = '',
  startTime,
  endTime,
  period = '1h',
  height = 400,
  showControls = true
}: LinechartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState(period);
  const [dateRange, setDateRange] = useState({
    startTime: startTime || '',
    endTime: endTime || ''
  });

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await scadaAPI.getSampleCharts(
        variableId,
        dateRange.startTime || undefined,
        dateRange.endTime || undefined,
        currentPeriod
      );
      
      if (response.success && response.data) {
        setChartData(response.data);
      } else {
        setError(response.error || 'Failed to fetch chart data');
      }
    } catch {
      setError('Network error while fetching chart data');
    } finally {
      setLoading(false);
    }
  }, [variableId, currentPeriod, dateRange.startTime, dateRange.endTime]);

  const createChart = useCallback(() => {
    if (!canvasRef.current || chartData.length === 0) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartRef.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: chartData.map(point => new Date(point.date).getTime()),
        datasets: [{
          label: `${variableName} ${unit ? `(${unit})` : ''}`,
          data: chartData.map(point => point.data),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${variableName} - Time Series Data`,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                const value = context.parsed.y;
                return `${context.dataset.label}: ${value ? value.toFixed(2) : 'N/A'}`;
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        scales: {
          x: {
            type: 'time',
            display: true,
            title: {
              display: true,
              text: 'Time'
            },
            time: {
              displayFormats: {
                minute: 'HH:mm',
                hour: 'HH:mm',
                day: 'MMM dd',
                week: 'MMM dd',
                month: 'MMM yyyy'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: unit || 'Value'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        }
      }
    });
  }, [chartData, variableName, unit]);

  const handlePeriodChange = (newPeriod: string) => {
    setCurrentPeriod(newPeriod);
  };

  const handleDateRangeChange = (field: 'startTime' | 'endTime', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch data on component mount and when parameters change
  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Create/update chart when data changes
  useEffect(() => {
    createChart();
    
    // Cleanup function
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [createChart]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Controls */}
      {showControls && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Period Selection */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Period:</label>
              <select
                value={currentPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="6h">6 Hours</option>
                <option value="1d">1 Day</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="datetime-local"
                value={dateRange.startTime}
                onChange={(e) => handleDateRangeChange('startTime', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="datetime-local"
                value={dateRange.endTime}
                onChange={(e) => handleDateRangeChange('endTime', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchChartData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{loading ? 'Loading...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading chart data...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {chartData.length === 0 && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg">No data available</p>
            <p className="text-sm">Try adjusting the date range or period</p>
          </div>
        )}

        <div style={{ height: `${height}px` }}>
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Chart Info */}
      {chartData.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="text-center">
            <span className="font-medium">Data Points:</span> {chartData.length}
          </div>
          <div className="text-center">
            <span className="font-medium">Min Value:</span> {Math.min(...chartData.map(p => p.data)).toFixed(2)}
          </div>
          <div className="text-center">
            <span className="font-medium">Max Value:</span> {Math.max(...chartData.map(p => p.data)).toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
