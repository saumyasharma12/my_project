import type { FastifyPluginAsync } from "fastify";
import {
  adjustInventorySchema,
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
} from "@commerce/validation";
import { sendError } from "../../common/http.js";
import { requireAdmin } from "../auth/auth.service.js";
import {
  adjustProductStock,
  createProduct,
  deleteProduct,
  getProductBySlug,
  listAllProductsAdmin,
  listProducts,
  updateProduct,
} from "./products.service.js";

export const productRoutes: FastifyPluginAsync = async (app) => {
  // Public product search & browsing with Redis cache
  app.get("/", async (request, reply) => {
    try {
      const query = productQuerySchema.parse(request.query);
      const result = await listProducts(query);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load products";
      return sendError(reply, 400, message);
    }
  });

  // Public product detail
  app.get("/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const product = await getProductBySlug(slug);
    if (!product) {
      return sendError(reply, 404, "Product not found");
    }
    return product;
  });

  // Admin: list all products with stock and status
  app.get("/admin/all", async (request, reply) => {
    try {
      await requireAdmin(request);
      const query = request.query as { search?: string; categoryId?: string };
      const products = await listAllProductsAdmin(query);
      return products;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unauthorized";
      return sendError(reply, 403, message);
    }
  });

  // Admin: create product
  app.post("/admin", async (request, reply) => {
    try {
      const admin = await requireAdmin(request);
      const body = createProductSchema.parse(request.body);
      const product = await createProduct(body, admin, request.ip);
      return reply.code(201).send(product);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create product";
      return sendError(reply, 400, message);
    }
  });

  // Admin: update product
  app.patch("/admin/:id", async (request, reply) => {
    try {
      const admin = await requireAdmin(request);
      const { id } = request.params as { id: string };
      const body = updateProductSchema.parse(request.body);
      const product = await updateProduct(id, body, admin, request.ip);
      return product;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update product";
      return sendError(reply, 400, message);
    }
  });

  // Admin: quick stock adjustment
  app.post("/admin/adjust-stock", async (request, reply) => {
    try {
      const admin = await requireAdmin(request);
      const body = adjustInventorySchema.parse(request.body);
      const updated = await adjustProductStock(
        body.productId,
        body.delta,
        body.reason,
        admin,
        request.ip,
      );
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to adjust inventory";
      return sendError(reply, 400, message);
    }
  });

  // Admin: delete product
  app.delete("/admin/:id", async (request, reply) => {
    try {
      const admin = await requireAdmin(request);
      const { id } = request.params as { id: string };
      await deleteProduct(id, admin, request.ip);
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete product";
      return sendError(reply, 400, message);
    }
  });

  // Admin: Image Upload helper (supports base64 data URLs or standard image URLs)
  app.post("/admin/upload-image", async (request, reply) => {
    try {
      await requireAdmin(request);
      const body = request.body as { url?: string; fileName?: string };
      if (!body.url) {
        return sendError(reply, 400, "Image URL or data is required");
      }
      return { url: body.url, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image upload failed";
      return sendError(reply, 400, message);
    }
  });
};
