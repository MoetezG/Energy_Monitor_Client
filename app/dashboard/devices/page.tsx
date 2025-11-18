"use client";

import { useState } from "react";
import DeviceSelector from "@/components/DeviceSelector";
import { SelectedDevice, scadaAPI } from "@/lib/api";
import Link from "next/link";

export default function DeviceManagement() {
  const [selectedDevices, setSelectedDevices] = useState<SelectedDevice[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleDevicesSelected = (devices: SelectedDevice[]) => {
    setSelectedDevices(devices);
    setSaveMessage(null);
  };

  const handleSaveToDatabase = async () => {
    if (selectedDevices.length === 0) {
      setSaveMessage({
        type: "error",
        text: "Please select at least one device and its variables",
      });
      return;
    }

    // Validate that at least one variable is selected for each device
    const devicesWithSelectedVariables = selectedDevices.filter((device) =>
      device.variables.some((v) => v.selected)
    );

    if (devicesWithSelectedVariables.length === 0) {
      setSaveMessage({
        type: "error",
        text: "Please select at least one variable for the selected devices",
      });
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const response = await scadaAPI.addDevicesToDatabase(
        devicesWithSelectedVariables
      );

      if (response.success) {
        setSaveMessage({
          type: "success",
          text: `Successfully added ${devicesWithSelectedVariables.length} devices to database`,
        });
      } else {
        setSaveMessage({
          type: "error",
          text: response.error || "Failed to save devices to database",
        });
      }
    } catch {
      setSaveMessage({
        type: "error",
        text: "Network error while saving devices",
      });
    } finally {
      setSaving(false);
    }
  };

  const getSelectedVariablesCount = () => {
    return selectedDevices.reduce(
      (total, device) =>
        total + device.variables.filter((v) => v.selected).length,
      0
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-2">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-105 transition-transform">
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
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Device Setup
                  </h1>
                  <p className="text-sm text-gray-600">
                    Connect and manage your energy devices
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center bg-blue-50 px-3 py-2 rounded-full">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm font-medium text-blue-700">
                  Setup Mode
                </span>
              </div>

              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-sm text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200 group"
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
        {/* Enhanced Header */}
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-4">
            Device Setup Center
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
            Discover, set up, and manage your energy devices. Choose what to
            monitor from each device.
          </p>

          {/* Status Indicators */}
          <div className="flex justify-center space-x-6 text-sm">
            <div className="flex items-center text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Device Search Active
            </div>
            <div className="flex items-center text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Monitor Settings
            </div>
            <div className="flex items-center text-gray-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
              Data Storage
            </div>
          </div>
        </div>

        {/* Selection Summary */}
        {selectedDevices.length > 0 && (
          <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-blue-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-6 mb-4 lg:mb-0">
                <div className="flex items-center bg-blue-50 px-4 py-2 rounded-xl">
                  <svg
                    className="w-5 h-5 text-blue-600 mr-2"
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
                  <span className="text-sm font-semibold text-blue-700">
                    {selectedDevices.length} device
                    {selectedDevices.length > 1 ? "s" : ""} selected
                  </span>
                </div>

                <div className="flex items-center bg-green-50 px-4 py-2 rounded-xl">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2"
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
                  <span className="text-sm font-semibold text-green-700">
                    {getSelectedVariablesCount()} item
                    {getSelectedVariablesCount() > 1 ? "s" : ""} to monitor
                  </span>
                </div>
              </div>

              <button
                onClick={handleSaveToDatabase}
                disabled={saving || getSelectedVariablesCount() === 0}
                className="flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Saving Settings...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Save to Database
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`mb-6 p-4 rounded-2xl border ${
              saveMessage.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center">
              {saveMessage.type === "success" ? (
                <svg
                  className="w-5 h-5 mr-2"
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
              ) : (
                <svg
                  className="w-5 h-5 mr-2"
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
              )}
              <span className="font-medium">{saveMessage.text}</span>
            </div>
          </div>
        )}

        {/* Device Selector Component */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  Find Your Energy Devices
                </h3>
                <p className="text-blue-100">
                  Discover available devices and choose what to monitor
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="p-6">
            <DeviceSelector onDevicesSelected={handleDevicesSelected} />
          </div>

          {/* Quick Actions & Help */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-600"
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
                How to Set Up Devices
              </h3>
              <ol className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full mr-3 flex-shrink-0">
                    1
                  </span>
                  <span>
                    Select devices from the &quot;Available Devices&quot;
                    section
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full mr-3 flex-shrink-0">
                    2
                  </span>
                  <span>
                    Choose what data you want to monitor for each device
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full mr-3 flex-shrink-0">
                    3
                  </span>
                  <span>Review your selection in the summary section</span>
                </li>
                <li className="flex items-start">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full mr-3 flex-shrink-0">
                    4
                  </span>
                  <span>
                    Click &quot;Save to Database&quot; to store your settings
                  </span>
                </li>
              </ol>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-green-600"
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
                Next Steps
              </h3>
              <div className="space-y-4">
                <Link
                  href="/dashboard/monitor"
                  className="flex items-center p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group"
                >
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                    <svg
                      className="w-4 h-4 text-white"
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
                    <div className="font-semibold text-green-900">
                      Monitor Devices
                    </div>
                    <div className="text-sm text-green-700">
                      View real-time values and data
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-green-600 ml-auto group-hover:translate-x-1 transition-transform"
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

                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="text-sm text-gray-600">
                    <strong>Tip:</strong> Once devices are saved, you can access
                    real-time monitoring, configure alerts, and view historical
                    data trends.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
