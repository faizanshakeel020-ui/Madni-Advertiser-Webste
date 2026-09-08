import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { slugify } from "@/lib/format";
import type { ServiceSub } from "@/lib/types";

function normalizeSubServices(raw: unknown): ServiceSub[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      const sub = s as { name?: unknown; description?: unknown; image?: unknown };
      return {
        name: String(sub.name ?? "").trim(),
        description: String(sub.description ?? "").trim(),
        image: String(sub.image ?? "").trim(),
      };
    })
    .filter((s) => s.name);
}

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((t) => String(t ?? "").trim()).filter(Boolean);
}

function parseJsonArray(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** PUT /api/admin/services/[id] — update a service pillar */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.service.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const b = await req.json().catch(() => ({}));
    const name = String(b.name ?? existing.name).trim();
    if (!name) return NextResponse.json({ error: "Service name is required" }, { status: 400 });

    // incoming arrays (form always sends them); fall back to the stored JSON
    const subServices = b.subServices !== undefined ? b.subServices : parseJsonArray(existing.subServices);
    const projectTags = b.projectTags !== undefined ? b.projectTags : parseJsonArray(existing.projectTags);

    // unique slug when it changed
    let slug = existing.slug;
    const wanted = slugify(String(b.slug ?? "").trim() || name);
    if (wanted && wanted !== existing.slug) {
      let n = 2;
      let candidate = wanted;
      while (await db.service.findFirst({ where: { slug: candidate, NOT: { id } } })) {
        candidate = `${wanted}-${n++}`;
      }
      slug = candidate;
    }

    const service = await db.service.update({
      where: { id },
      data: {
        name,
        slug,
        shortName: String(b.shortName ?? existing.shortName).trim() || name,
        tagline: String(b.tagline ?? existing.tagline).trim(),
        description: String(b.description ?? existing.description).trim(),
        hero: String(b.hero ?? existing.hero).trim(),
        icon: String(b.icon ?? existing.icon).trim() || "building",
        subServices: JSON.stringify(normalizeSubServices(subServices)),
        projectTags: JSON.stringify(normalizeTags(projectTags)),
        ...(Number.isFinite(Number(b.sortOrder)) ? { sortOrder: Number(b.sortOrder) } : {}),
      },
    });
    return NextResponse.json({ ...service, subServices: normalizeSubServices(subServices), projectTags: normalizeTags(projectTags) });
  } catch (e) {
    console.error("admin services PUT error", e);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

/** DELETE /api/admin/services/[id] — remove a service pillar */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.service.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Service not found" }, { status: 404 });
    await db.service.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin services DELETE error", e);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
