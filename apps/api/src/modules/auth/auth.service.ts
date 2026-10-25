import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@commerce/db";
import { config } from "../../config/index.js";
import type { FastifyRequest } from "fastify";
import type { UserRole } from "@commerce/types";
import { recordAuditLog } from "../../lib/queue.js";

export async function ensureDefaultAdmin() {
  const adminEmail = "admin@example.com";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        name: "Admin User",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log("Default admin account ensured: admin@example.com / admin123");
  }
}

export async function registerUser(input: { name: string; email: string; password: string }) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "CUSTOMER",
    },
  });

  return createSessionForUser(user.id, {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}

export async function loginUser(input: { email: string; password: string }) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid email or password.");
  }

  return createSessionForUser(user.id, {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}

async function createSessionForUser(
  userId: string,
  user: { id: string; email: string; name: string; role: string },
) {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
  const expiresAt = new Date(Date.now() + config.sessionTtlDays * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    token: sessionToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    },
  };
}

export async function logoutUser(request: FastifyRequest) {
  const sessionToken = request.cookies?.[config.sessionCookieName];
  if (!sessionToken) return;

  const tokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
  await prisma.session.deleteMany({
    where: { tokenHash },
  });
}

export async function getUserFromRequest(request: FastifyRequest) {
  const sessionToken = request.cookies?.[config.sessionCookieName];
  if (!sessionToken) return null;

  const tokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as UserRole,
  };
}

export async function requireUser(request: FastifyRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    throw new Error("Authentication required.");
  }
  return user;
}

export async function requireAdmin(request: FastifyRequest) {
  const user = await requireUser(request);
  if (user.role !== "ADMIN") {
    throw new Error("Admin access required.");
  }
  return user;
}

// User & customer management
export async function listAllUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          orders: true,
          sessions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    orderCount: u._count.orders,
    activeSessions: u._count.sessions,
  }));
}

export async function listCustomers() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      orders: {
        select: {
          id: true,
          totalCents: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return customers.map((c) => {
    const totalSpentCents = c.orders.reduce((sum, o) => sum + o.totalCents, 0);
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      role: c.role,
      orderCount: c.orders.length,
      totalSpentCents,
      createdAt: c.createdAt.toISOString(),
      recentOrders: c.orders.slice(0, 3).map((o) => ({
        id: o.id,
        totalCents: o.totalCents,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
    };
  });
}

export async function updateUserRole(
  adminUser: { id: string; name: string },
  targetUserId: string,
  newRole: UserRole,
  ipAddress?: string,
) {
  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
  });

  await recordAuditLog({
    userId: adminUser.id,
    adminName: adminUser.name,
    action: "USER_ROLE_UPDATE",
    entity: "User",
    entityId: targetUserId,
    details: `Updated role to ${newRole} for user ${updated.email}`,
    ipAddress,
  });

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
  };
}
