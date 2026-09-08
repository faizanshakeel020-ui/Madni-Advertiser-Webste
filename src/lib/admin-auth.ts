import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { Product as DbProduct } from "@prisma/client";

/** ---------- Password hashing (matches scripts/seed.ts) ---------- */
const ADMIN_SECRET = process.env.ADMIN_SECRET || "madni-admin-secret-2024";

export function hashPassword(username: string, password: string): string {
  return createHash("sha256").update(`${username}:${password}:${ADMIN_SECRET}`).digest("hex");
}

/** ---------- Session tokens (HMAC-signed expiry) ---------- */
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function sign(payload: string): string {
  return createHmac("sha256", ADMIN_SECRET).update(payload).digest("hex");
}

export function createSessionToken(): string {
  const exp = String(Date.now() + SESSION_TTL_MS);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  if (Number(exp) < Date.now()) return false;
  const expected = sign(exp);
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export const ADMIN_COOKIE = "madni_admin_session";

/** Check admin session from cookies */
export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

export async function setAdminCookie(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

/** ---------- Product row → client type ---------- */
export type MappedProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number | null;
  oldPrice: number | null;
  type: "BUY_NOW" | "CUSTOM_ORDER" | "BOTH";
  categoryId: string;
  subcategoryId: string | null;
  category?: { id: string; slug: string; name: string };
  images: string[];
  specs: { label: string; value: string }[];
  options: { label: string; values: string[] }[];
  badge: string | null;
  stock: number;
  featured: boolean;
  popularity: number;
  createdAt: string;
};

export function mapProduct(p: DbProduct & { category?: { id: string; slug: string; name: string } | null }): MappedProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: p.price,
    oldPrice: p.oldPrice,
    type: p.type,
    categoryId: p.categoryId,
    subcategoryId: p.subcategoryId ?? null,
    category: p.category ?? undefined,
    images: safeParse(p.images, []),
    specs: safeParse(p.specs, []),
    options: safeParse(p.options, []),
    badge: p.badge,
    stock: p.stock,
    featured: p.featured,
    popularity: p.popularity,
    createdAt: p.createdAt.toISOString(),
  };
}

function safeParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/** ---------- Order / quote number generators ---------- */
export function generateOrderNumber(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `MA-${n}`;
}

export function generateQuoteRef(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `Q-${n}`;
}
