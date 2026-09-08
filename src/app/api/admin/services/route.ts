import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { slugify } from "@/lib/format";
import type { ServiceSub } from "@/lib/types";

export type AdminServicePayload = {
  id?: string;
  name: string;
  slug?: string;
  shortName?: string;
  tagline?: string;
  description?: string;
  hero?: string;
  icon?: string;
  subServices?: ServiceSub[];
  projectTags?: string[];
  sortOrder?: number;
};

function safeParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/** Find a unique slug for a service ("outdoor", "outdoor-2", ...). */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base || "service";
  let n = 2;
  while (
    await db.service.findFirst({ where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) } })
  ) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

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

/** GET /api/admin/services — full list for the admin panel */
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const rows = await db.service.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    return NextResponse.json(
      rows.map((s) => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        shortName: s.shortName,
        tagline: s.tagline,
        description: s.description,
        hero: s.hero,
        icon: s.icon,
        subServices: safeParse<ServiceSub[]>(s.subServices, []),
        projectTags: safeParse<string[]>(s.projectTags, []),
        sortOrder: s.sortOrder,
      }))
    );
  } catch (e) {
    console.error("admin services GET error", e);
    return NextResponse.json({ error: "Failed to load services" }, { status: 500 });
  }
}

/** POST /api/admin/services — create a service pillar */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const b = (await req.json().catch(() => ({}))) as AdminServicePayload;
    const name = String(b.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Service name is required" }, { status: 400 });

    const slug = await uniqueSlug(slugify(String(b.slug ?? "").trim() || name));
    const sortOrder = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : (await db.service.count()) + 1;

    const service = await db.service.create({
      data: {
        name,
        slug,
        shortName: String(b.shortName ?? "").trim() || name,
        tagline: String(b.tagline ?? "").trim(),
        description: String(b.description ?? "").trim(),
        hero: String(b.hero ?? "").trim(),
        icon: String(b.icon ?? "building").trim() || "building",
        subServices: JSON.stringify(normalizeSubServices(b.subServices)),
        projectTags: JSON.stringify(normalizeTags(b.projectTags)),
        sortOrder,
      },
    });
    return NextResponse.json(
      { ...service, subServices: normalizeSubServices(b.subServices), projectTags: normalizeTags(b.projectTags) },
      { status: 201 }
    );
  } catch (e) {
    console.error("admin services POST error", e);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}
