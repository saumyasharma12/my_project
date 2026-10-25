import type { FastifyPluginAsync } from "fastify";
import { cartItemSchema, updateCartItemSchema } from "@commerce/validation";
import { sendError } from "../../common/http.js";
import { requireUser } from "../auth/auth.service.js";
import {
  addItemToCart,
  clearCart,
  getCartForUser,
  removeCartItem,
  updateCartItem,
} from "./cart.service.js";

export const cartRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const cart = await getCartForUser(user.id);
      return cart;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication required";
      return sendError(reply, 401, message);
    }
  });

  app.post("/items", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const body = cartItemSchema.parse(request.body);
      const cart = await addItemToCart(user.id, body.productId, body.quantity);
      return cart;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add to cart";
      return sendError(reply, 400, message);
    }
  });

  app.patch("/items/:id", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const { id } = request.params as { id: string };
      const body = updateCartItemSchema.parse(request.body);
      const cart = await updateCartItem(user.id, id, body.quantity);
      return cart;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update cart item";
      return sendError(reply, 400, message);
    }
  });

  app.delete("/items/:id", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const { id } = request.params as { id: string };
      const cart = await removeCartItem(user.id, id);
      return cart;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to remove cart item";
      return sendError(reply, 400, message);
    }
  });

  app.delete("/clear", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const cart = await clearCart(user.id);
      return cart;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to clear cart";
      return sendError(reply, 400, message);
    }
  });
};
