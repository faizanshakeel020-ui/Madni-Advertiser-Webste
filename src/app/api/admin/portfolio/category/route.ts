import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

/**
 * Portfolio category operations — categories are a plain string on each
 * PortfolioItem, so rename/delete act across every item in that category.
 */

/** PUT /api/admin/portfolio/category — rename a category (body: { category, name }) */
export async function PUT(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const b = await req.json().catch(() => ({}));
    const category = String(b.category ?? "").trim();
    const name = String(b.name ?? "").trim();
    if (!category) return NextResponse.json({ error: "Category is required" }, { status: 400 });
    if (!name) return NextResponse.json({ error: "New category name is required" }, { status: 400 });
    if (name === category) return NextResponse.json({ ok: true, updated: 0 });

    const res = await db.portfolioItem.updateMany({ where: { category }, data: { category: name } });
    if (res.count === 0) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    return NextResponse.json({ ok: true, updated: res.count });
  } catch (e) {
    console.error("admin portfolio category PUT error", e);
    return NextResponse.json({ error: "Failed to rename category" }, { status: 500 });
  }
}

/** DELETE /api/admin/portfolio/category?category=... — remove a category and all its projects */
export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const category = String(new URL(req.url).searchParams.get("category") ?? "").trim();
    if (!category) return NextResponse.json({ error: "Category is required" }, { status: 400 });

    const res = await db.portfolioItem.deleteMany({ where: { category } });
    return NextResponse.json({ ok: true, deleted: res.count });
  } catch (e) {
    console.error("admin portfolio category DELETE error", e);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
