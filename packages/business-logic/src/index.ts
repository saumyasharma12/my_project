import type { CartItem, Coupon } from "@commerce/types";

export function calculateLineTotal(quantity: number, unitPriceCents: number): number {
  return Math.max(0, quantity) * Math.max(0, unitPriceCents);
}

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + calculateLineTotal(item.quantity, item.unitPriceCents), 0);
}

export function calculateCouponDiscount(
  subtotalCents: number,
  coupon: Pick<Coupon, "discountType" | "discountValue" | "minOrderCents" | "isActive" | "expiresAt">,
): { valid: boolean; discountCents: number; reason?: string } {
  if (!coupon.isActive) {
    return { valid: false, discountCents: 0, reason: "Coupon is not active" };
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { valid: false, discountCents: 0, reason: "Coupon has expired" };
  }

  if (subtotalCents < coupon.minOrderCents) {
    const required = (coupon.minOrderCents / 100).toFixed(2);
    return {
      valid: false,
      discountCents: 0,
      reason: `Minimum order of $${required} required for this coupon`,
    };
  }

  let discount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discount = Math.round((subtotalCents * coupon.discountValue) / 100);
  } else {
    // FIXED discount in cents
    discount = coupon.discountValue;
  }

  // Discount cannot exceed subtotal
  discount = Math.min(subtotalCents, Math.max(0, discount));

  return { valid: true, discountCents: discount };
}

export function calculateShippingFee(subtotalAfterDiscountCents: number): number {
  // Free shipping for orders $50 (5000 cents) and above, else $5.00 (500 cents)
  if (subtotalAfterDiscountCents >= 5000 || subtotalAfterDiscountCents === 0) {
    return 0;
  }
  return 500;
}

export function ensureInventoryAvailable(items: CartItem[], stockByProductId: Record<string, number>) {
  for (const item of items) {
    const available = stockByProductId[item.productId] ?? 0;
    if (item.quantity > available) {
      throw new Error(`Insufficient stock for product "${item.productName || item.productId}". Only ${available} available.`);
    }
  }
}

export function reduceInventory(
  items: CartItem[],
  stockByProductId: Record<string, number>,
): Record<string, number> {
  const next: Record<string, number> = { ...stockByProductId };
  for (const item of items) {
    next[item.productId] = Math.max(0, (next[item.productId] ?? 0) - item.quantity);
  }
  return next;
}
