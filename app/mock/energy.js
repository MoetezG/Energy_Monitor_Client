// Mock data for energy consumption (accumulated kWh over time periods)
export const dailyEnergyMock = [
  { label: "Aujourd'hui", kWh: 1240, timeWindow: "24h", avgPower: 51.7 },
  { label: "Hier", kWh: 980, timeWindow: "24h", avgPower: 40.8 },
  { label: "J-2", kWh: 1020, timeWindow: "24h", avgPower: 42.5 },
  { label: "J-3", kWh: 1100, timeWindow: "24h", avgPower: 45.8 },
];

export const hourlyEnergyMock = [
  { label: "00-06", kWh: 120, timeWindow: "6h", avgPower: 20 },
  { label: "06-12", kWh: 240, timeWindow: "6h", avgPower: 40 },
  { label: "12-18", kWh: 310, timeWindow: "6h", avgPower: 51.7 },
  { label: "18-24", kWh: 280, timeWindow: "6h", avgPower: 46.7 },
];

export const zoneEnergyMock = [
  { zone: "Radiologie", kWh: 15000, timeWindow: "monthly", avgPower: 20.8 },
  { zone: "ICU", kWh: 8000, timeWindow: "monthly", avgPower: 11.1 },
  {
    zone: "Bloc Opératoire",
    kWh: 12000,
    timeWindow: "monthly",
    avgPower: 16.7,
  },
  { zone: "Administration", kWh: 5000, timeWindow: "monthly", avgPower: 6.9 },
  { zone: "Pharmacie", kWh: 3000, timeWindow: "monthly", avgPower: 4.2 },
];

// Mock data for real-time power consumption (instantaneous kW)
export const realTimePowerMock = [
  {
    deviceId: "DEV_001",
    zone: "Radiologie",
    currentPower: 22.5,
    unit: "kW",
    timestamp: new Date(),
  },
  {
    deviceId: "DEV_002",
    zone: "ICU",
    currentPower: 12.3,
    unit: "kW",
    timestamp: new Date(),
  },
  {
    deviceId: "DEV_003",
    zone: "Bloc Opératoire",
    currentPower: 18.7,
    unit: "kW",
    timestamp: new Date(),
  },
  {
    deviceId: "DEV_004",
    zone: "Administration",
    currentPower: 7.2,
    unit: "kW",
    timestamp: new Date(),
  },
  {
    deviceId: "DEV_005",
    zone: "Pharmacie",
    currentPower: 4.8,
    unit: "kW",
    timestamp: new Date(),
  },
];

// Legacy data formats (kept for backward compatibility)
export const energyByDay = [
  { label: "Aujourd'hui", value: 1240 },
  { label: "Hier", value: 980 },
  { label: "J-2", value: 1020 },
  { label: "J-3", value: 1100 },
];

export const energyByZone = [
  { label: "Radiologie", value: 15000 },
  { label: "ICU", value: 8000 },
  { label: "Bloc opératoire", value: 12000 },
  { label: "Admin", value: 5000 },
  { label: "Pharmacie", value: 3000 },
];

export const energyPie = [
  { name: "Éclairage", value: 35 },
  { name: "Climatisation", value: 25 },
  { name: "Appareils Médicaux", value: 30 },
  { name: "Autres", value: 10 },
];
