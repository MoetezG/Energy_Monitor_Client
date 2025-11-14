'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

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

export interface SystemStatus {
  isOnline: boolean;
  lastHeartbeat?: string;
  uptime?: number;
  errorCount: number;
  successCount: number;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
}

export function useHeartbeatWebSocket() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    isOnline: false,
    errorCount: 0,
    successCount: 0,
    connectionStatus: 'disconnected'
  });
  const [edsStatus, setEdsStatus] = useState<EDSStatus | null>(null);
  const [recentEvents, setRecentEvents] = useState<HeartbeatStatus[]>([]);
  const [lastHeartbeatEvent, setLastHeartbeatEvent] = useState<HeartbeatStatus | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectRef = useRef<(() => void) | null>(null);

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080';

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSystemStatus(prev => ({ 
      ...prev, 
      connectionStatus: 'disconnected',
      isOnline: false
    }));
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setSystemStatus(prev => ({ ...prev, connectionStatus: 'connecting' }));

    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to heartbeat WebSocket');
      setSystemStatus(prev => ({ 
        ...prev, 
        connectionStatus: 'connected',
        isOnline: true
      }));
    });

    socket.on('disconnect', (reason: string) => {
      console.log('❌ Disconnected from heartbeat WebSocket:', reason);
      setSystemStatus(prev => ({ 
        ...prev, 
        connectionStatus: 'disconnected',
        isOnline: false
      }));

      // Attempt to reconnect after 5 seconds
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          reconnectTimeoutRef.current = null;
          if (connectRef.current) {
            connectRef.current();
          }
        }, 5000);
      }
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ WebSocket connection error:', error);
      setSystemStatus(prev => ({ 
        ...prev, 
        connectionStatus: 'error',
        isOnline: false,
        errorCount: prev.errorCount + 1
      }));
    });

    // Listen for heartbeat status events
    socket.on('heartbeat_status', (data: HeartbeatStatus) => {
      console.log('💓 Heartbeat event received:', data);
      
      setLastHeartbeatEvent(data);
      
      // Add to recent events (keep last 50)
      setRecentEvents(prev => {
        const newEvents = [data, ...prev].slice(0, 50);
        return newEvents;
      });

      // Update system status based on event type
      switch (data.type) {
        case 'connection':
          setSystemStatus(prev => ({
            ...prev,
            isOnline: true,
            successCount: prev.successCount + 1,
            lastHeartbeat: data.timestamp
          }));
          break;
          
        case 'heartbeat_attempt':
        case 'listener_registration':
          setSystemStatus(prev => ({
            ...prev,
            lastHeartbeat: data.timestamp,
            successCount: prev.successCount + 1,
            isOnline: true
          }));
          break;
          
        case 'listener_registration_error':
        case 'eds_event_parse_error':
          setSystemStatus(prev => ({
            ...prev,
            errorCount: prev.errorCount + 1,
            isOnline: false
          }));
          break;
          
        case 'heartbeat_service_started':
          setSystemStatus(prev => ({
            ...prev,
            isOnline: true,
            lastHeartbeat: data.timestamp
          }));
          break;
          
        case 'eds_event_parsed':
          setSystemStatus(prev => ({
            ...prev,
            lastHeartbeat: data.timestamp,
            isOnline: true
          }));
          break;
          
        case 'eds_status_check':
          setSystemStatus(prev => ({
            ...prev,
            lastHeartbeat: data.timestamp,
            isOnline: (data.data as { online?: boolean })?.online || false,
            successCount: prev.successCount + 1
          }));
          break;
          
        case 'eds_status_offline':
          setSystemStatus(prev => ({
            ...prev,
            isOnline: false,
            errorCount: prev.errorCount + 1
          }));
          break;
          
        case 'eds_status_warning':
          setSystemStatus(prev => ({
            ...prev,
            errorCount: prev.errorCount + 1
          }));
          break;
      }
    });

    // Listen for EDS status updates
    socket.on('eds_status', (data: EDSStatus) => {
      console.log('📡 EDS Status received:', data);
      setEdsStatus(data);
      
      // Also update system status based on EDS status
      setSystemStatus(prev => ({
        ...prev,
        isOnline: data.online,
        lastHeartbeat: data.lastHeartbeat || prev.lastHeartbeat,
        uptime: data.uptime || prev.uptime
      }));
    });

  }, [serverUrl]);

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
      uptime: calculateUptime()
    },
    edsStatus,
    lastHeartbeatEvent,
    recentEvents,
    isConnected: systemStatus.connectionStatus === 'connected',
    reconnect,
    disconnect
  };
}