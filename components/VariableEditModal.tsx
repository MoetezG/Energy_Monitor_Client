'use client';

import React, { useState } from 'react';
import { VariableRecord } from '@/lib/api';

interface VariableEditModalProps {
  variable: VariableRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (variable: VariableRecord, updates: Partial<VariableRecord>) => Promise<void>;
  isLoading: boolean;
}

export default function VariableEditModal({
  variable,
  isOpen,
  onClose,
  onSave,
  isLoading
}: VariableEditModalProps) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [lastVariableId, setLastVariableId] = useState<number | null>(null);

  // Reset form when variable changes
  if (variable && variable.id !== lastVariableId && isOpen) {
    setName(variable.name || '');
    setUnit(variable.unit || '');
    setEnabled(variable.enabled ?? true);
    setLastVariableId(variable.id);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates: Partial<VariableRecord> = {
      name: name.trim() || undefined,
      unit: unit.trim() || undefined,
      enabled
    };

    await onSave(variable, updates);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-md transform rounded-2xl bg-white shadow-xl transition-all">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Variable</h3>
                <p className="text-sm text-gray-600">Modify variable properties and settings</p>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Variable Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs font-medium text-gray-500">VARIABLE CODE</span>
              </div>
              <p className="font-mono text-sm text-gray-900">{variable.var_code}</p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>Device ID: {variable.device_id}</span>
                <span>Variable ID: {variable.id}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Variable Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter variable display name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional friendly name for this variable
                </p>
              </div>

              {/* Unit */}
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <input
                  type="text"
                  id="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g., kW, V, A, °C"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Measurement unit for this variable
                </p>
              </div>

              {/* Enabled Toggle */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    disabled={isLoading}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Enable Variable</span>
                    <p className="text-xs text-gray-500">Whether this variable is actively monitored</p>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}