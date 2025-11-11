'use client';

import React, { useEffect, useState } from 'react';
import { scadaAPI, DatabaseDevice, VariableRecord } from '@/lib/api';

export default function MonitoringConfig() {
  const [devices, setDevices] = useState<DatabaseDevice[]>([]);
  const [variables, setVariables] = useState<VariableRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [devResp, varResp] = await Promise.all([
        scadaAPI.getDatabaseDevices(),
        scadaAPI.getVariableList(),
      ]);

      if (devResp.success && devResp.data) {
        const raw = devResp.data as unknown;
        const devs: DatabaseDevice[] = Array.isArray(raw) ? raw as DatabaseDevice[] : [raw as DatabaseDevice];
        setDevices(devs);
      } else {
        setDevices([]);
      }

      if (varResp.success && varResp.data) {
        setVariables(varResp.data as VariableRecord[]);
      } else {
        setVariables([]);
      }
    } catch {
      setError('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const varsByDevice = React.useMemo(() => {
    const m = new Map<number, VariableRecord[]>();
    for (const v of variables) {
      const arr = m.get(v.device_id) || [];
      arr.push(v);
      m.set(v.device_id, arr);
    }
    return m;
  }, [variables]);

  if (loading) return (
    <div className="p-6">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="mt-2 text-gray-600">Loading monitoring data...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Database Monitoring</h2>
            <p className="text-sm text-gray-500 mt-1">View saved devices and variable configurations</p>
          </div>
          <div className="flex items-center space-x-3">
            {loading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            )}
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {devices.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No devices in database</h3>
            <p className="text-gray-500">Add devices from the Device Selector to start monitoring</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{devices.length}</div>
                <div className="text-sm text-blue-800">Total Devices</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{variables.length}</div>
                <div className="text-sm text-green-800">Total Variables</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {variables.filter(v => v.enabled).length}
                </div>
                <div className="text-sm text-orange-800">Active Variables</div>
              </div>
            </div>

            {devices.map(device => (
              <div key={device.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{device.name || device.scada_id}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">SCADA ID: {device.scada_id}</span>
                        <span className="text-sm text-gray-500">DB ID: {device.id}</span>
                        {device.created_at && (
                          <span className="text-sm text-gray-500">
                            Added: {new Date(device.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {varsByDevice.get(device.id)?.length || 0} variables
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {varsByDevice.get(device.id)?.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left border-b border-gray-200">
                            <th className="pb-3 font-medium text-gray-900">Variable Code</th>
                            <th className="pb-3 font-medium text-gray-900">Name</th>
                            <th className="pb-3 font-medium text-gray-900">Status</th>
                            <th className="pb-3 font-medium text-gray-900">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {varsByDevice.get(device.id)?.map(v => (
                            <tr key={v.id} className="hover:bg-gray-50">
                              <td className="py-3 font-mono text-sm">{v.var_code}</td>
                              <td className="py-3">{v.name || '-'}</td>
                              <td className="py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  v.enabled 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {v.enabled ? 'Active' : 'Disabled'}
                                </span>
                              </td>
                              <td className="py-3 text-xs text-gray-500">
                                {v.created_at ? new Date(v.created_at).toLocaleString() : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">No variables configured for this device</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
