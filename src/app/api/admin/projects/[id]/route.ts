import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

/** PUT /api/admin/projects/[id] — update a client project */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const exists = await db.clientProject.findUnique({ where: { id } });
    if (!exists) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const b = await req.json().catch(() => ({}));
    const title = b.title !== undefined ? String(b.title).trim() : undefined;
    if (title === "") return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    const description = b.description !== undefined ? String(b.description).trim() : undefined;
    if (description === "") return NextResponse.json({ error: "Project description is required" }, { status: 400 });
    const image = b.image !== undefined ? String(b.image).trim() : undefined;
    if (image === "") return NextResponse.json({ error: "A project image is required" }, { status: 400 });

    const yearNum = Number(b.year);
    const project = await db.clientProject.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(b.year !== undefined && {
          year: Number.isFinite(yearNum) && yearNum > 1900 && yearNum < 2200 ? Math.round(yearNum) : null,
        }),
        ...(Number.isFinite(Number(b.sortOrder)) && { sortOrder: Number(b.sortOrder) }),
      },
    });
    return NextResponse.json(project);
  } catch (e) {
    console.error("admin projects PUT error", e);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

/** DELETE /api/admin/projects/[id] — delete a client project */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const exists = await db.clientProject.findUnique({ where: { id } });
    if (!exists) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    await db.clientProject.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin projects DELETE error", e);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
