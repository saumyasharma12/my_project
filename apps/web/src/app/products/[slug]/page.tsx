"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import type { Product } from "@commerce/types";
import { ProductCard } from "../../../components/ProductCard";
import { useCart } from "../../../context/CartContext";
import { formatCurrency } from "../../../lib/format";
import { api } from "../../../services/api";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { addToCart, wishlistIds, toggleWishlist } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getProduct(params.slug as string);
        setProduct(result);
        const mainImg =
          result.imageUrl ||
          (result.images && result.images.length > 0 ? result.images[0] : "") ||
          "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80";
        setSelectedImage(mainImg);

        // Fetch related products in the same category or general
        const related = await api.getProducts({
          limit: 4,
          categoryId: result.categoryId || undefined,
        });
        setRelatedProducts((related.items || []).filter((p) => p.id !== result.id).slice(0, 4));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load product");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 animate-pulse">
          <div className="aspect-square rounded-3xl bg-slate-200" />
          <div className="space-y-6">
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-6 bg-slate-200 rounded w-1/4" />
            <div className="h-24 bg-slate-200 rounded" />
            <div className="h-12 bg-slate-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="text-2xl font-black text-slate-900">Product Not Found</h2>
        <p className="mt-2 text-sm text-slate-500">
          The product you are looking for may have been removed or is temporarily unavailable.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Catalog</span>
        </Link>
      </div>
    );
  }

  const isWishlisted = wishlistIds.has(product.id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;

  const allImages = [
    ...(product.imageUrl ? [product.imageUrl] : []),
    ...(product.images || []),
  ];
  if (allImages.length === 0) {
    allImages.push("https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80");
  }

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setAddingToCart(true);
    await addToCart(product.id, quantity);
    setAddingToCart(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-indigo-600">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-indigo-600">Shop</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-indigo-600">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="font-semibold text-slate-900 truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Images Column */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-slate-100 border border-slate-200/80 shadow-md">
            <img
              src={selectedImage || allImages[0]}
              alt={product.name}
              className="h-full w-full object-cover object-center transition-all duration-300"
            />
            {product.isFeatured && (
              <span className="absolute top-4 left-4 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                Featured Piece
              </span>
            )}
          </div>

          {/* Thumbnails row */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative aspect-square w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    selectedImage === img
                      ? "border-indigo-600 ring-2 ring-indigo-600/20"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Column */}
        <div className="flex flex-col">
          {product.category && (
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              {product.category.name}
            </span>
          )}

          <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl leading-tight">
            {product.name}
          </h1>

          <div className="mt-4 flex items-center gap-4">
            <span className="text-3xl font-black text-slate-900">
              {formatCurrency(product.priceCents)}
            </span>

            {/* Stock indicator badge */}
            {isOutOfStock ? (
              <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700">
                Only {product.stock} units remaining!
              </span>
            ) : (
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                In Stock ({product.stock} available)
              </span>
            )}
          </div>

          <div className="mt-6 border-t border-b border-slate-200 py-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">About this item</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Action Row: Quantity & Add to Cart & Wishlist */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Quantity</span>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white">
                <button
                  type="button"
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= product.stock || isOutOfStock}
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="flex h-10 w-10 items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isOutOfStock || addingToCart}
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 px-6 text-sm font-bold text-white shadow-lg transition active:scale-98 ${
                  isOutOfStock
                    ? "bg-slate-300 cursor-not-allowed shadow-none"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30"
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>
                  {isOutOfStock
                    ? "Currently Unavailable"
                    : addingToCart
                      ? "Adding to Cart..."
                      : `Add ${quantity} to Cart • ${formatCurrency(product.priceCents * quantity)}`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => void toggleWishlist(product.id)}
                className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition shadow-sm ${
                  isWishlisted
                    ? "border-rose-200 bg-rose-50 text-rose-500"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-rose-500"
                }`}
                title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
              >
                <Heart className={`h-6 w-6 ${isWishlisted ? "fill-rose-500" : ""}`} />
              </button>
            </div>
          </div>

          {/* Guarantees Box */}
          <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-700">
              <Truck className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              <span>Free delivery on orders over $50. Standard 2-4 day shipping.</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-700">
              <RotateCcw className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              <span>30-day money-back guarantee. Effortless returns.</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-700">
              <ShieldCheck className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              <span>Secure checkout with instant order tracking timeline.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 border-t border-slate-200 pt-12">
          <h2 className="text-2xl font-black text-slate-900 mb-6">You may also like</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
