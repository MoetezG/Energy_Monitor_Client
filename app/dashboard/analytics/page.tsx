"use client";

import { useState, useEffect } from "react";
import { scadaAPI, DatabaseDevice, VariableRecord } from "@/lib/api";
import MultiVariableChart from "@/components/MultiVariableChart";
import DeviceMultiVariableChart from "@/components/DeviceMultiVariableChart";
import ReportGenerator from "@/components/ReportGenerator";
import Link from "next/link";
import EnergyBarChart from "@/components/EnergyBarChart";

interface AnalyticsPageState {
  devices: DatabaseDevice[];
  variables: VariableRecord[];
  selectedVariables: VariableRecord[];
  loading: boolean;
  error: string | null;
}

export default function AnalyticsPage() {
  const [state, setState] = useState<AnalyticsPageState>({
    devices: [],
    variables: [],
    selectedVariables: [],
    loading: false,
    error: null,
  });
  async function getMockEnergy() {
    const res = await fetch("http://localhost:3000/api/energy");
    return res.json();
  }

  const [energy, setEnergy] = useState<any>(null);

  useEffect(() => {
    const fetchEnergy = async () => {
      try {
        const energyData = await getMockEnergy();
        setEnergy(energyData);
      } catch (error) {
        console.error("Failed to fetch energy data:", error);
      }
    };

    fetchEnergy();
  }, []);

  const [viewMode, setViewMode] = useState<"device" | "multi">("device");
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);

  // Load devices and variables
  const loadData = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

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
          ? variablesResponse.data
          : [];

        // Filter enabled variables only
        const enabledVariables = variables.filter((v) => v.enabled !== false);

        setState((prev) => ({
          ...prev,
          devices,
          variables: enabledVariables,
          selectedVariables: enabledVariables.slice(0, 4), // Show first 4 by default
          loading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            devicesResponse.error ||
            variablesResponse.error ||
            "Failed to load data",
        }));
      }
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Network error while loading data",
      }));
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeData = async () => {
      if (!mounted) return;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [devicesResponse, variablesResponse] = await Promise.all([
          scadaAPI.getDatabaseDevices(),
          scadaAPI.getVariableList(),
        ]);

        if (!mounted) return;

        if (devicesResponse.success && variablesResponse.success) {
          const devices = Array.isArray(devicesResponse.data)
            ? devicesResponse.data
            : [];
          const variables = Array.isArray(variablesResponse.data)
            ? variablesResponse.data
            : [];

          // Filter enabled variables only
          const enabledVariables = variables.filter((v) => v.enabled !== false);

          setState((prev) => ({
            ...prev,
            devices,
            variables: enabledVariables,
            selectedVariables: enabledVariables.slice(0, 4), // Show first 4 by default
            loading: false,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            loading: false,
            error:
              devicesResponse.error ||
              variablesResponse.error ||
              "Failed to load data",
          }));
        }
      } catch {
        if (!mounted) return;

        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Network error while loading data",
        }));
      }
    };

    initializeData();

    return () => {
      mounted = false;
    };
  }, []);

  // Filter variables by selected device
  const filteredVariables = selectedDevice
    ? state.variables.filter((v) => v.device_id === selectedDevice)
    : state.variables;

  // Group variables by device
  const variablesByDevice = state.variables.reduce((acc, variable) => {
    if (!acc[variable.device_id]) {
      acc[variable.device_id] = [];
    }
    acc[variable.device_id].push(variable);
    return acc;
  }, {} as Record<number, VariableRecord[]>);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-2">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center group">
                <div className="w-10 h-10 bg-linear-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-105 transition-transform">
                  <svg
                    className="w-6 h-6 text-white"
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
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Usage Charts
                  </h1>
                  <p className="text-sm text-gray-600">
                    Historical trends & data analysis
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center bg-purple-50 px-3 py-2 rounded-full">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm font-medium text-purple-700">
                  Analytics Active
                </span>
              </div>

              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-sm text-gray-700 hover:text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-all duration-200 group"
              >
                <svg
                  className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-600 to-indigo-600 mb-3">
            Usage History
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            View historical trends, patterns, and energy usage data with
            easy-to-read charts and graphs
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Device Filter */}
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">
                Filter by Device:
              </label>
              <select
                value={selectedDevice || ""}
                onChange={(e) =>
                  setSelectedDevice(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Devices</option>
                {state.devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name} ({device.scada_id})
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode */}
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">
                View Mode:
              </label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("device")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === "device"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  By Device
                </button>
                <button
                  onClick={() => setViewMode("multi")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === "multi"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Multi-Variable
                </button>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              disabled={state.loading}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 ${state.loading ? "animate-spin" : ""}`}
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
              <span>{state.loading ? "Loading..." : "Refresh"}</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {state.devices.length}
              </div>
              <div className="text-sm text-blue-800">Connected Devices</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {state.variables.length}
              </div>
              <div className="text-sm text-green-800">Monitored Variables</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {filteredVariables.length}
              </div>
              <div className="text-sm text-purple-800">Active Variables</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">
                {Object.keys(variablesByDevice).length}
              </div>
              <div className="text-sm text-orange-800">Active Devices</div>
            </div>
          </div>
        </div>

        {/* Report Generator */}
        <ReportGenerator className="mb-8" />

        {/* Error Display */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-400 mr-2"
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
              <span className="text-red-800">{state.error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {state.loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg text-gray-600">
                Loading analytics data...
              </span>
            </div>
          </div>
        )}

        {/* Charts Display */}
        {!state.loading && !state.error && energy && (
          <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">
              Dashboard Énergie (Mock Demo)
            </h1>

            {/* Energy Charts Section */}
            <div className="space-y-8">
              {/* Bar Chart multijours */}
              <EnergyBarChart
                data={energy.daily}
                title="Consommation par Jour (kWh)"
                theme="blue"
                showAverage={true}
                enableExport={true}
              />

              {/* Bar Chart par heures */}
              <EnergyBarChart
                data={energy.hourly}
                title="Consommation par Tranche Horaire (kWh)"
                theme="green"
                showAverage={true}
                enableExport={true}
              />

              {/* Bar Chart par zones */}
              <EnergyBarChart
                data={energy.zones.map((z: { zone: string; kWh: number }) => ({
                  label: z.zone,
                  kWh: z.kWh,
                }))}
                title="Consommation par Zone (kWh)"
                theme="purple"
                showAverage={true}
                enableExport={true}
              />
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Analytics Dashboard • Real-time data aggregation from{" "}
            {state.devices.length} devices
          </p>
        </div>
      </div>
    </div>
  );
}
