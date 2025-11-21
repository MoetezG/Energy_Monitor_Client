"use client";
import FloorMap from "@/components/floorMap";
import DashboardLayout from "@/components/DashboardLayout";

export default function FloorMapPage() {
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
        </div>

        {/* Floor Map Component */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-2 border border-gray-200/50">
          <FloorMap />
        </div>
      </div>
    </DashboardLayout>
  );
}
