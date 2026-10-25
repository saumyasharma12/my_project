import type { Prisma } from "@commerce/db";
import { prisma } from "@commerce/db";
import { getCache, setCache, invalidateCachePattern } from "../../lib/redis.js";
import { recordAuditLog, enqueueEmail } from "../../lib/queue.js";

export interface ListProductsOptions {
  search?: string;
  category?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  sort?: "featured" | "price_asc" | "price_desc" | "name_asc" | "newest";
  page?: number;
  limit?: number;
}

export async function listProducts(options: ListProductsOptions) {
  const {
    search,
    category,
    categoryId,
    minPrice,
    maxPrice,
    inStock,
    featured,
    sort = "featured",
    page = 1,
    limit = 12,
  } = options;

  // Cache key based on query
  const cacheKey = `products:list:${JSON.stringify({
    search: search ?? "",
    category: category ?? "",
    categoryId: categoryId ?? "",
    minPrice: minPrice ?? 0,
    maxPrice: maxPrice ?? 0,
    inStock: inStock ?? false,
    featured: featured ?? false,
    sort,
    page,
    limit,
  })}`;

  const cached = await getCache<{
    items: any[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>(cacheKey);

  if (cached) {
    return cached;
  }

  const where: Prisma.ProductWhereInput = {
    isActive: true,
  };

  if (search && search.trim() !== "") {
    where.OR = [
      { name: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = { slug: category };
  } else if (categoryId) {
    where.categoryId = categoryId;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.priceCents = {};
    if (minPrice !== undefined) where.priceCents.gte = minPrice;
    if (maxPrice !== undefined) where.priceCents.lte = maxPrice;
  }

  if (inStock) {
    where.stock = { gt: 0 };
  }

  if (featured) {
    where.isFeatured = true;
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput;
  switch (sort) {
    case "price_asc":
      orderBy = { priceCents: "asc" };
      break;
    case "price_desc":
      orderBy = { priceCents: "desc" };
      break;
    case "name_asc":
      orderBy = { name: "asc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "featured":
    default:
      orderBy = { isFeatured: "desc" };
      break;
  }

  const [total, rawItems] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    }),
  ]);

  const items = rawItems.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const result = {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };

  await setCache(cacheKey, result, 180); // 3 minutes cache
  return result;
}

export async function getProductBySlug(slug: string) {
  const cacheKey = `products:slug:${slug}`;
  const cached = await getCache<any>(cacheKey);
  if (cached) return cached;

  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: true,
    },
  });

  if (!product) return null;

  const formatted = {
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };

  await setCache(cacheKey, formatted, 300);
  return formatted;
}

export async function listAllProductsAdmin(options?: { search?: string; categoryId?: string }) {
  const where: Prisma.ProductWhereInput = {};
  if (options?.search) {
    where.OR = [
      { name: { contains: options.search.trim(), mode: "insensitive" } },
      { slug: { contains: options.search.trim(), mode: "insensitive" } },
    ];
  }
  if (options?.categoryId) {
    where.categoryId = options.categoryId;
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return products.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    isLowStock: p.stock <= p.lowStockThreshold,
  }));
}

export async function createProduct(
  input: {
    name: string;
    slug: string;
    description: string;
    priceCents: number;
    stock: number;
    lowStockThreshold?: number;
    imageUrl?: string | null;
    images?: string[];
    categoryId?: string | null;
    isActive?: boolean;
    isFeatured?: boolean;
  },
  adminUser: { id: string; name: string },
  ipAddress?: string,
) {
  const product = await prisma.product.create({
    data: {
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      description: input.description.trim(),
      priceCents: input.priceCents,
      stock: input.stock,
      lowStockThreshold: input.lowStockThreshold ?? 5,
      imageUrl: input.imageUrl ?? null,
      images: input.images ?? [],
      categoryId: input.categoryId ?? null,
      isActive: input.isActive ?? true,
      isFeatured: input.isFeatured ?? false,
    },
    include: {
      category: true,
    },
  });

  // Invalidate product caches immediately
  await invalidateCachePattern("products:*");

  await recordAuditLog({
    userId: adminUser.id,
    adminName: adminUser.name,
    action: "PRODUCT_CREATE",
    entity: "Product",
    entityId: product.id,
    details: `Created product: "${product.name}" ($${(product.priceCents / 100).toFixed(2)}) with ${product.stock} units`,
    ipAddress,
  });

  return product;
}

export async function updateProduct(
  id: string,
  input: Partial<{
    name: string;
    slug: string;
    description: string;
    priceCents: number;
    stock: number;
    lowStockThreshold: number;
    imageUrl: string | null;
    images: string[];
    categoryId: string | null;
    isActive: boolean;
    isFeatured: boolean;
  }>,
  adminUser: { id: string; name: string },
  ipAddress?: string,
) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Product not found");
  }

  const product = await prisma.product.update({
    where: { id },
    data: input,
    include: {
      category: true,
    },
  });

  // Invalidate product caches immediately
  await invalidateCachePattern("products:*");

  // Check low stock alert
  if (product.stock <= product.lowStockThreshold) {
    await enqueueEmail({
      type: "LOW_STOCK_ALERT",
      to: "admin@example.com",
      subject: `Low Stock Alert: ${product.name}`,
      payload: {
        productId: product.id,
        name: product.name,
        stock: product.stock,
        threshold: product.lowStockThreshold,
      },
    });
  }

  await recordAuditLog({
    userId: adminUser.id,
    adminName: adminUser.name,
    action: "PRODUCT_UPDATE",
    entity: "Product",
    entityId: product.id,
    details: `Updated product "${product.name}". Price: $${(product.priceCents / 100).toFixed(2)}, Stock: ${product.stock}`,
    ipAddress,
  });

  return product;
}

export async function adjustProductStock(
  productId: string,
  delta: number,
  reason: string | undefined,
  adminUser: { id: string; name: string },
  ipAddress?: string,
) {
  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) {
    throw new Error("Product not found");
  }

  const nextStock = Math.max(0, existing.stock + delta);
  const updated = await prisma.product.update({
    where: { id: productId },
    data: { stock: nextStock },
  });

  await invalidateCachePattern("products:*");

  await recordAuditLog({
    userId: adminUser.id,
    adminName: adminUser.name,
    action: "INVENTORY_ADJUST",
    entity: "Product",
    entityId: productId,
    details: `Adjusted stock for "${existing.name}" by ${delta > 0 ? `+${delta}` : delta} (New: ${nextStock}). Reason: ${reason || "Manual adjustment"}`,
    ipAddress,
  });

  if (updated.stock <= updated.lowStockThreshold) {
    await enqueueEmail({
      type: "LOW_STOCK_ALERT",
      to: "admin@example.com",
      subject: `Low Stock Alert: ${updated.name}`,
      payload: {
        productId: updated.id,
        name: updated.name,
        stock: updated.stock,
        threshold: updated.lowStockThreshold,
      },
    });
  }

  return updated;
}

export async function deleteProduct(
  id: string,
  adminUser: { id: string; name: string },
  ipAddress?: string,
) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Product not found");
  }

  await prisma.product.delete({ where: { id } });

  await invalidateCachePattern("products:*");

  await recordAuditLog({
    userId: adminUser.id,
    adminName: adminUser.name,
    action: "PRODUCT_DELETE",
    entity: "Product",
    entityId: id,
    details: `Deleted product: "${existing.name}"`,
    ipAddress,
  });

  return { ok: true };
}
