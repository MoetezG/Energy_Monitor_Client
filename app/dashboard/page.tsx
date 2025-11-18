"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useDeviceData } from "@/hooks/useDeviceData";
import {
  SystemStatusIndicator,
  HeartbeatMonitor,
} from "@/components/SystemStatusIndicator";

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get real data from API
  const { devices, selectedDevices, loading, error, loadDevices } =
    useDeviceData();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Load devices when component mounts
    loadDevices();
  }, [loadDevices]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Top Navigation */}
      <nav className="bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Energy Monitor
                </h1>
                <p className="text-sm text-gray-600">
                  Energy Management Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-8">
              {/* System Status - WebSocket based heartbeat monitoring */}
              <SystemStatusIndicator showDetails={false} />

              <div className="hidden lg:flex flex-col items-end">
                <div className="text-sm font-medium text-gray-900">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="text-xl font-mono text-blue-600 font-semibold">
                  {currentTime.toLocaleTimeString()}
                </div>
              </div>
              <Link
                href="/login"
                className="flex items-center space-x-2 text-sm text-gray-700 hover:text-red-600 px-6 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 group border border-gray-200 hover:border-red-200"
              >
                <svg
                  className="w-5 h-5 group-hover:rotate-12 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="font-medium">Logout</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
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
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="w-12 h-2 bg-blue-100 rounded-full">
                  <div className="w-9 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Energy Usage
                </p>
                <div className="flex items-baseline mb-3">
                  <p className="text-4xl font-bold text-gray-900">
                    {loading ? "..." : "--"}
                  </p>
                  <span className="ml-2 text-xl font-semibold text-gray-600">
                    MW
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
                  {loading ? "Loading..." : "No data available"}
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-green-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-green-500/5 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-linear-to-br from-green-500 to-green-600 rounded-2xl shadow-xl group-hover:shadow-green-200/50 transition-all duration-300">
                  <svg
                    className="w-8 h-8 text-white"
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
                    {loading ? "..." : devices.length || "0"}
                  </p>
                  <span className="ml-2 text-xl font-semibold text-gray-600">
                    {devices.length === 1 ? "device" : "devices"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 flex items-center font-medium">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  {loading
                    ? "Loading..."
                    : error
                    ? "Connection error"
                    : devices.length > 0
                    ? "Devices discovered"
                    : "No devices found"}
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-yellow-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-yellow-500/5 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-linear-to-br from-yellow-500 to-orange-500 rounded-2xl shadow-xl group-hover:shadow-yellow-200/50 transition-all duration-300">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="w-12 h-2 bg-yellow-100 rounded-full">
                  <div className="w-7 h-2 bg-yellow-500 rounded-full"></div>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                  System Status
                </p>
                <div className="flex items-baseline mb-3">
                  <p className="text-4xl font-bold text-gray-900">
                    {loading ? "..." : error ? "ERR" : "OK"}
                  </p>
                  <span className="ml-2 text-xl font-semibold text-gray-600"></span>
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {loading
                    ? "Checking status..."
                    : error
                    ? "Connection error"
                    : "System operational"}
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-purple-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-linear-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl group-hover:shadow-purple-200/50 transition-all duration-300">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                    />
                  </svg>
                </div>
                <div className="w-12 h-2 bg-purple-100 rounded-full">
                  <div className="w-8 h-2 bg-purple-500 rounded-full"></div>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Selected Variables
                </p>
                <div className="flex items-baseline mb-3">
                  <p className="text-4xl font-bold text-gray-900">
                    {loading
                      ? "..."
                      : selectedDevices.reduce(
                          (total, device) =>
                            total + (device.variables?.length || 0),
                          0
                        ) || "0"}
                  </p>
                  <span className="ml-2 text-xl font-semibold text-gray-600">
                    vars
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {loading
                    ? "Loading..."
                    : selectedDevices.length > 0
                    ? "Variables configured"
                    : "No variables selected"}
                </p>
              </div>
            </div>
          </div>
        </div>

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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
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
                loading
                  ? "text-yellow-500"
                  : error
                  ? "text-red-500"
                  : "text-green-500"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {loading
              ? "Getting ready..."
              : error
              ? "Connection issue - please check your internet"
              : "Everything is working perfectly"}
          </div>
        </div>
      </div>
    </div>
  );
}
