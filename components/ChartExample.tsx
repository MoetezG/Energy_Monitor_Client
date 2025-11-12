'use client';

import React, { useMemo } from 'react';
import Linechart from './Linechart';

export default function ChartExample() {
  // Pre-calculate date ranges to avoid impure function calls during render
  const dateRanges = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return {
      startTime: yesterday.toISOString().slice(0, -8),
      endTime: now.toISOString().slice(0, -8)
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Chart.js Sample Implementation</h1>
        <p className="text-gray-600">
          This component demonstrates the Chart.js integration with sample API data.
        </p>
      </div>

      {/* Example Chart 1 - Energy Consumption */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Energy Consumption Chart</h2>
        <Linechart
          variableId={1}
          variableName="Energy Consumption"
          unit="kWh"
          period="1h"
          height={400}
          showControls={true}
        />
      </div>

      {/* Example Chart 2 - Temperature */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Temperature Monitoring</h2>
        <Linechart
          variableId={2}
          variableName="Temperature"
          unit="°C"
          period="15m"
          height={350}
          showControls={true}
        />
      </div>

      {/* Example Chart 3 - Voltage with preset date range */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Voltage Monitoring (Last 24h)</h2>
        <Linechart
          variableId={3}
          variableName="Voltage"
          unit="V"
          period="1h"
          height={300}
          showControls={false}
          startTime={dateRanges.startTime}
          endTime={dateRanges.endTime}
        />
      </div>

      {/* API Information */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>API Endpoint:</strong> <code className="bg-white px-2 py-1 rounded">/charts/[variable_id]?startTime&endTime&period</code>
            </p>
            <p className="text-sm text-blue-700 mt-2">
              <strong>Expected Response:</strong> Array of objects with <code className="bg-white px-1 rounded">date</code> and <code className="bg-white px-1 rounded">data</code> properties
            </p>
            <div className="mt-2 text-xs text-blue-600">
              <pre className="bg-white p-2 rounded overflow-x-auto">
{`[
  { "date": "2025-11-11T10:00:00Z", "data": 125.5 },
  { "date": "2025-11-11T11:00:00Z", "data": 130.2 },
  { "date": "2025-11-11T12:00:00Z", "data": 128.8 }
]`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="bg-green-50 border-l-4 border-green-400 p-4">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-green-800">Chart Features</h3>
          <ul className="mt-2 text-sm text-green-700 space-y-1">
            <li>• Interactive time-based line charts</li>
            <li>• Configurable time periods (5m, 15m, 1h, 6h, 1d)</li>
            <li>• Custom date range selection</li>
            <li>• Real-time data fetching and updates</li>
            <li>• Responsive design with hover tooltips</li>
            <li>• Loading states and error handling</li>
            <li>• Chart statistics (min, max, data points)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}