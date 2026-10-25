import { prisma } from "@commerce/db";
import { getCache, setCache, invalidateCachePattern } from "../../lib/redis.js";
import { recordAuditLog } from "../../lib/queue.js";

export async function listCategories() {
  const cacheKey = "categories:all";
  const cached = await getCache<any[]>(cacheKey);
  if (cached) return cached;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  const formatted = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    imageUrl: c.imageUrl,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    _count: c._count,
  }));

  await setCache(cacheKey, formatted, 600); // 10 minutes cache
  return formatted;
}

export async function getCategoryBySlug(slug: string) {
  const cacheKey = `categories:slug:${slug}`;
  const cached = await getCache<any>(cacheKey);
  if (cached) return cached;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isActive: true },
        take: 12,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!category) return null;

  await setCache(cacheKey, category, 600);
  return category;
}

export async function createCategory(
  input: { name: string; slug: string; description?: string | null; imageUrl?: string | null },
  adminUser: { id: string; name: string },
  ipAddress?: string,
) {
  const category = await prisma.category.create({
    data: {
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      description: input.description?.trim() ?? null,
      imageUrl: input.imageUrl?.trim() ?? null,
    },
  });

  // Invalidate cache immediately
  await invalidateCachePattern("categories:*");
  await invalidateCachePattern("products:*");

  await recordAuditLog({
    userId: adminUser.id,
    adminName: adminUser.name,
    action: "CATEGORY_CREATE",
    entity: "Category",
    entityId: category.id,
    details: `Created category: ${category.name} (${category.slug})`,
    ipAddress,
  });

  return category;
}

export async function updateCategory(
  id: string,
  input: Partial<{ name: string; slug: string; description: string | null; imageUrl: string | null }>,
  adminUser: { id: string; name: string },
  ipAddress?: string,
) {
  const category = await prisma.category.update({
    where: { id },
    data: input,
  });

  await invalidateCachePattern("categories:*");
  await invalidateCachePattern("products:*");

  await recordAuditLog({
    userId: adminUser.id,
    adminName: adminUser.name,
    action: "CATEGORY_UPDATE",
    entity: "Category",
    entityId: category.id,
    details: `Updated category: ${category.name}`,
    ipAddress,
  });

  return category;
}

export async function deleteCategory(
  id: string,
  adminUser: { id: string; name: string },
  ipAddress?: string,
) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Category not found");
  }

  // Set categoryId to null on associated products before delete
  await prisma.product.updateMany({
    where: { categoryId: id },
    data: { categoryId: null },
  });

  await prisma.category.delete({ where: { id } });

  await invalidateCachePattern("categories:*");
  await invalidateCachePattern("products:*");

  await recordAuditLog({
    userId: adminUser.id,
    adminName: adminUser.name,
    action: "CATEGORY_DELETE",
    entity: "Category",
    entityId: id,
    details: `Deleted category: ${existing.name}`,
    ipAddress,
  });

  return { ok: true };
}
