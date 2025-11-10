'use client';

import { useState } from 'react';
import DeviceSelector from '@/components/DeviceSelector';
import { SelectedDevice, scadaAPI } from '@/lib/api';
import Link from 'next/link';

export default function DeviceManagement() {
  const [selectedDevices, setSelectedDevices] = useState<SelectedDevice[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleDevicesSelected = (devices: SelectedDevice[]) => {
    setSelectedDevices(devices);
    setSaveMessage(null);
  };

  const handleSaveToDatabase = async () => {
    if (selectedDevices.length === 0) {
      setSaveMessage({ type: 'error', text: 'Please select at least one device and its variables' });
      return;
    }

    // Validate that at least one variable is selected for each device
    const devicesWithSelectedVariables = selectedDevices.filter(device => 
      device.variables.some(v => v.selected)
    );

    if (devicesWithSelectedVariables.length === 0) {
      setSaveMessage({ type: 'error', text: 'Please select at least one variable for the selected devices' });
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const response = await scadaAPI.addDevicesToDatabase(devicesWithSelectedVariables);
      
      if (response.success) {
        setSaveMessage({ 
          type: 'success', 
          text: `Successfully added ${devicesWithSelectedVariables.length} devices to database` 
        });
      } else {
        setSaveMessage({ 
          type: 'error', 
          text: response.error || 'Failed to save devices to database' 
        });
      }
    } catch {
      setSaveMessage({ 
        type: 'error', 
        text: 'Network error while saving devices' 
      });
    } finally {
      setSaving(false);
    }
  };

  const getSelectedVariablesCount = () => {
    return selectedDevices.reduce((total, device) => 
      total + device.variables.filter(v => v.selected).length, 0
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Energy Monitor SCADA</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                Back to Dashboard
              </Link>
              <div className="flex items-center text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                System Online
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Device Management</h2>
          <p className="text-gray-600">
            Select SCADA devices and their variables to monitor and store in the database.
          </p>
        </div>

        {/* Summary Card */}
        {selectedDevices.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Selection Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{selectedDevices.length}</div>
                <div className="text-sm text-blue-700">Devices Selected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{getSelectedVariablesCount()}</div>
                <div className="text-sm text-blue-700">Variables Selected</div>
              </div>
              <div className="text-center">
                <button
                  onClick={handleSaveToDatabase}
                  disabled={saving || getSelectedVariablesCount() === 0}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Save to Database
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Message */}
        {saveMessage && (
          <div className={`rounded-lg p-4 mb-6 ${
            saveMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              {saveMessage.type === 'success' ? (
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <p className={saveMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {saveMessage.text}
              </p>
            </div>
          </div>
        )}

        {/* Device Selector Component */}
        <DeviceSelector onDevicesSelected={handleDevicesSelected} />

        {/* Instructions */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">How to use:</h4>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Select the SCADA devices you want to monitor from the &quot;Available SCADA Devices&quot; section</li>
            <li>For each selected device, choose the specific variables you want to track</li>
            <li>Review your selection in the summary section above</li>
            <li>Click &quot;Save to Database&quot; to store your configuration</li>
          </ol>
        </div>
      </div>
    </div>
  );
}