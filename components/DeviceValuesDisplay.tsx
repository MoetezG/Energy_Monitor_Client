"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { scadaAPI, DatabaseDevice, VariableRecord } from "@/lib/api";
import useRealTimeWebSocket from "@/hooks/useRealTimeWebSocket";
import VariableChartModal from "./VariableChartModal";

interface DeviceValue {
  deviceId: number;
  deviceName: string;
  variableCode: string;
  variableName: string;
  value: number | string | boolean;
  unit: string;
  timestamp: Date;
  status: "online" | "offline" | "warning" | "error";
}

interface DeviceValuesDisplayProps {
  refreshInterval?: number;
  autoRefresh?: boolean;
  showCharts?: boolean;
  compactView?: boolean;
  useWebSocket?: boolean;
}

export default function DeviceValuesDisplay({
  refreshInterval = 5000,
  autoRefresh = true,
  showCharts = false,
  compactView = false,
  useWebSocket = false,
}: DeviceValuesDisplayProps) {
  const [devices, setDevices] = useState<DatabaseDevice[]>([]);
  const [variables, setVariables] = useState<VariableRecord[]>([]);
  const [deviceValues, setDeviceValues] = useState<DeviceValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("grid");
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [selectedVariableForChart, setSelectedVariableForChart] =
    useState<DeviceValue | null>(null);

  // WebSocket hook for real-time data
  const {
    realTimeData: wsRealTimeData,
    deviceStatuses: wsDeviceStatuses,
    isConnected: wsIsConnected,
    error: wsError,
    loading: wsLoading,
    lastUpdate: wsLastUpdate,
  } = useRealTimeWebSocket();

  // Helper function to get device status
  const getDeviceStatus = useCallback(
    (deviceId: number) => {
      if (useWebSocket && wsDeviceStatuses.length > 0) {
        return wsDeviceStatuses.find((ds) => ds.device_id === deviceId);
      }
      return null;
    },
    [useWebSocket, wsDeviceStatuses]
  );

  // Show error if WebSocket is enabled but there's an error
  const displayError = error || (useWebSocket ? wsError : null);
  const displayLoading = loading || (useWebSocket ? wsLoading : false);

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
        const devs: DatabaseDevice[] = Array.isArray(raw)
          ? (raw as DatabaseDevice[])
          : [raw as DatabaseDevice];
        setDevices(devs);
      }

      if (varResp.success && varResp.data) {
        setVariables(varResp.data as VariableRecord[]);
      }
    } catch {
      setError("Failed to load device information");
    } finally {
      setLoading(false);
    }
  };

  const refreshValues = useCallback(async () => {
    if (devices.length === 0) return;

    setIsRefreshing(true);

    try {
      if (useWebSocket) {
        // Use WebSocket data if available
        if (wsRealTimeData.length > 0) {
          const wsValues: DeviceValue[] = wsRealTimeData.map((wsVar) => ({
            deviceId: wsVar.device_id,
            deviceName: wsVar.device_name,
            variableCode: wsVar.var_code,
            variableName: wsVar.variable_name,
            value: wsVar.value,
            unit: wsVar.unit,
            timestamp: wsVar.timestamp,
            status: wsVar.status,
          }));
          setDeviceValues(wsValues);
          setLastUpdate(wsLastUpdate);
        }
      }
    } catch {
      setError("Failed to refresh device values");
    } finally {
      setIsRefreshing(false);
    }
  }, [devices, useWebSocket, wsRealTimeData, wsLastUpdate]);

  useEffect(() => {
    loadDevicesAndVariables();
  }, []);

  useEffect(() => {
    if (devices.length > 0 && variables.length > 0) {
      refreshValues();
    }
  }, [devices, variables, refreshValues]);

  // Update device values when WebSocket data changes
  useEffect(() => {
    if (useWebSocket && wsRealTimeData.length > 0) {
      refreshValues();
    }
  }, [useWebSocket, wsRealTimeData, wsLastUpdate, refreshValues]);

  useEffect(() => {
    if (!autoRefresh || devices.length === 0 || useWebSocket) return;

    const interval = setInterval(refreshValues, refreshInterval);
    return () => clearInterval(interval);
  }, [
    autoRefresh,
    refreshInterval,
    devices.length,
    useWebSocket,
    refreshValues,
  ]);

  const filteredDeviceValues = useMemo(() => {
    if (!selectedDeviceId) return deviceValues;
    return deviceValues.filter((dv) => dv.deviceId === selectedDeviceId);
  }, [deviceValues, selectedDeviceId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const handleVariableClick = (deviceValue: DeviceValue) => {
    setSelectedVariableForChart(deviceValue);
    setIsChartModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsChartModalOpen(false);
    setSelectedVariableForChart(null);
  };

  // Helper to get variable record and device for the modal
  const getVariableRecord = (deviceValue: DeviceValue) => {
    return variables.find(
      (v) =>
        v.var_code === deviceValue.variableCode &&
        v.device_id === deviceValue.deviceId
    );
  };

  const getDevice = (deviceValue: DeviceValue) => {
    return devices.find((d) => d.id === deviceValue.deviceId);
  };

  if (displayLoading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Loading Energy Data
            </h3>
            <p className="text-gray-600">
              {useWebSocket
                ? "Connecting and getting your live energy data..."
                : "Getting your latest energy data..."}
            </p>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Live Energy Monitoring
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${
                      isRefreshing
                        ? "bg-blue-500 animate-pulse"
                        : "bg-green-500"
                    }`}
                  ></div>
                  {isRefreshing ? "Refreshing..." : "Live Data"}
                </div>
                {useWebSocket && (
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-2 ${
                        wsIsConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    Connection {wsIsConnected ? "Active" : "Lost"}
                  </div>
                )}
                {lastUpdate && (
                  <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                )}
              </div>

              {/* Real-time Device Status Overview */}
              {useWebSocket && wsDeviceStatuses.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Device Status Overview
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {wsDeviceStatuses.map((deviceStatus) => (
                      <div
                        key={deviceStatus.device_id}
                        className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                          deviceStatus.status === "online"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : deviceStatus.status === "warning"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                        title={`${deviceStatus.online_variables}/${
                          deviceStatus.total_variables
                        } variables online${
                          deviceStatus.offline_variables.length > 0
                            ? ". Offline: " +
                              deviceStatus.offline_variables.join(", ")
                            : ""
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            deviceStatus.status === "online"
                              ? "bg-green-500"
                              : deviceStatus.status === "warning"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        />
                        <span className="mr-2">{deviceStatus.device_name}</span>
                        <span className="text-xs opacity-75">
                          ({deviceStatus.online_variables}/
                          {deviceStatus.total_variables})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Device Filter */}
              <select
                value={selectedDeviceId || ""}
                onChange={(e) =>
                  setSelectedDeviceId(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Devices</option>
                {devices.map((device) => {
                  const deviceStatus = getDeviceStatus(device.id);
                  const statusIcon =
                    deviceStatus?.status === "online"
                      ? "🟢"
                      : deviceStatus?.status === "warning"
                      ? "🟡"
                      : deviceStatus?.status === "offline"
                      ? "🔴"
                      : "";
                  return (
                    <option key={device.id} value={device.id}>
                      {statusIcon} {device.name || `Device ${device.scada_id}`}
                      {deviceStatus &&
                        ` (${deviceStatus.online_variables}/${deviceStatus.total_variables})`}
                    </option>
                  );
                })}
              </select>

              {/* View Mode */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                {(["grid", "list", "table"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === mode
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
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
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-medium"
              >
                <svg
                  className={`w-4 h-4 mr-2 ${
                    isRefreshing ? "animate-spin" : ""
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
                {isRefreshing ? "Refreshing" : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {displayError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center">
            <svg
              className="w-6 h-6 text-red-500 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-red-900">
                Error Loading Data
              </h3>
              <p className="text-red-700">{displayError}</p>
              {useWebSocket && wsError && (
                <p className="text-red-600 text-sm mt-1">
                  WebSocket Error: {wsError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Device Values Display */}
      {filteredDeviceValues.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-12 border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
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
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Device Data Available
          </h3>
          <p className="text-gray-600 mb-6">
            Add devices and configure variables to start monitoring.
          </p>
          <button
            onClick={loadDevicesAndVariables}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium"
          >
            Reload Devices
          </button>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {viewMode === "grid" && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDeviceValues.map((deviceValue, index) => (
                  <div
                    key={`${deviceValue.deviceId}-${deviceValue.variableCode}-${index}`}
                    onClick={() => handleVariableClick(deviceValue)}
                    title="Click to view variable chart"
                    className={`group bg-linear-to-br from-gray-50 to-white border rounded-xl p-4 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer relative ${(() => {
                      const deviceStatus = getDeviceStatus(
                        deviceValue.deviceId
                      );
                      if (deviceStatus?.status === "offline")
                        return "border-red-300 bg-red-50";
                      if (deviceStatus?.status === "warning")
                        return "border-yellow-300 bg-yellow-50";
                      return "border-gray-200";
                    })()}`}
                  >
                    {/* Chart icon indicator */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-blue-100 p-1 rounded-lg">
                        <svg
                          className="w-4 h-4 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {/* Variable Status */}
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            deviceValue.status
                          )}`}
                        >
                          {getStatusIcon(deviceValue.status)}
                          <span className="ml-1 capitalize">
                            {deviceValue.status}
                          </span>
                        </span>

                        {/* Device Status Indicator */}
                        {(() => {
                          const deviceStatus = getDeviceStatus(
                            deviceValue.deviceId
                          );
                          if (deviceStatus) {
                            return (
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  deviceStatus.status === "online"
                                    ? "bg-green-100 text-green-700 border border-green-200"
                                    : deviceStatus.status === "warning"
                                    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                    : "bg-red-100 text-red-700 border border-red-200"
                                }`}
                                title={`Device ${deviceStatus.status}: ${deviceStatus.online_variables}/${deviceStatus.total_variables} variables online`}
                              >
                                <span className="text-xs">
                                  Device {deviceStatus.status.toUpperCase()}
                                </span>
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    <h4 className="text-sm font-semibold flex items-center gap-1 justify-baseline text-gray-900 mb-1 truncate">
                      {/* seperate with point  */}
                      {deviceValue.variableName}{" "}
                      <div className="bg-black rounded-full h-2 w-2"> </div>{" "}
                      {deviceValue.deviceName}
                    </h4>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">
                          {typeof deviceValue.value === "number"
                            ? deviceValue.value.toFixed(2)
                            : deviceValue.value}
                        </span>
                        <span className="text-sm font-medium text-gray-600 ml-2">
                          {deviceValue.unit}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Updated: {deviceValue.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === "table" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Device
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Variable
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Value
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Variable Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Device Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Last Update
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDeviceValues.map((deviceValue, index) => {
                    const deviceStatus = getDeviceStatus(deviceValue.deviceId);
                    return (
                      <tr
                        key={`${deviceValue.deviceId}-${deviceValue.variableCode}-${index}`}
                        onClick={() => handleVariableClick(deviceValue)}
                        title="Click to view variable chart"
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                          deviceStatus?.status === "offline"
                            ? "bg-red-25"
                            : deviceStatus?.status === "warning"
                            ? "bg-yellow-25"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {deviceValue.deviceName}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {deviceValue.deviceId}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {deviceValue.variableName}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {deviceValue.variableCode}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-lg font-semibold text-gray-900">
                            {typeof deviceValue.value === "number"
                              ? deviceValue.value.toFixed(2)
                              : deviceValue.value}
                            <span className="text-sm font-normal text-gray-600 ml-2">
                              {deviceValue.unit}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              deviceValue.status
                            )}`}
                          >
                            {getStatusIcon(deviceValue.status)}
                            <span className="ml-1 capitalize">
                              {deviceValue.status}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {deviceStatus ? (
                            <div className="space-y-1">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  deviceStatus.status === "online"
                                    ? "bg-green-100 text-green-800"
                                    : deviceStatus.status === "warning"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full mr-2 ${
                                    deviceStatus.status === "online"
                                      ? "bg-green-500"
                                      : deviceStatus.status === "warning"
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                />
                                {deviceStatus.status.toUpperCase()}
                              </span>
                              <div className="text-xs text-gray-500">
                                {deviceStatus.online_variables}/
                                {deviceStatus.total_variables} online
                              </div>
                              {deviceStatus.offline_variables.length > 0 && (
                                <div
                                  className="text-xs text-red-600"
                                  title={`Offline variables: ${deviceStatus.offline_variables.join(
                                    ", "
                                  )}`}
                                >
                                  {deviceStatus.offline_variables.length}{" "}
                                  offline
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              No status
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {deviceValue.timestamp.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className="flex items-center"
                            title="Click to view chart"
                          >
                            <svg
                              className="w-5 h-5 text-blue-600 hover:text-blue-800"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                              />
                            </svg>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Variable Chart Modal */}
      <VariableChartModal
        isOpen={isChartModalOpen}
        onClose={handleCloseModal}
        variable={selectedVariableForChart}
        variableRecord={
          selectedVariableForChart
            ? getVariableRecord(selectedVariableForChart)
            : undefined
        }
        device={
          selectedVariableForChart
            ? getDevice(selectedVariableForChart)
            : undefined
        }
      />
    </div>
  );
}
