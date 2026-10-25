import crypto from "node:crypto";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { config } from "./config/index.js";
import { logger } from "./lib/logger.js";
import { checkRateLimit } from "./lib/redis.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { ensureDefaultAdmin } from "./modules/auth/auth.service.js";
import { cartRoutes } from "./modules/cart/cart.routes.js";
import { categoryRoutes } from "./modules/categories/categories.routes.js";
import { couponRoutes } from "./modules/coupons/coupons.routes.js";
import { orderRoutes } from "./modules/orders/order.routes.js";
import { productRoutes } from "./modules/products/products.routes.js";
import { wishlistRoutes } from "./modules/wishlist/wishlist.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: false,
    genReqId: () => crypto.randomUUID(),
  });

  // CORS
  await app.register(cors, {
    origin: [
      config.webOrigin,
      config.origin,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:4000",
      "http://127.0.0.1:4000",
    ],
    credentials: true,
  });

  // Cookie
  await app.register(cookie);

  // Request ID and Structured Logging Hooks
  app.addHook("onRequest", async (request, reply) => {
    // Attach request ID header
    const reqId = (request.headers["x-request-id"] as string) || request.id;
    reply.header("x-request-id", reqId);

    // Rate limiting check: 200 requests/minute per IP
    const rateLimit = await checkRateLimit(
      request.ip,
      request.routeOptions?.url || request.url,
      200,
      60,
    );
    reply.header("x-ratelimit-remaining", rateLimit.remaining);
    if (!rateLimit.allowed) {
      return reply.code(429).send({ error: "Too many requests. Please slow down." });
    }
  });

  app.addHook("onResponse", async (request, reply) => {
    logger.info("HTTP Request Completed", {
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      durationMs: Math.round(reply.elapsedTime),
      ip: request.ip,
    });
  });

  app.addHook("onError", async (request, reply, error) => {
    logger.error("HTTP Request Error", error, {
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      ip: request.ip,
    });
  });

  // API Routes
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(categoryRoutes, { prefix: "/api/categories" });
  await app.register(productRoutes, { prefix: "/api/products" });
  await app.register(wishlistRoutes, { prefix: "/api/wishlist" });
  await app.register(cartRoutes, { prefix: "/api/cart" });
  await app.register(couponRoutes, { prefix: "/api/coupons" });
  await app.register(orderRoutes, { prefix: "/api/orders" });
  await app.register(adminRoutes, { prefix: "/api/admin" });

  // Health check
  app.get("/health", async () => ({
    ok: true,
    service: "E-Commerce App API",
    timestamp: new Date().toISOString(),
  }));

  // Ensure default admin user exists
  await ensureDefaultAdmin().catch((err) => {
    logger.warn("Failed to ensure default admin user", {
      error: err instanceof Error ? err.message : String(err),
    });
  });

  return app;
}
