import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

/** GET /api/admin/stats — dashboard numbers */
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [products, orders, pendingOrders, quotes, newQuotes, deliveredAgg] =
      await Promise.all([
        db.product.count(),
        db.order.count(),
        db.order.count({ where: { status: "PENDING" } }),
        db.quoteRequest.count(),
        db.quoteRequest.count({ where: { status: "NEW" } }),
        db.order.aggregate({
          where: { status: { not: "CANCELLED" } },
          _sum: { subtotal: true },
        }),
      ]);
    return NextResponse.json({
      products,
      orders,
      pendingOrders,
      quotes,
      newQuotes,
      revenue: deliveredAgg._sum.subtotal ?? 0,
    });
  } catch (e) {
    console.error("admin stats error", e);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
