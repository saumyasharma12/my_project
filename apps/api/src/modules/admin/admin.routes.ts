import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "@commerce/db";
import { sendError } from "../../common/http.js";
import { listAllUsers, listCustomers, requireAdmin, updateUserRole } from "../auth/auth.service.js";
import { recordAuditLog } from "../../lib/queue.js";

const updateRoleSchema = z.object({
  role: z.enum(["CUSTOMER", "ADMIN"]),
});

export const adminRoutes: FastifyPluginAsync = async (app) => {
  // Admin Dashboard Overview metrics (100% real database aggregates)
  app.get("/overview", async (request, reply) => {
    try {
      await requireAdmin(request);

      const [
        productCount,
        categoryCount,
        orderCount,
        customerCount,
        revenueAggregate,
        lowStockProducts,
        recentOrders,
        recentAuditLogs,
        allOrders,
      ] = await Promise.all([
        prisma.product.count(),
        prisma.category.count(),
        prisma.order.count(),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.order.aggregate({
          where: { status: { not: "CANCELLED" } },
          _sum: { totalCents: true },
        }),
        prisma.product.findMany({
          where: {
            stock: { lte: 5 },
          },
          select: { id: true, name: true, stock: true, lowStockThreshold: true },
        }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: true,
          },
        }),
        prisma.auditLog.findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
        }),
        prisma.order.findMany({
          select: {
            id: true,
            status: true,
            totalCents: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
      ]);

      // Order status breakdown
      const orderStatusCounts: Record<string, number> = {
        CREATED: 0,
        PROCESSING: 0,
        SHIPPED: 0,
        DELIVERED: 0,
        CANCELLED: 0,
      };

      for (const order of allOrders) {
        orderStatusCounts[order.status] = (orderStatusCounts[order.status] || 0) + 1;
      }

      // Sales by day calculation (last 7 days)
      const salesMap = new Map<string, { date: string; amountCents: number; orders: number }>();
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        salesMap.set(key, { date: key, amountCents: 0, orders: 0 });
      }

      for (const order of allOrders) {
        const dateKey = order.createdAt.toISOString().slice(0, 10);
        if (salesMap.has(dateKey) && order.status !== "CANCELLED") {
          const entry = salesMap.get(dateKey)!;
          entry.amountCents += order.totalCents;
          entry.orders += 1;
        }
      }

      return {
        productCount,
        categoryCount,
        orderCount,
        customerCount,
        totalRevenueCents: revenueAggregate._sum.totalCents ?? 0,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          totalCents: o.totalCents,
          status: o.status,
          createdAt: o.createdAt.toISOString(),
          customerName: o.user?.name || o.shippingName || "Customer",
          customerEmail: o.user?.email || o.shippingEmail || "",
          itemCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
        })),
        recentAuditLogs: recentAuditLogs.map((log) => ({
          id: log.id,
          adminName: log.adminName || "System",
          action: log.action,
          entity: log.entity,
          details: log.details,
          createdAt: log.createdAt.toISOString(),
        })),
        salesByDay: Array.from(salesMap.values()),
        orderStatusCounts,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Admin overview unavailable";
      return sendError(reply, 403, message);
    }
  });

  // Customer management
  app.get("/customers", async (request, reply) => {
    try {
      await requireAdmin(request);
      const customers = await listCustomers();
      return customers;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unauthorized";
      return sendError(reply, 403, message);
    }
  });

  // User & role management
  app.get("/users", async (request, reply) => {
    try {
      await requireAdmin(request);
      const users = await listAllUsers();
      return users;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unauthorized";
      return sendError(reply, 403, message);
    }
  });

  app.patch("/users/:id/role", async (request, reply) => {
    try {
      const admin = await requireAdmin(request);
      const { id } = request.params as { id: string };
      const body = updateRoleSchema.parse(request.body);
      const updated = await updateUserRole(admin, id, body.role, request.ip);
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update user role";
      return sendError(reply, 400, message);
    }
  });

  // Payment management
  app.get("/payments", async (request, reply) => {
    try {
      await requireAdmin(request);
      const payments = await prisma.payment.findMany({
        include: {
          order: {
            select: {
              id: true,
              userId: true,
              status: true,
              shippingName: true,
              shippingEmail: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return payments.map((p) => ({
        id: p.id,
        orderId: p.orderId,
        amountCents: p.amountCents,
        currency: p.currency,
        status: p.status,
        provider: p.provider,
        transactionId: p.transactionId,
        createdAt: p.createdAt.toISOString(),
        customerName: p.order?.user?.name || p.order?.shippingName || "Customer",
        customerEmail: p.order?.user?.email || p.order?.shippingEmail || "",
        orderStatus: p.order?.status,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unauthorized";
      return sendError(reply, 403, message);
    }
  });

  // Refund payment
  app.post("/payments/:id/refund", async (request, reply) => {
    try {
      const admin = await requireAdmin(request);
      const { id } = request.params as { id: string };

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: { order: true },
      });

      if (!payment) {
        return sendError(reply, 404, "Payment record not found");
      }

      const updated = await prisma.$transaction(async (tx) => {
        const p = await tx.payment.update({
          where: { id },
          data: { status: "REFUNDED" },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: "REFUNDED", status: "CANCELLED" },
        });

        return p;
      });

      await recordAuditLog({
        userId: admin.id,
        adminName: admin.name,
        action: "PAYMENT_REFUND",
        entity: "Payment",
        entityId: id,
        details: `Refunded $${(payment.amountCents / 100).toFixed(2)} for Order #${payment.orderId}`,
        ipAddress: request.ip,
      });

      return {
        id: updated.id,
        status: updated.status,
        refundedAt: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Refund failed";
      return sendError(reply, 400, message);
    }
  });

  // Audit logs list
  app.get("/audit-logs", async (request, reply) => {
    try {
      await requireAdmin(request);
      const logs = await prisma.auditLog.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
      });

      return logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        adminName: log.adminName || "System",
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        details: log.details,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt.toISOString(),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unauthorized";
      return sendError(reply, 403, message);
    }
  });

  // Inventory dashboard list
  app.get("/inventory", async (request, reply) => {
    try {
      await requireAdmin(request);
      const products = await prisma.product.findMany({
        include: {
          category: { select: { id: true, name: true } },
        },
        orderBy: [{ stock: "asc" }, { name: "asc" }],
      });

      return products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        imageUrl: p.imageUrl,
        categoryName: p.category?.name || "Uncategorized",
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        priceCents: p.priceCents,
        isActive: p.isActive,
        isLowStock: p.stock <= p.lowStockThreshold,
        updatedAt: p.updatedAt.toISOString(),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unauthorized";
      return sendError(reply, 403, message);
    }
  });
};
