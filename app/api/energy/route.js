import { NextResponse } from "next/server";

import {
  dailyEnergyMock,
  hourlyEnergyMock,
  zoneEnergyMock,
} from "../../mock/energy";

export async function GET() {
  return NextResponse.json({
    daily: dailyEnergyMock,
    hourly: hourlyEnergyMock,
    zones: zoneEnergyMock,
  });
}
