"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../lib/format";
import { api } from "../../services/api";

export default function CartPage() {
  const { cart, updateQuantity, removeItem, clearCart, showToast } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountCents: number;
    discountType: string;
    discountValue: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const subtotalCents = cart.totalCents;
  const discountCents = appliedCoupon ? appliedCoupon.discountCents : 0;
  const subtotalAfterDiscount = Math.max(0, subtotalCents - discountCents);
  const shippingCents = subtotalAfterDiscount >= 5000 || subtotalAfterDiscount === 0 ? 0 : 500;
  const totalCents = subtotalAfterDiscount + shippingCents;

  const freeShippingThreshold = 5000;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotalAfterDiscount);
  const freeShippingProgress = Math.min(100, (subtotalAfterDiscount / freeShippingThreshold) * 100);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await api.validateCoupon(couponCode.trim(), subtotalCents);
      setAppliedCoupon({
        code: res.code,
        discountCents: res.discountCents,
        discountType: res.discountType,
        discountValue: res.discountValue,
      });
      showToast(`Coupon ${res.code} applied successfully!`, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid coupon code";
      setCouponError(message);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
    showToast("Coupon removed", "info");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Your Basket</span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Shopping Cart</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"} selected
          </p>
        </div>

        <Link
          href="/products"
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      {cart.items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Your cart is empty</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any items in your shopping cart yet. Discover our curated catalog.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition"
          >
            <span>Start Shopping</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-6">
            {/* Free Shipping Progress bar */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                <span className="flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-indigo-600" />
                  {amountNeededForFreeShipping === 0 ? (
                    <span className="text-emerald-700">Congratulations! You unlocked FREE shipping!</span>
                  ) : (
                    <span>Add {formatCurrency(amountNeededForFreeShipping)} more for FREE shipping</span>
                  )}
                </span>
                <span className="text-indigo-700 font-mono">{Math.round(freeShippingProgress)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-indigo-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>

            {/* Items */}
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {cart.items.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 hover:bg-slate-50/50 transition">
                  <div className="flex items-center gap-4">
                    <div className="relative aspect-square w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                      <img
                        src={item.imageUrl || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80"}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{item.productName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatCurrency(item.unitPriceCents)} each
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-6">
                    {/* Quantity controls */}
                    <div className="flex items-center rounded-lg border border-slate-200 bg-white">
                      <button
                        type="button"
                        onClick={() => void updateQuantity(item.id, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center text-slate-600 hover:text-slate-900"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => void updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center text-slate-600 hover:text-slate-900"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Line total */}
                    <div className="text-right min-w-[70px]">
                      <span className="text-sm font-black text-slate-900">
                        {formatCurrency(item.unitPriceCents * item.quantity)}
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => void removeItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => void clearCart()}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Clear all cart items
              </button>
            </div>
          </div>

          {/* Order Summary Column */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                Order Summary
              </h2>

              {/* Coupon input */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Have a Promo Code?
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{appliedCoupon.code}</span>
                      <span className="text-emerald-600">(-{formatCurrency(appliedCoupon.discountCents)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-emerald-700 hover:text-emerald-900"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs uppercase font-mono tracking-wider focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40 transition"
                    >
                      {couponLoading ? "..." : "Apply"}
                    </button>
                  </form>
                )}
                {couponError && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{couponError}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-slate-400">
                  <span>Available:</span>
                  <span className="font-mono text-indigo-600 font-bold">WELCOME10</span>
                  <span>•</span>
                  <span className="font-mono text-indigo-600 font-bold">SAVE20</span>
                </div>
              </div>

              {/* Calculations breakdown */}
              <div className="space-y-3 border-t border-slate-100 pt-4 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(subtotalCents)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-{formatCurrency(discountCents)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-600">
                  <span>Standard Shipping</span>
                  <span className="font-semibold text-slate-900">
                    {shippingCents === 0 ? "FREE" : formatCurrency(shippingCents)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-900">Estimated Total</span>
                  <span className="text-xl font-black text-slate-900">
                    {formatCurrency(totalCents)}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <Link
                href={`/checkout${appliedCoupon ? `?coupon=${encodeURIComponent(appliedCoupon.code)}` : ""}`}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 px-4 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
