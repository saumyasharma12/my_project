"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Edit,
  ExternalLink,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { Category, Product } from "@commerce/types";
import { formatCurrency } from "../../../lib/format";
import { api } from "../../../services/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [priceDollars, setPriceDollars] = useState("29.00");
  const [stock, setStock] = useState("20");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [prods, cats] = await Promise.all([
        api.adminGetProducts({
          search: search.trim() || undefined,
          categoryId: categoryFilter || undefined,
        }),
        api.adminGetCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [search, categoryFilter]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName("");
    setSlug("");
    setDescription("");
    setPriceDollars("25.00");
    setStock("20");
    setLowStockThreshold("5");
    setCategoryId(categories[0]?.id || "");
    setImageUrl("https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80");
    setIsFeatured(false);
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSlug(p.slug);
    setDescription(p.description);
    setPriceDollars((p.priceCents / 100).toFixed(2));
    setStock(String(p.stock));
    setLowStockThreshold(String(p.lowStockThreshold || 5));
    setCategoryId(p.categoryId || "");
    setImageUrl(p.imageUrl || "");
    setIsFeatured(p.isFeatured);
    setIsActive(p.isActive);
    setFormError(null);
    setModalOpen(true);
  };

  const handleAutoSlug = () => {
    const generated = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const priceCents = Math.round(parseFloat(priceDollars) * 100);
    const stockNumber = parseInt(stock, 10);
    const thresholdNumber = parseInt(lowStockThreshold, 10);

    try {
      if (editingProduct) {
        await api.adminUpdateProduct(editingProduct.id, {
          name,
          slug,
          description,
          priceCents,
          stock: stockNumber,
          lowStockThreshold: thresholdNumber,
          categoryId: categoryId || null,
          imageUrl: imageUrl.trim() || null,
          isFeatured,
          isActive,
        });
      } else {
        await api.adminCreateProduct({
          name,
          slug,
          description,
          priceCents,
          stock: stockNumber,
          lowStockThreshold: thresholdNumber,
          categoryId: categoryId || null,
          imageUrl: imageUrl.trim() || null,
          isFeatured,
          isActive,
        });
      }
      setModalOpen(false);
      void loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, prodName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${prodName}"?`)) {
      return;
    }
    try {
      await api.adminDeleteProduct(id);
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Store Inventory
          </span>
          <h1 className="text-2xl font-black text-white sm:text-3xl mt-0.5">
            Products Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, update, and manage catalog items with immediate customer UI reflection
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/30"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by product name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 pl-9 text-xs text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading products...
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => {
                  const isLow = p.stock <= (p.lowStockThreshold || 5);
                  const isOut = p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-slate-800 overflow-hidden border border-slate-700">
                            <img
                              src={p.imageUrl || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=200&q=80"}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-white block">{p.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">/{p.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {p.category?.name || "Uncategorized"}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {formatCurrency(p.priceCents)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold ${
                              isOut
                                ? "text-rose-400"
                                : isLow
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                            }`}
                          >
                            {p.stock}
                          </span>
                          {isOut ? (
                            <span className="rounded bg-rose-500/10 px-1 text-[9px] font-bold text-rose-400 uppercase">
                              Out
                            </span>
                          ) : isLow ? (
                            <span className="rounded bg-amber-500/10 px-1 text-[9px] font-bold text-amber-400 uppercase flex items-center gap-0.5">
                              <AlertTriangle className="h-2.5 w-2.5" /> Low
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            p.isActive
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          {p.isActive ? "Active" : "Archived"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                            title="Edit Product"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition"
                            title="Delete Product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No products found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">
                {editingProduct ? `Edit "${editingProduct.name}"` : "Create New Product"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl bg-rose-950/40 border border-rose-800 p-3 text-xs text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Slug *
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoSlug}
                      className="text-[10px] text-indigo-400 hover:underline"
                    >
                      Generate Slug
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Department Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">None / Unassigned</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Price (USD $) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={priceDollars}
                    onChange={(e) => setPriceDollars(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Stock Inventory Count *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Highlight as Featured Item</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Active in Public Store</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-900 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {submitting ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
