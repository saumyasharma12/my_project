import type { FastifyPluginAsync } from "fastify";
import { applyCouponSchema, createCouponSchema, updateCouponSchema } from "@commerce/validation";
import { sendError } from "../../common/http.js";
import { requireAdmin } from "../auth/auth.service.js";
import {
  createCoupon,
  deleteCoupon,
  listAllCoupons,
  updateCoupon,
  validateCoupon,
} from "./coupons.service.js";

export const couponRoutes: FastifyPluginAsync = async (app) => {
  // Public validation
  app.post("/validate", async (request, reply) => {
    try {
      const body = applyCouponSchema.parse(request.body);
      const result = await validateCoupon(body.code, body.subtotalCents);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid coupon";
      return sendError(reply, 400, message);
    }
  });

  // Admin list
  app.get("/admin", async (request, reply) => {
    try {
      await requireAdmin(request);
      const coupons = await listAllCoupons();
      return coupons;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unauthorized";
      return sendError(reply, 403, message);
    }
  });

  // Admin create
  app.post("/admin", async (request, reply) => {
    try {
      const admin = await requireAdmin(request);
      const body = createCouponSchema.parse(request.body);
      const coupon = await createCoupon(body, admin, request.ip);
      return reply.code(201).send(coupon);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create coupon";
      return sendError(reply, 400, message);
    }
  });

  // Admin update
  app.patch("/admin/:id", async (request, reply) => {
    try {
      const admin = await requireAdmin(request);
      const { id } = request.params as { id: string };
      const body = updateCouponSchema.parse(request.body);
      const coupon = await updateCoupon(id, body, admin, request.ip);
      return coupon;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update coupon";
      return sendError(reply, 400, message);
    }
  });

  // Admin delete
  app.delete("/admin/:id", async (request, reply) => {
    try {
      const admin = await requireAdmin(request);
      const { id } = request.params as { id: string };
      const result = await deleteCoupon(id, admin, request.ip);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete coupon";
      return sendError(reply, 400, message);
    }
  });
};
