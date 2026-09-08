import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { categorizeProduct } from "@/lib/categorize";

/** POST /api/admin/categorize — auto-detect category/subcategory for a product */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const b = await req.json().catch(() => ({}));
    const name = String(b.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const result = await categorizeProduct(name, b.description ? String(b.description) : undefined);
    if (!result) {
      return NextResponse.json({ error: "Could not detect a category" }, { status: 422 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("admin categorize POST error", e);
    return NextResponse.json({ error: "Categorization failed" }, { status: 500 });
  }
}
