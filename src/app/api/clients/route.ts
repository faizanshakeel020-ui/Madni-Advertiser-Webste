import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/clients — clients (with their projects) for the homepage Our Clients section */
export async function GET() {
  try {
    const clients = await db.client.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        projects: { orderBy: { sortOrder: "asc" } },
      },
    });
    return NextResponse.json(
      clients.map((c) => ({
        id: c.id,
        name: c.name,
        logo: c.logo,
        industry: c.industry,
        sortOrder: c.sortOrder,
        projects: c.projects.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          image: p.image,
          year: p.year,
          sortOrder: p.sortOrder,
        })),
      }))
    );
  } catch (e) {
    console.error("clients GET error", e);
    return NextResponse.json({ error: "Failed to load clients" }, { status: 500 });
  }
}
