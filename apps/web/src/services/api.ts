import type {
  AdminDashboardOverview,
  CartSummary,
  Category,
  Coupon,
  Order,
  Product,
  User,
  WishlistItem,
} from "@commerce/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error((payload as { error?: string }).error ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth
  async register(payload: { name: string; email: string; password: string }) {
    return fetchJson<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async login(payload: { email: string; password: string }) {
    return fetchJson<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async me(): Promise<{ user: User } | null> {
    try {
      return await fetchJson<{ user: User }>("/auth/me");
    } catch {
      return null;
    }
  },

  async logout() {
    return fetchJson<{ ok: boolean }>("/auth/logout", { method: "POST" });
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    return fetchJson<Category[]>("/categories");
  },

  async getCategory(slug: string): Promise<Category & { products: Product[] }> {
    return fetchJson<Category & { products: Product[] }>(`/categories/${slug}`);
  },

  // Products
  async getProducts(params?: Record<string, string | number | boolean | undefined>) {
    const search = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        search.set(key, String(value));
      }
    });
    const query = search.toString();
    return fetchJson<{
      items: Product[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>(`/products${query ? `?${query}` : ""}`);
  },

  async getProduct(slug: string): Promise<Product> {
    return fetchJson<Product>(`/products/${slug}`);
  },

  // Wishlist
  async getWishlist(): Promise<WishlistItem[]> {
    return fetchJson<WishlistItem[]>("/wishlist");
  },

  async toggleWishlist(productId: string): Promise<{ inWishlist: boolean; productId: string }> {
    return fetchJson<{ inWishlist: boolean; productId: string }>("/wishlist/toggle", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
  },

  async removeFromWishlist(productId: string): Promise<{ ok: boolean; productId: string }> {
    return fetchJson<{ ok: boolean; productId: string }>(`/wishlist/${productId}`, {
      method: "DELETE",
    });
  },

  // Cart
  async getCart(): Promise<CartSummary> {
    return fetchJson<CartSummary>("/cart");
  },

  async addToCart(productId: string, quantity = 1): Promise<CartSummary> {
    return fetchJson<CartSummary>("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
  },

  async updateCartItem(itemId: string, quantity: number): Promise<CartSummary> {
    return fetchJson<CartSummary>(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
  },

  async removeCartItem(itemId: string): Promise<CartSummary> {
    return fetchJson<CartSummary>(`/cart/items/${itemId}`, {
      method: "DELETE",
    });
  },

  async clearCart(): Promise<CartSummary> {
    return fetchJson<CartSummary>("/cart/clear", {
      method: "DELETE",
    });
  },

  // Coupons
  async validateCoupon(code: string, subtotalCents: number) {
    return fetchJson<{
      couponId: string;
      code: string;
      discountType: "PERCENTAGE" | "FIXED";
      discountValue: number;
      discountCents: number;
      minOrderCents: number;
    }>("/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code, subtotalCents }),
    });
  },

  // Orders & Checkout
  async checkout(payload: {
    couponCode?: string | null;
    shippingName: string;
    shippingEmail: string;
    shippingAddress: string;
    shippingCity: string;
    shippingPostalCode: string;
    shippingCountry: string;
    paymentMethod: string;
    notes?: string | null;
  }): Promise<Order> {
    return fetchJson<Order>("/orders/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getOrders(): Promise<Order[]> {
    return fetchJson<Order[]>("/orders");
  },

  async getOrder(id: string): Promise<Order> {
    return fetchJson<Order>(`/orders/${id}`);
  },

  // Admin APIs
  async adminGetOverview(): Promise<AdminDashboardOverview> {
    return fetchJson<AdminDashboardOverview>("/admin/overview");
  },

  async adminGetProducts(params?: { search?: string; categoryId?: string }): Promise<Product[]> {
    const search = new URLSearchParams();
    if (params?.search) search.set("search", params.search);
    if (params?.categoryId) search.set("categoryId", params.categoryId);
    const query = search.toString();
    return fetchJson<Product[]>(`/products/admin/all${query ? `?${query}` : ""}`);
  },

  async adminCreateProduct(payload: any): Promise<Product> {
    return fetchJson<Product>("/products/admin", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async adminUpdateProduct(id: string, payload: any): Promise<Product> {
    return fetchJson<Product>(`/products/admin/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async adminDeleteProduct(id: string): Promise<{ ok: boolean }> {
    return fetchJson<{ ok: boolean }>(`/products/admin/${id}`, {
      method: "DELETE",
    });
  },

  async adminAdjustStock(payload: { productId: string; delta: number; reason?: string }): Promise<Product> {
    return fetchJson<Product>("/products/admin/adjust-stock", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async adminGetCategories(): Promise<Category[]> {
    return fetchJson<Category[]>("/categories");
  },

  async adminCreateCategory(payload: any): Promise<Category> {
    return fetchJson<Category>("/categories/admin", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async adminUpdateCategory(id: string, payload: any): Promise<Category> {
    return fetchJson<Category>(`/categories/admin/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async adminDeleteCategory(id: string): Promise<{ ok: boolean }> {
    return fetchJson<{ ok: boolean }>(`/categories/admin/${id}`, {
      method: "DELETE",
    });
  },

  async adminGetOrders(params?: { status?: string; search?: string }): Promise<Order[]> {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.search) search.set("search", params.search);
    const query = search.toString();
    return fetchJson<Order[]>(`/orders/admin/all${query ? `?${query}` : ""}`);
  },

  async adminUpdateOrderStatus(
    id: string,
    payload: { status: string; trackingNumber?: string | null; notes?: string | null },
  ): Promise<Order> {
    return fetchJson<Order>(`/orders/admin/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async adminGetCustomers(): Promise<any[]> {
    return fetchJson<any[]>("/admin/customers");
  },

  async adminGetUsers(): Promise<any[]> {
    return fetchJson<any[]>("/admin/users");
  },

  async adminUpdateUserRole(id: string, role: string): Promise<any> {
    return fetchJson<any>(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  async adminGetPayments(): Promise<any[]> {
    return fetchJson<any[]>("/admin/payments");
  },

  async adminRefundPayment(id: string): Promise<{ id: string; status: string; refundedAt: string }> {
    return fetchJson<{ id: string; status: string; refundedAt: string }>(`/admin/payments/${id}/refund`, {
      method: "POST",
    });
  },

  async adminGetCoupons(): Promise<Coupon[]> {
    return fetchJson<Coupon[]>("/coupons/admin");
  },

  async adminCreateCoupon(payload: any): Promise<Coupon> {
    return fetchJson<Coupon>("/coupons/admin", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async adminUpdateCoupon(id: string, payload: any): Promise<Coupon> {
    return fetchJson<Coupon>(`/coupons/admin/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async adminDeleteCoupon(id: string): Promise<{ ok: boolean }> {
    return fetchJson<{ ok: boolean }>(`/coupons/admin/${id}`, {
      method: "DELETE",
    });
  },

  async adminGetInventory(): Promise<any[]> {
    return fetchJson<any[]>("/admin/inventory");
  },

  async adminGetAuditLogs(): Promise<any[]> {
    return fetchJson<any[]>("/admin/audit-logs");
  },
};
