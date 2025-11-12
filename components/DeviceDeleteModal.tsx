'use client';

import React from 'react';
import { DatabaseDevice } from '@/lib/api';

interface DeviceDeleteModalProps {
  device: DatabaseDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (device: DatabaseDevice) => Promise<void>;
  isLoading: boolean;
  variableCount?: number;
}

export default function DeviceDeleteModal({
  device,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  variableCount = 0
}: DeviceDeleteModalProps) {
  const handleConfirm = async () => {
    if (device) {
      await onConfirm(device);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen || !device) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0  transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-md transform rounded-2xl bg-white shadow-xl transition-all">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Delete Device</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            {/* Device Info */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-medium text-red-600">DEVICE TO DELETE</span>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">
                  {device.name || device.scada_id}
                </p>
                <p className="font-mono text-sm text-gray-700">SCADA ID: {device.scada_id}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                  <span>Database ID: {device.id}</span>
                  {device.created_at && (
                    <span>Added: {new Date(device.created_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="mb-6 space-y-3">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete this device? This will remove:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                  The device from monitoring configuration
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                  All {variableCount} variable{variableCount !== 1 ? 's' : ''} associated with this device
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                  All monitoring data and configurations
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  'Delete Device'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}