import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

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
