import { useState, useEffect, useCallback } from "react";
import { scadaAPI, SelectedDevice, DeviceVariable } from "@/lib/api";

export interface UseDeviceDataReturn {
  devices: string[];
  selectedDevices: SelectedDevice[];
  loading: boolean;
  error: string | null;
  loadDevices: () => Promise<void>;
  loadDeviceVariables: (deviceId: string) => Promise<DeviceVariable[]>;
  refreshDeviceData: (deviceIds: string[]) => Promise<void>;
}

export function useDeviceData(): UseDeviceDataReturn {
  const [devices, setDevices] = useState<string[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<SelectedDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await scadaAPI.getDeviceList();
      if (response.success && response.data) {
        setDevices(response.data.devices.id);
      } else {
        setError(response.error || "Failed to load devices");
      }
    } catch {
      setError("Network error while loading devices");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDeviceVariables = useCallback(
    async (deviceId: string): Promise<DeviceVariable[]> => {
      try {
        const response = await scadaAPI.getDeviceValues([deviceId]);
        if (response.success && response.data) {
          return response.data.values.variable;
        } else {
          throw new Error(response.error || "Failed to load variables");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Network error";
        setError(`Failed to load variables for ${deviceId}: ${errorMessage}`);
        return [];
      }
    },
    []
  );

  const refreshDeviceData = useCallback(async (deviceIds: string[]) => {
    if (deviceIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await scadaAPI.getDeviceValues(deviceIds);
      if (response.success && response.data) {
        const variables = response.data.values.variable;

        // Group variables by device ID
        const variablesByDevice = new Map<string, DeviceVariable[]>();
        variables.forEach((variable) => {
          const deviceId = variable.id.split(".")[0];
          if (!variablesByDevice.has(deviceId)) {
            variablesByDevice.set(deviceId, []);
          }
          variablesByDevice.get(deviceId)?.push(variable);
        });

        // Update selected devices with fresh data
        setSelectedDevices((prev) =>
          prev.map((device) => {
            const freshVariables = variablesByDevice.get(device.id);
            if (freshVariables) {
              return {
                ...device,
                variables: freshVariables.map((variable) => ({
                  ...variable,
                  selected:
                    device.variables.find((v) => v.id === variable.id)
                      ?.selected || false,
                })),
              };
            }
            return device;
          })
        );
      } else {
        setError(response.error || "Failed to refresh device data");
      }
    } catch {
      setError("Network error while refreshing device data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only load on mount, loadDevices is stable

  return {
    devices,
    selectedDevices,
    loading,
    error,
    loadDevices,
    loadDeviceVariables,
    refreshDeviceData,
  };
}
