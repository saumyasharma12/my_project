"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Package,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
} from "lucide-react";
import type { Category, Product } from "@commerce/types";
import { ProductCard } from "../components/ProductCard";
import { api } from "../services/api";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [prodResult, catResult] = await Promise.all([
          api.getProducts({ limit: 8, featured: true }),
          api.getCategories(),
        ]);
        setFeaturedProducts(prodResult.items || []);
        setCategories(catResult || []);
      } catch (error) {
        console.error("Failed loading homepage data", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 pt-12 pb-20 sm:pt-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm mb-6">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>The Modern Living Collection • 2026</span>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.1]">
                Thoughtfully designed essentials for{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                  everyday life.
                </span>
              </h1>

              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl">
                Elevate your daily routines with artisan ceramics, ambient lighting, architectural desk wares, and handcrafted textiles built to last.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:shadow-indigo-600/40 transition active:scale-95"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/products?sort=featured"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  <span>Featured Items</span>
                </Link>
              </div>

              {/* Quick trust highlights */}
              <div className="mt-12 grid grid-cols-3 gap-4 border-t border-slate-200 pt-8 max-w-xl">
                <div>
                  <div className="text-2xl font-black text-slate-900">100%</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Premium Quality</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">Free</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Shipping over $50</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">30-Day</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Easy Returns</div>
                </div>
              </div>
            </div>

            {/* Hero Image / Banner Showcase */}
            <div className="relative lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-slate-200 shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=80"
                    alt="Everyday Collection Preview"
                    className="h-full w-full object-cover object-center"
                  />
                </div>

                {/* Floating promo badge card */}
                <div className="absolute -bottom-6 -left-6 rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-xl backdrop-blur-md hidden sm:flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Tag className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Limited Promo</span>
                    <p className="text-xs font-bold text-slate-900">10% Off First Purchase</p>
                    <p className="text-[10px] text-slate-500 font-mono">CODE: WELCOME10</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Curated Categories</span>
              <h2 className="text-2xl font-black text-slate-900 sm:text-3xl mt-1">
                Explore by department
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
            >
              <span>Browse All Departments</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <img
                    src={category.imageUrl || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80"}
                    alt={category.name}
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3.5 text-center">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    {category.name}
                  </h3>
                  {category._count && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {category._count.products} {category._count.products === 1 ? "item" : "items"}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Handpicked Quality</span>
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl mt-1">
              Featured products
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
          >
            <span>View Complete Store</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse space-y-4">
                <div className="aspect-[4/3] rounded-xl bg-slate-200" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-8 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-base font-bold text-slate-900">No products available</h3>
            <p className="mt-1 text-xs text-slate-500">Check back soon for new arrivals.</p>
          </div>
        )}
      </section>

      {/* Promo Banner Strip */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 sm:px-12 sm:py-16 text-white shadow-xl">
          <div className="relative z-10 max-w-xl">
            <span className="rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-bold text-indigo-300">
              Special Savings
            </span>
            <h3 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Enjoy 20% off your entire cart on orders $50+
            </h3>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              Use promotional coupon <span className="font-mono font-bold text-amber-400">SAVE20</span> at checkout to unlock savings on all apparel, kitchenware, and homeware.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <Link
                href="/products"
                className="rounded-xl bg-white px-5 py-3 text-xs font-bold text-slate-900 hover:bg-slate-100 transition shadow-sm"
              >
                Start Shopping
              </Link>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        </div>
      </section>
    </div>
  );
}
