import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";
import type { ServiceSub } from "@/lib/types";

/**
 * Sub-service CRUD, nested under a service — mirrors the client-projects API
 * (/api/admin/clients/[id]/projects). Sub-services live as a JSON array on the
 * Service row, so items are addressed by their index in that array.
 */

function parseSubs(json: string): ServiceSub[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? (arr as ServiceSub[]) : [];
  } catch {
    return [];
  }
}

function normalizeSub(raw: unknown): ServiceSub {
  const sub = (raw ?? {}) as { name?: unknown; description?: unknown; image?: unknown };
  return {
    name: String(sub.name ?? "").trim(),
    description: String(sub.description ?? "").trim(),
    image: String(sub.image ?? "").trim(),
  };
}

/** POST /api/admin/services/[id]/subservices — add a sub-service to the service */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const service = await db.service.findUnique({ where: { id } });
    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const b = await req.json().catch(() => ({}));
    const sub = normalizeSub(b);
    if (!sub.name) return NextResponse.json({ error: "Sub-service name is required" }, { status: 400 });

    const subs = parseSubs(service.subServices);
    subs.push(sub);
    await db.service.update({ where: { id }, data: { subServices: JSON.stringify(subs) } });
    return NextResponse.json({ ok: true, subServices: subs }, { status: 201 });
  } catch (e) {
    console.error("admin service sub-services POST error", e);
    return NextResponse.json({ error: "Failed to add sub-service" }, { status: 500 });
  }
}

/** PUT /api/admin/services/[id]/subservices — update a sub-service (body: { index, name, description, image }) */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const service = await db.service.findUnique({ where: { id } });
    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const b = await req.json().catch(() => ({}));
    const index = Number(b.index);
    const subs = parseSubs(service.subServices);
    if (!Number.isInteger(index) || index < 0 || index >= subs.length) {
      return NextResponse.json({ error: "Sub-service not found" }, { status: 404 });
    }

    const sub = normalizeSub(b);
    if (!sub.name) return NextResponse.json({ error: "Sub-service name is required" }, { status: 400 });

    subs[index] = sub;
    await db.service.update({ where: { id }, data: { subServices: JSON.stringify(subs) } });
    return NextResponse.json({ ok: true, subServices: subs });
  } catch (e) {
    console.error("admin service sub-services PUT error", e);
    return NextResponse.json({ error: "Failed to update sub-service" }, { status: 500 });
  }
}

/** DELETE /api/admin/services/[id]/subservices?index=n — remove a sub-service */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const service = await db.service.findUnique({ where: { id } });
    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const index = Number(new URL(req.url).searchParams.get("index"));
    const subs = parseSubs(service.subServices);
    if (!Number.isInteger(index) || index < 0 || index >= subs.length) {
      return NextResponse.json({ error: "Sub-service not found" }, { status: 404 });
    }

    subs.splice(index, 1);
    await db.service.update({ where: { id }, data: { subServices: JSON.stringify(subs) } });
    return NextResponse.json({ ok: true, subServices: subs });
  } catch (e) {
    console.error("admin service sub-services DELETE error", e);
    return NextResponse.json({ error: "Failed to delete sub-service" }, { status: 500 });
  }
}
