import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

/** GET /api/admin/portfolio — full list for the admin panel */
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const rows = await db.portfolioItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(
      rows.map((p) => ({
        id: p.id,
        title: p.title,
        client: p.client,
        city: p.city,
        category: p.category,
        image: p.image,
        description: p.description,
        sortOrder: p.sortOrder,
      }))
    );
  } catch (e) {
    console.error("admin portfolio GET error", e);
    return NextResponse.json({ error: "Failed to load portfolio items" }, { status: 500 });
  }
}

/** POST /api/admin/portfolio — create a portfolio gallery item */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const b = await req.json().catch(() => ({}));
    const title = String(b.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    const image = String(b.image ?? "").trim();
    if (!image) return NextResponse.json({ error: "A project image is required" }, { status: 400 });

    const sortOrder = Number.isFinite(Number(b.sortOrder))
      ? Number(b.sortOrder)
      : (await db.portfolioItem.count()) + 1;

    const item = await db.portfolioItem.create({
      data: {
        title,
        client: String(b.client ?? "").trim(),
        city: String(b.city ?? "").trim(),
        category: String(b.category ?? "").trim() || "Other",
        image,
        description: String(b.description ?? "").trim(),
        sortOrder,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("admin portfolio POST error", e);
    return NextResponse.json({ error: "Failed to create portfolio item" }, { status: 500 });
  }
}
