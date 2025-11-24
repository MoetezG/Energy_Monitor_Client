"use client";
import FloorMap from "@/components/floorMap";
import DashboardLayout from "@/components/DashboardLayout";
import { useHeartbeatWebSocket } from "@/hooks/useHeartbeatWebSocket";

export default function FloorMapPage() {
  const { edsStatus } = useHeartbeatWebSocket();
  const isEdsOnline = edsStatus?.online || false;

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 mb-3">
            Floor Map & Room Control
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Interactive floor plans with real-time room monitoring and control
          </p>

          {/* EDS Status Indicator */}
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-4 ${
              isEdsOnline
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                isEdsOnline ? "bg-green-500" : "bg-red-500"
              }`}
            />
            EDS System: {isEdsOnline ? "Online" : "Offline"}
          </div>
        </div>

        {/* Floor Map Component */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-5 border border-gray-200/50">
          <FloorMap isEdsOnline={isEdsOnline} />
        </div>
      </div>
    </DashboardLayout>
  );
}
