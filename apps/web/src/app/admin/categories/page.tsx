"use client";

import { useEffect, useState } from "react";
import { Edit, FolderTree, Plus, Trash2, X } from "lucide-react";
import type { Category } from "@commerce/types";
import { api } from "../../../services/api";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      const data = await api.adminGetCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setImageUrl("https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80");
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setSlug(c.slug);
    setDescription(c.description || "");
    setImageUrl(c.imageUrl || "");
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

    try {
      if (editingCategory) {
        await api.adminUpdateCategory(editingCategory.id, {
          name,
          slug,
          description: description.trim() || null,
          imageUrl: imageUrl.trim() || null,
        });
      } else {
        await api.adminCreateCategory({
          name,
          slug,
          description: description.trim() || null,
          imageUrl: imageUrl.trim() || null,
        });
      }
      setModalOpen(false);
      void loadCategories();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      return;
    }
    try {
      await api.adminDeleteCategory(id);
      void loadCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Store Taxonomy
          </span>
          <h1 className="text-2xl font-black text-white sm:text-3xl mt-0.5">
            Categories & Departments
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize catalog products into customer-facing departments
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/30"
        >
          <Plus className="h-4 w-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-slate-800" />
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-lg hover:border-slate-700 transition"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900 border-b border-slate-800">
                <img
                  src={cat.imageUrl || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80"}
                  alt={cat.name}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-2.5 right-2.5 rounded-full bg-slate-950/80 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold text-white border border-slate-800 font-mono">
                  {cat._count?.products ?? 0} items
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{cat.name}</h3>
                  <p className="text-[11px] text-indigo-400 font-mono">/{cat.slug}</p>
                  {cat.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                    title="Edit Category"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition"
                    title="Delete Category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-12 text-center text-slate-500">
          <FolderTree className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <p className="text-sm font-bold text-slate-300">No categories created yet</p>
          <button
            onClick={openCreateModal}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white"
          >
            Create First Category
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">
                {editingCategory ? `Edit "${editingCategory.name}"` : "Create Category"}
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
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Category Name *
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
                    Generate
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
                  Cover Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
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
                  {submitting ? "Saving..." : editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
