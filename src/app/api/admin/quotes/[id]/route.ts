import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

const VALID = ["NEW", "CONTACTED", "QUOTED", "CLOSED"];

/** PATCH /api/admin/quotes/[id] — update status */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const { status } = (await req.json()) as { status?: string };
    if (!status || !VALID.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const existing = await db.quoteRequest.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

    await db.quoteRequest.update({ where: { id }, data: { status: status as (typeof VALID)[number] } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin quotes PATCH error", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
