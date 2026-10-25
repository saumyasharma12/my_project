import { prisma } from "@commerce/db";
import { calculateCartTotal } from "@commerce/business-logic";

export async function getCartForUser(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart) {
    return { items: [], totalCents: 0, itemCount: 0 };
  }

  const items = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    quantity: item.quantity,
    unitPriceCents: item.product.priceCents,
    imageUrl: item.product.imageUrl,
    stock: item.product.stock,
  }));

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    totalCents: calculateCartTotal(items),
  };
}

export async function ensureCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function addItemToCart(userId: string, productId: string, quantity: number) {
  const cart = await ensureCart(userId);
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product || !product.isActive) {
    throw new Error("Product not found or is currently inactive.");
  }

  if (product.stock < quantity) {
    throw new Error(`Only ${product.stock} items in stock.`);
  }

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (existing) {
    const nextQuantity = existing.quantity + quantity;
    if (product.stock < nextQuantity) {
      throw new Error(`Cannot add more. You have ${existing.quantity} in cart and stock is ${product.stock}.`);
    }
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQuantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    });
  }

  return getCartForUser(userId);
}

export async function updateCartItem(userId: string, itemId: string, quantity: number) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, product: true },
  });

  if (!item || item.cart.userId !== userId) {
    throw new Error("Cart item not found.");
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return getCartForUser(userId);
  }

  if (item.product.stock < quantity) {
    throw new Error(`Only ${item.product.stock} items available in stock.`);
  }

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  return getCartForUser(userId);
}

export async function removeCartItem(userId: string, itemId: string) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== userId) {
    throw new Error("Cart item not found.");
  }

  await prisma.cartItem.delete({ where: { id: itemId } });
  return getCartForUser(userId);
}

export async function clearCart(userId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  return { items: [], itemCount: 0, totalCents: 0 };
}
