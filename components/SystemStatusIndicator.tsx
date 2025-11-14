"use client";

import { useHeartbeatWebSocket } from "@/hooks/useHeartbeatWebSocket";
import { useEffect, useState } from "react";

interface SystemStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function SystemStatusIndicator({
  className = "",
  showDetails = false,
}: SystemStatusIndicatorProps) {
  const { systemStatus, edsStatus, isConnected } = useHeartbeatWebSocket();
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    const updateTimeAgo = () => {
      if (systemStatus.lastHeartbeat) {
        const diff =
          Date.now() - new Date(systemStatus.lastHeartbeat).getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        if (minutes > 0) {
          setTimeAgo(`${minutes}m ${seconds}s ago`);
        } else {
          setTimeAgo(`${seconds}s ago`);
        }
      } else {
        setTimeAgo("Never");
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [systemStatus.lastHeartbeat]);

  const getStatusColor = () => {
    if (!isConnected) return "bg-gray-400";
    if (systemStatus.isOnline && edsStatus?.online) return "bg-green-400";
    if (edsStatus?.online === false) return "bg-red-400";
    if (systemStatus.isOnline) return "bg-yellow-400";
    return "bg-red-400";
  };

  const getStatusText = () => {
    if (!isConnected) return "Disconnected";
    if (systemStatus.isOnline && edsStatus?.online) return "System Online";
    if (edsStatus?.online === false) return "System Offline";
    if (systemStatus.isOnline) return "System Online";
    return "System Offline";
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Status indicator dot with pulse animation for online status */}
      <div className="relative">
        <div
          className={`w-3 h-3 rounded-full ${getStatusColor()} ${
            systemStatus.isOnline && edsStatus?.online && isConnected
              ? "animate-pulse"
              : ""
          }`}
        />
        {systemStatus.isOnline && edsStatus?.online && isConnected && (
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping opacity-75" />
        )}
      </div>

      {/* Status text */}
      <span className="text-sm font-medium text-gray-700">
        {getStatusText()}
      </span>

      {/* Show details if requested */}
      {showDetails && (
        <div className="text-xs text-gray-500 ml-2">
          <div>Last heartbeat: {timeAgo}</div>
          <div>
            Success: {systemStatus.successCount} | Errors:{" "}
            {systemStatus.errorCount}
          </div>
        </div>
      )}
    </div>
  );
}

interface HeartbeatMonitorProps {
  className?: string;
}

export function HeartbeatMonitor({ className = "" }: HeartbeatMonitorProps) {
  const {
    systemStatus,
    edsStatus,
    isConnected,
    recentEvents,
    lastHeartbeatEvent,
    reconnect,
  } = useHeartbeatWebSocket();
  const [isExpanded, setIsExpanded] = useState(false);

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptime % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getEventTypeColor = (type: string) => {
    if (type.includes("error") || type.includes("Error")) return "text-red-600";
    if (
      type.includes("success") ||
      type.includes("registration") ||
      type.includes("parsed")
    )
      return "text-green-600";
    return "text-blue-600";
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SystemStatusIndicator />
            <div className="text-sm text-gray-600">
              WebSocket: {systemStatus.connectionStatus}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isConnected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  reconnect();
                }}
                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Reconnect
              </button>
            )}
            <svg
              className={`w-4 h-4 text-gray-400 transform transition-transform ${
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
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* System Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs font-medium text-gray-500 uppercase">
                Uptime
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {systemStatus.uptime
                  ? formatUptime(systemStatus.uptime)
                  : "N/A"}
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded">
              <div className="text-xs font-medium text-green-600 uppercase">
                Success Count
              </div>
              <div className="text-lg font-semibold text-green-800">
                {systemStatus.successCount}
              </div>
            </div>

            <div className="bg-red-50 p-3 rounded">
              <div className="text-xs font-medium text-red-600 uppercase">
                Error Count
              </div>
              <div className="text-lg font-semibold text-red-800">
                {systemStatus.errorCount}
              </div>
            </div>
          </div>

          {/* EDS Device Status */}
          {edsStatus && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-800 uppercase mb-3">
                EDS Device Status
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-2 rounded">
                  <div className="text-xs text-gray-500">Status</div>
                  <div
                    className={`font-semibold ${
                      edsStatus.online ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {edsStatus.online ? "Online" : "Offline"}
                  </div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="text-xs text-gray-500">Response Time</div>
                  <div className="font-semibold text-gray-900">
                    {edsStatus.responseTime || "N/A"}
                  </div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="text-xs text-gray-500">Failures</div>
                  <div className="font-semibold text-orange-600">
                    {edsStatus.failures}
                  </div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="text-xs text-gray-500">Device IP</div>
                  <div className="font-semibold text-gray-900">
                    {edsStatus.deviceInfo.ip}:{edsStatus.deviceInfo.port}
                  </div>
                </div>
              </div>
              {edsStatus.lastError && (
                <div className="mt-3 bg-red-50 p-2 rounded border border-red-200">
                  <div className="text-xs font-medium text-red-600">
                    Last Error:
                  </div>
                  <div className="text-sm text-red-800">
                    {edsStatus.lastError.message}
                  </div>
                  <div className="text-xs text-red-500 mt-1">
                    {new Date(edsStatus.lastError.timestamp).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Last Event */}
          {lastHeartbeatEvent && (
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                Latest Event
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <div
                    className={`font-medium ${getEventTypeColor(
                      lastHeartbeatEvent.type
                    )}`}
                  >
                    {lastHeartbeatEvent.type.replace(/_/g, " ").toUpperCase()}
                  </div>
                  {lastHeartbeatEvent.message && (
                    <div className="text-sm text-gray-600 mt-1">
                      {lastHeartbeatEvent.message}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(lastHeartbeatEvent.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {/* Recent Events */}
          {recentEvents.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                Recent Events
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {recentEvents.slice(0, 10).map((event, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-1 px-2 text-xs bg-gray-50 rounded"
                  >
                    <span className={getEventTypeColor(event.type)}>
                      {event.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-gray-400">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
