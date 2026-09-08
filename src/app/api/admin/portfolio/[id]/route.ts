import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

/** PUT /api/admin/portfolio/[id] — update a portfolio gallery item */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.portfolioItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Portfolio item not found" }, { status: 404 });

    const b = await req.json().catch(() => ({}));
    const title = String(b.title ?? existing.title).trim();
    if (!title) return NextResponse.json({ error: "Project title is required" }, { status: 400 });

    const item = await db.portfolioItem.update({
      where: { id },
      data: {
        title,
        client: String(b.client ?? existing.client).trim(),
        city: String(b.city ?? existing.city).trim(),
        category: String(b.category ?? existing.category).trim() || "Other",
        image: String(b.image ?? existing.image).trim(),
        description: String(b.description ?? existing.description).trim(),
        ...(Number.isFinite(Number(b.sortOrder)) ? { sortOrder: Number(b.sortOrder) } : {}),
      },
    });
    return NextResponse.json(item);
  } catch (e) {
    console.error("admin portfolio PUT error", e);
    return NextResponse.json({ error: "Failed to update portfolio item" }, { status: 500 });
  }
}

/** DELETE /api/admin/portfolio/[id] — remove a portfolio gallery item */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.portfolioItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Portfolio item not found" }, { status: 404 });
    await db.portfolioItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin portfolio DELETE error", e);
    return NextResponse.json({ error: "Failed to delete portfolio item" }, { status: 500 });
  }
}
