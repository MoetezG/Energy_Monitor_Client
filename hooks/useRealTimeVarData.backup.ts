'use client';

import { useState, useEffect, useRef } from 'react';
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
  refreshRealTimeData: () => Promise<void>;
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
  const loadMetadata = async () => {
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
  };

  // Fetch real-time data from SCADA API
  const fetchRealTimeData = async () => {
    if (variables.length === 0 || devices.length === 0) return;

    try {
      // Get device IDs from database devices
      const deviceIds = devices.map(d => d.scada_id);
      
      // Fetch current SCADA values
      const response = await scadaAPI.getDeviceValues(deviceIds);
      
      if (response.success && response.data?.varInfo?.var) {
        const scadaVariables = Array.isArray(response.data.varInfo.var) 
          ? response.data.varInfo.var
          : [response.data.varInfo.var];

        // Map SCADA data to our real-time format
        const mappedData = scadaVariables
          .map((scadaVar: { idEx?: string; id?: string; title?: string; value?: unknown; measureUnits?: string }) => {
            // Extract device ID and variable code from idEx (format: deviceId.variableCode)
            if (!scadaVar.idEx) {
              console.warn('Variable missing idEx:', scadaVar);
              return null;
            }

            const parts = scadaVar.idEx.split('.');
            const deviceScadaId = parts[0];
            const varCode = parts[1] || scadaVar.id;
            
            // Find matching device and variable from database
            const device = devices.find(d => d.scada_id === deviceScadaId);
            const variable = variables.find(v => 
              v.var_code === varCode && 
              v.device_id === device?.id
            );
            
            if (!device || !variable) {
              console.warn(`No matching device/variable found for ${scadaVar.idEx}`, {
                deviceScadaId,
                varCode,
                availableDevices: devices.map(d => d.scada_id),
                availableVariables: variables.map(v => `${v.device_id}:${v.var_code}`)
              });
              return null;
            }

            // Determine status based on value availability
            let status: 'online' | 'offline' | 'warning' | 'error' = 'warning';
            let displayValue: number | string | boolean = 'No data';

            // Check if variable has a value (some variables may not have hasValue="T")
            if (scadaVar.value !== undefined && scadaVar.value !== null) {
              status = 'online';
              displayValue = scadaVar.value as string | number | boolean;
            }

            // Use measureUnits from SCADA response if available, otherwise fall back to database
            const unit = scadaVar.measureUnits?.replace('#', '') || variable.unit || '';

            return {
              variable_id: variable.id,
              var_code: variable.var_code,
              device_id: device.id,
              device_name: device.name || `Device ${device.scada_id}`,
              variable_name: scadaVar.title || variable.name || variable.var_code,
              value: displayValue,
              unit: unit,
              timestamp: new Date(),
              status
            } as RealTimeVariableData;
          })
          .filter((item: RealTimeVariableData | null): item is RealTimeVariableData => item !== null);

        console.log(`📊 Mapped ${mappedData.length} variables from ${scadaVariables.length} SCADA variables`);
        setRealTimeData(mappedData);
        setLastUpdate(new Date());
        setError(null);
      } else {
        console.warn('Unexpected SCADA API response structure:', response);
        setError('Invalid response from SCADA API');
      }
    } catch (err) {
      setError('Failed to fetch real-time data');
      console.error('Real-time data fetch error:', err);
    }
  };

  // Initialize WebSocket connection for real-time updates
  const connectWebSocket = () => {
    const SERVER_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080';
    
    try {
      const socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setIsConnected(true);
        setError(null);
        console.log('✅ Connected to real-time data WebSocket');
      });

      socket.on('disconnect', (reason) => {
        setIsConnected(false);
        console.log('❌ Disconnected from real-time data WebSocket:', reason);
      });

      // Listen for variable data updates
      socket.on('variable_data_update', () => {
        console.log('📊 Received variable data update');
        fetchRealTimeData(); // Refresh data when notified
      });

      socket.on('connect_error', (error) => {
        setError('WebSocket connection error');
        console.error('❌ WebSocket connection error:', error);
      });

    } catch (err) {
      setError('Failed to establish WebSocket connection');
      console.error('WebSocket setup error:', err);
    }
  };

  // Manual refresh function
  const refreshRealTimeData = async () => {
    await fetchRealTimeData();
  };

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (devices.length > 0 && variables.length > 0) {
      // Initial data fetch
      fetchRealTimeData();
      
      // Set up periodic refresh every 5 seconds
      intervalId = setInterval(() => {
        fetchRealTimeData();
      }, 5000);
      
      // Set up WebSocket connection
      connectWebSocket();
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [devices.length, variables.length]); // Only depend on lengths to avoid infinite recreating

  return {
    realTimeData,
    isConnected,
    error,
    loading,
    lastUpdate,
    deviceCount: devices.length,
    variableCount: variables.length,
    refreshRealTimeData,
  };
}