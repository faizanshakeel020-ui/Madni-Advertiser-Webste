import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/admin-auth";

/** POST /api/admin/logout */
export async function POST() {
  await clearAdminCookie();
  return NextResponse.json({ ok: true });
}
