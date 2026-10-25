import crypto from "node:crypto";
import { prisma } from "@commerce/db";
import type { OrderStatus } from "@commerce/types";
import {
  calculateCartTotal,
  calculateCouponDiscount,
  calculateShippingFee,
  ensureInventoryAvailable,
} from "@commerce/business-logic";
import { invalidateCachePattern } from "../../lib/redis.js";
import { enqueueEmail, recordAuditLog } from "../../lib/queue.js";

export interface CheckoutInput {
  couponCode?: string | null;
  shippingName: string;
  shippingEmail: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  paymentMethod: string;
  notes?: string | null;
}

export async function createOrderFromCart(userId: string, input: CheckoutInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found.");
  }

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  // Validate active products
  for (const item of cart.items) {
    if (!item.product.isActive) {
      throw new Error(`Product "${item.product.name}" is no longer available.`);
    }
  }

  const items = cart.items.map((item) => ({
    id: item.productId,
    productId: item.productId,
    productName: item.product.name,
    unitPriceCents: item.product.priceCents,
    quantity: item.quantity,
    imageUrl: item.product.imageUrl,
  }));

  // Ensure stock is available
  ensureInventoryAvailable(
    items,
    Object.fromEntries(cart.items.map((item) => [item.productId, item.product.stock])),
  );

  const subtotalCents = calculateCartTotal(items);

  let discountCents = 0;
  let appliedCouponId: string | null = null;
  let appliedCouponCode: string | null = null;

  if (input.couponCode) {
    const code = input.couponCode.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (coupon) {
      const discountCalc = calculateCouponDiscount(subtotalCents, {
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderCents: coupon.minOrderCents,
        isActive: coupon.isActive,
        expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
      });

      if (discountCalc.valid) {
        discountCents = discountCalc.discountCents;
        appliedCouponId = coupon.id;
        appliedCouponCode = coupon.code;
      }
    }
  }

  const subtotalAfterDiscount = Math.max(0, subtotalCents - discountCents);
  const shippingCents = calculateShippingFee(subtotalAfterDiscount);
  const totalCents = subtotalAfterDiscount + shippingCents;

  const transactionId = `txn_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const trackingNumber = `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`;

  // Run atomic Prisma transaction
  const order = await prisma.$transaction(async (tx) => {
    // 1. Decrement stock
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // 2. Increment coupon used count if used
    if (appliedCouponId) {
      await tx.coupon.update({
        where: { id: appliedCouponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // 3. Create order
    const createdOrder = await tx.order.create({
      data: {
        userId,
        status: "PROCESSING",
        subtotalCents,
        discountCents,
        shippingCents,
        totalCents,
        couponId: appliedCouponId,
        couponCode: appliedCouponCode,
        shippingName: input.shippingName,
        shippingEmail: input.shippingEmail,
        shippingAddress: input.shippingAddress,
        shippingCity: input.shippingCity,
        shippingPostalCode: input.shippingPostalCode,
        shippingCountry: input.shippingCountry,
        paymentMethod: input.paymentMethod,
        paymentStatus: "PAID",
        trackingNumber,
        notes: input.notes ?? null,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            unitPriceCents: item.unitPriceCents,
            quantity: item.quantity,
          })),
        },
        payments: {
          create: {
            amountCents: totalCents,
            currency: "USD",
            status: "COMPLETED",
            provider: input.paymentMethod,
            transactionId,
          },
        },
      },
      include: {
        items: true,
        payments: true,
      },
    });

    // 4. Empty cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return createdOrder;
  });

  // Invalidate product caches immediately so customers see updated stock
  await invalidateCachePattern("products:*");

  // Enqueue background email confirmation
  await enqueueEmail({
    type: "ORDER_CONFIRMATION",
    to: input.shippingEmail || user.email,
    subject: `Order Confirmation #${order.id.slice(-8).toUpperCase()}`,
    payload: {
      orderId: order.id,
      totalCents: order.totalCents,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      trackingNumber: order.trackingNumber,
    },
  });

  return formatOrder(order);
}

export async function getOrdersForUser(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map(formatOrder);
}

export async function getOrderById(orderId: string, userId?: string) {
  const where: any = { id: orderId };
  if (userId) {
    where.userId = userId;
  }

  const order = await prisma.order.findFirst({
    where,
    include: {
      items: {
        include: { product: true },
      },
      payments: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!order) return null;
  return formatOrder(order);
}

export async function listAllOrdersAdmin(options?: { status?: string; search?: string }) {
  const where: any = {};
  if (options?.status) {
    where.status = options.status as OrderStatus;
  }
  if (options?.search) {
    where.OR = [
      { id: { contains: options.search.trim(), mode: "insensitive" } },
      { trackingNumber: { contains: options.search.trim(), mode: "insensitive" } },
      { shippingName: { contains: options.search.trim(), mode: "insensitive" } },
      { shippingEmail: { contains: options.search.trim(), mode: "insensitive" } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: true,
      payments: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map(formatOrder);
}

export async function updateOrderStatusAdmin(
  orderId: string,
  input: { status: OrderStatus; trackingNumber?: string | null; notes?: string | null },
  adminUser: { id: string; name: string },
  ipAddress?: string,
) {
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!existing) {
    throw new Error("Order not found.");
  }

  const updateData: any = { status: input.status };
  if (input.trackingNumber !== undefined) updateData.trackingNumber = input.trackingNumber;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const order = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
    include: { items: true, payments: true, user: true },
  });

  await recordAuditLog({
    userId: adminUser.id,
    adminName: adminUser.name,
    action: "ORDER_STATUS_UPDATE",
    entity: "Order",
    entityId: orderId,
    details: `Updated status from ${existing.status} to ${input.status}. Tracking: ${input.trackingNumber || existing.trackingNumber || "N/A"}`,
    ipAddress,
  });

  // Notify customer asynchronously via BullMQ
  if (order.shippingEmail || order.user?.email) {
    await enqueueEmail({
      type: "ORDER_STATUS_UPDATE",
      to: order.shippingEmail || order.user.email,
      subject: `Order Update: #${order.id.slice(-8).toUpperCase()} is now ${input.status}`,
      payload: {
        orderId: order.id,
        status: input.status,
        trackingNumber: order.trackingNumber,
      },
    });
  }

  return formatOrder(order);
}

function formatOrder(order: any) {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    couponId: order.couponId,
    couponCode: order.couponCode,
    shippingName: order.shippingName,
    shippingEmail: order.shippingEmail,
    shippingAddress: order.shippingAddress,
    shippingCity: order.shippingCity,
    shippingPostalCode: order.shippingPostalCode,
    shippingCountry: order.shippingCountry,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    trackingNumber: order.trackingNumber,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt ? order.updatedAt.toISOString() : order.createdAt.toISOString(),
    user: order.user,
    items: (order.items || []).map((i: any) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      unitPriceCents: i.unitPriceCents,
      quantity: i.quantity,
      imageUrl: i.product?.imageUrl,
    })),
    payments: (order.payments || []).map((p: any) => ({
      id: p.id,
      orderId: p.orderId,
      amountCents: p.amountCents,
      currency: p.currency,
      status: p.status,
      provider: p.provider,
      transactionId: p.transactionId,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}
