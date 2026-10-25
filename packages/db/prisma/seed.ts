import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    slug: "lifestyle-accessories",
    name: "Accessories",
    description: "Everyday essentials, bags, totes, and curated daily carries.",
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "kitchen-dining",
    name: "Kitchen & Dining",
    description: "Ceramics, coffee wares, and artisanal cookware for mindful living.",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "home-textiles",
    name: "Home Textiles",
    description: "Luxurious throws, organic cotton cushions, and cozy bedroom layers.",
    imageUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "lighting-decor",
    name: "Lighting & Decor",
    description: "Architectural desk lamps, ambient lighting, and modern decor.",
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "workspace-stationery",
    name: "Workspace & Stationery",
    description: "Minimalist desktop trays, notebooks, and tools for deep focus.",
    imageUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
  },
];

const products = [
  {
    slug: "everyday-canvas-tote",
    name: "Everyday Canvas Tote",
    description: "A sturdy, heavyweight organic cotton canvas tote for errands, laptops, books, and daily outings. Reinforced double-stitched straps for longevity.",
    priceCents: 2800,
    stock: 24,
    lowStockThreshold: 5,
    categorySlug: "lifestyle-accessories",
    isFeatured: true,
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    slug: "ceramic-coffee-cup",
    name: "Ceramic Coffee Cup",
    description: "A comfortable stoneware mug with a matte speckled glaze, ergonomically crafted for your daily pour-over coffee, matcha, or tea ritual.",
    priceCents: 1900,
    stock: 18,
    lowStockThreshold: 4,
    categorySlug: "kitchen-dining",
    isFeatured: true,
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    slug: "soft-knit-throw",
    name: "Soft Knit Throw",
    description: "A lightweight textured throw blanket woven from breathable cotton-linen blend that adds an extra layer of warmth and effortless style to your sofa.",
    priceCents: 6400,
    stock: 9,
    lowStockThreshold: 3,
    categorySlug: "home-textiles",
    isFeatured: true,
    imageUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    slug: "minimal-desk-lamp",
    name: "Minimal Desk Lamp",
    description: "A compact, adjustable aluminum desk lamp featuring warm dimming LED light with intuitive touch controls for focused work, study, and reading.",
    priceCents: 5200,
    stock: 12,
    lowStockThreshold: 5,
    categorySlug: "lighting-decor",
    isFeatured: true,
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    slug: "walnut-desk-organizer",
    name: "Walnut Desk Organizer",
    description: "Solid American walnut tray designed to neatly hold your phone, keys, fountain pens, and small desktop essentials with a felt-lined base.",
    priceCents: 3800,
    stock: 15,
    lowStockThreshold: 4,
    categorySlug: "workspace-stationery",
    isFeatured: false,
    imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    slug: "leather-passport-wallet",
    name: "Full-Grain Leather Wallet",
    description: "Slim bifold wallet made from vegetable-tanned full-grain leather that patinas beautifully over time. Features 6 card slots and RFID protection.",
    priceCents: 4500,
    stock: 3,
    lowStockThreshold: 5,
    categorySlug: "lifestyle-accessories",
    isFeatured: true,
    imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    slug: "scented-soy-candle",
    name: "Amber & Cedar Soy Candle",
    description: "Hand-poured 100% natural soy wax candle scented with woody cedar, amber, and subtle vanilla notes. 50-hour clean burn time in amber glass.",
    priceCents: 2400,
    stock: 30,
    lowStockThreshold: 8,
    categorySlug: "lighting-decor",
    isFeatured: false,
    imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    slug: "linen-apron",
    name: "Artisan Linen Chef Apron",
    description: "Cross-back pre-washed French flax linen apron with deep front pockets. Easy slip-on design with no ties, ideal for cooking, gardening, and ceramics.",
    priceCents: 4900,
    stock: 14,
    lowStockThreshold: 4,
    categorySlug: "kitchen-dining",
    isFeatured: false,
    imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80",
    images: [
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80",
    ],
  },
];

const coupons = [
  {
    code: "WELCOME10",
    discountType: "PERCENTAGE" as const,
    discountValue: 10,
    minOrderCents: 2000,
    maxUses: 500,
    isActive: true,
  },
  {
    code: "SAVE20",
    discountType: "PERCENTAGE" as const,
    discountValue: 20,
    minOrderCents: 5000,
    maxUses: 100,
    isActive: true,
  },
  {
    code: "FLAT15",
    discountType: "FIXED" as const,
    discountValue: 1500,
    minOrderCents: 6000,
    maxUses: 50,
    isActive: true,
  },
];

async function main() {
  // 1. Ensure Categories
  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
      },
      create: cat,
    });
    categoryMap.set(cat.slug, created.id);
  }
  console.info(`Seeded ${categories.length} categories.`);

  // 2. Ensure Products
  for (const product of products) {
    const { categorySlug, ...data } = product;
    const categoryId = categoryMap.get(categorySlug) ?? null;

    await prisma.product.upsert({
      where: { slug: data.slug },
      update: {
        name: data.name,
        description: data.description,
        priceCents: data.priceCents,
        stock: data.stock,
        lowStockThreshold: data.lowStockThreshold,
        imageUrl: data.imageUrl,
        images: data.images,
        isFeatured: data.isFeatured,
        categoryId,
      },
      create: {
        ...data,
        categoryId,
      },
    });
  }
  console.info(`Seeded / updated ${products.length} products with category links and photos.`);

  // 3. Ensure Coupons
  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderCents: coupon.minOrderCents,
        maxUses: coupon.maxUses,
        isActive: coupon.isActive,
      },
      create: coupon,
    });
  }
  console.info(`Seeded ${coupons.length} promotional coupons.`);

  // 4. Ensure Admin User (password is 'admin123' hashed with bcrypt)
  const adminEmail = "admin@example.com";
  // bcrypt hash of "admin123"
  const passwordHash = "$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: "ADMIN",
      passwordHash,
    },
    create: {
      name: "Admin Manager",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
  });
  console.info("Ensured administrator: admin@example.com (password: admin123)");
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
