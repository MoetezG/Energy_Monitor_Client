'use client';

import { useState, useEffect } from 'react';
import { scadaAPI, SelectedDevice, DeviceVariable, DatabaseDevice, DeviceVariablePayload, VariableRecord } from '@/lib/api';

interface DeviceSelectorProps {
  onDevicesSelected?: (devices: SelectedDevice[]) => void;
}

export default function DeviceSelector({ onDevicesSelected }: DeviceSelectorProps) {
  const [availableDevices, setAvailableDevices] = useState<string[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<SelectedDevice[]>([]);
  const [deviceVariables, setDeviceVariables] = useState<Map<string, DeviceVariable[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingVariables, setLoadingVariables] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load available devices on component mount
  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await scadaAPI.getDeviceList();
      if (response.success && response.data) {
        setAvailableDevices(response.data.devices.id);
      } else {
        setError(response.error || 'Failed to load devices');
      }
    } catch {
      setError('Network error while loading devices');
    } finally {
      setLoading(false);
    }
  };

  const saveSelections = async () => {
    setSaving(true);
    setSaveMessage(null);
    setError(null);

    try {
      // Fetch existing DB devices once
      const dbDevicesResp = await scadaAPI.getDatabaseDevices();
      let dbDevices: DatabaseDevice[] = [];
      if (dbDevicesResp.success && dbDevicesResp.data) {
        const dbDevicesRaw = dbDevicesResp.data as unknown;
        dbDevices = Array.isArray(dbDevicesRaw) ? dbDevicesRaw as DatabaseDevice[] : [dbDevicesRaw as DatabaseDevice];
      }

      for (const device of selectedDevices) {
        // Find or create device
        let dbDevice = dbDevices.find(d => d && (d.scada_id === device.id || d.scada_id === String(device.id)));
        if (!dbDevice) {
          const addResp = await scadaAPI.addDevicesToDatabase(device);
          if (!addResp.success) {
            setError(addResp.error || `Failed to create device ${device.id}`);
            continue;
          }
          // refresh dbDevices and find created
          const dbDevicesResp2 = await scadaAPI.getDatabaseDevices();
          if (dbDevicesResp2.success && dbDevicesResp2.data) {
            const raw2 = dbDevicesResp2.data as unknown;
            dbDevices = Array.isArray(raw2) ? raw2 as DatabaseDevice[] : [raw2 as DatabaseDevice];
            dbDevice = dbDevices.find(d => d && (d.scada_id === device.id || d.scada_id === String(device.id)));
          }
        }

        if (!dbDevice) {
          // can't proceed for this device
          continue;
        }

        // Persist selected variables that don't exist yet
        const selectedVars = device.variables.filter(v => v.selected);
        const toCreate: DeviceVariablePayload[] = [];

        for (const v of selectedVars) {
          const varCode =  v.id;
          const existingVarResp = await scadaAPI.getVariableByDeviceAndCode(Number(dbDevice.id), varCode);
          const exists = existingVarResp.success && existingVarResp.data && (existingVarResp.data as VariableRecord)?.id;
          if (!exists) {
            toCreate.push({
              device_id: Number(dbDevice.id),
              var_code: varCode,
              name: v.id,
              unit: '',
              enabled: true,
              meta: { value: v.value }
            });
          }
        }

        if (toCreate.length > 0) {
          const varResp = await scadaAPI.addVariablesToDatabase(toCreate);
          if (!varResp.success) {
            setError(varResp.error || `Failed to persist variables for ${device.id}`);
          }
        }
      }

      setSaveMessage('Saved selections successfully');
    } catch {
      setError('Network error while saving selections');
    } finally {
      setSaving(false);
    }
  };



  const handleDeviceToggle = async (deviceId: string) => {
    const isCurrentlySelected = selectedDevices.some(d => d.id === deviceId);
    
    if (isCurrentlySelected) {
      // Remove device
      const updatedDevices = selectedDevices.filter(d => d.id !== deviceId);
      setSelectedDevices(updatedDevices);
      onDevicesSelected?.(updatedDevices);
    } else {
      // Add device - first load its variables if not already loaded
      let variables: DeviceVariable[] = [];
      
      if (!deviceVariables.has(deviceId)) {
        setLoadingVariables(deviceId);
        
        try {
          const response = await scadaAPI.getDeviceValues([deviceId]);
          if (response.success && response.data) {
            variables = response.data.values.variable;
            setDeviceVariables(prev => new Map(prev).set(deviceId, variables));
          } else {
            setError(`Failed to load variables for device ${deviceId}`);
            setLoadingVariables(null);
            return; // Don't add device if variables failed to load
          }
        } catch {
          setError(`Network error while loading variables for device ${deviceId}`);
          setLoadingVariables(null);
          return; // Don't add device if variables failed to load
        } finally {
          setLoadingVariables(null);
        }
      } else {
        variables = deviceVariables.get(deviceId) || [];
      }
      
      const newDevice: SelectedDevice = {
        id: deviceId,
        name: deviceId,
        variables,
        selected: true
      };
      
      const updatedDevices = [...selectedDevices, newDevice];
      setSelectedDevices(updatedDevices);
      onDevicesSelected?.(updatedDevices);
    }
  };

  const handleVariableToggle = (deviceId: string, variableId: string) => {
    // Toggle locally first
    setSelectedDevices(prev => 
      prev.map(device => {
        if (device.id === deviceId) {
          const updatedVariables = device.variables.map(variable => 
            variable.id === variableId 
              ? { ...variable, selected: !(variable.selected || false) }
              : variable
          );
          return { ...device, variables: updatedVariables };
        }
        return device;
      })
    );

    // No DB persistence here. Persist only when Save button is clicked.
  };

  const getSelectedVariablesForDevice = (deviceId: string): DeviceVariable[] => {
    const device = selectedDevices.find(d => d.id === deviceId);
    return device?.variables.filter(v => v.selected) || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading devices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800">{error}</p>
        </div>
        <button 
          onClick={loadDevices}
          className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Devices */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Available SCADA Devices</h3>
            <p className="text-sm text-gray-500 mt-1">Select devices to monitor and configure variables</p>
          </div>
          <button 
            onClick={loadDevices}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {availableDevices.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No devices available</h4>
            <p className="text-gray-500">Check your SCADA connection</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableDevices.map(deviceId => {
              const isSelected = selectedDevices.some(d => d.id === deviceId);
              const isLoadingVars = loadingVariables === deviceId;
              
              return (
                <div 
                  key={deviceId}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => !isLoadingVars && handleDeviceToggle(deviceId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{deviceId}</h4>
                      <p className="text-sm text-gray-500 mt-1">SCADA Device</p>
                      {isSelected && (
                        <p className="text-xs text-blue-600 mt-2 font-medium">
                          {getSelectedVariablesForDevice(deviceId).length} variables selected
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      {isLoadingVars ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      ) : (
                        <div className={`w-5 h-5 rounded border-2 ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white m-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Devices and Variables */}
      {selectedDevices.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Selected Devices & Variables</h3>
              <p className="text-sm text-gray-500 mt-1">Save selected variables to database for automatic monitoring</p>
            </div>
            <div className="flex items-center space-x-4">
              {saveMessage && (
                <div className="flex items-center text-green-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">{saveMessage}</span>
                </div>
              )}
              <button
                onClick={saveSelections}
                disabled={saving || selectedDevices.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>Save selections</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            {selectedDevices.map(device => (
              <div key={device.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900">{device.id}</h4>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {getSelectedVariablesForDevice(device.id).length} of {device.variables.length} variables selected
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  {device.variables.length > 0 ? (
                    <div className="space-y-3">
                      {device.variables.map(variable => (
                        <div 
                          key={variable.id}
                          className={`border rounded-lg p-4 transition-all duration-200 ${
                            variable.selected ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <label className="flex items-center space-x-3 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={variable.selected || false}
                                onChange={() => handleVariableToggle(device.id, variable.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{variable.id}</p>
                                <p className="text-xs text-gray-500 mt-1">Current value: {String(variable.value)}</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">No variables available for this device</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}