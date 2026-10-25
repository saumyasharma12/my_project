"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart, ShoppingBag, Trash2 } from "lucide-react";
import type { WishlistItem } from "@commerce/types";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../lib/format";
import { api } from "../../services/api";

export default function WishlistPage() {
  const { user } = useAuth();
  const { addToCart, toggleWishlist } = useCart();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getWishlist();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWishlist();
  }, [user]);

  const handleMoveToCart = async (productId: string) => {
    await addToCart(productId, 1);
    await toggleWishlist(productId);
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleRemove = async (productId: string) => {
    await toggleWishlist(productId);
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-4">
          <Heart className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Sign in to view your wishlist</h1>
        <p className="mt-2 text-sm text-slate-500">
          Save items you love and keep track of availability by signing in to your account.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Saved Essentials</span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">My Wishlist</h1>
          <p className="text-xs text-slate-500 mt-0.5">{items.length} {items.length === 1 ? "item" : "items"} saved</p>
        </div>

        <Link
          href="/products"
          className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="aspect-[4/3] rounded-xl bg-slate-200" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-8 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const p = item.product;
            const displayImg =
              p.imageUrl ||
              (p.images && p.images.length > 0 ? p.images[0] : "") ||
              "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80";
            const isOutOfStock = p.stock <= 0;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <Link href={`/products/${p.slug}`}>
                    <img
                      src={displayImg}
                      alt={p.name}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition duration-300"
                    />
                  </Link>
                  <button
                    onClick={() => void handleRemove(p.id)}
                    className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-sm hover:bg-white transition"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  {p.category && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
                      {p.category.name}
                    </span>
                  )}
                  <Link
                    href={`/products/${p.slug}`}
                    className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-1"
                  >
                    {p.name}
                  </Link>
                  <span className="text-sm font-black text-slate-900 mt-2">
                    {formatCurrency(p.priceCents)}
                  </span>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold ${
                        isOutOfStock ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {isOutOfStock ? "Sold Out" : `${p.stock} in stock`}
                    </span>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => void handleMoveToCart(p.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Move to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
            <Heart className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Your wishlist is empty</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Browse through our catalog and click the heart icon on any product to save it here for later.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition"
          >
            <span>Explore Collection</span>
          </Link>
        </div>
      )}
    </div>
  );
}
