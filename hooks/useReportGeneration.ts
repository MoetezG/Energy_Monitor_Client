import { useState } from "react";
import { scadaAPI, ReportRequest, ReportResponse } from "@/lib/api";

interface UseReportGenerationResult {
  generateReport: (request: ReportRequest) => Promise<void>;
  downloadReport: (filePath: string, fileName?: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  generatedReport: ReportResponse | null;
  clearError: () => void;
  clearReport: () => void;
}

export const useReportGeneration = (): UseReportGenerationResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<ReportResponse | null>(
    null
  );

  const clearError = () => setError(null);
  const clearReport = () => setGeneratedReport(null);

  const generateReport = async (request: ReportRequest) => {
    setLoading(true);
    setError(null);
    setGeneratedReport(null);

    try {
      const response = await scadaAPI.generateReport(request);

      if (response.success && response.data) {
        setGeneratedReport(response.data);
      } else {
        setError(response.error || "Failed to generate report");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate report"
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (filePath: string, fileName?: string) => {
    try {
      const blob = await scadaAPI.downloadReport(filePath);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName || filePath.split("/").pop() || "report.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError("Failed to download report");
    }
  };

  return {
    generateReport,
    downloadReport,
    loading,
    error,
    generatedReport,
    clearError,
    clearReport,
  };
};
