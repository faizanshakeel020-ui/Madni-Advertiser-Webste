import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, setAdminCookie } from "@/lib/admin-auth";

/** POST /api/admin/login */
export async function POST(req: NextRequest) {
  try {
    const { username, password } = (await req.json()) as {
      username?: string;
      password?: string;
    };
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    const admin = await db.adminUser.findUnique({ where: { username } });
    if (!admin) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }
    const hash = hashPassword(username, password);
    if (hash !== admin.passwordHash) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    await setAdminCookie();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin login error", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
