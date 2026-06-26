"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { ClipboardList, Shield, Key } from "lucide-react";

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState<"activity" | "admin">("activity");

  const { data: logsRes, isLoading } = useQuery({
    queryKey: ["adminLogs"],
    queryFn: async () => {
      const res = await api.get("/admin/logs");
      return res.data;
    },
  });

  const adminLogs = logsRes?.adminLogs || [];
  const activityLogs = logsRes?.activityLogs || [];

  if (isLoading) {
    return <p className="animate-pulse">Loading activity logs...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">System Audit Logs</h1>
        <p className="text-sm text-gray-500">Track and monitor security events and admin interventions.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <button
          onClick={() => setActiveTab("activity")}
          className={`text-xs font-bold px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
            activeTab === "activity"
              ? "bg-amber-600 border-amber-600 text-white"
              : "bg-white dark:bg-gray-900 hover:bg-gray-50"
          }`}
        >
          User Activity Logs ({activityLogs.length})
        </button>
        <button
          onClick={() => setActiveTab("admin")}
          className={`text-xs font-bold px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
            activeTab === "admin"
              ? "bg-amber-600 border-amber-600 text-white"
              : "bg-white dark:bg-gray-900 hover:bg-gray-50"
          }`}
        >
          Admin Intervention Logs ({adminLogs.length})
        </button>
      </div>

      {/* Log Feed */}
      <div className="border rounded-2xl bg-white dark:bg-gray-900 shadow-sm p-4 space-y-4">
        {activeTab === "activity" ? (
          activityLogs.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No user activities logged yet.</p>
          ) : (
            <div className="space-y-3 divide-y">
              {activityLogs.map((log: any, idx: number) => (
                <div
                  key={log.id}
                  className={`text-xs pt-3 flex items-start gap-3 justify-between ${idx === 0 ? "pt-0" : ""}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 mt-0.5">
                      <Key className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-300">
                        {log.user.username}{" "}
                        <span className="font-semibold text-primary">[{log.action}]</span>
                      </p>
                      <p className="text-gray-500 mt-0.5">{log.details}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )
        ) : adminLogs.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">No administrator actions logged yet.</p>
        ) : (
          <div className="space-y-3 divide-y">
            {adminLogs.map((log: any, idx: number) => (
              <div
                key={log.id}
                className={`text-xs pt-3 flex items-start gap-3 justify-between ${idx === 0 ? "pt-0" : ""}`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-900/30 mt-0.5">
                    <Shield className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-300">
                      {log.user.username}{" "}
                      <span className="font-semibold text-amber-600">[{log.action}]</span>
                    </p>
                    <p className="text-gray-500 mt-0.5">{log.details}</p>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
