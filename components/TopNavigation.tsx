"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

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

  const pageInfo =
    pageTitles[pathname || "/dashboard"] || pageTitles["/dashboard"];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-sm sticky top-0 z-30">
      <div className="px-6 py-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm mb-3">
          {pageInfo.breadcrumbs.map((item, index) => (
            <div key={item.href} className="flex items-center">
              {index > 0 && (
                <svg
                  className="w-4 h-4 text-gray-400 mx-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
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
            {/* System Status Indicator */}
            <div className="hidden md:flex items-center bg-green-50 px-4 py-2 rounded-xl border border-green-200/50">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse shadow-lg shadow-green-500/30"></div>
              <div>
                <p className="text-sm font-medium text-green-900">
                  System Online
                </p>
                <p className="text-xs text-green-700">
                  All services operational
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
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 relative">
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
                    d="M15 17h5l-5 5v-5zM9 17H4l5 5v-5zM12 3v14M12 3l4 4M12 3L8 7"
                  />
                </svg>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </button>

              {/* Settings */}
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200">
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

              {/* Help */}
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200">
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
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
