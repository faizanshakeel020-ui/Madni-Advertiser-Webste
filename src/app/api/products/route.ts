import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mapProduct } from "@/lib/admin-auth";

/** GET /api/products — public catalog with filters, sort & pagination */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const cat = params.get("cat") ?? undefined;
    const sub = params.get("sub") ?? undefined;
    const q = params.get("q") ?? undefined;
    const type = params.get("type") ?? undefined;
    const min = params.get("min");
    const max = params.get("max");
    const sort = params.get("sort") ?? "popular";
    const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
    const per = Math.min(48, Math.max(1, parseInt(params.get("per") ?? "12", 10) || 12));
    const featured = params.get("featured") === "1";

    const where: Record<string, unknown> = {};
    if (cat) {
      const category = await db.category.findUnique({ where: { slug: cat } });
      where.categoryId = category?.id ?? "none";
    }
    if (sub) {
      const subcat = await db.subcategory.findUnique({ where: { slug: sub } });
      where.subcategoryId = subcat?.id ?? "none";
    }
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
      ];
    }
    if (type === "BUY_NOW" || type === "CUSTOM_ORDER") where.type = type;
    if (min || max) {
      where.AND = [
        { price: min ? { gte: Number(min) } : undefined },
        { price: max ? { lte: Number(max) } : undefined },
      ].filter(Boolean);
    }
    if (featured) where.featured = true;

    const orderBy: Record<string, string> =
      sort === "price_asc"
        ? { price: "asc" }
        : sort === "price_desc"
          ? { price: "desc" }
          : sort === "newest"
            ? { createdAt: "desc" }
            : sort === "featured"
              ? { featured: "desc" }
              : { popularity: "desc" };

    const [items, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * per,
        take: per,
        include: { category: { select: { id: true, slug: true, name: true } } },
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map(mapProduct),
      total,
      page,
      pages: Math.ceil(total / per) || 0,
    });
  } catch (e) {
    console.error("products GET error", e);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
