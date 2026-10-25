"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Lock,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../lib/format";
import { api } from "../../services/api";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCoupon = searchParams.get("coupon") || "";

  const { user } = useAuth();
  const { cart, refreshCart, showToast } = useCart();

  const [shippingName, setShippingName] = useState(user?.name || "");
  const [shippingEmail, setShippingEmail] = useState(user?.email || "");
  const [shippingAddress, setShippingAddress] = useState("742 Evergreen Terrace");
  const [shippingCity, setShippingCity] = useState("Springfield");
  const [shippingPostalCode, setShippingPostalCode] = useState("97477");
  const [shippingCountry, setShippingCountry] = useState("United States");
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "CASH_ON_DELIVERY" | "UPI">("CARD");
  const [notes, setNotes] = useState("");

  const [couponCode, setCouponCode] = useState(urlCoupon);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountCents: number;
  } | null>(null);

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (!shippingName) setShippingName(user.name);
      if (!shippingEmail) setShippingEmail(user.email);
    }
  }, [user]);

  // Auto-validate URL coupon if provided
  useEffect(() => {
    if (urlCoupon && cart.totalCents > 0) {
      void (async () => {
        try {
          const res = await api.validateCoupon(urlCoupon, cart.totalCents);
          setAppliedCoupon({ code: res.code, discountCents: res.discountCents });
        } catch {
          // ignore invalid
        }
      })();
    }
  }, [urlCoupon, cart.totalCents]);

  const subtotalCents = cart.totalCents;
  const discountCents = appliedCoupon ? appliedCoupon.discountCents : 0;
  const subtotalAfterDiscount = Math.max(0, subtotalCents - discountCents);
  const shippingCents = subtotalAfterDiscount >= 5000 || subtotalAfterDiscount === 0 ? 0 : 500;
  const totalCents = subtotalAfterDiscount + shippingCents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login?redirect=/checkout");
      return;
    }

    if (cart.items.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const order = await api.checkout({
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        shippingName,
        shippingEmail,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
        shippingCountry,
        paymentMethod,
        notes: notes.trim() || null,
      });

      await refreshCart();
      showToast("Order placed successfully!", "success");
      router.push(`/orders/${order.id}?success=true`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Checkout failed";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h2 className="text-2xl font-black text-slate-900">Sign In Required</h2>
        <p className="mt-2 text-xs text-slate-500">
          Please sign in or register to complete your order and receive live tracking updates.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/login?redirect=/checkout"
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
          >
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Package className="mx-auto h-12 w-12 text-slate-400" />
        <h2 className="mt-4 text-xl font-black text-slate-900">Your cart is empty</h2>
        <p className="mt-1 text-xs text-slate-500">Add products before proceeding to checkout.</p>
        <Link
          href="/products"
          className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Secure Order
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Express Checkout</h1>
        </div>

        <Link
          href="/cart"
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Edit Cart</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Left Column: Shipping & Payment */}
          <div className="lg:col-span-7 space-y-8">
            {/* Shipping Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                  1
                </div>
                <h3 className="text-sm font-bold text-slate-900">Shipping Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Email for Notifications *
                  </label>
                  <input
                    type="email"
                    required
                    value={shippingEmail}
                    onChange={(e) => setShippingEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingPostalCode}
                    onChange={(e) => setShippingPostalCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingCountry}
                    onChange={(e) => setShippingCountry(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                    Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Leave by front porch / gate code"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                  2
                </div>
                <h3 className="text-sm font-bold text-slate-900">Payment Selection</h3>
              </div>

              <div className="space-y-3">
                <label
                  onClick={() => setPaymentMethod("CARD")}
                  className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition ${
                    paymentMethod === "CARD"
                      ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "CARD"}
                      onChange={() => setPaymentMethod("CARD")}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Credit or Debit Card</p>
                      <p className="text-[11px] text-slate-500">Secure automated test payment</p>
                    </div>
                  </div>
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                </label>

                {paymentMethod === "CARD" && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        disabled
                        value="•••• •••• •••• 4242 (Instant Demo Authorization)"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                          Expiry
                        </label>
                        <input
                          type="text"
                          disabled
                          value="12/28"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                          CVC
                        </label>
                        <input
                          type="text"
                          disabled
                          value="•••"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <label
                  onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                  className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition ${
                    paymentMethod === "CASH_ON_DELIVERY"
                      ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "CASH_ON_DELIVERY"}
                      onChange={() => setPaymentMethod("CASH_ON_DELIVERY")}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Cash on Delivery (COD)</p>
                      <p className="text-[11px] text-slate-500">Pay when your order arrives at your door</p>
                    </div>
                  </div>
                  <Truck className="h-5 w-5 text-slate-500" />
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Place Order */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Items in Order ({cart.itemCount})
              </h3>

              {/* Items Preview */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-slate-100">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 pt-3 first:pt-0">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                        <img
                          src={item.imageUrl || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=200&q=80"}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 line-clamp-1">{item.productName}</p>
                        <p className="text-[11px] text-slate-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {formatCurrency(item.unitPriceCents * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pricing breakdown */}
              <div className="space-y-2.5 border-t border-slate-100 pt-4 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(subtotalCents)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-emerald-700 font-semibold">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-{formatCurrency(discountCents)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-slate-900">
                    {shippingCents === 0 ? "FREE" : formatCurrency(shippingCents)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-900">Total Due</span>
                  <span className="text-xl font-black text-slate-900">
                    {formatCurrency(totalCents)}
                  </span>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-50 transition active:scale-98"
              >
                <Lock className="h-4 w-4" />
                <span>{processing ? "Authorizing Payment & Decrementing Stock..." : `Place Order • ${formatCurrency(totalCents)}`}</span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                <span>SSL Encrypted & Transaction Protected</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
