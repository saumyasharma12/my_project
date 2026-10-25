"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Lock, Mail, ShoppingBag, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register(name, email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <div className="text-center mb-8">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 mb-3">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Create an Account</h1>
          <p className="mt-1 text-xs text-slate-500">
            Join E-Commerce App for express checkout, order tracking, and wishlist sync
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs focus:border-indigo-500 focus:outline-none"
              />
              <User className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="jane@example.com"
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
                minLength={6}
                placeholder="Minimum 6 characters"
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
            <span>{loading ? "Creating Account..." : "Create Account"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-indigo-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
