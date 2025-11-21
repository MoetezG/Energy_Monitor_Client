"use client";
import React, { useState } from "react";
import Image from "next/image";

interface Room {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  power: number;
  ac: boolean;
  lights: boolean;
}

interface Floor {
  id: string;
  name: string;
  background: string; // floor plan image
  rooms: Room[];
}

// Floor plan data with real coordinates based on floor plan images
const floors: Floor[] = [
  {
    id: "1",
    name: "Ground Floor",
    background: "/bg.jpg", // Replace with your actual floor plan image
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

  const currentFloor = floors.find((f) => f.id === currentFloorId)!;

  return (
    <div className="w-full">
      {/* Floor Selector */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Select Floor
        </h3>
        <div className="flex space-x-3">
          {floors.map((floor) => (
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
      </div>

      {/* Floor Map with fixed dimensions */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-lg w-fit ">
        <div className="bg-linear-to-r from-gray-700 to-gray-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium">{currentFloor.name}</h4>
            <div className="text-gray-300 text-sm">
              Rooms: {currentFloor.rooms.length} | Total Power (Real-time):{" "}
              {currentFloor.rooms.reduce((sum, room) => sum + room.power, 0)}kW
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
                onClick={() =>
                  alert(
                    `🏠 Room ${room.id}\n` +
                      `⚡ Instantaneous Power: ${room.power}kW\n` +
                      `📊 This shows current real-time power consumption\n` +
                      `❄️ AC: ${room.ac ? "ON" : "OFF"}\n` +
                      `💡 Lights: ${room.lights ? "ON" : "OFF"}\n` +
                      `📍 Floor: ${currentFloor.name}`
                  )
                }
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
                      <span className="text-xs">{room.ac ? "ON" : "OFF"}</span>
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
              <span className="font-medium">💡 Setup Guide:</span> Replace floor
              plan images in{" "}
              <code className="bg-gray-200 px-1 rounded">/public/floors/</code>{" "}
              and adjust room coordinates (x, y) to match actual room positions
              on your floor plans.
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
            <strong>Power Display:</strong> Values shown are instantaneous power
            consumption (kW), updated in real-time. For accumulated energy
            consumption over time (kWh), check the Analytics dashboard.
          </div>
        </div>
      </div>
    </div>
  );
}
