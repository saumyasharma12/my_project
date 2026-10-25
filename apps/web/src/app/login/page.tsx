"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { ArrowRight, Lock, Mail, ShieldAlert, ShoppingBag, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const { login } = useAuth();
  const [email, setEmail] = useState("customer@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role === "ADMIN" && redirect === "/") {
        router.push("/admin");
      } else {
        router.push(redirect);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (type: "customer" | "admin") => {
    if (type === "customer") {
      setEmail("customer@example.com");
      setPassword("password123");
    } else {
      setEmail("admin@example.com");
      setPassword("admin123");
    }
    setError(null);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 mb-3">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Welcome Back</h1>
          <p className="mt-1 text-xs text-slate-500">
            Sign in to manage your orders, wishlist, and profile
          </p>
        </div>

        {/* 1-Click Demo Accounts */}
        <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
            Quick Test Accounts
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo("customer")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <User className="h-3.5 w-3.5 text-indigo-600" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo("admin")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-indigo-600" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs focus:border-indigo-500 focus:outline-none"
              />
              <Mail className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs focus:border-indigo-500 focus:outline-none"
              />
              <Lock className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 px-4 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-50 transition active:scale-98"
          >
            <span>{loading ? "Authenticating..." : "Sign In to Account"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Don't have an account?{" "}
          <Link href="/register" className="font-bold text-indigo-600 hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Loading login...</div>}>
      <LoginContent />
    </Suspense>
  );
}
