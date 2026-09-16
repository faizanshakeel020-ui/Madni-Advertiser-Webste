import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

/** DELETE /api/admin/orders — permanently delete multiple orders */
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
      return NextResponse.json({ error: "Provide between 1 and 100 order IDs" }, { status: 400 });
    }

    const result = await db.order.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ ok: true, deleted: result.count });
  } catch (e) {
    console.error("admin orders bulk DELETE error", e);
    return NextResponse.json({ error: "Bulk delete failed" }, { status: 500 });
  }
}

/** GET /api/admin/orders — all orders, newest first */
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const orders = await db.order.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(
      orders.map((o) => ({
        ...o,
        items: JSON.parse(o.items || "[]"),
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      }))
    );
  } catch (e) {
    console.error("admin orders GET error", e);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
