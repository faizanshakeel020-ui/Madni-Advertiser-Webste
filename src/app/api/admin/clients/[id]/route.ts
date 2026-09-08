import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import { slugify } from "@/lib/format";

/** PUT /api/admin/clients/[id] — update a client */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const exists = await db.client.findUnique({ where: { id } });
    if (!exists) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const b = await req.json().catch(() => ({}));
    const name = b.name !== undefined ? String(b.name).trim() : undefined;
    if (name === "") return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    const logo = b.logo !== undefined ? String(b.logo).trim() : undefined;
    if (logo === "") return NextResponse.json({ error: "A logo image is required" }, { status: 400 });

    // slug: explicit, or keep existing, or derive from the new name
    let slug: string | undefined;
    if (b.slug !== undefined || (name && name !== exists.name)) {
      const base = slugify(
        (b.slug !== undefined ? String(b.slug) : "").trim() ||
          (name !== undefined ? name : exists.name)
      );
      // ensure uniqueness (excluding this client)
      let candidate = base || exists.slug;
      let n = 2;
      while (
        await db.client.findFirst({ where: { slug: candidate, NOT: { id } } })
      ) {
        candidate = `${base}-${n++}`;
      }
      slug = candidate;
    }

    const client = await db.client.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(logo !== undefined && { logo }),
        ...(b.industry !== undefined && { industry: String(b.industry).trim() || null }),
        ...(Number.isFinite(Number(b.sortOrder)) && { sortOrder: Number(b.sortOrder) }),
      },
    });
    return NextResponse.json(client);
  } catch (e) {
    console.error("admin clients PUT error", e);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

/** DELETE /api/admin/clients/[id] — delete a client (projects cascade) */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const exists = await db.client.findUnique({ where: { id } });
    if (!exists) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    await db.client.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin clients DELETE error", e);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
