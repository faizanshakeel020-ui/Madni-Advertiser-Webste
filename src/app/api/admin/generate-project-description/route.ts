import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { generateProjectDescription } from "@/lib/describe-project";

/** POST /api/admin/generate-project-description — AI-write a long SEO case-study description */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const b = await req.json().catch(() => ({}));
    const title = String(b.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "Project title is required" }, { status: 400 });

    // Resolve the client for keyword-rich context
    let clientName = String(b.clientName ?? "").trim();
    let clientIndustry: string | null = null;
    let otherProjectTitles: string[] = [];
    const clientId = b.clientId ? String(b.clientId) : null;
    if (clientId) {
      const client = await db.client.findUnique({
        where: { id: clientId },
        include: { projects: { select: { title: true }, orderBy: { sortOrder: "asc" } } },
      });
      if (client) {
        clientName = client.name;
        clientIndustry = client.industry;
        otherProjectTitles = client.projects.map((p) => p.title).filter((t) => t !== title);
      }
    }
    if (!clientName) return NextResponse.json({ error: "Client is required" }, { status: 400 });

    const year =
      typeof b.year === "number" && Number.isFinite(b.year) && b.year > 1900 ? Math.round(b.year) : null;
    const imageUrl = b.imageUrl ? String(b.imageUrl).trim() : null;
    const variation = Number.isFinite(Number(b.variation))
      ? Math.max(1, Math.min(20, Number(b.variation)))
      : 1;

    const result = await generateProjectDescription({
      clientName,
      clientIndustry,
      title,
      year,
      otherProjectTitles,
      hints: b.hints ? String(b.hints) : null,
      imageUrl: imageUrl ? new URL(imageUrl, req.url).toString() : null,
      variation,
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error("admin generate-project-description POST error", e);
    return NextResponse.json({ error: "Case study generation failed" }, { status: 500 });
  }
}
