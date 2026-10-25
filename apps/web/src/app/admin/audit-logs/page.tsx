"use client";

import { useEffect, useState } from "react";
import { History, RefreshCw, Shield, Terminal } from "lucide-react";
import { api } from "../../../services/api";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      const data = await api.adminGetAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  const getActionBadge = (action: string) => {
    if (action.includes("CREATE")) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
    if (action.includes("UPDATE") || action.includes("ADJUST")) {
      return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    }
    if (action.includes("DELETE") || action.includes("REFUND")) {
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }
    return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Compliance & System Events
          </span>
          <h1 className="text-2xl font-black text-white sm:text-3xl mt-0.5">
            Admin Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of back-office modifications, inventory adjustments, and status changes
          </p>
        </div>

        <button
          onClick={() => void loadLogs()}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Audit Stream</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Admin Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Audit Details</th>
                <th className="py-3 px-4">Source IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString()}{" "}
                      <span className="text-slate-500">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                      {log.adminName || "System"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold font-mono uppercase ${getActionBadge(
                          log.action,
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-300">
                      {log.entity}
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-xs">
                      {log.details || "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No audit records registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
