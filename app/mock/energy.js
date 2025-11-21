export const dailyEnergyMock = [
  { label: "Aujourd'hui", kWh: 1240 },
  { label: "Hier", kWh: 980 },
  { label: "J-2", kWh: 1020 },
  { label: "J-3", kWh: 1100 },
];

export const hourlyEnergyMock = [
  { label: "00-06", kWh: 120 },
  { label: "06-12", kWh: 240 },
  { label: "12-18", kWh: 310 },
  { label: "18-24", kWh: 280 },
];

export const zoneEnergyMock = [
  { zone: "Radiologie", kWh: 15000 },
  { zone: "ICU", kWh: 8000 },
  { zone: "Bloc Opératoire", kWh: 12000 },
  { zone: "Administration", kWh: 5000 },
  { zone: "Pharmacie", kWh: 3000 },
];

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
