export type UserRole = "CUSTOMER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  images: string[];
  priceCents: number;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string | null;
  category?: Category | null;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: Product;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  imageUrl?: string | null;
}

export interface CartSummary {
  items: CartItem[];
  itemCount: number;
  totalCents: number;
}

export type OrderStatus =
  | "CREATED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type DiscountType = "PERCENTAGE" | "FIXED";

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderCents: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  imageUrl?: string | null;
  product?: Product;
}

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface Payment {
  id: string;
  orderId: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  transactionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  couponId?: string | null;
  couponCode?: string | null;
  shippingName?: string | null;
  shippingEmail?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  trackingNumber?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  payments?: Payment[];
}

export interface AuditLog {
  id: string;
  userId: string | null;
  adminName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AdminDashboardOverview {
  productCount: number;
  categoryCount: number;
  orderCount: number;
  customerCount: number;
  totalRevenueCents: number;
  lowStockCount: number;
  recentOrders: Order[];
  recentAuditLogs: AuditLog[];
  salesByDay: Array<{ date: string; amountCents: number; orders: number }>;
  orderStatusCounts: Record<OrderStatus, number>;
}

export interface CustomerSession {
  user: User;
}
