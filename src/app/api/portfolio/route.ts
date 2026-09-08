import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PORTFOLIO } from "@/lib/services-data";
import type { PortfolioProject } from "@/lib/types";

/**
 * Seed the PortfolioItem table from the static site content on first use,
 * so the site keeps working before anything is edited in the admin panel.
 */
async function ensureSeeded() {
  const count = await db.portfolioItem.count();
  if (count > 0) return;
  await db.portfolioItem.createMany({
    data: PORTFOLIO.map((p, i) => ({
      title: p.title,
      client: p.client,
      city: p.city,
      category: p.category,
      image: p.image,
      description: p.description,
      sortOrder: i + 1,
    })),
  });
}

/** GET /api/portfolio — public portfolio gallery items */
export async function GET() {
  try {
    await ensureSeeded();
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
      }))
    );
  } catch (e) {
    console.error("portfolio GET error", e);
    // fall back to static content so the site never breaks
    return NextResponse.json(PORTFOLIO);
  }
}
