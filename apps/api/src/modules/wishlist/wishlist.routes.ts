import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { sendError } from "../../common/http.js";
import { requireUser } from "../auth/auth.service.js";
import { getWishlist, removeFromWishlist, toggleWishlist } from "./wishlist.service.js";

const toggleSchema = z.object({
  productId: z.string().min(1),
});

export const wishlistRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const items = await getWishlist(user.id);
      return items;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication required";
      return sendError(reply, 401, message);
    }
  });

  app.post("/toggle", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const body = toggleSchema.parse(request.body);
      const result = await toggleWishlist(user.id, body.productId);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update wishlist";
      return sendError(reply, 400, message);
    }
  });

  app.delete("/:productId", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const { productId } = request.params as { productId: string };
      const result = await removeFromWishlist(user.id, productId);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove from wishlist";
      return sendError(reply, 400, message);
    }
  });
};
