"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  DownloadIcon,
  BarChart3Icon,
  FileSpreadsheetIcon,
} from "lucide-react";
import { useChartReportGeneration } from "@/hooks/useChartReportGeneration";

interface EnergyData {
  label: string;
  kWh: number;
  trend?: "up" | "down" | "stable";
  previousValue?: number;
  efficiency?: number;
}

type ChartTheme = "blue" | "green" | "purple" | "orange";

const themeColors = {
  blue: {
    primary: "#3b82f6",
    secondary: "#1d4ed8",
    light: "#eff6ff",
    text: "#1e40af",
  },
  green: {
    primary: "#10b981",
    secondary: "#047857",
    light: "#ecfdf5",
    text: "#065f46",
  },
  purple: {
    primary: "#8b5cf6",
    secondary: "#7c3aed",
    light: "#f3e8ff",
    text: "#6b21a8",
  },
  orange: {
    primary: "#f97316",
    secondary: "#ea580c",
    light: "#fff7ed",
    text: "#c2410c",
  },
};

interface TooltipPayload {
  value: number;
  color: string;
  dataKey: string;
  name: string;
  payload: EnergyData;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as EnergyData;
    const value = payload[0].value as number;
    const percentage = data.previousValue
      ? (((value - data.previousValue) / data.previousValue) * 100).toFixed(1)
      : null;

    return (
      <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3Icon className="w-4 h-4 text-blue-600" />
          <p className="text-sm font-semibold text-gray-900">{label}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Énergie consommée:</span>
            <span className="text-sm font-bold text-blue-600">
              {value.toLocaleString()} kWh
            </span>
          </div>
          <div className="text-xs text-gray-500 italic">
            (Consommation cumulée sur la période)
          </div>

          {data.efficiency && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Efficacité:</span>
              <span className="text-sm font-medium text-green-600">
                {data.efficiency}%
              </span>
            </div>
          )}

