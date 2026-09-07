import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

/** POST /api/admin/clients/[id]/projects — add a project to a client */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const client = await db.client.findUnique({ where: { id } });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const b = await req.json().catch(() => ({}));
    const title = String(b.title ?? "").trim();
    const description = String(b.description ?? "").trim();
    const image = String(b.image ?? "").trim();
    if (!title) return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    if (!description) return NextResponse.json({ error: "Project description is required" }, { status: 400 });
    if (!image) return NextResponse.json({ error: "A project image is required" }, { status: 400 });

    const yearNum = Number(b.year);
    const sortOrder = Number.isFinite(Number(b.sortOrder))
      ? Number(b.sortOrder)
      : (await db.clientProject.count({ where: { clientId: id } })) + 1;

    const project = await db.clientProject.create({
      data: {
        title,
        description,
        image,
        year: Number.isFinite(yearNum) && yearNum > 1900 && yearNum < 2200 ? Math.round(yearNum) : null,
        sortOrder,
        clientId: id,
      },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (e) {
    console.error("admin client projects POST error", e);
    return NextResponse.json({ error: "Failed to add project" }, { status: 500 });
  }
}
