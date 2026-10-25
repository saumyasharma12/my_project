"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import type { Category, Product } from "@commerce/types";
import { ProductCard } from "../../components/ProductCard";
import { api } from "../../services/api";

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sort, setSort] = useState<"featured" | "price_asc" | "price_desc" | "name_asc" | "newest">("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Sync when search params change
  useEffect(() => {
    if (searchParams.get("search") !== null) {
      setSearch(searchParams.get("search") || "");
    }
    if (searchParams.get("category") !== null) {
      setSelectedCategory(searchParams.get("category") || "");
    }
  }, [searchParams]);

  // Load categories once
  useEffect(() => {
    void (async () => {
      try {
        const cats = await api.getCategories();
        setCategories(cats);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Fetch products
  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        const res = await api.getProducts({
          search: search.trim() || undefined,
          category: selectedCategory || undefined,
          sort,
          inStock: inStockOnly ? true : undefined,
          page,
          limit: 12,
        });

        if (active) {
          setProducts(res.items || []);
          setTotalPages(res.totalPages);
          setTotalCount(res.total);
        }
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [search, selectedCategory, sort, inStockOnly, page]);

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSort("featured");
    setInStockOnly(false);
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || selectedCategory || inStockOnly || sort !== "featured");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Catalog & Essentials
          </span>
          <h1 className="text-3xl font-black text-slate-900 sm:text-4xl mt-1">
            Browse All Products
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Showing {products.length} of {totalCount} items
          </p>
        </div>

        {/* Search Bar in Catalog */}
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Filter by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
                <span>Filters</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Reset all
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Categories
              </h4>
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    setSelectedCategory("");
                    setPage(1);
                  }}
                  className={`w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    selectedCategory === ""
                      ? "bg-indigo-50 text-indigo-700 font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCategory(c.slug);
                      setPage(1);
                    }}
                    className={`flex items-center justify-between w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                      selectedCategory === c.slug
                        ? "bg-indigo-50 text-indigo-700 font-bold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{c.name}</span>
                    {c._count && (
                      <span className="text-[10px] text-slate-400">({c._count.products})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock Toggle */}
            <div className="border-t border-slate-100 pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>In Stock Items Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Sort Bar */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm text-xs">
            <span className="font-medium text-slate-600">
              Showing <span className="font-bold text-slate-900">{products.length}</span> results
            </span>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-white py-1 px-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="featured">Featured First</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse space-y-4">
                  <div className="aspect-[4/3] rounded-xl bg-slate-200" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-8 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <Filter className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-base font-bold text-slate-900">No matching products</h3>
              <p className="mt-1 text-xs text-slate-500">
                Try loosening your search query or selecting a different category filter.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs font-medium text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Loading catalog...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
