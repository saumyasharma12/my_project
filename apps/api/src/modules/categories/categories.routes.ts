import type { FastifyPluginAsync } from "fastify";
import { createCategorySchema, updateCategorySchema } from "@commerce/validation";
import { sendError } from "../../common/http.js";
import { requireAdmin } from "../auth/auth.service.js";
import {
  createCategory,
  deleteCategory,
  getCategoryBySlug,
  listCategories,
  updateCategory,
} from "./categories.service.js";

export const categoryRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (request, reply) => {
    try {
      const categories = await listCategories();
      return categories;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load categories";
      return sendError(reply, 500, message);
    }
  });

  app.get("/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const category = await getCategoryBySlug(slug);
    if (!category) {
      return sendError(reply, 404, "Category not found");
    }
    return category;
  });

  app.post("/admin", async (request, reply) => {
    try {
      const admin = await requireAdmin(request);
      const body = createCategorySchema.parse(request.body);
      const category = await createCategory(body, admin, request.ip);
      return reply.code(201).send(category);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create category";
      return sendError(reply, 400, message);
    }
  });

  app.patch("/admin/:id", async (request, reply) => {
    try {
      const admin = await requireAdmin(request);
      const { id } = request.params as { id: string };
      const body = updateCategorySchema.parse(request.body);
      const category = await updateCategory(id, body, admin, request.ip);
      return category;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update category";
      return sendError(reply, 400, message);
    }
  });

  app.delete("/admin/:id", async (request, reply) => {
    try {
      const admin = await requireAdmin(request);
      const { id } = request.params as { id: string };
      const result = await deleteCategory(id, admin, request.ip);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete category";
      return sendError(reply, 400, message);
    }
  });
};
