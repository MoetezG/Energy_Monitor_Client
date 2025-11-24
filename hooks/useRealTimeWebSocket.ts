"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import { scadaAPI, VariableRecord, DatabaseDevice } from "@/lib/api";

export interface WebSocketVariableData {
  variable_id: number;
  var_code: string;
  value: number | string | boolean;
  meta: any;
}

export interface RealTimeWebSocketData {
  variables: WebSocketVariableData[];
  timestamp: string;
  raw_response?: any;
}

export interface EnhancedRealTimeVariableData {
  variable_id: number;
  var_code: string;
  device_id: number;
  device_name: string;
  variable_name: string;
  value: number | string | boolean;
  unit: string;
  timestamp: Date;
  status: "online" | "offline" | "warning" | "error";
}

export interface DeviceStatus {
  device_id: number;
  device_name: string;
  status: "online" | "offline" | "warning" | "error";
  online_variables: number;
  total_variables: number;
  last_seen: Date;
  offline_variables: string[];
}

export interface UseRealTimeWebSocketReturn {
  realTimeData: EnhancedRealTimeVariableData[];
  deviceStatuses: DeviceStatus[];
  isConnected: boolean;
  error: string | null;
  loading: boolean;
  lastUpdate: Date | null;
  deviceCount: number;
  variableCount: number;
  rawData: RealTimeWebSocketData | null;
}

