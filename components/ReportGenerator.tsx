import React, { useState, useEffect } from "react";
import { useReportGeneration } from "@/hooks/useReportGeneration";
import {
  scadaAPI,
  ReportRequest,
  DatabaseDevice,
  VariableRecord,
} from "@/lib/api";

type Period = "day" | "week" | "month";

interface ReportGeneratorProps {
  className?: string;
}

export default function ReportGenerator({
  className = "",
}: ReportGeneratorProps) {
  const [devices, setDevices] = useState<DatabaseDevice[]>([]);
  const [variables, setVariables] = useState<VariableRecord[]>([]);
  const [formData, setFormData] = useState({
    variableId: "",
    startTime: "",
    endTime: "",
    period: "day" as Period,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const {
    generateReport,
    downloadReport,
    loading,
    error,
    generatedReport,
    clearError,
    clearReport,
  } = useReportGeneration();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [devicesResponse, variablesResponse] = await Promise.all([
          scadaAPI.getDatabaseDevices(),
          scadaAPI.getVariableList(),
        ]);

        if (devicesResponse.success && devicesResponse.data) {
          setDevices(devicesResponse.data);
        }

        if (variablesResponse.success && variablesResponse.data) {
          const enabledVariables = variablesResponse.data.filter(
            (v: VariableRecord) => v.enabled !== false
          );
          setVariables(enabledVariables);

          if (enabledVariables.length > 0) {
            setFormData((prev) => ({
              ...prev,
              variableId: enabledVariables[0].id.toString(),
            }));
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError();
  };

  const getDefaultStartTime = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().slice(0, 16);
  };

  const getDefaultEndTime = () => {
    return new Date().toISOString().slice(0, 16);
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.variableId || !formData.startTime || !formData.endTime) {
      return;
    }

    // Convert datetime-local format (YYYY-MM-DDTHH:MM) to date format (YYYY-MM-DD)
    const formatDate = (datetimeLocal: string) => {
      return datetimeLocal.split("T")[0];
    };

    const reportRequest: ReportRequest = {
      variableId: formData.variableId,
      startTime: formatDate(formData.startTime || getDefaultStartTime()),
      endTime: formatDate(formData.endTime || getDefaultEndTime()),
      period: formData.period,
    };

    await generateReport(reportRequest);
  };

  const handleDownloadReport = async () => {
    if (!generatedReport?.filePath) return;

    const fileName = generatedReport.filePath.split("/").pop() || "report.csv";
    await downloadReport(generatedReport.filePath, fileName);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      clearError();
      clearReport();
    }
  };

  return (
    <div
      className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 ${className}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 transition-colors duration-200"
        onClick={toggleExpanded}
      >
        <div className="flex items-center space-x-3\">
          <div className="p-2 bg-orange-100 rounded-lg\">
            <svg
              className="w-5 h-5 text-orange-600\"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Report Generator</h3>
            <p className="text-sm text-gray-500">Export data as CSV reports</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {generatedReport && (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          <form onSubmit={handleGenerateReport} className="space-y-4">
            {/* Device and Period in one row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variable
                </label>
                <select
                  name="variableId"
                  value={formData.variableId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Select variable...</option>
                  {variables.map((variable) => {
                    const device = devices.find(
                      (d) => d.id === variable.device_id
                    );
                    return (
                      <option key={variable.id} value={variable.id}>
                        {variable.name || variable.var_code} (
                        {device?.name || "Unknown Device"})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period
                </label>
                <select
                  name="period"
                  value={formData.period}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                >
                  <option value="raw">Raw Data</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime || getDefaultStartTime()}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime || getDefaultEndTime()}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 text-red-400 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Generating...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Generate Report
                </div>
              )}
            </button>
          </form>

          {/* Generated Report */}
          {generatedReport && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800 mb-1">
                    {generatedReport.message}
                  </p>
                  <p className="text-xs text-green-600">
                    File: {generatedReport.filePath.split("/").pop()}
                  </p>
                </div>
                <button
                  onClick={handleDownloadReport}
                  className="bg-green-600 text-white font-medium py-1.5 px-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all duration-200 text-sm"
                >
                  <div className="flex items-center">
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
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
