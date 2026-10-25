import { prisma } from "@commerce/db";
import { calculateCouponDiscount } from "@commerce/business-logic";
import { recordAuditLog } from "../../lib/queue.js";

export async function listAllCoupons() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { orders: true },
      },
    },
  });

  return coupons.map((c) => ({
    ...c,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    ordersCount: c._count.orders,
  }));
}

export async function createCoupon(
  input: {
    code: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minOrderCents?: number;
    maxUses?: number | null;
    expiresAt?: string | null;
    isActive?: boolean;
  },
  adminUser: { id: string; name: string },
  ipAddress?: string,
) {
  const code = input.code.trim().toUpperCase();
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    throw new Error(`Coupon code "${code}" already exists.`);
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderCents: input.minOrderCents ?? 0,
      maxUses: input.maxUses ?? null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      isActive: input.isActive ?? true,
    },
  });

  await recordAuditLog({
    userId: adminUser.id,
    adminName: adminUser.name,
    action: "COUPON_CREATE",
    entity: "Coupon",
    entityId: coupon.id,
    details: `Created coupon ${coupon.code} (${coupon.discountType}: ${coupon.discountValue})`,
    ipAddress,
  });

  return {
    ...coupon,
    expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
    createdAt: coupon.createdAt.toISOString(),
    updatedAt: coupon.updatedAt.toISOString(),
  };
}

export async function updateCoupon(
  id: string,
  input: Partial<{
    code: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    minOrderCents: number;
    maxUses: number | null;
    expiresAt: string | null;
    isActive: boolean;
  }>,
  adminUser: { id: string; name: string },
  ipAddress?: string,
) {
  const updateData: any = { ...input };
  if (input.code) {
    updateData.code = input.code.trim().toUpperCase();
  }
  if (input.expiresAt !== undefined) {
    updateData.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  }

  const coupon = await prisma.coupon.update({
    where: { id },
    data: updateData,
  });

  await recordAuditLog({
    userId: adminUser.id,
    adminName: adminUser.name,
    action: "COUPON_UPDATE",
    entity: "Coupon",
    entityId: coupon.id,
    details: `Updated coupon ${coupon.code}`,
    ipAddress,
  });

  return {
    ...coupon,
    expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
    createdAt: coupon.createdAt.toISOString(),
    updatedAt: coupon.updatedAt.toISOString(),
  };
}

export async function deleteCoupon(
  id: string,
  adminUser: { id: string; name: string },
  ipAddress?: string,
) {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Coupon not found");
  }

  await prisma.coupon.delete({ where: { id } });

  await recordAuditLog({
    userId: adminUser.id,
    adminName: adminUser.name,
    action: "COUPON_DELETE",
    entity: "Coupon",
    entityId: id,
    details: `Deleted coupon ${existing.code}`,
    ipAddress,
  });

  return { ok: true };
}

export async function validateCoupon(code: string, subtotalCents: number) {
  const normalized = code.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });

  if (!coupon) {
    throw new Error("Invalid coupon code.");
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw new Error("Coupon usage limit reached.");
  }

  const result = calculateCouponDiscount(subtotalCents, {
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minOrderCents: coupon.minOrderCents,
    isActive: coupon.isActive,
    expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
  });

  if (!result.valid) {
    throw new Error(result.reason || "Coupon cannot be applied to this order.");
  }

  return {
    couponId: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountCents: result.discountCents,
    minOrderCents: coupon.minOrderCents,
  };
}
