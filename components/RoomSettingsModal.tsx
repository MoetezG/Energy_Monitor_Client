"use client";
import React, { useState } from "react";

interface RoomSettings {
  lights: {
    enabled: boolean;
    delay: number;
    latencyDeactivation: number;
    comment: string;
  };
  ventilation: {
    enabled: boolean;
    delay: number;
    latencyDeactivation: number;
    comment: string;
  };
}

interface RoomData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  power: number;
  ac: boolean;
  lights: boolean;
  settings?: {
    lights: {
      enabled: boolean;
      delay: number;
      latencyDeactivation: number;
      comment: string;
    };
    ventilation: {
      enabled: boolean;
      delay: number;
      latencyDeactivation: number;
      comment: string;
    };
  };
}

interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomData: RoomData;
  onSave: (
    roomId: string,
    settings: RoomSettings,
    lights: boolean,
    ac: boolean
  ) => void;
}

export default function RoomSettingsModal({
  isOpen,
  onClose,
  roomId,
  roomData,
  onSave,
}: RoomSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"lights" | "ventilation">(
    "lights"
  );

  const [settings, setSettings] = useState<RoomSettings>({
    lights: {
      enabled: roomData?.lights || false,
      delay: 0,
      latencyDeactivation: 0,
      comment: "-",
    },
    ventilation: {
      enabled: roomData?.ac || false,
      delay: 0,
      latencyDeactivation: 0,
      comment: "-",
    },
  });

  const handleSave = () => {
    onSave(
      roomId,
      settings,
      settings.lights.enabled,
      settings.ventilation.enabled
    );
    onClose();
  };

  const handleCancel = () => {
    // Reset to initial state
    setSettings({
      lights: {
        enabled: roomData?.lights || false,
        delay: 0,
        latencyDeactivation: 0,
        comment: "-",
      },
      ventilation: {
        enabled: roomData?.ac || false,
        delay: 0,
        latencyDeactivation: 0,
        comment: "-",
      },
    });
    onClose();
  };

  const updateSetting = (
    type: "lights" | "ventilation",
    field: string,
    value: string | number | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  if (!isOpen) return null;

  const currentSettings = settings[activeTab];

  return (
    <div className="fixed inset-0 backdrop-brightness-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Room Settings
              </h2>
              <p className="text-gray-300 text-sm mt-1">
                Room {roomId} | {roomData?.power || 0}kW
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg
                className="w-6 h-6"
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
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100">
          <button
            onClick={() => setActiveTab("lights")}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === "lights"
                ? "bg-white text-yellow-600 border-b-2 border-yellow-500"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xl">💡</span>
              <span>Lighting</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("ventilation")}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === "ventilation"
                ? "bg-white text-blue-600 border-b-2 border-blue-500"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xl">❄️</span>
              <span>Ventilation</span>
            </div>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Enable/Disable Switch */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {activeTab === "lights"
                    ? "Lighting Control"
                    : "Ventilation Control"}
                </h3>
                <p className="text-sm text-gray-500">
                  {activeTab === "lights"
                    ? "Turn room lights on or off"
                    : "Turn air conditioning and ventilation on or off"}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentSettings.enabled}
                  onChange={(e) =>
                    updateSetting(activeTab, "enabled", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Settings (always show regardless of toggle state) */}
            {/* Delay Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turn-on Delay (seconds)
              </label>
              <input
                type="number"
                min="0"
                max="300"
                step="0.5"
                value={currentSettings.delay}
                onChange={(e) =>
                  updateSetting(activeTab, "delay", Number(e.target.value))
                }
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !currentSettings.enabled ? "bg-gray-50 text-gray-600" : ""
                }`}
                placeholder="Enter delay time"
              />
              <p className="text-xs text-gray-500 mt-1">
                Delay before turning on (optional)
              </p>
            </div>

            {/* Latency Deactivation Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turn-off Delay (seconds)
              </label>
              <input
                type="number"
                min="0"
                max="3600"
                step="0.5"
                value={currentSettings.latencyDeactivation}
                onChange={(e) =>
                  updateSetting(
                    activeTab,
                    "latencyDeactivation",
                    Number(e.target.value)
                  )
                }
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !currentSettings.enabled ? "bg-gray-50 text-gray-600" : ""
                }`}
                placeholder="Enter delay time"
              />
              <p className="text-xs text-gray-500 mt-1">
                Delay before turning off (optional)
              </p>
            </div>

            {/* Comment Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={currentSettings.comment}
                onChange={(e) =>
                  updateSetting(activeTab, "comment", e.target.value)
                }
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  !currentSettings.enabled ? "bg-gray-50 text-gray-600" : ""
                }`}
                rows={3}
                placeholder="Add any notes about this room..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional notes or comments about this room&apos;s settings
              </p>
            </div>

            {/* Status Indicator */}
            <div
              className={`p-4 rounded-lg border-2 ${
                currentSettings.enabled
                  ? activeTab === "lights"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-blue-50 border-blue-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    currentSettings.enabled
                      ? activeTab === "lights"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                      : "bg-gray-400"
                  }`}
                ></div>
                <span className="font-medium text-gray-900">
                  {currentSettings.enabled
                    ? `${activeTab === "lights" ? "Lights" : "Ventilation"} On`
                    : `${
                        activeTab === "lights" ? "Lights" : "Ventilation"
                      } Off`}
                </span>
              </div>
              {currentSettings.enabled && (
                <div className="mt-2 text-sm text-gray-600">
                  Turn-on delay: {currentSettings.delay}s | Turn-off latency:{" "}
                  {currentSettings.latencyDeactivation}s
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
