import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SERVICES } from "@/lib/services-data";
import type { ServicePillar, ServiceSub } from "@/lib/types";

function safeParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/** Map a DB row to the public ServicePillar shape. */
function mapService(s: {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  hero: string;
  icon: string;
  subServices: string;
  projectTags: string;
  sortOrder: number;
}): ServicePillar {
  return {
    slug: s.slug,
    name: s.name,
    shortName: s.shortName || s.name,
    tagline: s.tagline,
    description: s.description,
    hero: s.hero,
    icon: s.icon,
    subServices: safeParse<ServiceSub[]>(s.subServices, []).filter((sub) => sub.name?.trim()),
    projectTags: safeParse<string[]>(s.projectTags, []).filter(Boolean),
  };
}

/**
 * Seed the Service table from the static site content on first use,
 * so the site keeps working before anything is edited in the admin panel.
 */
async function ensureSeeded() {
  const count = await db.service.count();
  if (count > 0) return;
  await db.service.createMany({
    data: SERVICES.map((s, i) => ({
      slug: s.slug,
      name: s.name,
      shortName: s.shortName,
      tagline: s.tagline,
      description: s.description,
      hero: s.hero,
      icon: s.icon,
      subServices: JSON.stringify(s.subServices),
      projectTags: JSON.stringify(s.projectTags),
      sortOrder: i + 1,
    })),
  });
}

/** GET /api/services — public list of service pillars */
export async function GET() {
  try {
    await ensureSeeded();
    const rows = await db.service.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    return NextResponse.json(rows.map(mapService));
  } catch (e) {
    console.error("services GET error", e);
    // fall back to static content so the site never breaks
    return NextResponse.json(SERVICES);
  }
}
