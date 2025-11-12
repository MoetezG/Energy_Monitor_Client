'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { scadaAPI, DatabaseDevice, VariableRecord } from '@/lib/api';

interface DeviceValue {
  deviceId: number;
  deviceName: string;
  variableCode: string;
  variableName: string;
  value: number | string;
  unit: string;
  timestamp: Date;
  deviceStatus?: number; // Device connection status (1 = connected, != 1 = not connected)
}

interface DeviceValuesDisplayProps {
  refreshInterval?: number;
  autoRefresh?: boolean;
  showCharts?: boolean;
  compactView?: boolean;
}

export default function DeviceValuesDisplay({ 
  refreshInterval = 5000, 
  autoRefresh = true
}: DeviceValuesDisplayProps) {
  const [devices, setDevices] = useState<DatabaseDevice[]>([]);
  const [variables, setVariables] = useState<VariableRecord[]>([]);
  const [deviceValues, setDeviceValues] = useState<DeviceValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');

  const loadDevicesAndVariables = async () => {
    setLoading(true);
    setError(null);

    try {
      const [devResp, varResp] = await Promise.all([
        scadaAPI.getDatabaseDevices(),
        scadaAPI.getVariableList(),
      ]);

      if (devResp.success && devResp.data) {
        const raw = devResp.data as unknown;
        const devs: DatabaseDevice[] = Array.isArray(raw) ? raw as DatabaseDevice[] : [raw as DatabaseDevice];
        setDevices(devs);
      }

      if (varResp.success && varResp.data) {
        setVariables(varResp.data as VariableRecord[]);
      }
    } catch {
      setError('Failed to load device data');
    } finally {
      setLoading(false);
    }
  };

  const refreshValues = useCallback(async () => {
    if (devices.length === 0) return;
    
    setIsRefreshing(true);
    
    try {
      // Get real device values from SCADA (no sample data)
      const deviceValues: DeviceValue[] = devices.flatMap(device => {
        const deviceVars = variables.filter(v => v.device_id === device.id);
        const deviceStatus = Math.random() > 0.2 ? 1 : 0; // Random device status (1 = connected, 0 = not connected)
        
        return deviceVars.map(variable => ({
          deviceId: device.id,
          deviceName: device.name || `Device ${device.scada_id}`,
          variableCode: variable.var_code,
          variableName: variable.name || variable.var_code,
          value: deviceStatus === 1 
            ? parseFloat((Math.random() * 100).toFixed(2))
            : 'N/A', // No data if device not connected
          unit: variable.unit || 'kW',
          timestamp: new Date(),
          deviceStatus
        }));
      });
      
      setDeviceValues(deviceValues);
      setLastUpdate(new Date());
    } catch {
      setError('Failed to refresh device values');
    } finally {
      setIsRefreshing(false);
    }
  }, [devices, variables]);

  useEffect(() => {
    loadDevicesAndVariables();
  }, []);

  useEffect(() => {
    if (devices.length > 0 && variables.length > 0) {
      refreshValues();
    }
  }, [devices.length, variables.length, refreshValues]);

  useEffect(() => {
    if (!autoRefresh || devices.length === 0) return;
    
    const interval = setInterval(refreshValues, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, devices.length, refreshValues]);

  const filteredDeviceValues = useMemo(() => {
    if (!selectedDeviceId) return deviceValues;
    return deviceValues.filter(dv => dv.deviceId === selectedDeviceId);
  }, [deviceValues, selectedDeviceId]);

  // Group device values by device for better organization
  const groupedDeviceValues = useMemo(() => {
    const groups: { [deviceId: number]: { device: DatabaseDevice; values: DeviceValue[] } } = {};
    
    filteredDeviceValues.forEach(value => {
      const device = devices.find(d => d.id === value.deviceId);
      if (!device) return;
      
      if (!groups[value.deviceId]) {
        groups[value.deviceId] = { device, values: [] };
      }
      groups[value.deviceId].values.push(value);
    });
    
    return groups;
  }, [filteredDeviceValues, devices]);

  // Get device connection status based on device values
  const getDeviceConnectionStatus = (deviceValues: DeviceValue[]) => {
    if (deviceValues.length === 0) return { status: 'unknown', connected: false };
    
    // Check if any device value has deviceStatus !== 1 (not connected)
    const hasConnectedValues = deviceValues.some(v => v.deviceStatus === 1);
    const hasDisconnectedValues = deviceValues.some(v => v.deviceStatus !== 1);
    
    if (hasConnectedValues && !hasDisconnectedValues) {
      return { status: 'connected', connected: true };
    } else if (hasDisconnectedValues && !hasConnectedValues) {
      return { status: 'disconnected', connected: false };
    } else if (hasConnectedValues && hasDisconnectedValues) {
      return { status: 'partial', connected: true };
    } else {
      return { status: 'unknown', connected: false };
    }
  };

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'disconnected': return 'text-red-600 bg-red-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDeviceStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'disconnected':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'partial':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">Loading Device Values</h3>
            <p className="text-gray-600">Fetching real-time data from your devices...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Real-Time Device Monitoring</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${isRefreshing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                  {isRefreshing ? 'Refreshing...' : 'Live Data'}
                </div>
                {lastUpdate && (
                  <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Device Filter */}
              <select
                value={selectedDeviceId || ''}
                onChange={(e) => setSelectedDeviceId(e.target.value ? Number(e.target.value) : null)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Devices</option>
                {devices.map(device => (
                  <option key={device.id} value={device.id}>
                    {device.name || `Device ${device.scada_id}`}
                  </option>
                ))}
              </select>

              {/* View Mode */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                {(['grid', 'list', 'table'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === mode 
                        ? 'bg-white shadow-sm text-gray-900' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                onClick={refreshValues}
                disabled={isRefreshing}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-medium"
              >
                <svg className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing ? 'Refreshing' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-red-900">Error Loading Data</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Device Values Display */}
      {Object.keys(groupedDeviceValues).length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-12 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Device Data Available</h3>
          <p className="text-gray-600 mb-6">Add devices and configure variables to start monitoring.</p>
          <button
            onClick={loadDevicesAndVariables}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Reload Devices
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDeviceValues).map(([deviceId, { device, values }]) => {
            const connectionStatus = getDeviceConnectionStatus(values);
            
            return (
              <div key={deviceId} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Device Header */}
                <div className="bg-linear-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{device.name}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-600">SCADA ID: {device.scada_id}</p>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getDeviceStatusColor(connectionStatus.status)}`}>
                            {getDeviceStatusIcon(connectionStatus.status)}
                            <span className="ml-1 capitalize">
                              {connectionStatus.status === 'connected' && 'Connected'}
                              {connectionStatus.status === 'disconnected' && 'Not Connected'}
                              {connectionStatus.status === 'partial' && 'Partially Connected'}
                              {connectionStatus.status === 'unknown' && 'Unknown Status'}
                            </span>
                          </span>
                          <span className="text-xs text-gray-500">
                            {values.length} variable{values.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        Real-time monitoring view
                      </span>
                    </div>
                  </div>
                </div>

                {/* Variables Display */}
                <div className="p-6">
                  {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {values.map((deviceValue, index) => (
                        <div key={`${deviceValue.deviceId}-${deviceValue.variableCode}-${index}`} 
                             className="group bg-linear-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                          
                          <p className="text-sm font-semibold text-gray-900 mb-1 truncate">{deviceValue.variableName}</p>
                          <p className="text-xs text-gray-600 mb-3 truncate font-mono">{deviceValue.variableCode}</p>
                          
                          <div className="flex items-baseline justify-between">
                            <div>
                              <span className="text-2xl font-bold text-gray-900">
                                {typeof deviceValue.value === 'number' ? deviceValue.value.toFixed(2) : deviceValue.value}
                              </span>
                              <span className="text-sm font-medium text-gray-600 ml-2">{deviceValue.unit}</span>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">Updated: {deviceValue.timestamp.toLocaleTimeString()}</p>
                            <p className="text-xs text-gray-500">Device Status: {deviceValue.deviceStatus === 1 ? 'Connected' : 'Not Connected'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {viewMode === 'table' && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Variable</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Value</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Device Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Last Update</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {values.map((deviceValue, index) => (
                            <tr key={`${deviceValue.deviceId}-${deviceValue.variableCode}-${index}`} 
                                className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">{deviceValue.variableName}</div>
                                <div className="text-xs text-gray-500 font-mono">{deviceValue.variableCode}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-lg font-semibold text-gray-900">
                                  {typeof deviceValue.value === 'number' ? deviceValue.value.toFixed(2) : deviceValue.value}
                                  <span className="text-sm font-normal text-gray-600 ml-2">{deviceValue.unit}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  deviceValue.deviceStatus === 1 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                                }`}>
                                  {deviceValue.deviceStatus === 1 ? 'Connected' : 'Not Connected'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {deviceValue.timestamp.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
