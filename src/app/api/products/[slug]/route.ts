import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mapProduct } from "@/lib/admin-auth";

/** GET /api/products/[slug] — single product + related items */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await db.product.findUnique({
      where: { slug },
      include: { category: { select: { id: true, slug: true, name: true } } },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // bump popularity (fire and forget)
    db.product
      .update({ where: { id: product.id }, data: { popularity: { increment: 1 } } })
      .catch(() => {});

    const related = await db.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id } },
      orderBy: { popularity: "desc" },
      take: 4,
      include: { category: { select: { id: true, slug: true, name: true } } },
    });

    return NextResponse.json({
      product: mapProduct(product),
      related: related.map(mapProduct),
    });
  } catch (e) {
    console.error("product GET error", e);
    return NextResponse.json({ error: "Failed to load product" }, { status: 500 });
  }
}
