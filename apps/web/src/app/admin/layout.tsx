"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowLeft,
  Boxes,
  CreditCard,
  FolderTree,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && (!user || user.role !== "ADMIN")) {
      // not logged in as admin
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Verifying Admin Credentials...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Admin Access Required</h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            You must be signed in with an administrator account to view the back-office dashboard.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/login?redirect=/admin"
              className="rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-700 transition"
            >
              Sign In as Administrator
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Categories", href: "/admin/categories", icon: FolderTree },
    { label: "Inventory", href: "/admin/inventory", icon: Boxes },
    { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Payments", href: "/admin/payments", icon: CreditCard },
    { label: "Coupons", href: "/admin/coupons", icon: Tag },
    { label: "Users & Roles", href: "/admin/users", icon: ShieldCheck },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: History },
  ];

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-white block">
                  E-Commerce App
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 -mt-1 block">
                  Admin Console
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer in Sidebar */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <Store className="h-3.5 w-3.5 text-indigo-400" />
            <span>Customer Storefront</span>
          </Link>

          <button
            onClick={() => void logout()}
            className="w-full flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition text-left"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        {/* Top Header bar */}
        <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 md:hidden">
            <Link href="/admin" className="font-bold text-white text-sm">
              E-Commerce Admin
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
              ● Production Ready
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              <Store className="h-3.5 w-3.5" />
              <span>View Store</span>
            </Link>

            <div className="flex items-center gap-2.5 border-l border-slate-800 pl-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight">{user.name}</p>
                <p className="text-[10px] text-indigo-400 font-mono">ADMINISTRATOR</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
