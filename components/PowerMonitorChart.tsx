"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  ZapIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ActivityIcon,
} from "lucide-react";

interface PowerData {
  deviceId: string;
  zone: string;
  currentPower: number;
  unit: string;
  timestamp: Date;
  trend?: "up" | "down" | "stable";
  previousValue?: number;
}

interface TooltipPayload {
  value: number;
  color: string;
  dataKey: string;
  name: string;
  payload: PowerData;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as PowerData;
    const value = payload[0].value as number;

    return (
      <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <ZapIcon className="w-4 h-4 text-orange-600" />
          <p className="text-sm font-semibold text-gray-900">{data.zone}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Puissance instantanée:
            </span>
            <span className="text-sm font-bold text-orange-600">
              {value.toFixed(1)} {data.unit}
            </span>
          </div>
          <div className="text-xs text-gray-500 italic">
            (Mesure en temps réel)
          </div>
          <div className="text-xs text-gray-400">Device: {data.deviceId}</div>
          <div className="text-xs text-gray-400">
            Horodatage: {data.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function PowerMonitorChart({
  data,
  title = "Surveillance de puissance en temps réel",
  className = "",
  showGrid = true,
  animated = true,
}: {
  data: PowerData[];
  title?: string;
  className?: string;
  showGrid?: boolean;
  animated?: boolean;
}) {
  const maxPower = Math.max(...data.map((d) => d.currentPower));
  const avgPower =
    data.reduce((sum, d) => sum + d.currentPower, 0) / data.length;
  const totalPower = data.reduce((sum, d) => sum + d.currentPower, 0);

  // Calculate trend indicators
  const trendsData = data.map((item, index) => {
    if (index === 0) return { ...item, trend: "stable" as const };
    const previous = data[index - 1];
    const change =
      ((item.currentPower - previous.currentPower) / previous.currentPower) *
      100;

    if (change > 5) return { ...item, trend: "up" as const };
    if (change < -5) return { ...item, trend: "down" as const };
    return { ...item, trend: "stable" as const };
  });

  return (
    <div
      className={`bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-orange-100 ${className}`}
    >
      <div className="absolute inset-0 bg-linear-to-br from-orange-50/30 via-amber-50/20 to-yellow-50/30 rounded-3xl"></div>
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-linear-to-r from-orange-500 to-amber-500 rounded-xl">
                <ActivityIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-linear-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {title}
              </h2>
            </div>
            <p className="text-sm text-gray-600">
              Puissance instantanée par zone - Données temps réel
            </p>
          </div>

          {/* Real-time indicators */}
          <div className="flex items-center gap-4">
            <div className="bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
              <div className="text-xs text-orange-700 font-medium">Total</div>
              <div className="text-lg font-bold text-orange-600">
                {totalPower.toFixed(1)} kW
              </div>
            </div>
            <div className="bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
              <div className="text-xs text-amber-700 font-medium">Moyenne</div>
              <div className="text-lg font-bold text-amber-600">
                {avgPower.toFixed(1)} kW
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Live</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200"
                />
              )}
              <XAxis
                dataKey="zone"
                className="text-xs fill-gray-500"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                className="text-xs fill-gray-500"
                tick={{ fontSize: 12 }}
                label={{
                  value: "Puissance (kW)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Average line */}
              <ReferenceLine
                y={avgPower}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                label={{
                  value: "Moyenne",
                  position: "topRight",
                  className: "fill-amber-600 text-xs",
                }}
              />

              <Line
                type="monotone"
                dataKey="currentPower"
                stroke="#ea580c"
                strokeWidth={3}
                dot={{ fill: "#ea580c", strokeWidth: 2, r: 6 }}
                activeDot={{
                  r: 8,
                  stroke: "#ea580c",
                  strokeWidth: 2,
                  fill: "#fff",
                }}
                animationDuration={animated ? 750 : 0}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Device Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendsData.map((device) => (
            <div
              key={device.deviceId}
              className="bg-white/70 p-4 rounded-xl border border-orange-100"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-900">
                  {device.zone}
                </div>
                <div className="flex items-center gap-1">
                  {device.trend === "up" && (
                    <TrendingUpIcon className="w-4 h-4 text-red-500" />
                  )}
                  {device.trend === "down" && (
                    <TrendingDownIcon className="w-4 h-4 text-green-500" />
                  )}
                  {device.trend === "stable" && (
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{device.deviceId}</span>
                <span className="text-lg font-bold text-orange-600">
                  {device.currentPower.toFixed(1)} {device.unit}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-linear-to-r from-orange-400 to-amber-400 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(device.currentPower / maxPower) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-amber-50/50 rounded-xl border border-amber-200">
          <div className="flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Temps réel</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUpIcon className="w-3 h-3 text-red-500" />
                <span>Tendance hausse</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingDownIcon className="w-3 h-3 text-green-500" />
                <span>Tendance baisse</span>
              </div>
            </div>
            <div className="italic">
              Puissance instantanée (kW) - Mise à jour:{" "}
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
