import { NextResponse } from "next/server";

import {
  dailyEnergyMock,
  hourlyEnergyMock,
  zoneEnergyMock,
  realTimePowerMock,
} from "../../mock/energy";

export async function GET() {
  return NextResponse.json({
    // Accumulated energy consumption over time periods (kWh)
    daily: dailyEnergyMock,
    hourly: hourlyEnergyMock,
    zones: zoneEnergyMock,
    // Real-time instantaneous power consumption (kW)
    realTimePower: realTimePowerMock,
    metadata: {
      energyUnit: "kWh",
      powerUnit: "kW",
      lastUpdated: new Date().toISOString(),
      description: {
        energy: "Accumulated energy consumption over specified time periods",
        power: "Instantaneous power consumption at current moment",
      },
    },
  });
}
