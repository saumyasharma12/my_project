"use client";

import { useEffect, useState } from "react";
import { Mail, ShoppingBag, UserCheck, Users } from "lucide-react";
import { formatCurrency } from "../../../lib/format";
import { api } from "../../../services/api";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = await api.adminGetCustomers();
        setCustomers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Clientele & Relations
          </span>
          <h1 className="text-2xl font-black text-white sm:text-3xl mt-0.5">
            Customer Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered customer accounts, purchasing volume, and order histories
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-bold text-slate-300">
          Total Customers: {customers.length}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Total Orders</th>
                <th className="py-3 px-4">Lifetime Spend</th>
                <th className="py-3 px-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Loading customer records...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 font-bold text-xs border border-indigo-500/30">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {c.email}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-bold">
                      {c.orderCount} {c.orderCount === 1 ? "order" : "orders"}
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-400 font-mono">
                      {formatCurrency(c.totalSpentCents)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No registered customers yet.
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
