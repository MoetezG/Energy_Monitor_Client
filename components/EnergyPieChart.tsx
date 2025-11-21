"use client";
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { FileSpreadsheetIcon } from "lucide-react";
import { useChartReportGeneration } from "@/hooks/useChartReportGeneration";

const COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#06b6d4", // Cyan
];

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const total = payload.reduce(
      (sum: number, item: TooltipPayloadItem) => sum + item.value,
      0
    );
    return (
      <div className="card-glass p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <div>
            <p className="text-sm font-semibold text-gray-900">{data.name}</p>
            <p className="text-lg font-bold" style={{ color: data.color }}>
              {data.value.toLocaleString()} kWh
            </p>
            <p className="text-xs text-gray-500">
              {((data.value / total) * 100).toFixed(1)}% of total
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function EnergyPieChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const { generateChartReport, loading: reportLoading } =
    useChartReportGeneration();

  return (
    <div className="card-glass w-full min-h-[500px] p-8 relative">
      <div className="absolute inset-0 bg-linear-to-br from-blue-50/30 via-purple-50/20 to-indigo-50/30"></div>
      <div className="relative z-10">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Energy Distribution Analysis
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Breakdown of consumption by category
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-full border border-blue-200/50">
                <span className="text-sm font-semibold text-blue-700">
                  Total: {total.toLocaleString()} kWh
                </span>
              </div>
              <button
                onClick={() =>
                  generateChartReport(data, "Energy Distribution Analysis")
                }
                disabled={reportLoading}
                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors disabled:opacity-50"
                title="Générer rapport Excel"
              >
                <FileSpreadsheetIcon className="w-4 h-4 mr-2" />
                {reportLoading ? "Génération..." : "Export Excel"}
              </button>
            </div>
          </div>
          <div className="w-16 h-1 bg-linear-to-r from-blue-400 to-purple-400 rounded-full"></div>
        </div>

        <div className="h-96 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {COLORS.map((color, index) => (
                  <linearGradient
                    key={index}
                    id={`gradient${index}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={1}
                dataKey="value"
                animationBegin={0}
                animationDuration={2000}
                label={(entry) => `${entry.name}: ${entry.value} `}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#gradient${index % COLORS.length})`}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
