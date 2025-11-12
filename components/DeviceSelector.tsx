'use client';

import { useState, useEffect } from 'react';
import { scadaAPI, SelectedDevice, DeviceVariable, DatabaseDevice, DeviceVariablePayload, VariableRecord } from '@/lib/api';

interface DeviceSelectorProps {
  onDevicesSelected?: (devices: SelectedDevice[]) => void;
}

interface DeviceDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (device: DatabaseDevice) => void;
  device: DatabaseDevice | null;
  loading: boolean;
}

function DeviceDeleteModal({ isOpen, onClose, onConfirm, device, loading }: DeviceDeleteModalProps) {
  if (!isOpen || !device) return null;

  return (
    <div className="fixed inset-0 backdrop:blur-3xl flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-9-7a9 9 0 1118 0 9 9 0 01-18 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Delete Device</h3>
        </div>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete device <strong>{device.name}</strong> (ID: {device.scada_id})? 
          This will also delete all associated variables and their historical data. This action cannot be undone.
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(device)}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Device</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeviceSelector({ onDevicesSelected }: DeviceSelectorProps) {
  const [availableDevices, setAvailableDevices] = useState<string[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<SelectedDevice[]>([]);
  const [databaseDevices, setDatabaseDevices] = useState<DatabaseDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingVariables, setLoadingVariables] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<DatabaseDevice | null>(null);
  const [deletingDevice, setDeletingDevice] = useState(false);

  // Load available devices on component mount
  useEffect(() => {
    loadDevices();
    loadDatabaseDevices();
  }, []);

  const loadDatabaseDevices = async () => {
    try {
      const response = await scadaAPI.getDatabaseDevices();
      if (response.success && response.data) {
        const devices = Array.isArray(response.data) ? response.data : [response.data];
        setDatabaseDevices(devices);
      }
    } catch {
      // Silently fail, as this is for additional functionality
    }
  };

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
          const varCode =  v.idEx;
          const existingVarResp = await scadaAPI.getVariableByDeviceAndCode(Number(dbDevice.id), varCode);
          const exists = existingVarResp.success && existingVarResp.data && (existingVarResp.data as VariableRecord)?.id;
          if (!exists) {
            toCreate.push({
              device_id: Number(dbDevice.id),
              var_code: varCode,
              name: v.title || v.idEx,
              unit: v.measureUnits || '',
              enabled: true,
              meta: { 
                value: v.value,
                valueInfo: v.valueInfo || null
              }
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
      // Add device - load filtered variables (only those not in database)
      setLoadingVariables(deviceId);
      
      try {
        const response = await scadaAPI.getFilteredDeviceVariables([deviceId]);
        if (response.success && response.data) {
          const deviceData = response.data.find(d => d.deviceId === deviceId);
          const variables = deviceData?.variables || [];
          console.log('Filtered Variables for device', deviceId, ':', variables);      
          const newDevice: SelectedDevice = {
            id: deviceId,
            name: deviceId,
            variables,
            selected: true
          };
          
          const updatedDevices = [...selectedDevices, newDevice];
          setSelectedDevices(updatedDevices);
          onDevicesSelected?.(updatedDevices);
        } else {
          setError(`Failed to load variables for device ${deviceId}: ${response.error}`);
        }
      } catch {
        setError(`Network error while loading variables for device ${deviceId}`);
      } finally {
        setLoadingVariables(null);
      }
    }
  };

  // Handle delete device button click
  const handleDeleteDeviceClick = (deviceId: string) => {
    const dbDevice = databaseDevices.find(d => d.scada_id === deviceId);
    if (dbDevice) {
      setDeviceToDelete(dbDevice);
      setDeleteModalOpen(true);
    }
  };

  // Handle delete device confirmation
  const handleDeleteDeviceConfirm = async (device: DatabaseDevice) => {
    setDeletingDevice(true);
    setError(null);
    
    try {
      const response = await scadaAPI.deleteDevice(device.id);
      if (response.success) {
        // Remove from database devices list
        setDatabaseDevices(prev => prev.filter(d => d.id !== device.id));
        
        // Remove from selected devices if present
        setSelectedDevices(prev => prev.filter(d => d.id !== device.scada_id));
        
        setDeleteModalOpen(false);
        setDeviceToDelete(null);
        setSaveMessage(`Device "${device.name}" deleted successfully`);
        
        // Clear the success message after 3 seconds
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setError(response.error || `Failed to delete device ${device.name}`);
      }
    } catch {
      setError(`Network error while deleting device ${device.name}`);
    } finally {
      setDeletingDevice(false);
    }
  };

  const handleVariableToggle = (deviceId: string, variableId: string) => {
    // Toggle locally first
    setSelectedDevices(prev => 
      prev.map(device => {
        if (device.id === deviceId) {
          const updatedVariables = device.variables.map(variable => 
            variable.idEx === variableId 
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
              
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No devices available</h4>
            <p className="text-gray-500">Check your SCADA connection</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableDevices.map(deviceId => {
              const isSelected = selectedDevices.some(d => d.id === deviceId);
              const isLoadingVars = loadingVariables === deviceId;
              const isInDatabase = databaseDevices.some(d => d.scada_id === deviceId);
              
              return (
                <div 
                  key={deviceId}
                  className={`border-2 rounded-lg p-4 transition-all duration-200 relative ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {/* Delete button for devices in database */}
                  {isInDatabase && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDeviceClick(deviceId);
                      }}
                      className="absolute top-2 right-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                      title="Delete device from database"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  
                  <div 
                    className="cursor-pointer"
                    onClick={() => !isLoadingVars && handleDeviceToggle(deviceId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-8">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900">{deviceId}</h4>
                          {isInDatabase && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              In DB
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">SCADA Device</p>
                        {isSelected && (
                          <p className="text-xs text-blue-600 mt-2 font-medium">
                            {getSelectedVariablesForDevice(deviceId).length} new variables selected
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
              <p className="text-sm text-gray-500 mt-1">
                Only variables not yet in the database are shown to avoid duplicates. 
                Save selected variables for automatic monitoring.
              </p>
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
                      {getSelectedVariablesForDevice(device.id).length} of {device.variables.length} new variables selected
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  {device.variables.length > 0 ? (
                    <div className="space-y-3">
                      {device.variables.map(variable => (
                        <div 
                          key={variable.idEx}
                          className={`border rounded-lg p-4 transition-all duration-200 ${
                            variable.selected ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <label className="flex items-center space-x-3 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={variable.selected || false}
                                onChange={() => handleVariableToggle(device.id, variable.idEx)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {variable.title || variable.idEx}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <p className="text-xs text-gray-500">ID: {variable.idEx}</p>
                                  {variable.measureUnits && (
                                    <p className="text-xs text-gray-500">Unit: {variable.measureUnits}</p>
                                  )}
                                </div>
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 mb-1">No new variables available</p>
                      <p className="text-xs text-gray-400">All variables for this device are already in the database</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Device Modal */}
      <DeviceDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeviceToDelete(null);
        }}
        onConfirm={handleDeleteDeviceConfirm}
        device={deviceToDelete}
        loading={deletingDevice}
      />
    </div>
  );
}