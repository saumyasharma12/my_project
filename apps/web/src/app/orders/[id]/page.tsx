"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Package,
  ShieldCheck,
  Sparkles,
  Truck,
  XCircle,
} from "lucide-react";
import type { Order } from "@commerce/types";
import { formatCurrency } from "../../../lib/format";
import { api } from "../../../services/api";

function OrderTrackingContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await api.getOrder(params.id as string);
        setOrder(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load order details");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-40 bg-slate-200 rounded-3xl" />
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <XCircle className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="mt-4 text-xl font-black text-slate-900">Order Not Found</h2>
        <p className="mt-1 text-xs text-slate-500">{error || "Could not retrieve order details."}</p>
        <Link
          href="/orders"
          className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white"
        >
          View All Orders
        </Link>
      </div>
    );
  }

  const stages = [
    { key: "CREATED", label: "Order Placed", desc: "We received your order" },
    { key: "PROCESSING", label: "Processing", desc: "Items gathered & packed" },
    { key: "SHIPPED", label: "Shipped", desc: "In transit with courier" },
    { key: "DELIVERED", label: "Delivered", desc: "Delivered to address" },
  ];

  const stageOrder = ["CREATED", "PROCESSING", "SHIPPED", "DELIVERED"];
  const currentStageIndex = stageOrder.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Success banner if redirected from checkout */}
      {isSuccess && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/90 p-6 sm:p-8 text-emerald-950 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black">Thank You! Order Confirmed</h2>
              <p className="text-xs text-emerald-800 mt-0.5">
                A confirmation receipt and tracking updates have been sent to{" "}
                <span className="font-bold">{order.shippingEmail || "your email"}</span>.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-800">
            Payment Completed
          </span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link
            href="/orders"
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Orders</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900">
              Order #{order.id.slice(-8).toUpperCase()}
            </h1>
            <span
              className={`rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                order.status === "DELIVERED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : order.status === "SHIPPED"
                    ? "bg-sky-50 text-sky-700 border-sky-200"
                    : order.status === "PROCESSING"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : order.status === "CANCELLED"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              {order.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {order.trackingNumber && (
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm text-right">
            <span className="text-[10px] font-bold uppercase text-slate-400">Tracking Code</span>
            <p className="font-mono text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="h-4 w-4 text-indigo-600" />
              {order.trackingNumber}
            </p>
          </div>
        )}
      </div>

      {/* Visual Tracking Timeline */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-6">Delivery Progress</h3>

        {isCancelled ? (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-rose-600" />
            <span>This order was cancelled and refunded.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
            {stages.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div key={stage.key} className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition shadow-sm ${
                      isPast
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                          ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                  </div>
                  <div>
                    <h4
                      className={`text-xs font-bold ${
                        isCurrent
                          ? "text-indigo-600"
                          : isPast
                            ? "text-slate-900"
                            : "text-slate-400"
                      }`}
                    >
                      {stage.label}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{stage.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Grid: Shipping & Payment & Line Items */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Items */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Items Ordered ({order.items.length})
            </h3>
            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                      <img
                        src={item.imageUrl || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80"}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.productName}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Qty: {item.quantity} • {formatCurrency(item.unitPriceCents)} each
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-900">
                    {formatCurrency(item.unitPriceCents * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address & Instructions Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-bold text-slate-900">
              <MapPin className="h-4 w-4 text-indigo-600" />
              <span>Shipping Address</span>
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900">{order.shippingName || "Customer"}</p>
              <p>{order.shippingAddress || "N/A"}</p>
              <p>
                {order.shippingCity}, {order.shippingPostalCode}
              </p>
              <p>{order.shippingCountry}</p>
              {order.notes && (
                <p className="mt-3 text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-lg">
                  Notes: {order.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Payment Method */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Order Receipt
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(order.subtotalCents || order.totalCents)}
                </span>
              </div>

              {order.discountCents > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-semibold">
                  <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                  <span>-{formatCurrency(order.discountCents)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600">
                <span>Shipping</span>
                <span className="font-semibold text-slate-900">
                  {order.shippingCents === 0 ? "FREE" : formatCurrency(order.shippingCents)}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-sm">
                <span className="font-bold text-slate-900">Total Paid</span>
                <span className="text-xl font-black text-slate-900">
                  {formatCurrency(order.totalCents)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-xs font-bold text-slate-900">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              <span>Payment Information</span>
            </div>
            <div className="text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Method</span>
                <span className="font-semibold text-slate-900">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Status</span>
                <span
                  className={`font-bold ${
                    order.paymentStatus === "REFUNDED"
                      ? "text-rose-600"
                      : "text-emerald-600"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              {order.payments && order.payments.length > 0 && (
                <div className="flex justify-between text-slate-400 font-mono text-[10px]">
                  <span>Txn ID</span>
                  <span className="truncate max-w-[120px]">{order.payments[0]?.transactionId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Loading order tracking...</div>}>
      <OrderTrackingContent />
    </Suspense>
  );
}
