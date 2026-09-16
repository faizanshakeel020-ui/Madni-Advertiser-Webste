import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

/** DELETE /api/admin/quotes — permanently delete multiple quote requests */
export async function DELETE(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { ids?: unknown };
    const ids = Array.isArray(body.ids) && body.ids.every((id): id is string => typeof id === "string")
      ? [...new Set(body.ids)]
      : [];
    if (ids.length === 0 || ids.length > 100) {
      return NextResponse.json({ error: "Provide between 1 and 100 quote IDs" }, { status: 400 });
    }

    const result = await db.quoteRequest.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ ok: true, deleted: result.count });
  } catch (e) {
    console.error("admin quotes bulk DELETE error", e);
    return NextResponse.json({ error: "Bulk delete failed" }, { status: 500 });
  }
}

/** GET /api/admin/quotes — all quote requests, newest first */
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const quotes = await db.quoteRequest.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(
      quotes.map((q) => ({
        ...q,
        createdAt: q.createdAt.toISOString(),
        updatedAt: q.updatedAt.toISOString(),
      }))
    );
  } catch (e) {
    console.error("admin quotes GET error", e);
    return NextResponse.json({ error: "Failed to load quotes" }, { status: 500 });
  }
}
