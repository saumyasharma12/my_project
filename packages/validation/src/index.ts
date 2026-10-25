import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Please provide a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email"),
  password: z.string().min(1, "Password is required").max(128),
});

export const productQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  inStock: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  sort: z
    .enum(["featured", "price_asc", "price_desc", "name_asc", "newest"])
    .default("featured"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

export const createProductSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  priceCents: z.number().int().min(0, "Price must be non-negative"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  lowStockThreshold: z.number().int().min(0).default(5),
  imageUrl: z.string().optional().nullable(),
  images: z.array(z.string()).default([]),
  categoryId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const cartItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1).max(50),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(50),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  subtotalCents: z.number().int().min(0),
});

export const createCouponSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters").toUpperCase(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().int().min(1, "Discount value must be at least 1"),
  minOrderCents: z.number().int().min(0).default(0),
  maxUses: z.number().int().min(1).optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateCouponSchema = createCouponSchema.partial();

export const checkoutSchema = z.object({
  couponCode: z.string().optional().nullable(),
  shippingName: z.string().min(2, "Full name is required"),
  shippingEmail: z.string().email("Valid email is required"),
  shippingAddress: z.string().min(5, "Street address is required"),
  shippingCity: z.string().min(2, "City is required"),
  shippingPostalCode: z.string().min(2, "Postal code is required"),
  shippingCountry: z.string().min(2, "Country is required"),
  paymentMethod: z.enum(["CARD", "CASH_ON_DELIVERY", "UPI", "NET_BANKING"]).default("CARD"),
  notes: z.string().optional().nullable(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["CREATED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  trackingNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const adjustInventorySchema = z.object({
  productId: z.string().min(1),
  delta: z.number().int(),
  reason: z.string().optional(),
});
