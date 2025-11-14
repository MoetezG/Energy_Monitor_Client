'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { scadaAPI, VariableRecord, DatabaseDevice } from '@/lib/api';

export interface RealTimeVariableData {
  variable_id: number;
  var_code: string;
  device_id: number;
  device_name: string;
  variable_name: string;
  value: number | string | boolean;
  unit: string;
  timestamp: Date;
  status: 'online' | 'offline' | 'warning' | 'error';
}

export interface UseRealTimeVarDataReturn {
  realTimeData: RealTimeVariableData[];
  isConnected: boolean;
  error: string | null;
  loading: boolean;
  lastUpdate: Date | null;
  deviceCount: number;
  variableCount: number;
}

export function useRealTimeVarData(): UseRealTimeVarDataReturn {
  const [realTimeData, setRealTimeData] = useState<RealTimeVariableData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [devices, setDevices] = useState<DatabaseDevice[]>([]);
  const [variables, setVariables] = useState<VariableRecord[]>([]);
  
  const socketRef = useRef<Socket | null>(null);

  // Load initial device and variable data
  const loadMetadata = useCallback(async () => {
    setLoading(true);
    try {
      const [devResp, varResp] = await Promise.all([
        scadaAPI.getDatabaseDevices(),
        scadaAPI.getVariableList(),
      ]);

      if (devResp.success && devResp.data) {
        const devs: DatabaseDevice[] = Array.isArray(devResp.data) 
          ? devResp.data as DatabaseDevice[]
          : [devResp.data as DatabaseDevice];
        setDevices(devs);
      }

      if (varResp.success && varResp.data) {
        setVariables(varResp.data as VariableRecord[]);
      }
    } catch (err) {
      setError('Failed to load device and variable metadata');
      console.error('Metadata loading error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch real-time data from SCADA using new getCurrentValues API
  const fetchRealTimeData = useCallback(async () => {
    if (variables.length === 0 || devices.length === 0) return;

    try {
      // Extract variable codes from database variables
      const variableCodes = variables.map(v => v.var_code);
      
      // Fetch current values from SCADA
      const response = await scadaAPI.getCurrentValues(variableCodes);
      
      if (response.success && response.data && response.data.variables) {
        // Map SCADA values to our RealTimeVariableData format
        const realTimeVariables: RealTimeVariableData[] = variables.map(dbVar => {
          const scadaValue = response.data!.variables.find(
            sv => sv.varCode === dbVar.var_code
          );
          
          // Find device name - convert device.id to string for comparison
          const device = devices.find(d => String(d.id) === String(dbVar.device_id));
          const deviceName = device?.name || `Device ${device?.scada_id}` || 'Unknown Device';
          
          // Determine status based on whether we got a value
          let status: 'online' | 'offline' | 'warning' | 'error' = 'warning';
          let displayValue: number | string | boolean = 'No data';

          if (scadaValue && scadaValue.value !== undefined && scadaValue.value !== null) {
            status = 'online';
            displayValue = scadaValue.value;
            
            // Try to parse as number if it looks like one
            if (typeof scadaValue.value === 'string') {
              const numValue = parseFloat(scadaValue.value);
              if (!isNaN(numValue)) {
                displayValue = numValue;
              }
            }
          }
          
          return {
            variable_id: dbVar.id,
            var_code: dbVar.var_code,
            device_id: dbVar.device_id,
            device_name: deviceName,
            variable_name: dbVar.name || dbVar.var_code,
            value: displayValue,
            unit: dbVar.unit || '',
            timestamp: scadaValue?.timestamp ? new Date(scadaValue.timestamp) : new Date(),
            status
          };
        });

        setRealTimeData(realTimeVariables);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError('Failed to fetch real-time data');
      }
    } catch (err) {
      console.error('Error fetching real-time data:', err);
      setError('Error fetching real-time data');
    }
  }, [variables, devices]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io('ws://localhost:3001', {
      transports: ['websocket'],
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('🔗 WebSocket connected');
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.warn('🔌 WebSocket connection error:', error.message);
      setIsConnected(false);
    });

    socket.on('variableUpdate', (data) => {
      console.log('📡 Received variable update:', data);
      // For now, trigger a full refresh when we get updates
      // In future, we could update specific variables
      fetchRealTimeData();
    });

    socketRef.current = socket;
  }, [fetchRealTimeData]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Initialize and set up polling
  useEffect(() => {
    loadMetadata();
    connectWebSocket();

    // Set up polling every 5 seconds
    const interval = setInterval(() => {
      fetchRealTimeData();
    }, 5000);

    return () => {
      clearInterval(interval);
      disconnectWebSocket();
    };
  }, [loadMetadata, connectWebSocket, fetchRealTimeData, disconnectWebSocket]);

  // Fetch data when metadata is loaded
  useEffect(() => {
    if (variables.length > 0 && devices.length > 0) {
      fetchRealTimeData();
    }
  }, [variables, devices, fetchRealTimeData]);

  return {
    realTimeData,
    isConnected,
    error,
    loading,
    lastUpdate,
    deviceCount: devices.length,
    variableCount: variables.length,
  };
}