import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/orders/[orderNumber] — public order status lookup for confirmation page */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const order = await db.order.findUnique({ where: { orderNumber } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      phone: order.phone,
      email: order.email,
      address: order.address,
      city: order.city,
      items: JSON.parse(order.items || "[]"),
      subtotal: order.subtotal,
      paymentMethod: order.paymentMethod,
      status: order.status,
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("order GET error", e);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}
