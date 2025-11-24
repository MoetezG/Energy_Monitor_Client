"use client";
import React, { useState } from "react";

interface FloorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  floorId: string;
  floorName: string;
  currentTimeRetard?: number; // keeping same prop name for compatibility
  onSave: (floorId: string, settings: { timeRetard: number }) => void; // keeping same for compatibility
  isEdsOnline?: boolean; // EDS system status
}

export default function FloorSettingsModal({
  isOpen,
  onClose,
  floorId,
  floorName,
  currentTimeRetard = 0,
  onSave,
  isEdsOnline = false,
}: FloorSettingsModalProps) {
  const [controlLatency, setControlLatency] = useState(currentTimeRetard);

  const handleSave = () => {
    onSave(floorId, { timeRetard: controlLatency }); // keeping timeRetard for compatibility
    onClose();
  };

  const handleCancel = () => {
    setControlLatency(currentTimeRetard);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-brightness-30  flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Floor Control Settings
            </h2>
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
          <p className="text-blue-100 text-sm mt-1">{floorName}</p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* EDS Offline Warning */}
          {!isEdsOnline && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="shrink-0">
                  <svg
                    className="w-5 h-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-800">
                    EDS System Offline
                  </h4>
                  <p className="text-sm text-red-700 mt-1">
                    Floor settings cannot be configured when the EDS monitoring
                    system is offline. Please wait for system recovery.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Time Retard Setting */}
            <div>
              <label
                htmlFor="timeRetard"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                💡 Control Latency (seconds)
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="timeRetard"
                  min="0"
                  max="300"
                  step="0.5"
                  value={controlLatency}
                  onChange={(e) => setControlLatency(Number(e.target.value))}
                  disabled={!isEdsOnline}
                  className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 ${
                    !isEdsOnline
                      ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  }`}
                  placeholder="Enter latency time in seconds"
                />
                <div className="absolute right-3 top-3 text-gray-400 text-sm">
                  sec
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Delay time before lights/AC turn off when room becomes
                unoccupied (0-300 seconds)
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    About Control Latency
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Sets how long to wait before automatically turning off
                    lights and AC when a room becomes unoccupied. Higher values
                    prevent unnecessary on/off cycling.
                  </p>
                </div>
              </div>
            </div>

            {/* Control Preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-3">
                This setting affects:
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-500">💡</span>
                  <span className="text-sm text-gray-700">Room Lights</span>
                </div>
                <div className="text-xs text-green-600 font-medium">
                  Auto Turn-off
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500">❄️</span>
                  <span className="text-sm text-gray-700">
                    Air Conditioning
                  </span>
                </div>
                <div className="text-xs text-green-600 font-medium">
                  Auto Turn-off
                </div>
              </div>
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
            disabled={!isEdsOnline}
            className={`px-6 py-2 rounded-lg transition-colors duration-200 font-medium ${
              !isEdsOnline
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Apply Control Settings
          </button>
        </div>
      </div>
    </div>
  );
}