export function useRealTimeWebSocket(
  serverUrl: string = "http://localhost:8080"
): UseRealTimeWebSocketReturn {
  const [realTimeData, setRealTimeData] = useState<
    EnhancedRealTimeVariableData[]
  >([]);
  const [deviceStatuses, setDeviceStatuses] = useState<DeviceStatus[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [devices, setDevices] = useState<DatabaseDevice[]>([]);
  const [variables, setVariables] = useState<VariableRecord[]>([]);
  const [rawData, setRawData] = useState<RealTimeWebSocketData | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Load initial device and variable metadata
  const loadMetadata = useCallback(async () => {
    setLoading(true);
    try {
      const [devResp, varResp] = await Promise.all([
        scadaAPI.getDatabaseDevices(),
        scadaAPI.getVariableList(),
      ]);

      if (devResp.success && devResp.data) {
        const devs: DatabaseDevice[] = Array.isArray(devResp.data)
          ? (devResp.data as DatabaseDevice[])
          : [devResp.data as DatabaseDevice];
        setDevices(devs);
      }

      if (varResp.success && varResp.data) {
        setVariables(varResp.data as VariableRecord[]);
      }
    } catch (err) {
      setError("Failed to load device and variable metadata");
      console.error("Metadata loading error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Process WebSocket data and enhance it with metadata
  const processWebSocketData = useCallback(
    (wsData: RealTimeWebSocketData) => {
      if (!wsData.variables || variables.length === 0 || devices.length === 0) {
        return [];
      }

      const enhancedData: EnhancedRealTimeVariableData[] = wsData.variables
        .map((wsVar) => {
          // Find the corresponding database variable
          const dbVar = variables.find((v) => v.id === wsVar.variable_id);

          if (!dbVar) {
            console.warn(
              `No database variable found for variable_id: ${wsVar.variable_id}`
            );
            return null;
          }

          // Find the device
          const device = devices.find((d) => d.id === dbVar.device_id);
          const deviceName =
            device?.name || `Device ${device?.scada_id}` || "Unknown Device";

          // Determine status based on value
          let status: "online" | "offline" | "warning" | "error" = "warning";
          let displayValue: number | string | boolean = wsVar.value;

          if (
            wsVar.value !== undefined &&
            wsVar.value !== null &&
            wsVar.value !== "-"
          ) {
            status = "online";

            // Try to parse as number if it looks like one
            if (typeof wsVar.value === "string" && wsVar.value !== "-") {
              const numValue = parseFloat(wsVar.value);
              if (!isNaN(numValue)) {
                displayValue = numValue;
              }
            }
          } else {
            status = "offline";
            displayValue = "No data";
          }

          return {
            variable_id: wsVar.variable_id,
            var_code: wsVar.var_code,
            device_id: dbVar.device_id,
            device_name: deviceName,
            variable_name: dbVar.name || dbVar.var_code,
            value: displayValue,
            unit: dbVar.unit || "",
            timestamp: new Date(wsData.timestamp),
            status,
          };
        })
        .filter((item): item is EnhancedRealTimeVariableData => item !== null);

      return enhancedData;
    },
    [variables, devices]
  );

  // Calculate device statuses based on variable statuses
  const calculateDeviceStatuses = useCallback(
    (variableData: EnhancedRealTimeVariableData[]) => {
      if (!variableData.length || !devices.length) return [];

      const deviceStatusMap = new Map<number, DeviceStatus>();

      // Initialize device statuses
      devices.forEach((device) => {
        deviceStatusMap.set(device.id, {
          device_id: device.id,
          device_name: device.name || `Device ${device.scada_id}`,
          status: "offline", // Start as offline, will be updated based on variables
          online_variables: 0,
          total_variables: 0,
          last_seen: new Date(),
          offline_variables: [],
        });
      });

      // Process variable data to determine device statuses
      variableData.forEach((varData) => {
        const deviceStatus = deviceStatusMap.get(varData.device_id);
        if (deviceStatus) {
          deviceStatus.total_variables++;
          deviceStatus.last_seen = new Date(
            Math.max(
              deviceStatus.last_seen.getTime(),
              varData.timestamp.getTime()
            )
          );

          if (varData.status === "online") {
            deviceStatus.online_variables++;
          } else if (varData.status === "offline") {
            deviceStatus.offline_variables.push(varData.variable_name);
          }
        }
      });

      // Calculate final device statuses
      deviceStatusMap.forEach((deviceStatus, deviceId) => {
        if (deviceStatus.total_variables === 0) {
          deviceStatus.status = "offline";
        } else if (deviceStatus.online_variables === 0) {
          // All variables are offline - device is offline
          deviceStatus.status = "offline";
        } else if (
          deviceStatus.online_variables < deviceStatus.total_variables
        ) {
          // Some variables offline - device has issues
          deviceStatus.status = "warning";
        } else {
          // All variables online - device is online
          deviceStatus.status = "online";
        }
      });

      return Array.from(deviceStatusMap.values());
    },
    [devices]
  );

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (socketRef.current?.connected) return;

    console.log(`🔗 Connecting to WebSocket at ${serverUrl}`);

    const socket = io(serverUrl, {
      transports: ["websocket"],
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("🔗 WebSocket connected for real-time variables");
      setIsConnected(true);
      setError(null);

      // Request initial real-time data
      socket.emit("request_real_time_data");
    });

    socket.on("disconnect", () => {
      console.log("🔌 WebSocket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.warn("🔌 WebSocket connection error:", error.message);
      setIsConnected(false);
      setError(`Connection failed: ${error.message}`);
    });

    socket.on("reconnect_error", (error) => {
      console.warn("🔌 WebSocket reconnection error:", error.message);
      setError(`Reconnection failed: ${error.message}`);
    });

    // Listen for real-time variable data
    socket.on(
      "real_time_variables",
      (data: {
        type: string;
        data: RealTimeWebSocketData;
        timestamp: string;
      }) => {
        console.log("📡 Received real-time variable data:", data);

        setRawData(data.data);
        const enhancedData = processWebSocketData(data.data);
        const deviceStatuses = calculateDeviceStatuses(enhancedData);

        setRealTimeData(enhancedData);
        setDeviceStatuses(deviceStatuses);
        setLastUpdate(new Date(data.timestamp));
        setError(null);

        // Log device status changes for debugging
        deviceStatuses.forEach((device) => {
          if (device.status === "offline") {
            console.warn(
              `🔴 Device "${device.device_name}" is OFFLINE (${device.offline_variables.length}/${device.total_variables} variables offline)`
            );
          } else if (device.status === "warning") {
            console.warn(
              `🟡 Device "${device.device_name}" has issues (${device.online_variables}/${device.total_variables} variables online)`
            );
          }
        });
      }
    );

    // Listen for real-time errors
    socket.on(
      "real_time_error",
      (errorData: {
        type: string;
        message: string;
        error?: string;
        timestamp: string;
      }) => {
        console.error("📡 Real-time data error:", errorData);
        setError(`${errorData.message}: ${errorData.error || "Unknown error"}`);
      }
    );

    socketRef.current = socket;
  }, [serverUrl, processWebSocketData]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Request real-time data manually
  const requestRealTimeData = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("request_real_time_data");
    }
  }, []);

  // Initialize
  useEffect(() => {
    loadMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only load metadata on mount

  // Connect WebSocket after metadata is loaded
  useEffect(() => {
    if (variables.length > 0 && devices.length > 0) {
      connectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [variables.length, devices.length, connectWebSocket, disconnectWebSocket]);

  return {
    realTimeData,
    deviceStatuses,
    isConnected,
    error,
    loading,
    lastUpdate,
    deviceCount: devices.length,
    variableCount: variables.length,
    rawData,
  };
}

// Export the hook as default for easier imports
export default useRealTimeWebSocket;
