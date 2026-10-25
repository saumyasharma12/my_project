"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@commerce/types";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../lib/format";

export function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd?: (productId: string) => void;
}) {
  const { wishlistIds, toggleWishlist, addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const isWishlisted = wishlistIds.has(product.id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 5);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;
    setIsAdding(true);
    if (onAdd) {
      onAdd(product.id);
    } else {
      await addToCart(product.id, 1);
    }
    setIsAdding(false);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    await toggleWishlist(product.id);
  };

  const displayImage =
    product.imageUrl ||
    (product.images && product.images.length > 0 ? product.images[0] : null) ||
    "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Top Image Area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <Link href={`/products/${product.slug}`} className="block h-full w-full">
          <img
            src={displayImage}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isFeatured && (
            <span className="rounded-full bg-indigo-600/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase text-white shadow-sm">
              Featured
            </span>
          )}
          {isOutOfStock ? (
            <span className="rounded-full bg-rose-600/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold uppercase text-white shadow-sm">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="rounded-full bg-amber-500/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
              Only {product.stock} left
            </span>
          ) : null}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlist}
          type="button"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition shadow-sm ${
            isWishlisted
              ? "bg-rose-50 text-rose-500 shadow-rose-500/20"
              : "bg-white/80 text-slate-500 hover:bg-white hover:text-rose-500"
          }`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-rose-500" : ""}`} />
        </button>
      </div>

      {/* Product Content Details */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {product.category && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 mb-1">
            {product.category.name}
          </span>
        )}

        <Link
          href={`/products/${product.slug}`}
          className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1"
        >
          {product.name}
        </Link>

        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <span className="text-lg font-black text-slate-900">
              {formatCurrency(product.priceCents)}
            </span>
          </div>

          <button
            type="button"
            disabled={isOutOfStock || isAdding}
            onClick={handleAdd}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition ${
              isOutOfStock
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-indigo-600 active:scale-95"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>{isOutOfStock ? "Out of Stock" : isAdding ? "Adding..." : "Add to Cart"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
