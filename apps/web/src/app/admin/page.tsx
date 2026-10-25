"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import type { AdminDashboardOverview } from "@commerce/types";
import { formatCurrency } from "../../lib/format";
import { api } from "../../services/api";

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOverview = async () => {
    try {
      const overview = await api.adminGetOverview();
      setData(overview);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadOverview();
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  const overview = data || {
    productCount: 0,
    categoryCount: 0,
    orderCount: 0,
    customerCount: 0,
    totalRevenueCents: 0,
    lowStockCount: 0,
    recentOrders: [],
    recentAuditLogs: [],
    salesByDay: [],
    orderStatusCounts: {
      CREATED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    },
  };

  // Find max sales day for chart scaling
  const maxSaleCents = Math.max(
    10000,
    ...overview.salesByDay.map((d) => d.amountCents),
  );

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Analytics & Control
          </span>
          <h1 className="text-2xl font-black text-white sm:text-3xl mt-0.5">
            Store Performance Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time aggregates calculated directly from PostgreSQL transactions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/products"
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-md shadow-indigo-600/30"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Product</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Revenue
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">
              {formatCurrency(overview.totalRevenueCents)}
            </span>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
              <TrendingUp className="h-3 w-3" />
              <span>Paid transactions</span>
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Orders
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{overview.orderCount}</span>
            <p className="text-[11px] text-indigo-400 mt-1 font-semibold">
              {overview.orderStatusCounts.PROCESSING || 0} currently processing
            </p>
          </div>
        </div>

        {/* Active Products */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Catalog Products
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{overview.productCount}</span>
            <p className="text-[11px] text-slate-400 mt-1 font-semibold">
              Across {overview.categoryCount} departments
            </p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Low Stock Alerts
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{overview.lowStockCount}</span>
            <Link
              href="/admin/inventory"
              className="text-[11px] text-amber-400 hover:underline mt-1 block font-semibold"
            >
              Adjust inventory →
            </Link>
          </div>
        </div>
      </div>

      {/* Chart Section: 7-Day Revenue Trend & Orders by Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 7-Day Sales Trend SVG Chart */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white">7-Day Revenue & Volume Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Aggregated daily revenue from orders</p>
            </div>
            <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400">
              Daily Metrics
            </span>
          </div>

          {/* Interactive SVG Bar Chart */}
          <div className="h-52 w-full flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-800">
            {overview.salesByDay.map((day) => {
              const heightPercent = Math.max(
                8,
                Math.round((day.amountCents / maxSaleCents) * 100),
              );
              const label = new Date(day.date).toLocaleDateString("en-US", { weekday: "short" });

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold rounded-lg px-2 py-1 pointer-events-none shadow-xl border border-slate-700 whitespace-nowrap z-20">
                    {formatCurrency(day.amountCents)} ({day.orders} {day.orders === 1 ? "order" : "orders"})
                  </div>

                  <div
                    className="w-full max-w-[42px] rounded-t-lg bg-indigo-600 group-hover:bg-indigo-500 transition-all duration-300"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Orders by Status breakdown */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
            Orders by Status
          </h3>

          <div className="space-y-3">
            {[
              { key: "PROCESSING", label: "Processing", color: "bg-indigo-500", text: "text-indigo-400" },
              { key: "SHIPPED", label: "Shipped", color: "bg-sky-500", text: "text-sky-400" },
              { key: "DELIVERED", label: "Delivered", color: "bg-emerald-500", text: "text-emerald-400" },
              { key: "CANCELLED", label: "Cancelled", color: "bg-rose-500", text: "text-rose-400" },
            ].map((status) => {
              const count = (overview.orderStatusCounts as any)[status.key] || 0;
              const percent = overview.orderCount > 0 ? Math.round((count / overview.orderCount) * 100) : 0;

              return (
                <div key={status.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={status.text}>{status.label}</span>
                    <span className="text-slate-300 font-mono">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${status.color} transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800">
            <Link
              href="/admin/orders"
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <span>Manage All Orders</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Orders & Audit Log Stream */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Recent Orders Table */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">Recent Store Orders</h3>
            <Link href="/admin/orders" className="text-xs font-bold text-indigo-400 hover:underline">
              View all
            </Link>
          </div>

          {overview.recentOrders.length > 0 ? (
            <div className="divide-y divide-slate-800/80">
              {overview.recentOrders.map((o: any) => (
                <div key={o.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <Link
                      href={`/admin/orders`}
                      className="font-bold text-white hover:text-indigo-400 transition"
                    >
                      #{o.id.slice(-8).toUpperCase()}
                    </Link>
                    <p className="text-[11px] text-slate-400">{o.customerName || "Customer"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{formatCurrency(o.totalCents)}</p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        o.status === "DELIVERED"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : o.status === "SHIPPED"
                            ? "bg-sky-500/10 text-sky-400"
                            : o.status === "PROCESSING"
                              ? "bg-indigo-500/10 text-indigo-400"
                              : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">No orders yet.</p>
          )}
        </div>

        {/* Live Admin Audit Log Activity */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">Admin Audit Trail</h3>
            <Link href="/admin/audit-logs" className="text-xs font-bold text-indigo-400 hover:underline">
              Full log
            </Link>
          </div>

          {overview.recentAuditLogs.length > 0 ? (
            <div className="space-y-3">
              {overview.recentAuditLogs.map((log: any) => (
                <div key={log.id} className="rounded-xl border border-slate-800/70 bg-slate-900/70 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400">{log.action}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-1">{log.details || log.entity}</p>
                  <p className="text-[10px] text-slate-500">by {log.adminName}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">No audit activity recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
