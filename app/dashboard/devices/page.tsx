"use client";

import { useState } from "react";
import DeviceSelector from "@/components/DeviceSelector";
import { SelectedDevice, scadaAPI } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";

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
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 mb-3">
            Device Management
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Configure and manage your energy monitoring devices
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-blue-600"
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
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Selected Devices
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedDevices.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-green-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-green-600"
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
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Variables</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getSelectedVariablesCount()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-purple-600"
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
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-sm font-semibold text-green-600">
                  Ready to Configure
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200/50">
          <DeviceSelector onDevicesSelected={handleDevicesSelected} />

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedDevices.length > 0 && (
                <span>
                  {selectedDevices.length} device
                  {selectedDevices.length !== 1 ? "s" : ""} selected with{" "}
                  {getSelectedVariablesCount()} variable
                  {getSelectedVariablesCount() !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <button
              onClick={handleSaveToDatabase}
              disabled={
                selectedDevices.length === 0 ||
                saving ||
                getSelectedVariablesCount() === 0
              }
              className="px-8 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {saving ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                "Save Configuration"
              )}
            </button>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div
              className={`mt-6 p-4 rounded-xl border ${
                saveMessage.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-center">
                {saveMessage.type === "success" ? (
                  <svg
                    className="w-5 h-5 mr-3"
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
                ) : (
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                <span className="font-medium">{saveMessage.text}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
