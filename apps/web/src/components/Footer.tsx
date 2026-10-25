"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, ShoppingBag, Truck, Undo2 } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  // Hide on admin routes
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="border-t border-slate-200 bg-white">
      {/* Feature perks strip */}
      <div className="border-b border-slate-100 bg-slate-50/50 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Complimentary Shipping</h4>
                <p className="text-xs text-slate-500">Free delivery on all continental orders over $50.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Guaranteed Safe Checkout</h4>
                <p className="text-xs text-slate-500">256-bit encrypted transactions and role-secured data.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                <Undo2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Hassle-Free 30-Day Returns</h4>
                <p className="text-xs text-slate-500">Return or exchange any item within 30 days easily.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer navigation */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                E-Commerce App
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Curated everyday goods, ceramics, lighting, and workspace accessories engineered for longevity and effortless living.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900">Catalog</h5>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
              <li>
                <Link href="/products" className="hover:text-indigo-600 transition">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?sort=featured" className="hover:text-indigo-600 transition">
                  Featured Collections
                </Link>
              </li>
              <li>
                <Link href="/products?sort=price_asc" className="hover:text-indigo-600 transition">
                  Value Finds
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900">Account & Help</h5>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
              <li>
                <Link href="/orders" className="hover:text-indigo-600 transition">
                  Track Orders
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-indigo-600 transition">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-600 transition">
                  Sign In / Register
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-indigo-600 transition">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900">Newsletter</h5>
            <p className="mt-4 text-xs text-slate-500">
              Subscribe to receive preview access to seasonal releases and limited editions.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="email"
                placeholder="Enter email address"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} E-Commerce App. All rights reserved. Designed for modern commerce.</p>
        </div>
      </div>
    </footer>
  );
}
