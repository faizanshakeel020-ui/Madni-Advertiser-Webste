import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { generateProductDescription } from "@/lib/describe";

/** POST /api/admin/generate-description — AI-write an SEO product description */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const b = await req.json().catch(() => ({}));
    const name = String(b.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Product name is required" }, { status: 400 });

    const type = b.type === "BUY_NOW" || b.type === "CUSTOM_ORDER" ? b.type : null;
    const price =
      typeof b.price === "number" && Number.isFinite(b.price) && b.price > 0 ? Math.round(b.price) : null;
    const variation = Number.isFinite(Number(b.variation)) ? Math.max(1, Math.min(20, Number(b.variation))) : 1;

    const result = await generateProductDescription({
      name,
      categoryId: b.categoryId ? String(b.categoryId) : null,
      subcategoryId: b.subcategoryId ? String(b.subcategoryId) : null,
      type,
      price,
      hints: b.hints ? String(b.hints) : null,
      variation,
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error("admin generate-description POST error", e);
    return NextResponse.json({ error: "Description generation failed" }, { status: 500 });
  }
}
