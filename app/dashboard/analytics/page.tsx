"use client";

import { useState, useEffect } from "react";
import { scadaAPI, DatabaseDevice, VariableRecord } from "@/lib/api";
import useRealTimeWebSocket from "@/hooks/useRealTimeWebSocket";
import DeviceMultiVariableChart from "@/components/DeviceMultiVariableChart";
import MultiVariableChart from "@/components/MultiVariableChart";
import ReportGenerator from "@/components/ReportGenerator";
import DashboardLayout from "@/components/DashboardLayout";
import EnergyBarChart from "@/components/EnergyBarChart";
import EnergyPieChart from "@/components/EnergyPieChart";
import PowerMonitorChart from "@/components/PowerMonitorChart";

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

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeChart, setActiveChart] = useState<"device" | "multi">("device");
  const [activeEnergyTab, setActiveEnergyTab] = useState<
    "consumption" | "power"
  >("consumption");

  // Use WebSocket hook for real-time device status
  const { deviceStatuses } = useRealTimeWebSocket();

  async function getMockEnergy() {
    const res = await fetch("http://localhost:3000/api/energy");
    return res.json();
  }

  const [energy, setEnergy] = useState<{
    daily: Array<{ label: string; kWh: number }>;
    hourly: Array<{ label: string; kWh: number }>;
    zones: Array<{ zone: string; kWh: number }>;
    realTimePower?: Array<{
      deviceId: string;
      zone: string;
      currentPower: number;
      unit: string;
      timestamp: Date;
    }>;
    metadata?: {
      energyUnit: string;
      powerUnit: string;
      lastUpdated: string;
      description: {
        energy: string;
        power: string;
      };
    };
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

  useEffect(() => {
    // Direct function call to avoid linting issues
    const initializeData = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        // Fetch both devices and variables from the database
        const [devicesResponse, variablesResponse] = await Promise.all([
          scadaAPI.getDatabaseDevices(),
          scadaAPI.getVariableList(),
        ]);

        if (devicesResponse.success && devicesResponse.data) {
          setState((prev) => ({
            ...prev,
            devices: devicesResponse.data || [],
          }));
        } else {
          setState((prev) => ({
            ...prev,
            error: devicesResponse.error || "Failed to load devices",
          }));
        }

        if (variablesResponse.success && variablesResponse.data) {
          setState((prev) => ({
            ...prev,
            variables: variablesResponse.data || [],
          }));
        } else {
          console.error("Failed to load variables:", variablesResponse.error);
          setState((prev) => ({
            ...prev,
            error: variablesResponse.error || "Failed to load variables",
          }));
        }

        setState((prev) => ({ ...prev, loading: false }));
      } catch (error: unknown) {
        const errorObj = error as {
          status?: number;
          response?: { status?: number; statusText?: string };
          message?: string;
        };

        if (errorObj?.status === 304 || errorObj?.response?.status === 304) {
          setState((prev) => ({ ...prev, loading: false }));
          return;
        }

        console.error("Error loading data:", error);
        setState((prev) => ({
          ...prev,
          error: `Network error: ${
            errorObj?.message ||
            errorObj?.response?.statusText ||
            "Failed to load data"
          }`,
          loading: false,
        }));
      }
    };

    initializeData();
  }, []);

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Generate Report</span>
            </button>
          </div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-600 to-indigo-600 mb-3">
            Analytics & Reports
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Energy usage analysis and performance insights
          </p>
        </div>

        {/* Essential Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Variables
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {state.variables.length}
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Online Devices
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {deviceStatuses.filter((d) => d.status === "online").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-red-100">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Offline Devices
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {deviceStatuses.filter((d) => d.status === "offline").length}
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
            {/* Energy & Power Charts Section */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200/50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Energy & Power Analysis
                </h3>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveEnergyTab("consumption")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      activeEnergyTab === "consumption"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    📊 Consommation (kWh)
                  </button>
                  <button
                    onClick={() => setActiveEnergyTab("power")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      activeEnergyTab === "power"
                        ? "bg-white text-orange-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    ⚡ Puissance (kW)
                  </button>
                </div>
              </div>

              {activeEnergyTab === "consumption" && energy && (
                <div className="space-y-6">
                  <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-800">
                        Consommation d&apos;énergie cumulée
                      </span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Données d&apos;énergie (kWh) accumulées sur des périodes
                      de temps définies. Idéal pour analyser les tendances de
                      consommation et calculer les coûts énergétiques.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span>📈</span>
                        Consommation quotidienne (kWh)
                      </h4>
                      <EnergyBarChart
                        data={energy.daily}
                        title="Consommation quotidienne cumulée"
                      />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span>🥧</span>
                        Répartition par catégorie
                      </h4>
                      <EnergyPieChart data={energyPie} />
                    </div>
                  </div>

                  {energy.hourly && (
                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span>⏰</span>
                        Consommation par tranche horaire (kWh)
                      </h4>
                      <EnergyBarChart
                        data={energy.hourly}
                        title="Consommation horaire cumulée"
                        theme="green"
                      />
                    </div>
                  )}
                </div>
              )}

              {activeEnergyTab === "power" &&
                energy &&
                energy.realTimePower && (
                  <div className="space-y-6">
                    <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-orange-800">
                          Puissance instantanée temps réel
                        </span>
                      </div>
                      <p className="text-xs text-orange-700">
                        Données de puissance (kW) mesurées en temps réel à
                        l&apos;instant T. Idéal pour surveiller la charge
                        actuelle et détecter les pics de consommation.
                      </p>
                    </div>

                    <PowerMonitorChart
                      data={energy.realTimePower.map((item) => ({
                        ...item,
                        timestamp: new Date(item.timestamp),
                      }))}
                      title="Surveillance puissance temps réel"
                    />
                  </div>
                )}

              {activeEnergyTab === "power" &&
                (!energy || !energy.realTimePower) && (
                  <div className="text-center py-12 bg-orange-50/50 rounded-xl border border-orange-200">
                    <div className="text-orange-600 mb-4">
                      <svg
                        className="w-12 h-12 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-orange-800 mb-2">
                      Données de puissance non disponibles
                    </h4>
                    <p className="text-orange-700 text-sm">
                      Connectez des dispositifs pour voir les données de
                      puissance en temps réel.
                    </p>
                  </div>
                )}
            </div>

            {/*  Charts */}

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200/50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Device Analysis
                </h3>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveChart("device")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      activeChart === "device"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Device Multi-Variable
                  </button>
                  <button
                    onClick={() => setActiveChart("multi")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      activeChart === "multi"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Multi-Variable
                  </button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl p-6">
                {activeChart === "device" ? (
                  <DeviceMultiVariableChart />
                ) : (
                  <MultiVariableChart />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Report Generator Modal */}
        <ReportGenerator
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}
