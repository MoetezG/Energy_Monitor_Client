'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface RealtimeData {
  deviceId: string;
  timestamp: string;
  consumption: number;
  voltage: number;
  current: number;
  power: number;
  temperature: number;
  humidity: number;
}

export function useWebSocket(url: string) {
  const [data, setData] = useState<RealtimeData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    const connect = () => {
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          setError(null);
          console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
          try {
            const receivedData = JSON.parse(event.data);
            setData(receivedData);
          } catch (err) {
            console.error('Error parsing WebSocket data:', err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          console.log('WebSocket disconnected');
          
          // Attempt to reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 5000);
        };

        ws.onerror = (error) => {
          setError('WebSocket connection error');
          console.error('WebSocket error:', error);
        };
      } catch (err) {
        setError('Failed to connect to WebSocket');
        console.error('WebSocket connection failed:', err);
      }
    };

    connect();

    return () => {
      disconnect();
    };
  }, [url, disconnect]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      // Trigger re-connection by updating a dependency
      setError(null);
    }, 100);
  }, [disconnect]);

  return {
    data,
    isConnected,
    error,
    reconnect,
    disconnect,
  };
}

// Hook for energy monitoring WebSocket
export function useEnergyWebSocket() {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws';
  return useWebSocket(wsUrl);
}