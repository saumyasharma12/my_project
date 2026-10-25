"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { itemCount, wishlistIds } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide main store navbar on admin pages (admin has its own sidebar layout)
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { label: "Shop", href: "/products" },
    { label: "Orders", href: "/orders" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
      {/* Top promotional bar */}
      <div className="bg-slate-900 py-1.5 px-4 text-center text-xs font-medium text-slate-200 tracking-wide">
        <span>✨ Free standard shipping on orders over $50 • Use coupon </span>
        <span className="font-bold text-amber-400">WELCOME10</span>
        <span> for 10% off</span>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 group-hover:bg-indigo-700 transition">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition">
                E-Commerce App
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                Premium Goods
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-slate-100 text-indigo-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="hidden sm:flex flex-1 max-w-md items-center relative"
        >
          <input
            type="text"
            placeholder="Search products, essentials, decor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
          />
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
        </form>

        {/* Actions / User / Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin link badge if user is ADMIN */}
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition border border-indigo-200/60"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Admin Dashboard</span>
              <span className="sm:hidden">Admin</span>
            </Link>
          )}

          {/* Wishlist Link */}
          <Link
            href="/wishlist"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            title="Wishlist"
          >
            <Heart className="h-5 w-5" />
            {wishlistIds.size > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {wishlistIds.size}
              </span>
            )}
          </Link>

          {/* Cart Link */}
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            title="Shopping Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow-sm">
                {itemCount}
              </span>
            )}
          </Link>

          {/* User Profile / Auth */}
          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-2 rounded-full p-1.5 sm:px-3 sm:py-1.5 hover:bg-slate-100 transition border border-slate-200/60 text-slate-700">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-xs font-medium max-w-[100px] truncate">
                  {user.name}
                </span>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-1 w-52 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  <span className="mt-1 inline-block rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                    {user.role}
                  </span>
                </div>

                <div className="pt-1">
                  <Link
                    href="/orders"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Package className="h-3.5 w-3.5" />
                    My Orders
                  </Link>

                  <Link
                    href="/wishlist"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Heart className="h-3.5 w-3.5" />
                    My Wishlist
                  </Link>

                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Admin Dashboard
                    </Link>
                  )}

                  <button
                    onClick={() => void logout()}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
