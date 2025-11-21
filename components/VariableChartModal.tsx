"use client";

import React, { useState, useEffect } from "react";
import MultiVariableChart from "./MultiVariableChart";
import { VariableRecord, DatabaseDevice } from "@/lib/api";

interface VariableChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  variable: {
    deviceId: number;
    deviceName: string;
    variableCode: string;
    variableName: string;
    value?: number | string | boolean;
    unit: string;
    timestamp?: Date;
    status: "online" | "offline" | "warning" | "error";
  } | null;
  variableRecord?: VariableRecord;
  device?: DatabaseDevice;
}

export default function VariableChartModal({
  isOpen,
  onClose,
  variable,
  variableRecord,
  device,
}: VariableChartModalProps) {
  const [chartKey, setChartKey] = useState(0);

  // Reset chart when modal opens/closes or variable changes
  useEffect(() => {
    if (isOpen && variable) {
      const timeoutId = setTimeout(() => {
        setChartKey((prev) => prev + 1);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, variable]);

  const handleClose = () => {
    onClose();
  };

  if (!isOpen || !variable) return null;

  return (
    <div className="fixed inset-0  z-50 overflow-y-auto">
      <div className="flex h-full  items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative w-full   max-w-6xl transform rounded-2xl bg-white shadow-xl transition-all">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Variable Chart: {variable.variableName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Device: {variable.deviceName}
                    {variable.value !== undefined && (
                      <>
                        {" • Current Value: "}
                        <span className="font-medium">
                          {typeof variable.value === "number"
                            ? variable.value.toFixed(2)
                            : variable.value}{" "}
                          {variable.unit}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {/* Status indicator */}
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      variable.status === "online"
                        ? "bg-green-500"
                        : variable.status === "warning"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium capitalize ${
                      variable.status === "online"
                        ? "text-green-700"
                        : variable.status === "warning"
                        ? "text-yellow-700"
                        : "text-red-700"
                    }`}
                  >
                    {variable.status}
                  </span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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

            {/* Variable Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">
                    Variable Code
                  </span>
                  <p className="font-mono text-gray-900">
                    {variable.variableCode}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Device ID</span>
                  <p className="text-gray-900">{variable.deviceId}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Last Update</span>
                  <p className="text-gray-900">
                    {variable.timestamp
                      ? variable.timestamp.toLocaleString()
                      : "No real-time data (Config mode)"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Unit</span>
                  <p className="text-gray-900">{variable.unit || "No unit"}</p>
                </div>
              </div>
            </div>

            {/* Chart Container */}
            <div className="bg-white rounded-lg border overflow-auto  border-gray-200">
              <div className="p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Historical Data
                </h4>
                <div className="h-96">
                  <MultiVariableChart
                    key={chartKey}
                    height={384}
                    className="w-full"
                    maxVariables={1}
                    preselectedVariable={variableRecord}
                    preselectedDevice={device}
                    singleVariableMode={true}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
