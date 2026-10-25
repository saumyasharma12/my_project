"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { CartItem, CartSummary } from "@commerce/types";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface CartContextType {
  cart: CartSummary;
  itemCount: number;
  totalCents: number;
  wishlistIds: Set<string>;
  loading: boolean;
  toasts: Toast[];
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refreshCart: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartSummary>({ items: [], itemCount: 0, totalCents: 0 });
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshCart = async () => {
    if (!user) {
      setCart({ items: [], itemCount: 0, totalCents: 0 });
      return;
    }
    try {
      const data = await api.getCart();
      setCart(data);
    } catch {
      // not logged in or error
    }
  };

  const refreshWishlist = async () => {
    if (!user) {
      setWishlistIds(new Set());
      return;
    }
    try {
      const items = await api.getWishlist();
      setWishlistIds(new Set(items.map((i) => i.productId)));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      void refreshCart();
      void refreshWishlist();
    } else {
      setCart({ items: [], itemCount: 0, totalCents: 0 });
      setWishlistIds(new Set());
    }
  }, [user]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user) {
      showToast("Please sign in to add items to your cart", "info");
      return;
    }
    setLoading(true);
    try {
      const updated = await api.addToCart(productId, quantity);
      setCart(updated);
      showToast("Item added to cart!", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add item to cart";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    setLoading(true);
    try {
      const updated = await api.updateCartItem(itemId, quantity);
      setCart(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update item";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setLoading(true);
    try {
      const updated = await api.removeCartItem(itemId);
      setCart(updated);
      showToast("Item removed from cart", "info");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove item";
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      const updated = await api.clearCart();
      setCart(updated);
    } catch (err) {
      // ignore
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      showToast("Please sign in to save items to your wishlist", "info");
      return false;
    }
    try {
      const res = await api.toggleWishlist(productId);
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (res.inWishlist) {
          next.add(productId);
          showToast("Saved to your wishlist", "success");
        } else {
          next.delete(productId);
          showToast("Removed from your wishlist", "info");
        }
        return next;
      });
      return res.inWishlist;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update wishlist";
      showToast(message, "error");
      return false;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount: cart.itemCount,
        totalCents: cart.totalCents,
        wishlistIds,
        loading,
        toasts,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        toggleWishlist,
        refreshCart,
        refreshWishlist,
        showToast,
        removeToast,
      }}
    >
      {children}

      {/* Global Toast notifications container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-xl transition-all duration-300 animate-slide-in ${
              toast.type === "success"
                ? "bg-slate-900 text-white border border-slate-800"
                : toast.type === "error"
                  ? "bg-rose-600 text-white"
                  : "bg-indigo-600 text-white"
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/70 hover:text-white ml-2 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
