import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

/** GET /api/admin/session — check login state */
export async function GET() {
  return NextResponse.json({ authenticated: await isAdminRequest() });
}
