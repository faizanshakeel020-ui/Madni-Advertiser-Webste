import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/categories — shop categories with subcategories & product counts */
export async function GET() {
  try {
    const cats = await db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { products: true } },
        products: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { images: true },
        },
        subcategories: {
          orderBy: { sortOrder: "asc" },
          include: { _count: { select: { products: true } } },
        },
      },
    });
    return NextResponse.json(
      cats.map((c) => {
        let productImage: string | null = null;
        try {
          const images: unknown = JSON.parse(c.products[0]?.images ?? "[]");
          if (Array.isArray(images) && typeof images[0] === "string") productImage = images[0];
        } catch {
          productImage = null;
        }

        return {
          id: c.id,
          slug: c.slug,
          name: c.name,
          description: c.description,
          image: productImage ?? c.image,
          sortOrder: c.sortOrder,
          productCount: c._count.products,
          subcategories: c.subcategories.map((s) => ({
            id: s.id,
            slug: s.slug,
            name: s.name,
            categoryId: s.categoryId,
            sortOrder: s.sortOrder,
            productCount: s._count.products,
          })),
        };
      })
    );
  } catch (e) {
    console.error("categories GET error", e);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
