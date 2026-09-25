import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, mapProduct } from "@/lib/admin-auth";
import { slugify } from "@/lib/format";
import { categorizeProduct, type CategorizeResult } from "@/lib/categorize";

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

/** DELETE /api/admin/products — permanently delete multiple products */
export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { ids?: unknown };
    const ids = Array.isArray(body.ids) && body.ids.every((id): id is string => typeof id === "string")
      ? [...new Set(body.ids)]
      : [];
    if (ids.length === 0 || ids.length > 100) {
      return NextResponse.json({ error: "Provide between 1 and 100 product IDs" }, { status: 400 });
    }

    const result = await db.product.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ ok: true, deleted: result.count });
  } catch (e) {
    console.error("admin products bulk DELETE error", e);
    return NextResponse.json({ error: "Bulk delete failed" }, { status: 500 });
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

    const description = String(b.description ?? "").trim();

    // ---- Category: auto-detect (AI + keyword fallback) when missing/invalid ----
    let categoryId = String(b.categoryId ?? "").trim();
    if (categoryId) {
      const catExists = await db.category.findUnique({ where: { id: categoryId }, select: { id: true } });
      if (!catExists) categoryId = "";
    }
    let auto: CategorizeResult | null = null;
    if (!categoryId) {
      auto = await categorizeProduct(name, description);
      if (auto) {
        categoryId = auto.categoryId;
      } else {
        const first = await db.category.findFirst({ orderBy: { sortOrder: "asc" }, select: { id: true } });
        categoryId = first?.id ?? "";
      }
      if (!categoryId) return NextResponse.json({ error: "No categories exist yet" }, { status: 400 });
    }

    // ---- Subcategory: validate provided, auto-detect when missing ----
    let subcategoryId: string | null = null;
    if (b.subcategoryId) {
      const sub = await db.subcategory.findUnique({ where: { id: String(b.subcategoryId) } });
      if (sub && sub.categoryId === categoryId) subcategoryId = sub.id;
    }
    if (!subcategoryId) {
      if (!auto) auto = await categorizeProduct(name, description);
      if (auto && auto.categoryId === categoryId && auto.subcategoryId) {
        subcategoryId = auto.subcategoryId;
      }
    }

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        price: b.price === null || b.price === undefined || b.price === "" ? null : Number(b.price),
        oldPrice: b.oldPrice === null || b.oldPrice === undefined || b.oldPrice === "" ? null : Number(b.oldPrice),
        type: b.type === "BUY_NOW" ? "BUY_NOW" : b.type === "BOTH" ? "BOTH" : "CUSTOM_ORDER",
        categoryId,
        subcategoryId,
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
