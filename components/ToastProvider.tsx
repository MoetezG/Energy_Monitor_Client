"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 -right-90 transform translate-x-1/2 z-50 space-y-2 container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto overflow-hidden border-l-4 ${
              toast.type === "success"
                ? "border-green-500"
                : toast.type === "error"
                ? "border-red-500"
                : toast.type === "warning"
                ? "border-yellow-500"
                : "border-blue-500"
            }`}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="shrink-0">
                  {toast.type === "success" && (
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  )}
                  {toast.type === "error" && (
                    <XCircle className="h-6 w-6 text-red-400" />
                  )}
                  {toast.type === "warning" && (
                    <AlertTriangle className="h-6 w-6 text-yellow-400" />
                  )}
                  {toast.type === "info" && (
                    <Info className="h-6 w-6 text-blue-400" />
                  )}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">
                    {toast.title}
                  </p>
                  {toast.message && (
                    <p className="mt-1 text-sm text-gray-500">
                      {toast.message}
                    </p>
                  )}
                </div>
                <div className="ml-4 shrink-0 flex">
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
