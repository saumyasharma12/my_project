import { prisma } from "@commerce/db";

export async function getWishlist(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return items.map((item) => ({
    id: item.id,
    userId: item.userId,
    productId: item.productId,
    createdAt: item.createdAt.toISOString(),
    product: {
      ...item.product,
      createdAt: item.product.createdAt.toISOString(),
      updatedAt: item.product.updatedAt.toISOString(),
    },
  }));
}

export async function toggleWishlist(userId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new Error("Product not found");
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({
      where: { id: existing.id },
    });
    return { inWishlist: false, productId };
  } else {
    await prisma.wishlistItem.create({
      data: { userId, productId },
    });
    return { inWishlist: true, productId };
  }
}

export async function removeFromWishlist(userId: string, productId: string) {
  await prisma.wishlistItem.deleteMany({
    where: { userId, productId },
  });
  return { ok: true, productId };
}
