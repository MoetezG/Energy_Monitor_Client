"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, HelpCircle, ChevronRight } from "lucide-react";
import { useHeartbeatWebSocket } from "@/hooks/useHeartbeatWebSocket";

interface BreadcrumbItem {
  name: string;
  href: string;
}

const pageTitles: Record<
  string,
  { title: string; subtitle: string; breadcrumbs: BreadcrumbItem[] }
> = {
  "/dashboard": {
    title: "Dashboard Overview",
    subtitle: "Monitor your energy usage and system performance",
    breadcrumbs: [{ name: "Dashboard", href: "/dashboard" }],
  },
  "/dashboard/monitor": {
    title: "Live Monitoring",
    subtitle: "Real-time energy data and system monitoring",
    breadcrumbs: [
      { name: "Dashboard", href: "/dashboard" },
      { name: "Monitoring", href: "/dashboard/monitor" },
    ],
  },
  "/dashboard/devices": {
    title: "Device Management",
    subtitle: "Configure and manage your energy monitoring devices",
    breadcrumbs: [
      { name: "Dashboard", href: "/dashboard" },
      { name: "Devices", href: "/dashboard/devices" },
    ],
  },
  "/dashboard/analytics": {
    title: "Analytics & Reports",
    subtitle: "Energy usage analysis and performance insights",
    breadcrumbs: [
      { name: "Dashboard", href: "/dashboard" },
      { name: "Analytics", href: "/dashboard/analytics" },
    ],
  },
};

export default function TopNavigation() {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { edsStatus, isConnected } = useHeartbeatWebSocket();

  const pageInfo =
    pageTitles[pathname || "/dashboard"] || pageTitles["/dashboard"];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Function to get EDS status display info
  const getEDSStatusInfo = () => {
    if (!isConnected) {
      return {
        text: "Disconnected",
        subtext: "WebSocket offline",
        dotColor: "bg-gray-500",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200/50",
        textColor: "text-gray-900",
        subtextColor: "text-gray-700",
      };
    }

    if (!edsStatus) {
      return {
        text: "Initializing",
        subtext: "Connecting to EDS...",
        dotColor: "bg-yellow-500",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200/50",
        textColor: "text-yellow-900",
        subtextColor: "text-yellow-700",
      };
    }

    if (edsStatus.online) {
      return {
        text: "System Online",
        subtext: `Response: ${edsStatus.responseTime || "Unknown"}`,
        dotColor: "bg-green-500",
        bgColor: "bg-green-50",
        borderColor: "border-green-200/50",
        textColor: "text-green-900",
        subtextColor: "text-green-700",
        showPulse: true,
      };
    }

    if (edsStatus.failures >= 3) {
      return {
        text: "System Offline",
        subtext: "Max failures reached",
        dotColor: "bg-red-500",
        bgColor: "bg-red-50",
        borderColor: "border-red-200/50",
        textColor: "text-red-900",
        subtextColor: "text-red-700",
      };
    }

    return {
      text: "System Warning",
      subtext: `Failed (${edsStatus.failures}/3)`,
      dotColor: "bg-yellow-500",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200/50",
      textColor: "text-yellow-900",
      subtextColor: "text-yellow-700",
    };
  };

  const statusInfo = getEDSStatusInfo();

  return (
    <div className="bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-sm sticky top-0 z-30">
      <div className="px-6 py-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm mb-3">
          {pageInfo.breadcrumbs.map((item, index) => (
            <div key={item.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
              )}
              <Link
                href={item.href}
                className={`transition-colors duration-200 ${
                  index === pageInfo.breadcrumbs.length - 1
                    ? "text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {item.name}
              </Link>
            </div>
          ))}
        </nav>

        {/* Page Title and Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {pageInfo.title}
            </h1>
            <p className="text-gray-600">{pageInfo.subtitle}</p>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-6">
            {/* EDS Status Indicator */}
            <div
              className={`hidden md:flex items-center px-4 py-2 rounded-xl border ${statusInfo.bgColor} ${statusInfo.borderColor}`}
            >
              <div className="relative">
                <div
                  className={`w-3 h-3 ${statusInfo.dotColor} rounded-full shadow-lg`}
                ></div>
                {statusInfo.showPulse && (
                  <div
                    className={`absolute inset-0 w-3 h-3 ${statusInfo.dotColor} rounded-full animate-pulse opacity-75`}
                  ></div>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${statusInfo.textColor}`}>
                  {statusInfo.text}
                </p>
                <p className={`text-xs ${statusInfo.subtextColor}`}>
                  {statusInfo.subtext}
                </p>
              </div>
            </div>

            {/* Time Display */}
            <div className="hidden lg:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="text-lg font-mono text-blue-600 font-semibold">
                {currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              {/* Notifications */}

              {/* Help */}
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200">
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
