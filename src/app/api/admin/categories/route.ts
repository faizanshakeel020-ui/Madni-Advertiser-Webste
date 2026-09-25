import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { slugify } from "@/lib/format";

/** POST /api/admin/categories — create a shop category */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const slug = slugify(String(body.slug ?? "") || name);
    if (!name || !slug) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const category = await db.category.create({
      data: {
        name,
        slug,
        description: body.description ? String(body.description).trim() : null,
        image: body.image ? String(body.image).trim() : null,
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
      },
    });
    return NextResponse.json({ ...category, productCount: 0, subcategories: [] }, { status: 201 });
  } catch (e) {
    console.error("admin categories POST error", e);
    return NextResponse.json({ error: "Could not create category; its slug may already be in use" }, { status: 400 });
  }
}
