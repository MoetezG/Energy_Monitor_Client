"use client";

import { useState, useEffect, useCallback } from "react";
import { scadaAPI, DatabaseDevice, VariableRecord } from "@/lib/api";
import MultiVariableChart from "@/components/MultiVariableChart";
import DeviceMultiVariableChart from "@/components/DeviceMultiVariableChart";
import ReportGenerator from "@/components/ReportGenerator";
import DashboardLayout from "@/components/DashboardLayout";
import EnergyBarChart from "@/components/EnergyBarChart";
import EnergyPieChart from "@/components/EnergyPieChart";

import { energyPie } from "@/app/mock/energy";

interface AnalyticsPageState {
  devices: DatabaseDevice[];
  variables: VariableRecord[];
  selectedVariables: VariableRecord[];
  loading: boolean;
  error: string | null;
}

export default function AnalyticsPage() {
  const [state, setState] = useState<AnalyticsPageState>({
    devices: [],
    variables: [],
    selectedVariables: [],
    loading: false,
    error: null,
  });

  async function getMockEnergy() {
    const res = await fetch("http://localhost:3000/api/energy");
    return res.json();
  }

  const [energy, setEnergy] = useState<{
    daily: Array<{ label: string; kWh: number }>;
    hourly: Array<{ label: string; kWh: number }>;
    zones: Array<{ zone: string; kWh: number }>;
  } | null>(null);

  useEffect(() => {
    const fetchEnergy = async () => {
      try {
        const energyData = await getMockEnergy();
        setEnergy(energyData);
      } catch (error) {
        console.error("Failed to fetch energy data:", error);
      }
    };

    fetchEnergy();
  }, []);

  const loadVariables = useCallback(async (devices: DatabaseDevice[]) => {
    try {
      // For now, use mock variables since getVariablesFromDatabase might not exist
      const allVariables: VariableRecord[] = devices.map((device, index) => ({
        id: index + 1,
        device_id: device.id,
        name: `Variable_${index + 1}`,
        var_code: `VAR_${index + 1}`,
        unit: index % 2 === 0 ? "kWh" : "V",
        timestamp: new Date().toISOString(),
        value: Math.random() * 100,
      }));
      setState((prev) => ({ ...prev, variables: allVariables }));
    } catch (error: unknown) {
      console.error("Error loading variables:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to load variables",
      }));
    }
  }, []);

  const loadDevicesFromDatabase = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await scadaAPI.getDatabaseDevices();
      if (response.success && response.data) {
        setState((prev) => ({
          ...prev,
          devices: response.data || [],
          loading: false,
        }));
        await loadVariables(response.data || []);
      } else {
        setState((prev) => ({
          ...prev,
          error: response.error || "Failed to load devices",
          loading: false,
        }));
      }
    } catch (error: unknown) {
      // Check if it's a 304 Not Modified response (which is actually successful)
      const errorObj = error as {
        status?: number;
        response?: { status?: number; statusText?: string };
        message?: string;
      };
      if (errorObj?.status === 304 || errorObj?.response?.status === 304) {
        // 304 means content hasn't changed, use cached data or try again
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      console.error("Error loading devices:", error);
      setState((prev) => ({
        ...prev,
        error: `Network error: ${
          errorObj?.message ||
          errorObj?.response?.statusText ||
          "Failed to load devices"
        }`,
        loading: false,
      }));
    }
  }, [loadVariables]);

  useEffect(() => {
    loadDevicesFromDatabase();
  }, [loadDevicesFromDatabase]);

  const handleVariableSelection = (variable: VariableRecord) => {
    setState((prev) => {
      const isSelected = prev.selectedVariables.some(
        (v) => v.id === variable.id
      );
      const selectedVariables = isSelected
        ? prev.selectedVariables.filter((v) => v.id !== variable.id)
        : [...prev.selectedVariables, variable];
      return { ...prev, selectedVariables };
    });
  };

  // Group variables by device
  const variablesByDevice = state.variables.reduce((acc, variable) => {
    if (!acc[variable.device_id]) {
      acc[variable.device_id] = [];
    }
    acc[variable.device_id].push(variable);
    return acc;
  }, {} as Record<number, VariableRecord[]>);

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-600 to-indigo-600 mb-3">
            Analytics & Reports
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Energy usage analysis and performance insights
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Devices
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {state.devices.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-green-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Variables</p>
                <p className="text-2xl font-bold text-gray-900">
                  {state.variables.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Selected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {state.selectedVariables.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-orange-100">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {state.devices.filter((d) => d.name).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {state.loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics data...</p>
          </div>
        )}

        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6">
            <p className="font-medium">Error: {state.error}</p>
          </div>
        )}

        {!state.loading && (
          <div className="space-y-8">
            {/* Charts Section */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200/50">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Energy Charts
              </h3>

              {energy && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold mb-4">
                      Daily Energy Usage
                    </h4>
                    <EnergyBarChart data={energy.daily} title="Daily Usage" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-4">
                      Energy Distribution
                    </h4>
                    <EnergyPieChart data={energyPie} />
                  </div>
                </div>
              )}
            </div>

            {/* Device Charts */}

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200/50">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Device Analysis
              </h3>
              <div className="space-y-8">
                <div className="border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold mb-4"></h4>
                  <DeviceMultiVariableChart />
                </div>
              </div>
            </div>

            {/* Report Generation */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200/50">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Report Generation
              </h3>
              <ReportGenerator />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
