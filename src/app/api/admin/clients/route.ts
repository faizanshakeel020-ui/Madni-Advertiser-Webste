import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { slugify } from "@/lib/format";
import { parseImages } from "@/lib/images";

/** Find a unique slug for a client ("cafe-mocha", "cafe-mocha-2", ...). */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base || "client";
  let n = 2;
  while (
    await db.client.findFirst({ where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) } })
  ) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

/** GET /api/admin/clients — list with project counts */
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const clients = await db.client.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { projects: true } },
        projects: { orderBy: { sortOrder: "asc" } },
      },
    });
    return NextResponse.json(
      clients.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        logo: c.logo,
        industry: c.industry,
        sortOrder: c.sortOrder,
        projectCount: c._count.projects,
        projects: c.projects.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          images: parseImages(p.images),
          year: p.year,
          sortOrder: p.sortOrder,
        })),
      }))
    );
  } catch (e) {
    console.error("admin clients GET error", e);
    return NextResponse.json({ error: "Failed to load clients" }, { status: 500 });
  }
}

/** POST /api/admin/clients — create a client */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const b = await req.json().catch(() => ({}));
    const name = String(b.name ?? "").trim();
    const logo = String(b.logo ?? "").trim();
    if (!name) return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    if (!logo) return NextResponse.json({ error: "A logo image is required" }, { status: 400 });

    const sortOrder = Number.isFinite(Number(b.sortOrder))
      ? Number(b.sortOrder)
      : (await db.client.count()) + 1;

    const slug = await uniqueSlug(
      slugify(String(b.slug ?? "").trim() || name)
    );

    const client = await db.client.create({
      data: {
        name,
        slug,
        logo,
        industry: b.industry ? String(b.industry).trim() : null,
        sortOrder,
      },
    });
    return NextResponse.json(client, { status: 201 });
  } catch (e) {
    console.error("admin clients POST error", e);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
