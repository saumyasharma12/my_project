"use client";

import { useEffect, useState } from "react";
import { Edit, Plus, Tag, Trash2, X } from "lucide-react";
import type { Coupon } from "@commerce/types";
import { formatCurrency } from "../../../lib/format";
import { api } from "../../../services/api";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form Fields
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("10"); // 10% or $10
  const [minOrderDollars, setMinOrderDollars] = useState("20");
  const [maxUses, setMaxUses] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadCoupons = async () => {
    try {
      const data = await api.adminGetCoupons();
      setCoupons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode("");
    setDiscountType("PERCENTAGE");
    setDiscountValue("15");
    setMinOrderDollars("30");
    setMaxUses("100");
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDiscountType(c.discountType);
    setDiscountValue(
      c.discountType === "PERCENTAGE"
        ? String(c.discountValue)
        : (c.discountValue / 100).toFixed(2),
    );
    setMinOrderDollars((c.minOrderCents / 100).toFixed(2));
    setMaxUses(c.maxUses ? String(c.maxUses) : "");
    setIsActive(c.isActive);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const numericValue =
      discountType === "PERCENTAGE"
        ? parseInt(discountValue, 10)
        : Math.round(parseFloat(discountValue) * 100);

    const minCents = Math.round(parseFloat(minOrderDollars || "0") * 100);
    const uses = maxUses.trim() ? parseInt(maxUses, 10) : null;

    try {
      if (editingCoupon) {
        await api.adminUpdateCoupon(editingCoupon.id, {
          code: code.trim().toUpperCase(),
          discountType,
          discountValue: numericValue,
          minOrderCents: minCents,
          maxUses: uses,
          isActive,
        });
      } else {
        await api.adminCreateCoupon({
          code: code.trim().toUpperCase(),
          discountType,
          discountValue: numericValue,
          minOrderCents: minCents,
          maxUses: uses,
          isActive,
        });
      }
      setModalOpen(false);
      void loadCoupons();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, couponCode: string) => {
    if (!window.confirm(`Are you sure you want to delete coupon code "${couponCode}"?`)) {
      return;
    }
    try {
      await api.adminDeleteCoupon(id);
      void loadCoupons();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete coupon");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Promotions & Campaigns
          </span>
          <h1 className="text-2xl font-black text-white sm:text-3xl mt-0.5">
            Coupon Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure percentage and fixed price discount promo codes for checkouts
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/30"
        >
          <Plus className="h-4 w-4" />
          <span>New Promo Coupon</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Discount Value</th>
                <th className="py-3 px-4">Min Order</th>
                <th className="py-3 px-4">Redemptions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading coupon list...
                  </td>
                </tr>
              ) : coupons.length > 0 ? (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-sm text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                        {c.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-300">
                      {c.discountType === "PERCENTAGE" ? "Percentage (%)" : "Fixed Amount ($)"}
                    </td>
                    <td className="py-3 px-4 font-black text-white">
                      {c.discountType === "PERCENTAGE"
                        ? `${c.discountValue}% OFF`
                        : `${formatCurrency(c.discountValue)} OFF`}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {c.minOrderCents === 0 ? "None" : formatCurrency(c.minOrderCents)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {c.usedCount} {c.maxUses ? `/ ${c.maxUses}` : "uses"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          c.isActive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {c.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                          title="Edit Coupon"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.code)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition"
                          title="Delete Coupon"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No active coupons found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">
                {editingCoupon ? `Edit Coupon "${editingCoupon.code}"` : "Create Promotional Coupon"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl bg-rose-950/40 border border-rose-800 p-3 text-xs text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER25"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono uppercase text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Dollars ($)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    {discountType === "PERCENTAGE" ? "Percent Off (%) *" : "Dollar Amount ($) *"}
                  </label>
                  <input
                    type="number"
                    step={discountType === "PERCENTAGE" ? "1" : "0.01"}
                    min="1"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Minimum Order ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={minOrderDollars}
                    onChange={(e) => setMinOrderDollars(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Maximum Usages
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited if empty"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Active & Ready to Redeem</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingCoupon ? "Save Changes" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
