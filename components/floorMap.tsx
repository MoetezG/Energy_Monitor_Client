"use client";
import React, { useState } from "react";
import Image from "next/image";
import FloorSettingsModal from "./FloorSettingsModal";
import RoomSettingsModal from "./RoomSettingsModal";

interface Room {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  power: number;
  ac: boolean;
  lights: boolean;
  settings?: {
    lights: {
      enabled: boolean;
      delay: number;
      latencyDeactivation: number;
      comment: string;
    };
    ventilation: {
      enabled: boolean;
      delay: number;
      latencyDeactivation: number;
      comment: string;
    };
  };
}

interface Floor {
  id: string;
  name: string;
  background: string; // floor plan image
  rooms: Room[];
  controlLatency?: number; // delay in seconds before turning off lights/AC
}

// Floor plan data with real coordinates based on floor plan images
const floors: Floor[] = [
  {
    id: "1",
    name: "Ground Floor",
    background: "/bg.jpg", // Replace with your actual floor plan image
    controlLatency: 0,
    rooms: [
      {
        id: "101",
        x: 150, // X coordinate on the floor plan image
        y: 180, // Y coordinate on the floor plan image
        width: 120,
        height: 80,
        power: 450,
        ac: true,
        lights: false,
      },
      {
        id: "102",
        x: 350,
        y: 180,
        width: 120,
        height: 80,
        power: 320,
        ac: false,
        lights: true,
      },
      {
        id: "103",
        x: 560,
        y: 180,
        width: 120,
        height: 80,
        power: 380,
        ac: true,
        lights: true,
      },
    ],
  },
  {
    id: "2",
    name: "First Floor",
    background: "/floors/floor2.png", // Replace with your actual floor plan image
    controlLatency: 0,
    rooms: [
      {
        id: "201",
        x: 150,
        y: 120,
        width: 110,
        height: 85,
        power: 380,
        ac: true,
        lights: true,
      },
      {
        id: "202",
        x: 320,
        y: 120,
        width: 110,
        height: 85,
        power: 290,
        ac: false,
        lights: false,
      },
      {
        id: "203",
        x: 480,
        y: 120,
        width: 110,
        height: 85,
        power: 340,
        ac: true,
        lights: false,
      },
    ],
  },
  {
    id: "3",
    name: "Second Floor",
    background: "/floors/floor3.png", // Replace with your actual floor plan image
    controlLatency: 0,
    rooms: [
      {
        id: "301",
        x: 180,
        y: 160,
        width: 120,
        height: 90,
        power: 460,
        ac: true,
        lights: false,
      },
      {
        id: "302",
        x: 360,
        y: 160,
        width: 120,
        height: 90,
        power: 330,
        ac: false,
        lights: true,
      },
      {
        id: "303",
        x: 540,
        y: 160,
        width: 120,
        height: 90,
        power: 410,
        ac: true,
        lights: true,
      },
    ],
  },
];

