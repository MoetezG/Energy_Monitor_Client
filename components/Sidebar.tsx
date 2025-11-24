"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { JSX, useState } from "react";
import {
  LayoutDashboard,
  Activity,
  Settings,
  BarChart3,
  Map,
  LogOut,
} from "lucide-react";

interface NavigationItem {
  name: string;
  href: string;
  icon: JSX.Element;
  badge?: string;
  submenu?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: "Monitoring",
    href: "/dashboard/monitor",
    icon: <Activity className="w-5 h-5" />,
    badge: "Live",
  },
  {
    name: "Devices",
    href: "/dashboard/devices",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    name: "Floor Map",
    href: "/dashboard/floormap",
    icon: <Map className="w-5 h-5" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname ? pathname.startsWith(href) : false;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
          isCollapsed ? "lg:w-20" : "lg:w-65"
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col bg-white/95 backdrop-blur-lg border-r border-gray-200/50 shadow-xl">
          {/* Logo */}
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex items-center shrink-0 px-4">
              <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              {!isCollapsed && (
                <div className="ml-4">
                  <h1 className="text-xl font-bold text-gray-900">
                    Energy Monitor
                  </h1>
                  <p className="text-sm text-gray-600">Smart Management</p>
                </div>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="ml-auto lg:hidden xl:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    isCollapsed ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                </svg>
              </button>
            </div>

            {/* Navigation */}
            <nav className="mt-8 flex-1 space-y-2 px-3">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative ${
                      active
                        ? "bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-200/50 scale-105"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-105"
                    }`}
                  >
                    <div
                      className={`shrink-0 ${
                        active
                          ? "text-white"
                          : "text-gray-500 group-hover:text-gray-700"
                      }`}
                    >
                      {item.icon}
                    </div>
                    {!isCollapsed && (
                      <>
                        <span className="ml-3 flex-1">{item.name}</span>
                        {item.badge && (
                          <span
                            className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                              active
                                ? "bg-white/20 text-white"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {active && (
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"></div>
                        )}
                      </>
                    )}
                    {isCollapsed && item.badge && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Menu */}
          <div className="shrink-0 p-4 border-t border-gray-200/50">
            <Link
              href="/login"
              className={`group flex items-center w-full px-3 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all duration-200 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <LogOut className="w-5 h-5 text-gray-500 group-hover:text-red-600" />
              {!isCollapsed && <span className="ml-3">Logout</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu Button - Fixed Position */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          type="button"
          className="bg-white/90 backdrop-blur-lg p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white shadow-lg border border-gray-200/50 transition-all duration-200"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {!isCollapsed && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsCollapsed(true)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white/95 backdrop-blur-lg shadow-xl">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsCollapsed(true)}
              >
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="shrink-0 flex items-center px-4">
                <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h1 className="text-xl font-bold text-gray-900">
                    Energy Monitor
                  </h1>
                  <p className="text-sm text-gray-600">Smart Management</p>
                </div>
              </div>
              <nav className="mt-8 px-3 space-y-2">
                {navigation.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        active
                          ? "bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                      onClick={() => setIsCollapsed(true)}
                    >
                      <div
                        className={`shrink-0 ${
                          active
                            ? "text-white"
                            : "text-gray-500 group-hover:text-gray-700"
                        }`}
                      >
                        {item.icon}
                      </div>
                      <span className="ml-3 flex-1">{item.name}</span>
                      {item.badge && (
                        <span
                          className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="shrink-0 p-4 border-t border-gray-200/50">
              <Link
                href="/login"
                className="group flex items-center w-full px-3 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all duration-200"
              >
                <LogOut className="w-5 h-5 text-gray-500 group-hover:text-red-600" />
                <span className="ml-3">Logout</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
