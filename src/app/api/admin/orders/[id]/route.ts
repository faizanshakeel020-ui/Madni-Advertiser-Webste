import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

const VALID = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

/** PATCH /api/admin/orders/[id] — update status */
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
    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    await db.order.update({ where: { id }, data: { status: status as (typeof VALID)[number] } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin orders PATCH error", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/** DELETE /api/admin/orders/[id] — permanently delete an order */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const existing = await db.order.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    await db.order.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin orders DELETE error", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
