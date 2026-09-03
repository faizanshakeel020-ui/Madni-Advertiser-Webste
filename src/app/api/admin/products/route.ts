import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, mapProduct } from "@/lib/admin-auth";
import { slugify } from "@/lib/format";

/** GET /api/admin/products — full catalog (no pagination) */
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const products = await db.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: { select: { id: true, slug: true, name: true } } },
    });
    return NextResponse.json(products.map(mapProduct));
  } catch (e) {
    console.error("admin products GET error", e);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

/** POST /api/admin/products — create */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const b = await req.json();
    const name = String(b.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    const slug = slugify(String(b.slug ?? "") || name);
    if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    const dupe = await db.product.findUnique({ where: { slug } });
    if (dupe) return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 400 });

    const product = await db.product.create({
      data: {
        name,
        slug,
        description: String(b.description ?? "").trim(),
        price: b.price === null || b.price === undefined || b.price === "" ? null : Number(b.price),
        oldPrice: b.oldPrice === null || b.oldPrice === undefined || b.oldPrice === "" ? null : Number(b.oldPrice),
        type: b.type === "BUY_NOW" ? "BUY_NOW" : "CUSTOM_ORDER",
        categoryId: String(b.categoryId ?? ""),
        images: JSON.stringify(Array.isArray(b.images) ? b.images : []),
        specs: JSON.stringify(Array.isArray(b.specs) ? b.specs : []),
        options: JSON.stringify(Array.isArray(b.options) ? b.options : []),
        badge: b.badge ? String(b.badge).trim() : null,
        stock: Number(b.stock) || 0,
        featured: Boolean(b.featured),
      },
      include: { category: { select: { id: true, slug: true, name: true } } },
    });
    return NextResponse.json(mapProduct(product), { status: 201 });
  } catch (e) {
    console.error("admin products POST error", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
