import type { FastifyPluginAsync } from "fastify";
import { checkoutSchema, updateOrderStatusSchema } from "@commerce/validation";
import { sendError } from "../../common/http.js";
import { requireAdmin, requireUser } from "../auth/auth.service.js";
import {
  createOrderFromCart,
  getOrderById,
  getOrdersForUser,
  listAllOrdersAdmin,
  updateOrderStatusAdmin,
} from "./order.service.js";

export const orderRoutes: FastifyPluginAsync = async (app) => {
  // Customer: list orders
  app.get("/", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const orders = await getOrdersForUser(user.id);
      return orders;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication required";
      return sendError(reply, 401, message);
    }
  });

  // Customer / Admin: get order by ID
  app.get("/:id", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const { id } = request.params as { id: string };
      // If admin, can see any order, otherwise restrict to own order
      const order = await getOrderById(id, user.role === "ADMIN" ? undefined : user.id);
      if (!order) {
        return sendError(reply, 404, "Order not found");
      }
      return order;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load order";
      return sendError(reply, 400, message);
    }
  });

  // Customer: checkout
  app.post("/checkout", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const body = checkoutSchema.parse(request.body);
      const order = await createOrderFromCart(user.id, body);
      return reply.code(201).send(order);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Checkout failed";
      return sendError(reply, 400, message);
    }
  });

  // Admin: list all orders
  app.get("/admin/all", async (request, reply) => {
    try {
      await requireAdmin(request);
      const query = request.query as { status?: string; search?: string };
      const orders = await listAllOrdersAdmin(query);
      return orders;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unauthorized";
      return sendError(reply, 403, message);
    }
  });

  // Admin: update order status
  app.patch("/admin/:id/status", async (request, reply) => {
    try {
      const admin = await requireAdmin(request);
      const { id } = request.params as { id: string };
      const body = updateOrderStatusSchema.parse(request.body);
      const order = await updateOrderStatusAdmin(id, body, admin, request.ip);
      return order;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update order";
      return sendError(reply, 400, message);
    }
  });
};
