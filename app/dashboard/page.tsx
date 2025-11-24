"use client";

import { useState, useEffect } from "react";
import { useDeviceData } from "@/hooks/useDeviceData";
import useRealTimeWebSocket from "@/hooks/useRealTimeWebSocket";
import { useRealTimeVarData } from "@/hooks/useRealTimeVarData";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import {
  Zap,
  BarChart3,
  TrendingUp,
  Activity,
  Cloud,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

interface EnergyData {
  daily: Array<{ label: string; kWh: number; avgPower: number }>;
  hourly: Array<{ label: string; kWh: number; avgPower: number }>;
  zones: Array<{ zone: string; kWh: number; avgPower: number }>;
  realTimePower?: Array<{
    deviceId: string;
    zone: string;
    currentPower: number;
    unit: string;
    timestamp: Date;
  }>;
  metadata?: {
    energyUnit: string;
    powerUnit: string;
    lastUpdated: string;
  };
}

export default function DashboardPage() {
  const [energyData, setEnergyData] = useState<EnergyData | null>(null);
  const [energyLoading, setEnergyLoading] = useState(true);

  // Get real data from API
  const { devices, selectedDevices, loading, error, loadDevices } =
    useDeviceData();

  // Real-time WebSocket data
  const {
    deviceStatuses,
    isConnected: wsConnected,
    realTimeData,
    lastUpdate,
    error: wsError,
  } = useRealTimeWebSocket();

  // Real-time variable data
  const {
    isConnected: varConnected,
    loading: varLoading,
    variableCount,
  } = useRealTimeVarData();

  useEffect(() => {
    // Load devices when component mounts
    loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, loadDevices is stable

  // Fetch energy data
  useEffect(() => {
    const fetchEnergyData = async () => {
      try {
        setEnergyLoading(true);
        const response = await fetch("/api/energy");
        if (response.ok) {
          const data = await response.json();
          setEnergyData(data);
        }
      } catch (err) {
        console.error("Failed to fetch energy data:", err);
      } finally {
        setEnergyLoading(false);
      }
    };

    fetchEnergyData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchEnergyData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate aggregated values
  const totalEnergyToday = energyData?.daily?.[0]?.kWh || 0;
  const averagePowerToday = energyData?.daily?.[0]?.avgPower || 0;
  const totalCurrentPower =
    energyData?.realTimePower?.reduce(
      (sum, device) => sum + device.currentPower,
      0
    ) || 0;
  const onlineDeviceCount = deviceStatuses.filter(
    (d) => d.status === "online"
  ).length;
  const totalVariableCount = realTimeData.length || variableCount;

  return (
    <DashboardLayout>
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="flex items-center justify-center mb-4"></div>
        <h2 className="text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 mb-6 leading-tight">
          Energy Dashboard
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          Monitor, analyze, and optimize your energy usage with real-time
          tracking and smart analytics.
        </p>
        <div className="flex justify-center space-x-8 mb-8">
          <div className="flex items-center text-base text-gray-700">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 shadow-lg shadow-blue-500/50"></div>
            Live Monitoring
          </div>
          <div className="flex items-center text-base text-gray-700">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 shadow-lg shadow-green-500/50"></div>
            Smart Analytics
          </div>
          <div className="flex items-center text-base text-gray-700">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-3 shadow-lg shadow-purple-500/50"></div>
            Device Control
          </div>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <div className="group bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-blue-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl group-hover:shadow-blue-200/50 transition-all duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="w-12 h-2 bg-blue-100 rounded-full">
                <div className="w-9 h-2 bg-blue-500 rounded-full"></div>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                Energy Consumption (Today)
              </p>
              <div className="flex items-baseline mb-3">
                <p className="text-4xl font-bold text-gray-900">
                  {energyLoading ? "..." : totalEnergyToday.toFixed(1)}
                </p>
                <span className="ml-2 text-xl font-semibold text-gray-600">
                  kWh
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center font-medium">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                {energyLoading
                  ? "Loading..."
                  : totalEnergyToday > 0
                  ? `Avg: ${averagePowerToday.toFixed(1)} kW`
                  : "No data available"}
              </p>
            </div>
          </div>
        </div>

        <div className="group bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-orange-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl group-hover:shadow-orange-200/50 transition-all duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="w-12 h-2 bg-orange-100 rounded-full">
                <div className="w-8 h-2 bg-orange-500 rounded-full"></div>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                Current Power (Real-time)
              </p>
              <div className="flex items-baseline mb-3">
                <p className="text-4xl font-bold text-gray-900">
                  {energyLoading ? "..." : totalCurrentPower.toFixed(1)}
                </p>
                <span className="ml-2 text-xl font-semibold text-gray-600">
                  kW
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center font-medium">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    wsConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`}
                ></div>
                {energyLoading
                  ? "Loading..."
                  : wsConnected
                  ? "Live monitoring"
                  : "Connection lost"}
              </p>
            </div>
          </div>
        </div>

        <div className="group bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-green-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-green-500/5 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-linear-to-br from-green-500 to-green-600 rounded-2xl shadow-xl group-hover:shadow-green-200/50 transition-all duration-300">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div className="w-12 h-2 bg-green-100 rounded-full">
                <div className="w-10 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                Active Devices
              </p>
              <div className="flex items-baseline mb-3">
                <p className="text-4xl font-bold text-gray-900">
                  {loading ? "..." : onlineDeviceCount || devices.length || "0"}
                </p>
                <span className="ml-2 text-xl font-semibold text-gray-600">
                  online
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center font-medium">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    onlineDeviceCount > 0 ? "bg-green-500" : "bg-gray-400"
                  }`}
                ></div>
                {loading
                  ? "Loading..."
                  : error
                  ? "Connection error"
                  : deviceStatuses.length > 0
                  ? `${onlineDeviceCount}/${deviceStatuses.length} devices`
                  : devices.length > 0
                  ? "Devices discovered"
                  : "No devices found"}
              </p>
            </div>
          </div>
        </div>

        <div className="group bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-purple-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl group-hover:shadow-purple-200/50 transition-all duration-300">
                <Cloud className="w-8 h-8 text-white" />
              </div>
              <div className="w-12 h-2 bg-purple-100 rounded-full">
                <div className="w-8 h-2 bg-purple-500 rounded-full"></div>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                Live Variables
              </p>
              <div className="flex items-baseline mb-3">
                <p className="text-4xl font-bold text-gray-900">
                  {varLoading
                    ? "..."
                    : totalVariableCount ||
                      selectedDevices.reduce(
                        (total, device) =>
                          total + (device.variables?.length || 0),
                        0
                      ) ||
                      "0"}
                </p>
                <span className="ml-2 text-xl font-semibold text-gray-600">
                  vars
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center font-medium">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    varConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                ></div>
                {varLoading
                  ? "Loading..."
                  : varConnected
                  ? "Variables streaming"
                  : totalVariableCount > 0
                  ? "Variables configured"
                  : "No variables selected"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Data Display */}
      {realTimeData.length > 0 && (
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-gray-100/50 mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Live Variable Monitoring
              </h3>
              <p className="text-gray-600">
                Real-time data stream from {realTimeData.length} variables
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                <div className="text-xs text-green-700 font-medium">Status</div>
                <div className="text-sm font-bold text-green-600">
                  {wsConnected ? "LIVE" : "OFFLINE"}
                </div>
              </div>
              {lastUpdate && (
                <div className="bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-700 font-medium">
                    Last Update
                  </div>
                  <div className="text-sm font-bold text-blue-600">
                    {lastUpdate.toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {realTimeData.slice(0, 8).map((variable) => (
              <div
                key={`${variable.device_id}-${variable.var_code}`}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {variable.variable_name || variable.var_code}
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      {
                        online: "bg-green-500 animate-pulse",
                        warning: "bg-yellow-500",
                        error: "bg-red-500",
                        offline: "bg-gray-400",
                      }[variable.status]
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Value:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {typeof variable.value === "number"
                        ? variable.value.toFixed(2)
                        : String(variable.value)}
                    </span>
                  </div>

                  {variable.unit && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Unit:</span>
                      <span className="text-sm text-gray-700">
                        {variable.unit}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Device:</span>
                    <span className="text-sm text-gray-700 truncate">
                      {variable.device_name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {realTimeData.length > 8 && (
            <div className="text-center mt-6">
              <Link
                href="/dashboard/monitor"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200"
              >
                View All {realTimeData.length} Variables
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Energy Overview */}
      {energyData && (
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-gray-100/50 mb-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Energy Overview
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Today&apos;s energy consumption and real-time power monitoring
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Energy Consumption (Today) */}
            <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-200/50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-semibold text-blue-900">
                  Energy Consumption
                </h4>
                <div className="bg-blue-100 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium text-blue-800">kWh</span>
                </div>
              </div>

              <div className="space-y-3">
                {energyData.daily.slice(0, 4).map((day) => (
                  <div
                    key={day.label}
                    className="flex items-center justify-between p-3 bg-white/70 rounded-lg"
                  >
                    <span className="text-gray-700 font-medium">
                      {day.label}
                    </span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {day.kWh.toLocaleString()} kWh
                      </div>
                      <div className="text-sm text-gray-500">
                        Avg: {day.avgPower.toFixed(1)} kW
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-blue-200">
                <Link
                  href="/dashboard/analytics"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  View detailed analytics
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Real-time Power */}
            {energyData.realTimePower && (
              <div className="bg-orange-50/50 rounded-2xl p-6 border border-orange-200/50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-semibold text-orange-900">
                    Real-time Power
                  </h4>
                  <div className="bg-orange-100 px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-orange-800">
                      kW
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {energyData.realTimePower.slice(0, 4).map((device) => (
                    <div
                      key={device.deviceId}
                      className="flex items-center justify-between p-3 bg-white/70 rounded-lg"
                    >
                      <span className="text-gray-700 font-medium">
                        {device.zone}
                      </span>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-600">
                          {device.currentPower.toFixed(1)} kW
                        </div>
                        <div className="text-sm text-gray-500">
                          {device.deviceId}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-orange-200">
                  <Link
                    href="/dashboard/monitor"
                    className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium"
                  >
                    View live monitoring
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Cards - Redesigned */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* Device Management */}
        <div className="group bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100/50">
          <div className="bg-linear-to-r from-blue-500 to-blue-600 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-4 translate-y-4"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-9 h-9 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Device Management</h3>
              <p className="text-blue-100 mb-6">
                Configure and manage your SCADA devices with ease
              </p>
            </div>
          </div>
          <div className="p-8">
            <div className="space-y-4 mb-8">
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Smart device discovery and configuration
              </div>
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Choose what to monitor
              </div>
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Save your data automatically
              </div>
            </div>
            <Link
              href="/dashboard/devices"
              className="group/btn inline-flex items-center justify-center w-full px-8 py-4 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg
                className="w-5 h-5 mr-3 group-hover/btn:rotate-12 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
              </svg>
              Configure Devices
              <svg
                className="w-4 h-4 ml-3 group-hover/btn:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Real-time Monitoring */}
        <div className="group bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100/50">
          <div className="bg-linear-to-r from-green-500 to-green-600 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-4 translate-y-4"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-9 h-9 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Live Monitoring</h3>
              <p className="text-green-100 mb-6">
                Watch your energy usage in real-time
              </p>
            </div>
          </div>
          <div className="p-8">
            <div className="space-y-4 mb-8">
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Live energy data updates
              </div>
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Customizable refresh settings
              </div>
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Monitor multiple devices at once
              </div>
            </div>
            <Link
              href="/dashboard/monitor"
              className="group/btn inline-flex items-center justify-center w-full px-8 py-4 bg-green-600 text-white font-semibold rounded-2xl hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500/20 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg
                className="w-5 h-5 mr-3 group-hover/btn:rotate-12 transition-transform"
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
              Monitor Devices
              <svg
                className="w-4 h-4 ml-3 group-hover/btn:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Analytics */}
        <div className="group bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100/50">
          <div className="bg-linear-to-r from-purple-500 to-purple-600 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-4 translate-y-4"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-9 h-9 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Data Analytics</h3>
              <p className="text-purple-100 mb-6">
                Analyze trends, historical data patterns, and generate reports
              </p>
            </div>
          </div>
          <div className="p-8">
            <div className="space-y-4 mb-8">
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                Interactive charts and visualizations
              </div>
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                Historical data analysis and trends
              </div>
              <div className="flex items-center text-gray-700">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                Generate and export CSV reports
              </div>
            </div>
            <Link
              href="/dashboard/analytics"
              className="group/btn inline-flex items-center justify-center w-full px-8 py-4 bg-purple-600 text-white font-semibold rounded-2xl hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg
                className="w-5 h-5 mr-3 group-hover/btn:rotate-12 transition-transform"
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
              View Analytics
              <svg
                className="w-4 h-4 ml-3 group-hover/btn:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* System Heartbeat Monitor */}
      {/* <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              System Health Monitor
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Real-time monitoring of EDS heartbeat and system connectivity
            </p>
          </div>

          <HeartbeatMonitor className="max-w-4xl mx-auto" />
        </div> */}

      {/* Quick Actions & Features */}
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-10 border border-gray-100/50 mb-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Features & Tools
          </h3>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover the features that make energy monitoring simple and
            effective
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="text-center p-6 rounded-2xl bg-blue-50 border border-blue-100 group hover:bg-blue-100 transition-colors duration-300">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-9 h-9 text-white"
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
            <h4 className="text-xl font-semibold text-gray-900 mb-3">
              Usage History
            </h4>
            <p className="text-gray-600">
              View your energy usage patterns with easy-to-read charts and
              trends
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-green-50 border border-green-100 group hover:bg-green-100 transition-colors duration-300">
            <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-9 h-9 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-3">
              Smart Alerts
            </h4>
            <p className="text-gray-600">
              Get notified when your energy usage goes above or below your set
              limits
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-purple-50 border border-purple-100 group hover:bg-purple-100 transition-colors duration-300">
            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-9 h-9 text-white"
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
            <h4 className="text-xl font-semibold text-gray-900 mb-3">
              Easy Setup
            </h4>
            <p className="text-gray-600">
              Connect your energy systems effortlessly with our simple setup
              process
            </p>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="text-center">
        <div className="inline-flex items-center px-6 py-3 bg-gray-100 rounded-full text-sm text-gray-600">
          <svg
            className={`w-5 h-5 mr-2 ${
              loading || energyLoading || varLoading
                ? "text-yellow-500 animate-spin"
                : error || wsError
                ? "text-red-500"
                : wsConnected && varConnected
                ? "text-green-500"
                : "text-orange-500"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {loading || energyLoading || varLoading ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            ) : error || wsError ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            )}
          </svg>
          {loading || energyLoading || varLoading
            ? "Getting ready..."
            : error || wsError
            ? "Connection issue - please check your internet"
            : wsConnected && varConnected
            ? "All systems operational - real-time data flowing"
            : "Partial connectivity - some features may be limited"}
        </div>
      </div>
    </DashboardLayout>
  );
}
