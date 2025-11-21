"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
    icon: (
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
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 5a2 2 0 012-2h4a2 2 0 012 2v14l-5-3-5 3V5z"
        />
      </svg>
    ),
  },
  {
    name: "Monitoring",
    href: "/dashboard/monitor",
    icon: (
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
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    badge: "Live",
  },
  {
    name: "Devices",
    href: "/dashboard/devices",
    icon: (
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
    ),
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: (
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
          d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
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
          isCollapsed ? "lg:w-20" : "lg:w-72"
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col bg-white/95 backdrop-blur-lg border-r border-gray-200/50 shadow-xl">
          {/* Logo */}
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex items-center flex-shrink-0 px-4">
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
                      className={`flex-shrink-0 ${
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

            {/* Quick Actions */}
            {!isCollapsed && (
              <div className="px-3 mt-8">
                <div className="bg-linear-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200/50">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
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
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-green-900">
                        System Status
                      </p>
                      <div className="flex items-center mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                        <p className="text-xs text-green-700">
                          All systems online
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200/50">
            <Link
              href="/login"
              className={`group flex items-center w-full px-3 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all duration-200 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <svg
                className="w-5 h-5 text-gray-500 group-hover:text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
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
              <div className="flex-shrink-0 flex items-center px-4">
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
                        className={`flex-shrink-0 ${
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
            <div className="flex-shrink-0 p-4 border-t border-gray-200/50">
              <Link
                href="/login"
                className="group flex items-center w-full px-3 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all duration-200"
              >
                <svg
                  className="w-5 h-5 text-gray-500 group-hover:text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="ml-3">Logout</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
