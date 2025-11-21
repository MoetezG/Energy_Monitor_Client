import { useState } from "react";
import { scadaAPI, ReportRequest } from "@/lib/api";

interface ChartDataItem {
  [key: string]: string | number | boolean | null | undefined;
}

interface UseChartReportGenerationResult {
  generateChartReport: (data: ChartDataItem[], chartTitle: string) => Promise<void>;
  generateVariableReport: (variableId: string, startTime?: Date, endTime?: Date) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useChartReportGeneration = (): UseChartReportGenerationResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Generate CSV from chart data directly
  const generateChartReport = async (data: ChartDataItem[], chartTitle: string) => {
    setLoading(true);
    setError(null);

    try {
      // Convert chart data to CSV
      let csvContent = "";
      let headers: string[] = [];
      
      if (data && data.length > 0) {
        // Determine headers based on data structure
        const firstItem = data[0];
        headers = Object.keys(firstItem).filter(key => 
          typeof firstItem[key] === 'number' || 
          typeof firstItem[key] === 'string' || 
          key.includes('timestamp') || 
          key.includes('time') ||
          key.includes('date') ||
          key === 'label' ||
          key === 'name' ||
          key === 'value' ||
          key === 'kWh'
        );
        
        // Create CSV headers
        csvContent += headers.join(",") + "\n";
        
        // Add data rows
        data.forEach(item => {
          const row = headers.map(header => {
            const value = item[header];
            // Handle different data types
            if (value === null || value === undefined) return "";
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`;
            }
            return value;
          });
          csvContent += row.join(",") + "\n";
        });
      } else {
        csvContent = "No data available\n";
      }

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const fileName = `${chartTitle.replace(/[^a-z0-9]/gi, '_')}_report_${timestamp}.csv`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate chart report");
    } finally {
      setLoading(false);
    }
  };

  // Generate report using the API for a specific variable
  const generateVariableReport = async (variableId: string, startTime?: Date, endTime?: Date) => {
    setLoading(true);
    setError(null);

    try {
      const defaultStartTime = startTime || new Date(new Date().setDate(new Date().getDate() - 7));
      const defaultEndTime = endTime || new Date();

      const reportRequest: ReportRequest = {
        variableId: variableId,
        startTime: defaultStartTime.toISOString().split('T')[0],
        endTime: defaultEndTime.toISOString().split('T')[0],
        period: "hour",
      };

      const response = await scadaAPI.generateReport(reportRequest);

      if (response.success && response.data) {
        // Download the generated report
        const fileName = response.data.filePath.split("/").pop() || `variable_${variableId}_report.csv`;
        const blob = await scadaAPI.downloadReport(response.data.filePath);
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.style.display = "none";
        link.href = url;
        link.download = fileName;
        
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } else {
        setError(response.error || "Failed to generate variable report");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate variable report");
    } finally {
      setLoading(false);
    }
  };

  return {
    generateChartReport,
    generateVariableReport,
    loading,
    error,
    clearError,
  };
};