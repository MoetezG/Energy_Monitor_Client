"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import { useToast } from "@/components/ToastProvider";

export interface HeartbeatStatus {
  type: string;
  data?: unknown;
  message?: string;
  timestamp: string;
  source?: string;
  clientId?: string;
}

export interface EDSStatus {
  online: boolean;
  lastHeartbeat?: string;
  failures: number;
  responseTime?: string;
  lastError?: {
    message: string;
    timestamp: string;
  } | null;
  deviceInfo: {
    ip: string;
    port: number;
    model: string;
    firmware: string;
  };
  timestamp: string;
  uptime?: number | null;
}

export interface RealTimeDataStatus {
  type: string;
  online?: boolean;
  failures?: number;
  maxFailures?: number;
  message?: string;
  timestamp: string;
}

export interface SystemStatus {
  isOnline: boolean;
  lastHeartbeat?: string;
  uptime?: number;
  errorCount: number;
  successCount: number;
  connectionStatus: "connected" | "disconnected" | "connecting" | "error";
}

export function useHeartbeatWebSocket() {
  const { showToast } = useToast();
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    isOnline: false,
    errorCount: 0,
    successCount: 0,
    connectionStatus: "disconnected",
  });
  const [edsStatus, setEdsStatus] = useState<EDSStatus | null>(null);
  const [recentEvents, setRecentEvents] = useState<HeartbeatStatus[]>([]);
  const [lastHeartbeatEvent, setLastHeartbeatEvent] =
    useState<HeartbeatStatus | null>(null);

  // Toast tracking to prevent duplicate notifications
  const [lastToastStatus, setLastToastStatus] = useState<
    "online" | "warning" | "offline" | null
  >(null);
  const [lastRealtimeToastStatus, setLastRealtimeToastStatus] = useState<
    "online" | "warning" | "offline" | null
  >(null);

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectRef = useRef<(() => void) | null>(null);

  const serverUrl =
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8080";

  // Function to show EDS status toast notifications
  const handleEDSStatusToast = useCallback(
    (
      newStatus: "online" | "warning" | "offline",
      details?: { failures?: number; [key: string]: unknown }
    ) => {
      // Only show toast if status has changed to prevent spam
      if (lastToastStatus !== newStatus) {
        switch (newStatus) {
          case "warning":
            showToast({
              type: "warning",
              title: "EDS Connection Warning",
              message: `Heartbeat failed (${
                details?.failures || "N/A"
              }/3). Attempting to reconnect...`,
            });
            break;
          case "offline":
            showToast({
              type: "error",
              title: "EDS System Offline",
              message:
                "Maximum connection failures reached. EDS device is not responding.",
            });
            break;
          case "online":
            if (
              lastToastStatus === "offline" ||
              lastToastStatus === "warning"
            ) {
              showToast({
                type: "success",
                title: "EDS System Online",
                message: "Connection to EDS device restored successfully.",
              });
            }
            break;
        }
        setLastToastStatus(newStatus);
      }
    },
    [lastToastStatus, showToast]
  );

  // Function to show real-time data status toast notifications
  const handleRealtimeDataToast = useCallback(
    (
      newStatus: "online" | "warning" | "offline",
      details?: { failures?: number; maxFailures?: number }
    ) => {
      // Only show toast if status has changed to prevent spam
      if (lastRealtimeToastStatus !== newStatus) {
        switch (newStatus) {
          case "warning":
            showToast({
              type: "warning",
              title: "Data Fetch Warning",
              message: `Real-time data fetch failed (${
                details?.failures || "N/A"
              }/${details?.maxFailures || 3}). Retrying...`,
            });
            break;
          case "offline":
            showToast({
              type: "error",
              title: "Real-time Data Offline",
              message:
                "Maximum data fetch failures reached. Real-time monitoring disabled.",
            });
            break;
          case "online":
            if (
              lastRealtimeToastStatus === "offline" ||
              lastRealtimeToastStatus === "warning"
            ) {
              showToast({
                type: "success",
                title: "Real-time Data Restored",
                message: "Data fetching resumed successfully.",
              });
            }
            break;
        }
        setLastRealtimeToastStatus(newStatus);
      }
    },
    [lastRealtimeToastStatus, showToast]
  );

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSystemStatus((prev) => ({
      ...prev,
      connectionStatus: "disconnected",
      isOnline: false,
    }));
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setSystemStatus((prev) => ({ ...prev, connectionStatus: "connecting" }));

    const socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      timeout: 10000,
      forceNew: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to heartbeat WebSocket");
      setSystemStatus((prev) => ({
        ...prev,
        connectionStatus: "connected",
        isOnline: true,
      }));
    });

    socket.on("disconnect", (reason: string) => {
      console.log("❌ Disconnected from heartbeat WebSocket:", reason);
      setSystemStatus((prev) => ({
        ...prev,
        connectionStatus: "disconnected",
        isOnline: false,
      }));

      // Attempt to reconnect after 5 seconds
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("🔄 Attempting to reconnect...");
          reconnectTimeoutRef.current = null;
          if (connectRef.current) {
            connectRef.current();
          }
        }, 5000);
      }
    });

    socket.on("connect_error", (error: Error) => {
      console.error("❌ WebSocket connection error:", error);
      setSystemStatus((prev) => ({
        ...prev,
        connectionStatus: "error",
        isOnline: false,
        errorCount: prev.errorCount + 1,
      }));
    });

    // Listen for heartbeat status events
    socket.on("heartbeat_status", (data: HeartbeatStatus) => {
      console.log("💓 Heartbeat event received:", data);

      setLastHeartbeatEvent(data);

      // Add to recent events (keep last 50)
      setRecentEvents((prev) => {
        const newEvents = [data, ...prev].slice(0, 50);
        return newEvents;
      });

      // Update system status based on event type
      switch (data.type) {
        case "connection":
          setSystemStatus((prev) => ({
            ...prev,
            isOnline: true,
            successCount: prev.successCount + 1,
            lastHeartbeat: data.timestamp,
          }));
          break;

        case "heartbeat_attempt":
        case "listener_registration":
          setSystemStatus((prev) => ({
            ...prev,
            lastHeartbeat: data.timestamp,
            successCount: prev.successCount + 1,
            isOnline: true,
          }));
          break;

        case "listener_registration_error":
        case "eds_event_parse_error":
          setSystemStatus((prev) => ({
            ...prev,
            errorCount: prev.errorCount + 1,
            isOnline: false,
          }));
          break;

        case "heartbeat_service_started":
          setSystemStatus((prev) => ({
            ...prev,
            isOnline: true,
            lastHeartbeat: data.timestamp,
          }));
          break;

        case "eds_event_parsed":
          setSystemStatus((prev) => ({
            ...prev,
            lastHeartbeat: data.timestamp,
            isOnline: true,
          }));
          break;

        case "eds_status_check":
          setSystemStatus((prev) => ({
            ...prev,
            lastHeartbeat: data.timestamp,
            isOnline: (data.data as { online?: boolean })?.online || false,
            successCount: prev.successCount + 1,
          }));
          break;

        case "eds_status_offline":
          setSystemStatus((prev) => ({
            ...prev,
            isOnline: false,
            errorCount: prev.errorCount + 1,
          }));
          handleEDSStatusToast("offline");
          break;

        case "eds_status_warning":
          setSystemStatus((prev) => ({
            ...prev,
            errorCount: prev.errorCount + 1,
          }));
          handleEDSStatusToast("warning", data.data as { failures?: number });
          break;
      }
    });

    // Listen for EDS status updates
    socket.on("eds_status", (data: EDSStatus) => {
      console.log("📡 EDS Status received:", data);
      setEdsStatus(data);

      // Handle toast notifications based on EDS status changes
      if (data.online && data.failures === 0) {
        handleEDSStatusToast("online");
      } else if (data.failures >= 3 && !data.online) {
        handleEDSStatusToast("offline");
      } else if (data.failures > 0 && data.failures < 3) {
        handleEDSStatusToast("warning", { failures: data.failures });
      }

      // Also update system status based on EDS status
      setSystemStatus((prev) => ({
        ...prev,
        isOnline: data.online,
        lastHeartbeat: data.lastHeartbeat || prev.lastHeartbeat,
        uptime: data.uptime || prev.uptime,
      }));
    });

    // Listen for real-time data status updates
    socket.on("real_time_status", (data: RealTimeDataStatus) => {
      console.log("📊 Real-time data status received:", data);

      // Handle toast notifications based on real-time data status
      if (data.type === "real_time_data_offline") {
        handleRealtimeDataToast("offline");
      } else if (data.type === "real_time_data_warning") {
        handleRealtimeDataToast("warning", {
          failures: data.failures,
          maxFailures: data.maxFailures,
        });
      } else if (
        data.type === "real_time_data_reset" ||
        (data.online && data.failures === 0)
      ) {
        handleRealtimeDataToast("online");
      }
    });
  }, [serverUrl, handleEDSStatusToast, handleRealtimeDataToast]);

  // Store connect reference for reconnection
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  // Auto-connect on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      connect();
    }, 100);

    return () => {
      clearTimeout(timer);
      disconnect();
    };
  }, [connect, disconnect]);

  // Calculate uptime
  const calculateUptime = useCallback(() => {
    if (!systemStatus.lastHeartbeat) return 0;
    return Date.now() - new Date(systemStatus.lastHeartbeat).getTime();
  }, [systemStatus.lastHeartbeat]);

  return {
    systemStatus: {
      ...systemStatus,
      uptime: calculateUptime(),
    },
    edsStatus,
    lastHeartbeatEvent,
    recentEvents,
    isConnected: systemStatus.connectionStatus === "connected",
    reconnect,
    disconnect,
  };
}
