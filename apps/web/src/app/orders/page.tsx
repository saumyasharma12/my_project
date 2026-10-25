"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Package, Truck } from "lucide-react";
import type { Order } from "@commerce/types";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../lib/format";
import { api } from "../../services/api";

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const data = await api.getOrders();
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Package className="mx-auto h-12 w-12 text-slate-400" />
        <h2 className="mt-4 text-xl font-black text-slate-900">Sign in to view orders</h2>
        <p className="mt-1 text-xs text-slate-500">
          Sign in to view your order history and track active deliveries.
        </p>
        <Link
          href="/login?redirect=/orders"
          className="mt-6 inline-flex rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "SHIPPED":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "PROCESSING":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Account Activity
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">My Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {orders.length} {orders.length === 1 ? "order" : "orders"} placed
          </p>
        </div>

        <Link
          href="/products"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          Explore More Products
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-12 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/70 p-4 sm:px-6 text-xs">
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Order ID</span>
                      <p className="font-mono font-bold text-slate-900">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Date Placed</span>
                      <p className="font-semibold text-slate-800">{dateStr}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                      <p className="font-black text-slate-900">{formatCurrency(order.totalCents)}</p>
                    </div>

                    {order.trackingNumber && (
                      <div className="hidden sm:block">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Tracking</span>
                        <p className="font-mono text-slate-700 flex items-center gap-1">
                          <Truck className="h-3 w-3 text-indigo-600" />
                          {order.trackingNumber}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getStatusBadge(
                        order.status,
                      )}`}
                    >
                      {order.status}
                    </span>

                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
                    >
                      <span>Track Order</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Items in order preview */}
                <div className="p-4 sm:p-6 divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{item.productName}</h4>
                        <p className="text-[11px] text-slate-500">
                          Qty: {item.quantity} • {formatCurrency(item.unitPriceCents)} each
                        </p>
                      </div>
                      <span className="text-xs font-black text-slate-900">
                        {formatCurrency(item.unitPriceCents * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center">
          <Package className="mx-auto h-14 w-14 text-slate-400 mb-4" />
          <h3 className="text-lg font-black text-slate-900">No orders found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            You haven't placed any orders yet. Once you make a purchase, it will appear here.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
          >
            Start Shopping
          </Link>
        </div>
      )}
    </div>
  );
}