export default function FloorMap() {
  const [currentFloorId, setCurrentFloorId] = useState("1");
  const [floorsData, setFloorsData] = useState(floors);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedFloorForSettings, setSelectedFloorForSettings] =
    useState<string>("");
  const [isRoomSettingsModalOpen, setIsRoomSettingsModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"plan" | "table">("table");

  const currentFloor = floorsData.find((f) => f.id === currentFloorId)!;
  const selectedRoom = currentFloor.rooms.find((r) => r.id === selectedRoomId);

  const handleOpenSettings = (floorId: string) => {
    setSelectedFloorForSettings(floorId);
    setIsSettingsModalOpen(true);
  };

  const handleSaveSettings = (
    floorId: string,
    settings: { timeRetard: number }
  ) => {
    setFloorsData((prevFloors) =>
      prevFloors.map((floor) =>
        floor.id === floorId
          ? { ...floor, timeRetard: settings.timeRetard }
          : floor
      )
    );
  };

  const handleOpenRoomSettings = (roomId: string) => {
    setSelectedRoomId(roomId);
    setIsRoomSettingsModalOpen(true);
  };

  const handleSaveRoomSettings = (
    roomId: string,
    settings: Room["settings"],
    lights: boolean,
    ac: boolean
  ) => {
    setFloorsData((prevFloors) =>
      prevFloors.map((floor) =>
        floor.id === currentFloorId
          ? {
              ...floor,
              rooms: floor.rooms.map((room) =>
                room.id === roomId ? { ...room, settings, lights, ac } : room
              ),
            }
          : floor
      )
    );
  };

  const selectedFloorData = floorsData.find(
    (f) => f.id === selectedFloorForSettings
  );

  return (
    <div className="w-full">
      {/* Floor Selector */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Select Floor
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex space-x-3">
            {floorsData.map((floor) => (
              <button
                key={floor.id}
                onClick={() => setCurrentFloorId(floor.id)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  currentFloorId === floor.id
                    ? "bg-blue-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102"
                }`}
              >
                {floor.name}
              </button>
            ))}
          </div>

          {/* Settings icon only for selected floor */}
          <button
            onClick={() => handleOpenSettings(currentFloorId)}
            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors duration-200 group"
            title={`Settings for ${currentFloor.name}`}
          >
            <svg
              className="w-5 h-5 text-gray-600 group-hover:text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-center">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("plan")}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                viewMode === "plan"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                  />
                </svg>
                <span>Floor Plan</span>
              </div>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                viewMode === "table"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h14a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1z"
                  />
                </svg>
                <span>Table View</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Conditional View Rendering */}
      {viewMode === "plan" ? (
        /* Floor Plan View */
        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-lg w-fit ">
          <div className="bg-linear-to-r from-gray-700 to-gray-800 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">{currentFloor.name}</h4>
                {currentFloor.controlLatency !== undefined &&
                  currentFloor.controlLatency > 0 && (
                    <div className="text-blue-300 text-xs mt-1">
                      ⏱️ Control delay: {currentFloor.controlLatency}s
                    </div>
                  )}
              </div>
              <div className="text-gray-300 text-sm">
                Rooms: {currentFloor.rooms.length} | Total Power (Real-time):{" "}
                {currentFloor.rooms.reduce((sum, room) => sum + room.power, 0)}
                kW
              </div>
            </div>
          </div>
          <div className="relative bg-white overflow-hidden">
            {/* Floor plan background image with fixed dimensions */}
            <div
              className="relative bg-gray-200 flex items-center justify-center"
              style={{ width: "1200px", height: "800px" }}
            >
              <Image
                src={currentFloor.background}
                alt={`${currentFloor.name} floor plan`}
                height={800}
                width={1200}
                className="object-cover w-full h-full"
                onError={() => {
                  // Fallback handled by Next.js Image component
                  console.log(
                    `Could not load floor plan: ${currentFloor.background}`
                  );
                }}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyuwjQTck15Fv8AHE8LihXA6EkpH"
              />
            </div>

            {/* Room overlays positioned on the floor plan */}
            <div className="absolute inset-0">
              {currentFloor.rooms.map((room) => (
                <div
                  key={room.id}
                  className="absolute group cursor-pointer transition-all duration-300 hover:scale-110 hover:z-20"
                  style={{
                    left: `${room.x}px`,
                    top: `${room.y}px`,
                    width: `${room.width}px`,
                    height: `${room.height}px`,
                  }}
                  onClick={() => handleOpenRoomSettings(room.id)}
                >
                  {/* Room background with status-based color */}
                  <div
                    className={`w-full h-full rounded-lg border-2 border-white shadow-lg p-2 text-white text-xs font-medium transition-all duration-300 ${
                      room.power > 400
                        ? "bg-red-600/90 hover:bg-red-700/95"
                        : room.power > 300
                        ? "bg-yellow-600/90 hover:bg-yellow-700/95"
                        : "bg-green-600/90 hover:bg-green-700/95"
                    }`}
                  >
                    {/* Room ID */}
                    <div className="text-center font-bold text-sm mb-1 bg-black/20 rounded px-1">
                      {room.id}
                    </div>

                    {/* Power consumption */}
                    <div className="flex items-center justify-center mb-1">
                      <span className="text-yellow-300 mr-1">⚡</span>
                      <span className="font-bold">{room.power}kW</span>
                    </div>

                    {/* Status indicators */}
                    <div className="flex justify-between items-center">
                      <div
                        className={`flex items-center ${
                          room.ac ? "text-blue-300" : "text-gray-400"
                        }`}
                      >
                        <span className="mr-1">❄️</span>
                        <span className="text-xs">
                          {room.ac ? "ON" : "OFF"}
                        </span>
                      </div>
                      <div
                        className={`flex items-center ${
                          room.lights ? "text-yellow-300" : "text-gray-400"
                        }`}
                      >
                        <span className="mr-1">💡</span>
                        <span className="text-xs">
                          {room.lights ? "ON" : "OFF"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced hover tooltip */}
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-30 shadow-xl">
                    <div className="font-bold">Room {room.id}</div>
                    <div>Click for details & controls</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions for positioning rooms */}
          <div className="bg-gray-100 px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">💡 Setup Guide:</span> Replace
                floor plan images in{" "}
                <code className="bg-gray-200 px-1 rounded">
                  /public/floors/
                </code>{" "}
                and adjust room coordinates (x, y) to match actual room
                positions on your floor plans.
              </p>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-600 rounded mr-1"></div>
                  <span className="text-gray-600">≤300kW</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-600 rounded mr-1"></div>
                  <span className="text-gray-600">301-400kW</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-600 rounded mr-1"></div>
                  <span className="text-gray-600">&gt;400kW</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 border-t border-gray-300 pt-2">
              <strong>Power Display:</strong> Values shown are instantaneous
              power consumption (kW), updated in real-time. For accumulated
              energy consumption over time (kWh), check the Analytics dashboard.
            </div>
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
          {/* Table Header */}
          <div className="bg-linear-to-r from-gray-700 to-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">
                  {currentFloor.name} - Table View
                </h4>
                {currentFloor.controlLatency !== undefined &&
                  currentFloor.controlLatency > 0 && (
                    <div className="text-blue-300 text-xs mt-1">
                      ⏱️ Control delay: {currentFloor.controlLatency}s
                    </div>
                  )}
              </div>
              <div className="text-gray-300 text-sm">
                Rooms: {currentFloor.rooms.length} | Total Power:{" "}
                {currentFloor.rooms.reduce((sum, room) => sum + room.power, 0)}
                kW
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Power (kW)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lighting
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Air Conditioning
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentFloor.rooms.map((room, index) => (
                  <tr
                    key={room.id}
                    className={`hover:bg-gray-50 transition-colors duration-200 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-25"
                    }`}
                  >
                    {/* Room ID */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {room.id}
                        </div>
                      </div>
                    </td>

                    {/* Power */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-2">⚡</span>
                        <div
                          className={`text-sm font-semibold ${
                            room.power > 400
                              ? "text-red-600"
                              : room.power > 300
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {room.power}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          room.power > 400
                            ? "bg-red-100 text-red-800"
                            : room.power > 300
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {room.power > 400
                          ? "High Usage"
                          : room.power > 300
                          ? "Medium Usage"
                          : "Normal"}
                      </span>
                    </td>

                    {/* Lighting */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-2">💡</span>
                        <span
                          className={`text-sm ${
                            room.lights
                              ? "text-green-600 font-medium"
                              : "text-gray-400"
                          }`}
                        >
                          {room.lights ? "ON" : "OFF"}
                        </span>
                      </div>
                    </td>

                    {/* Air Conditioning */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-blue-500 mr-2">❄️</span>
                        <span
                          className={`text-sm ${
                            room.ac
                              ? "text-green-600 font-medium"
                              : "text-gray-400"
                          }`}
                        >
                          {room.ac ? "ON" : "OFF"}
                        </span>
                      </div>
                    </td>

                    {/* Automation Status */}

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenRoomSettings(room.id)}
                        className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
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
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                <strong>Table View:</strong> Detailed overview of all rooms with
                automation settings and current status
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-600 rounded mr-1"></div>
                  <span>≤300kW</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-600 rounded mr-1"></div>
                  <span>301-400kW</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-600 rounded mr-1"></div>
                  <span>&gt;400kW</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floor Settings Modal */}
      {selectedFloorData && (
        <FloorSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          floorId={selectedFloorData.id}
          floorName={selectedFloorData.name}
          currentTimeRetard={selectedFloorData.controlLatency || 0}
          onSave={handleSaveSettings}
        />
      )}

      {/* Room Settings Modal */}
      {selectedRoom && (
        <RoomSettingsModal
          isOpen={isRoomSettingsModalOpen}
          onClose={() => setIsRoomSettingsModalOpen(false)}
          roomId={selectedRoom.id}
          roomData={selectedRoom}
          onSave={handleSaveRoomSettings}
        />
      )}
    </div>
  );
}
