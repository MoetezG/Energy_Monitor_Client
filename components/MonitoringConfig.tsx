"use client";

import React, { useEffect, useState } from "react";
import { scadaAPI, DatabaseDevice, VariableRecord } from "@/lib/api";
import useRealTimeWebSocket from "@/hooks/useRealTimeWebSocket";
import VariableEditModal from "./VariableEditModal";
import VariableDeleteModal from "./VariableDeleteModal";
import DeviceDeleteModal from "./DeviceDeleteModal";
import VariableChartModal from "./VariableChartModal";
import { useToast } from "./ToastProvider";

export default function MonitoringConfig() {
  const { showToast } = useToast();
  const [devices, setDevices] = useState<DatabaseDevice[]>([]);
  const [variables, setVariables] = useState<VariableRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WebSocket hook for real-time device status
  const {
    deviceStatuses,
    realTimeData,
    isConnected: wsIsConnected,
    lastUpdate,
  } = useRealTimeWebSocket();

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deviceDeleteModalOpen, setDeviceDeleteModalOpen] = useState(false);
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [selectedVariable, setSelectedVariable] =
    useState<VariableRecord | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DatabaseDevice | null>(
    null
  );
  const [selectedVariableForChart, setSelectedVariableForChart] = useState<{
    variable: VariableRecord;
    device: DatabaseDevice;
  } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const loadData = async () => {
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
      } else {
        setDevices([]);
      }

      if (varResp.success && varResp.data) {
        setVariables(varResp.data as VariableRecord[]);
      } else {
        setVariables([]);
      }
    } catch {
      setError("Failed to load monitoring information");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit variable
  const handleEditVariable = (variable: VariableRecord) => {
    setSelectedVariable(variable);
    setEditModalOpen(true);
  };

  // Handle delete variable
  const handleDeleteVariable = (variable: VariableRecord) => {
    setSelectedVariable(variable);
    setDeleteModalOpen(true);
  };

  // Handle delete device
  const handleDeleteDevice = (device: DatabaseDevice) => {
    setSelectedDevice(device);
    setDeviceDeleteModalOpen(true);
  };

  // Handle view chart
  const handleViewChart = (
    variable: VariableRecord,
    device: DatabaseDevice
  ) => {
    setSelectedVariableForChart({ variable, device });
    setChartModalOpen(true);
  };

  // Handle save variable
  const handleSaveVariable = async (
    variable: VariableRecord,
    updates: Partial<VariableRecord>
  ) => {
    setModalLoading(true);
    try {
      const response = await scadaAPI.updateVariable(variable.id, updates);
      if (response.success) {
        // Update the variables list
        setVariables((prev) =>
          prev.map((v) => (v.id === variable.id ? { ...v, ...updates } : v))
        );
        setEditModalOpen(false);
        setSelectedVariable(null);
        showToast({
          type: "success",
          title: "Setting Updated",
          message: `Successfully updated setting "${variable.var_code}"`,
        });
      } else {
        const errorMessage = response.error || "Failed to update variable";
        setError(errorMessage);
        showToast({
          type: "error",
          title: "Update Failed",
          message: errorMessage,
        });
      }
    } catch {
      const errorMessage = "Failed to update setting";
      setError(errorMessage);
      showToast({
        type: "error",
        title: "Update Failed",
        message: errorMessage,
      });
    } finally {
      setModalLoading(false);
    }
  };

  // Handle delete variable confirm
  const handleDeleteVariableConfirm = async (variable: VariableRecord) => {
    setModalLoading(true);
    try {
      const response = await scadaAPI.deleteVariable(variable.id);
      if (response.success) {
        // Remove from variables list
        setVariables((prev) => prev.filter((v) => v.id !== variable.id));
        setDeleteModalOpen(false);
        setSelectedVariable(null);
        showToast({
          type: "success",
          title: "Setting Deleted",
          message: `Successfully deleted setting "${variable.var_code}"`,
        });
      } else {
        const errorMessage = response.error || "Failed to delete setting";
        setError(errorMessage);
        showToast({
          type: "error",
          title: "Delete Failed",
          message: errorMessage,
        });
      }
    } catch {
      const errorMessage = "Failed to delete setting";
      setError(errorMessage);
      showToast({
        type: "error",
        title: "Delete Failed",
        message: errorMessage,
      });
    } finally {
      setModalLoading(false);
    }
  };

  // Handle delete device confirm
  const handleDeleteDeviceConfirm = async (device: DatabaseDevice) => {
    setModalLoading(true);
    try {
      const response = await scadaAPI.deleteDevice(device.id);
      if (response.success) {
        // Remove device from devices list
        setDevices((prev) => prev.filter((d) => d.id !== device.id));
        // Remove all variables associated with this device
        setVariables((prev) => prev.filter((v) => v.device_id !== device.id));
        setDeviceDeleteModalOpen(false);
        setSelectedDevice(null);
        showToast({
          type: "success",
          title: "Device Deleted",
          message: `Successfully deleted device "${
            device.name || device.scada_id
          }" and all its settings`,
        });
      } else {
        const errorMessage = response.error || "Failed to delete device";
        setError(errorMessage);
        showToast({
          type: "error",
          title: "Delete Failed",
          message: errorMessage,
        });
      }
    } catch {
      const errorMessage = "Failed to delete device";
      setError(errorMessage);
      showToast({
        type: "error",
        title: "Delete Failed",
        message: errorMessage,
      });
    } finally {
      setModalLoading(false);
    }
  };

  // Close modals
  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedVariable(null);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedVariable(null);
  };

  const closeDeviceDeleteModal = () => {
    setDeviceDeleteModalOpen(false);
    setSelectedDevice(null);
  };

  const closeChartModal = () => {
    setChartModalOpen(false);
    setSelectedVariableForChart(null);
  };

  useEffect(() => {
    loadData();
  }, []);

  const varsByDevice = React.useMemo(() => {
    const m = new Map<number, VariableRecord[]>();
    for (const v of variables) {
      const arr = m.get(v.device_id) || [];
      arr.push(v);
      m.set(v.device_id, arr);
    }
    return m;
  }, [variables]);

  if (loading)
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading your settings...</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Your Monitoring Settings
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              View and manage your saved device settings
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {loading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            )}
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium transition-all"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-500 mr-2"
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
              {error}
            </div>
          </div>
        )}

        {devices.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No devices set up yet
            </h3>
            <p className="text-gray-500">
              Add devices from the Device Setup page to start monitoring
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Enhanced Stats Cards with Real-time Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <div className="text-xl font-bold text-blue-700">
                      {devices.length}
                    </div>
                    <div className="text-xs text-blue-600">Total Devices</div>
                  </div>
                </div>
              </div>

              <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <svg
                      className="w-5 h-5 text-white"
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
                  </div>
                  <div className="ml-3">
                    <div className="text-xl font-bold text-green-700">
                      {
                        deviceStatuses.filter((d) => d.status === "online")
                          .length
                      }
                    </div>
                    <div className="text-xs text-green-600">Online Devices</div>
                  </div>
                </div>
              </div>

              <div className="bg-linear-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                <div className="flex items-center">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <svg
                      className="w-5 h-5 text-white"
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
                  </div>
                  <div className="ml-3">
                    <div className="text-xl font-bold text-red-700">
                      {
                        deviceStatuses.filter((d) => d.status === "offline")
                          .length
                      }
                    </div>
                    <div className="text-xs text-red-600">Offline Devices</div>
                  </div>
                </div>
              </div>

              <div className="bg-linear-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <svg
                      className="w-5 h-5 text-white"
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
                  <div className="ml-3">
                    <div className="text-xl font-bold text-purple-700">
                      {variables.length}
                    </div>
                    <div className="text-xs text-purple-600">
                      Total Variables
                    </div>
                  </div>
                </div>
              </div>
            </div>{" "}
            {/* Connection Status Indicator */}
            <div className="mb-6 flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    wsIsConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm font-medium text-gray-700">
                  {wsIsConnected
                    ? "Real-time Connection Active"
                    : "Connection Lost"}
                </span>
                {lastUpdate && (
                  <span className="text-xs text-gray-500">
                    Last update: {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Monitoring {variables.length} total variables across{" "}
                {deviceStatuses.filter((d) => d.status === "online").length}{" "}
                online devices
              </div>
            </div>
            {devices.map((device) => {
              const deviceStatus = deviceStatuses.find(
                (ds) => ds.device_id === device.id
              );
              const deviceVariables = varsByDevice.get(device.id) || [];
              const statusColor =
                deviceStatus?.status === "online"
                  ? "bg-green-500"
                  : deviceStatus?.status === "warning"
                  ? "bg-yellow-500"
                  : "bg-red-500";
              const statusTextColor =
                deviceStatus?.status === "online"
                  ? "text-green-800"
                  : deviceStatus?.status === "warning"
                  ? "text-yellow-800"
                  : "text-red-800";
              const statusBgColor =
                deviceStatus?.status === "online"
                  ? "bg-green-100"
                  : deviceStatus?.status === "warning"
                  ? "bg-yellow-100"
                  : "bg-red-100";

              return (
                <div
                  key={device.id}
                  className={`border-2 rounded-xl overflow-hidden shadow-lg transition-all duration-200 ${
                    deviceStatus?.status === "online"
                      ? "border-green-200 hover:border-green-300"
                      : deviceStatus?.status === "warning"
                      ? "border-yellow-200 hover:border-yellow-300"
                      : "border-red-200 hover:border-red-300"
                  }`}
                >
                  <div
                    className={`px-6 py-4 border-b border-gray-200 ${
                      deviceStatus?.status === "online"
                        ? "bg-green-50"
                        : deviceStatus?.status === "warning"
                        ? "bg-yellow-50"
                        : "bg-red-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-3 h-3 rounded-full ${statusColor}`}
                        ></div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {device.name || device.scada_id}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">
                              SCADA ID: {device.scada_id}
                            </span>
                            <span className="text-sm text-gray-500">
                              DB ID: {device.id}
                            </span>
                            {deviceStatus && (
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBgColor} ${statusTextColor}`}
                              >
                                {deviceStatus.status.toUpperCase()} •{" "}
                                {deviceStatus.online_variables}/
                                {deviceStatus.total_variables} vars
                              </span>
                            )}
                            {device.created_at && (
                              <span className="text-sm text-gray-500">
                                Added:{" "}
                                {new Date(
                                  device.created_at
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            deviceVariables.length > 0
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {deviceVariables.length} variables
                        </span>
                        <button
                          onClick={() => handleDeleteDevice(device)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete device"
                        >
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {deviceVariables.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left border-b border-gray-200">
                              <th className="pb-3 font-medium text-gray-900">
                                Variable Code
                              </th>
                              <th className="pb-3 font-medium text-gray-900">
                                Name
                              </th>
                              <th className="pb-3 font-medium text-gray-900">
                                Current Value
                              </th>
                              <th className="pb-3 font-medium text-gray-900">
                                Unit
                              </th>
                              <th className="pb-3 font-medium text-gray-900">
                                Status
                              </th>
                              <th className="pb-3 font-medium text-gray-900">
                                Last Update
                              </th>
                              <th className="pb-3 font-medium text-gray-900">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {deviceVariables.map((v) => {
                              const realTimeVar = realTimeData.find(
                                (rtd) =>
                                  rtd.var_code === v.var_code &&
                                  rtd.device_id === device.id
                              );
                              const isOnline = realTimeVar?.status === "online";

                              return (
                                <tr
                                  key={v.id}
                                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                                  onClick={() => handleViewChart(v, device)}
                                  title="Click to view variable chart"
                                >
                                  <td className="py-3 font-mono text-sm font-medium">
                                    <div className="flex items-center space-x-2">
                                      <div
                                        className={`w-2 h-2 rounded-full ${
                                          isOnline
                                            ? "bg-green-500"
                                            : "bg-gray-400"
                                        }`}
                                      ></div>
                                      <span>{v.var_code}</span>
                                    </div>
                                  </td>
                                  <td className="py-3">{v.name || "-"}</td>
                                  <td className="py-3 font-mono">
                                    {realTimeVar ? (
                                      <span
                                        className={`${
                                          isOnline
                                            ? "text-green-600"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        {typeof realTimeVar.value === "number"
                                          ? realTimeVar.value.toFixed(2)
                                          : String(realTimeVar.value)}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">
                                        No data
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3">{v.unit || "-"}</td>
                                  <td className="py-3">
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        isOnline
                                          ? "bg-green-100 text-green-800"
                                          : realTimeVar
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {isOnline
                                        ? "Online"
                                        : realTimeVar
                                        ? "Warning"
                                        : "Offline"}
                                    </span>
                                  </td>
                                  <td className="py-3 text-xs text-gray-500">
                                    {realTimeVar
                                      ? realTimeVar.timestamp.toLocaleTimeString()
                                      : v.created_at
                                      ? new Date(v.created_at).toLocaleString()
                                      : "-"}
                                  </td>
                                  <td className="py-3">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewChart(v, device);
                                        }}
                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                        title="View chart"
                                      >
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
                                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                          />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditVariable(v);
                                        }}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        title="Edit variable"
                                      >
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
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                          />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteVariable(v);
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Delete variable"
                                      >
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
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
                          <svg
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-500">
                          No variables configured for this device
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>{" "}
      {/* Modals */}
      {selectedVariable && (
        <VariableEditModal
          variable={selectedVariable}
          isOpen={editModalOpen}
          onClose={closeEditModal}
          onSave={handleSaveVariable}
          isLoading={modalLoading}
        />
      )}
      {selectedVariable && (
        <VariableDeleteModal
          variable={selectedVariable}
          isOpen={deleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteVariableConfirm}
          isLoading={modalLoading}
        />
      )}
      {selectedDevice && (
        <DeviceDeleteModal
          device={selectedDevice}
          isOpen={deviceDeleteModalOpen}
          onClose={closeDeviceDeleteModal}
          onConfirm={handleDeleteDeviceConfirm}
          isLoading={modalLoading}
          variableCount={varsByDevice.get(selectedDevice.id)?.length || 0}
        />
      )}
      {/* Variable Chart Modal */}
      {selectedVariableForChart && (
        <VariableChartModal
          isOpen={chartModalOpen}
          onClose={closeChartModal}
          variable={{
            deviceId: selectedVariableForChart.device.id,
            deviceName:
              selectedVariableForChart.device.name ||
              selectedVariableForChart.device.scada_id,
            variableCode: selectedVariableForChart.variable.var_code,
            variableName:
              selectedVariableForChart.variable.name ||
              selectedVariableForChart.variable.var_code,
            unit: selectedVariableForChart.variable.unit || "",
            status: selectedVariableForChart.variable.enabled
              ? "online"
              : "offline",
          }}
          variableRecord={selectedVariableForChart.variable}
          device={selectedVariableForChart.device}
        />
      )}
    </div>
  );
}
