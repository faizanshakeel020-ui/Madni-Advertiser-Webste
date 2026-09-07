import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

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