          {percentage && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Variation:</span>
              <div className="flex items-center gap-1">
                {parseFloat(percentage) > 0 ? (
                  <TrendingUpIcon className="w-3 h-3 text-red-500" />
                ) : (
                  <TrendingDownIcon className="w-3 h-3 text-green-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    parseFloat(percentage) > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {percentage}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function EnergyBarChart({
  data,
  title = "Consommation d'énergie (kWh)",
  className = "",
  theme = "blue",
  showAverage = true,
  showTrend = true,
  enableExport = true,
  animated = true,
}: {
  data: EnergyData[];
  title?: string;
  className?: string;
  theme?: ChartTheme;
  showAverage?: boolean;
  showTrend?: boolean;
  enableExport?: boolean;
  animated?: boolean;
}) {
  const colors = themeColors[theme];
  const { generateChartReport, loading: reportLoading } =
    useChartReportGeneration();
  // Handle empty or invalid data
  if (!data || data.length === 0) {
    return (
      <div
        className={`w-full min-h-[400px] bg-white p-6 rounded-xl shadow-sm border border-gray-100 ${className}`}
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
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
            <p className="text-gray-500 font-medium">
              Aucune donnée disponible
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Les données apparaîtront ici une fois collectées
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Advanced calculations
  const totalConsumption = data.reduce((sum, item) => sum + item.kWh, 0);
  const maxValue = Math.max(...data.map((item) => item.kWh));
  const averageValue = totalConsumption / data.length;
  const variance =
    data.reduce((sum, item) => sum + Math.pow(item.kWh - averageValue, 2), 0) /
    data.length;
  const standardDeviation = Math.sqrt(variance);

  // Trend analysis
  const trendData = data.map((item, index) => {
    if (index === 0) return { ...item, trend: "stable" as const };
    const previousValue = data[index - 1].kWh;
    const change = ((item.kWh - previousValue) / previousValue) * 100;
    return {
      ...item,
      trend:
        change > 5
          ? ("up" as const)
          : change < -5
          ? ("down" as const)
          : ("stable" as const),
      previousValue,
    };
  });

  // Dynamic bar colors based on performance
  const getBarColor = (value: number) => {
    if (value > averageValue * 1.2) return colors.secondary; // High consumption
    if (value < averageValue * 0.8) return "#10b981"; // Low consumption (good)
    return colors.primary; // Normal consumption
  };

  // Export functionality
  const exportData = () => {
    const csvContent = [
      ["Période", "Consommation (kWh)", "Tendance"],
      ...data.map((item) => [
        item.label,
        item.kWh.toString(),
        item.trend || "stable",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/\s+/g, "_").toLowerCase()}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`w-full min-h-[500px] bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 ${className}`}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Analyse détaillée de la consommation énergétique
            </p>
          </div>
          <div className="flex items-center gap-2">
            {enableExport && (
              <>
                <button
                  onClick={exportData}
                  className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                  title="Exporter CSV"
                >
                  <DownloadIcon className="w-4 h-4 mr-1" />
                  CSV
                </button>
                <button
                  onClick={() => {
                    const reportData = data.map((item) => ({
                      label: item.label,
                      kWh: item.kWh,
                      trend: item.trend || "stable",
                      previousValue: item.previousValue || 0,
                      efficiency: item.efficiency || 0,
                    }));
                    generateChartReport(reportData, title);
                  }}
                  disabled={reportLoading}
                  className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors disabled:opacity-50"
                  title="Générer rapport Excel"
                >
                  <FileSpreadsheetIcon className="w-4 h-4 mr-1" />
                  {reportLoading ? "..." : "Excel"}
                </button>
              </>
            )}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {data.length} entrées
            </span>
          </div>
        </div>

        {/* Enhanced Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-blue-700">TOTAL</span>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
            <p className="text-base lg:text-lg font-bold text-blue-900">
              {totalConsumption.toLocaleString()}
              <span className="text-xs lg:text-sm font-normal text-blue-600 ml-1">
                kWh
              </span>
            </p>
          </div>

          <div className="bg-linear-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-green-700">
                MOYENNE
              </span>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
            <p className="text-base lg:text-lg font-bold text-green-900">
              {Math.round(averageValue).toLocaleString()}
              <span className="text-xs lg:text-sm font-normal text-green-600 ml-1">
                kWh
              </span>
            </p>
          </div>

          <div className="bg-linear-to-br from-red-50 to-red-100 rounded-lg p-3 border border-red-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-red-700">
                MAXIMUM
              </span>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
            </div>
            <p className="text-base lg:text-lg font-bold text-red-900">
              {maxValue.toLocaleString()}
              <span className="text-xs lg:text-sm font-normal text-red-600 ml-1">
                kWh
              </span>
            </p>
          </div>

          <div className="bg-linear-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-orange-700">
                ÉCART-TYPE
              </span>
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            </div>
            <p className="text-base lg:text-lg font-bold text-orange-900">
              {Math.round(standardDeviation).toLocaleString()}
              <span className="text-xs lg:text-sm font-normal text-orange-600 ml-1">
                kWh
              </span>
            </p>
          </div>
        </div>

        {/* Trend Indicators */}
        {showTrend && (
          <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm bg-gray-50 rounded-lg p-3 border">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-gray-700 font-medium">Élevée</span>
              <span className="text-gray-500">
                (&gt;{Math.round(averageValue * 1.2).toLocaleString()})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors.primary }}
              ></div>
              <span className="text-gray-700 font-medium">Normale</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-gray-700 font-medium">Optimale</span>
              <span className="text-gray-500">
                (&lt;{Math.round(averageValue * 0.8).toLocaleString()})
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="h-96 relative mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trendData} barCategoryGap="20%">
            <defs>
              <linearGradient
                id={`gradient-${theme}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={colors.primary}
                  stopOpacity={0.9}
                />
                <stop
                  offset="60%"
                  stopColor={colors.secondary}
                  stopOpacity={0.7}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f3f4f6"
              strokeOpacity={0.6}
            />

            {/* Average Reference Line */}
            {showAverage && (
              <ReferenceLine
                y={averageValue}
                stroke={colors.primary}
                strokeDasharray="5 5"
                strokeOpacity={0.7}
                label={{ value: "Moyenne", position: "right", fontSize: 11 }}
              />
            )}

            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#6b7280", fontWeight: 500 }}
              tickLine={{ stroke: "#d1d5db" }}
              axisLine={{ stroke: "#d1d5db" }}
              height={50}
            />

            <YAxis
              tick={{ fontSize: 10, fill: "#6b7280" }}
              tickLine={{ stroke: "#d1d5db" }}
              axisLine={{ stroke: "#d1d5db" }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              width={50}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
              animationDuration={200}
            />

            <Bar
              dataKey="kWh"
              radius={[6, 6, 0, 0]}
              stroke={colors.secondary}
              strokeWidth={1}
              animationDuration={animated ? 800 : 0}
              animationBegin={100}
            >
              {trendData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.kWh)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Performance Indicator */}
        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 border border-gray-200">
          <div className="text-xs text-gray-600 mb-1 font-medium">
            Performance
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span className="text-xs font-semibold text-green-700">
                {trendData.filter((d) => d.kWh < averageValue * 0.8).length}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: colors.primary }}
              ></div>
              <span
                className="text-xs font-semibold"
                style={{ color: colors.text }}
              >
                {
                  trendData.filter(
                    (d) =>
                      d.kWh >= averageValue * 0.8 && d.kWh <= averageValue * 1.2
                  ).length
                }
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              <span className="text-xs font-semibold text-red-700">
                {trendData.filter((d) => d.kWh > averageValue * 1.2).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
