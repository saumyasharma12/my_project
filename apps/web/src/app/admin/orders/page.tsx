"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Edit,
  Eye,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import type { Order } from "@commerce/types";
import { formatCurrency } from "../../../lib/format";
import { api } from "../../../services/api";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  // Status Update Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("PROCESSING");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadOrders = async () => {
    try {
      const data = await api.adminGetOrders({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      });
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [statusFilter, search]);

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingNumber || `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setNotes(order.notes || "");
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmitting(true);

    try {
      await api.adminUpdateOrderStatus(selectedOrder.id, {
        status: newStatus,
        trackingNumber: trackingNumber.trim() || null,
        notes: notes.trim() || null,
      });
      setSelectedOrder(null);
      void loadOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update order status");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "SHIPPED":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "PROCESSING":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Fulfillment & Shipments
          </span>
          <h1 className="text-2xl font-black text-white sm:text-3xl mt-0.5">
            Customer Orders
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track customer orders, manage shipment status, and dispatch tracking updates
          </p>
        </div>

        <button
          onClick={() => void loadOrders()}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search order ID, customer name, email, tracking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 pl-9 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="CREATED">Created</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Fulfillment</th>
                <th className="py-3 px-4">Tracking Code</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-white block">
                        #{o.id.slice(-8).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-200 block">
                        {o.user?.name || o.shippingName || "Customer"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {o.user?.email || o.shippingEmail || ""}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {o.items.length} {o.items.length === 1 ? "item" : "items"}
                    </td>
                    <td className="py-3 px-4 font-black text-white">
                      {formatCurrency(o.totalCents)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          o.paymentStatus === "REFUNDED"
                            ? "bg-rose-500/10 text-rose-400"
                            : "bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${getStatusBadge(
                          o.status,
                        )}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {o.trackingNumber ? (
                        <span className="flex items-center gap-1 text-slate-300">
                          <Truck className="h-3 w-3 text-indigo-400" />
                          {o.trackingNumber}
                        </span>
                      ) : (
                        "Pending"
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openStatusModal(o)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-indigo-400 hover:bg-indigo-600 hover:text-white transition"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Update</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No orders match current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">
                  Update Order #{selectedOrder.id.slice(-8).toUpperCase()}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Recipient: {selectedOrder.shippingName || "Customer"}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Fulfillment Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="CREATED">CREATED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Courier Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. TRK-84920192"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Internal / Customer Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Dispatched via Express Courier"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? "Updating..." : "Commit Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
