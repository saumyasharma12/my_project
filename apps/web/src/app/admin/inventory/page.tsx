"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Boxes, Check, Minus, Plus, RefreshCw, Search } from "lucide-react";
import { formatCurrency } from "../../../lib/format";
import { api } from "../../../services/api";

export default function AdminInventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [deltaValue, setDeltaValue] = useState<number>(1);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadInventory = async () => {
    try {
      const data = await api.adminGetInventory();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInventory();
  }, []);

  const handleQuickAdjust = async (productId: string, delta: number) => {
    try {
      await api.adminAdjustStock({ productId, delta, reason: "Quick inventory button" });
      void loadInventory();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to adjust stock");
    }
  };

  const handleModalAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingId) return;
    setSubmitting(true);
    try {
      await api.adminAdjustStock({
        productId: adjustingId,
        delta: deltaValue,
        reason: reason.trim() || undefined,
      });
      setAdjustingId(null);
      setDeltaValue(1);
      setReason("");
      void loadInventory();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to adjust stock");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.categoryName.toLowerCase().includes(search.toLowerCase()),
  );

  const lowStockCount = items.filter((i) => i.isLowStock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Stock Control & Reordering
          </span>
          <h1 className="text-2xl font-black text-white sm:text-3xl mt-0.5">
            Inventory Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor real-time warehouse stock, low-inventory thresholds, and stock movements
          </p>
        </div>

        {lowStockCount > 0 && (
          <div className="flex items-center gap-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-xs font-bold text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span>{lowStockCount} items below threshold</span>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Filter by product or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 pl-9 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
        />
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Reorder Threshold</th>
                <th className="py-3 px-4">Stock Health</th>
                <th className="py-3 px-4 text-right">Quick Stock Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading inventory data...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 font-bold text-white">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                          <img
                            src={item.imageUrl || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=150&q=80"}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{item.categoryName}</td>
                    <td className="py-3 px-4 font-mono font-bold text-base text-white">
                      {item.stock}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {item.lowStockThreshold} units
                    </td>
                    <td className="py-3 px-4">
                      {item.stock <= 0 ? (
                        <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[10px] font-bold text-rose-400 uppercase">
                          Out of Stock
                        </span>
                      ) : item.isLowStock ? (
                        <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1 w-fit">
                          <AlertTriangle className="h-3 w-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => void handleQuickAdjust(item.id, -1)}
                          className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                          title="Decrement stock by 1"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => void handleQuickAdjust(item.id, +1)}
                          className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                          title="Increment stock by 1"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => void handleQuickAdjust(item.id, +10)}
                          className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-bold text-indigo-400 hover:bg-indigo-950/30 transition"
                          title="Restock +10 units"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => {
                            setAdjustingId(item.id);
                            setDeltaValue(5);
                            setReason("Warehouse restock");
                          }}
                          className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-700 transition ml-1"
                        >
                          Custom
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Adjustment Modal */}
      {adjustingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Adjust Product Stock Level</h3>
            <p className="text-xs text-slate-400">
              Enter positive value to add inventory or negative to reduce.
            </p>

            <form onSubmit={handleModalAdjust} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Stock Change Delta (+ / -)
                </label>
                <input
                  type="number"
                  required
                  value={deltaValue}
                  onChange={(e) => setDeltaValue(parseInt(e.target.value || "0", 10))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received shipment / Damaged stock"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustingId(null)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? "Updating..." : "Commit Change"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
