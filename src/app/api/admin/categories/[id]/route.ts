import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { slugify } from "@/lib/format";

type RouteContext = { params: Promise<{ id: string }> };

/** PUT /api/admin/categories/[id] — update a shop category */
export async function PUT(req: NextRequest, { params }: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await req.json();
    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const name = String(body.name ?? existing.name).trim();
    const slug = slugify(String(body.slug ?? "") || name);
    if (!name || !slug) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const category = await db.category.update({
      where: { id },
      data: {
        name,
        slug,
        description: body.description === undefined ? existing.description : body.description ? String(body.description).trim() : null,
        image: body.image === undefined ? existing.image : body.image ? String(body.image).trim() : null,
        sortOrder: body.sortOrder === undefined ? existing.sortOrder : Number(body.sortOrder) || 0,
      },
      include: { _count: { select: { products: true } }, subcategories: true },
    });
    return NextResponse.json({ ...category, productCount: category._count.products });
  } catch (e) {
    console.error("admin categories PUT error", e);
    return NextResponse.json({ error: "Could not update category; its slug may already be in use" }, { status: 400 });
  }
}

/** DELETE /api/admin/categories/[id] — delete only an unused category */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const category = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, subcategories: true } } },
    });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    if (category._count.products || category._count.subcategories) {
      return NextResponse.json(
        { error: "Move or delete this category's products and subcategories before deleting it" },
        { status: 409 }
      );
    }
    await db.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin categories DELETE error", e);
    return NextResponse.json({ error: "Could not delete category" }, { status: 500 });
  }
}
