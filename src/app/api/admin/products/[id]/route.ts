import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest, mapProduct } from "@/lib/admin-auth";
import { slugify } from "@/lib/format";

/** PUT /api/admin/products/[id] — update */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const b = await req.json();
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const name = String(b.name ?? existing.name).trim();
    const slug = slugify(String(b.slug ?? "") || name) || existing.slug;
    if (slug !== existing.slug) {
      const dupe = await db.product.findUnique({ where: { slug } });
      if (dupe) return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 400 });
    }

    const finalCategoryId = b.categoryId ? String(b.categoryId) : existing.categoryId;

    // Subcategory: keep existing if not sent, clear if emptied, validate it belongs to the final category
    let subcategoryId: string | null | undefined =
      b.subcategoryId === undefined ? existing.subcategoryId ?? null : b.subcategoryId ? String(b.subcategoryId) : null;
    if (subcategoryId) {
      const sub = await db.subcategory.findUnique({ where: { id: subcategoryId } });
      if (!sub || sub.categoryId !== finalCategoryId) subcategoryId = null;
    }

    const product = await db.product.update({
      where: { id },
      data: {
        name,
        slug,
        description: String(b.description ?? existing.description).trim(),
        price: b.price === null || b.price === undefined || b.price === "" ? null : Number(b.price),
        oldPrice:
          b.oldPrice === null || b.oldPrice === undefined || b.oldPrice === ""
            ? null
            : Number(b.oldPrice),
        type: b.type === "BUY_NOW" ? "BUY_NOW" : b.type === "BOTH" ? "BOTH" : "CUSTOM_ORDER",
        categoryId: finalCategoryId,
        subcategoryId: subcategoryId ?? null,
        images: JSON.stringify(Array.isArray(b.images) ? b.images : JSON.parse(existing.images || "[]")),
        specs: JSON.stringify(Array.isArray(b.specs) ? b.specs : JSON.parse(existing.specs || "[]")),
        options: JSON.stringify(Array.isArray(b.options) ? b.options : JSON.parse(existing.options || "[]")),
        badge: b.badge ? String(b.badge).trim() : null,
        stock: b.stock === undefined ? existing.stock : Number(b.stock) || 0,
        featured: b.featured === undefined ? existing.featured : Boolean(b.featured),
      },
      include: { category: { select: { id: true, slug: true, name: true } } },
    });
    return NextResponse.json(mapProduct(product));
  } catch (e) {
    console.error("admin products PUT error", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/** DELETE /api/admin/products/[id] */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    await db.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin products DELETE error", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
