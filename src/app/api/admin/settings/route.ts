import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { clearAdminCookie, hashPassword, isAdminRequest } from "@/lib/admin-auth";
import { SITE } from "@/lib/constants";

const DEFAULT_SETTINGS = {
  business: { phone: "+92 300 4572300", email: "madniad786@gmail.com", address: "Imtiaz Center, Main Market, Gulberg II, Lahore, Pakistan", hours: "Mon - Sat: 10:00 AM - 9:00 PM" },
  social: { facebook: "https://www.facebook.com/share/19BFHfpMDt/", instagram: "https://www.instagram.com/madniadvertiser1999/" },
  quote: { enabled: true, responseMessage: "Our team will contact you within a few hours." },
  orders: { codEnabled: true, bankTransferEnabled: true, deliveryCharge: 0, minimumOrder: 0 },
  homepage: { heroTitle: "Signs That Make Your Business Shine", promotion: "" },
  notifications: { email: "madniad786@gmail.com", whatsapp: true, newOrders: true, newQuotes: true },
  seo: { title: "Madni Advertiser - Signage & Display Advertising", description: "Custom signage, LED displays and advertising solutions across Pakistan." },
  about: { heroTitle: "The sign-makers behind Pakistan's brightest brands", heroText: `Established in ${SITE.establishedYear}, Madni Advertiser has designed, fabricated and installed signage that helps businesses get noticed for over ${SITE.stats.years} years.`, storyTitle: `Serving businesses since ${SITE.establishedYear}`, storyText: `Madni Advertiser was established in Lahore in ${SITE.establishedYear} with a simple belief: every business deserves a sign it is proud of.`, mission: "Make signs that make businesses shine — and keep them shining with honest after-sales service.", images: ["/images/about-workshop.png", "/images/about-team.png"] },
};

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await db.adminUser.findFirst({ select: { username: true, settings: true } });
  if (!admin) return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
  return NextResponse.json({ username: admin.username, settings: { ...DEFAULT_SETTINGS, ...(admin.settings as object) } });
}

/** PATCH /api/admin/settings — change admin username and/or password */
export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      currentPassword?: string;
      username?: string;
      password?: string;
      settings?: Record<string, unknown>;
    };
    const currentPassword = body.currentPassword?.trim() ?? "";
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";

    if (!username && !password && !body.settings) {
      return NextResponse.json({ error: "Enter a new username or password" }, { status: 400 });
    }

    const changingCredentials = Boolean(username || password);
    if (changingCredentials && !currentPassword) {
      return NextResponse.json({ error: "Current password is required to change admin credentials" }, { status: 400 });
    }

    if (username && !/^[a-zA-Z0-9_.-]{3,50}$/.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3-50 characters and use only letters, numbers, _, ., or -" },
        { status: 400 }
      );
    }

    if (password && password.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    const admin = await db.adminUser.findFirst();
    if (!admin) {
      return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
    }
    if (changingCredentials && hashPassword(admin.username, currentPassword) !== admin.passwordHash) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const nextUsername = username || admin.username;
    const nextSettings = body.settings
      ? { ...(admin.settings as object), ...body.settings }
      : admin.settings;

    try {
      await db.adminUser.update({
        where: { id: admin.id },
        data: {
          ...(changingCredentials ? { username: nextUsername, passwordHash: hashPassword(nextUsername, password || currentPassword) } : {}),
          ...(body.settings ? { settings: nextSettings as Prisma.InputJsonValue } : {}),
        },
      });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        return NextResponse.json({ error: "That username is already in use" }, { status: 409 });
      }
      throw error;
    }

    if (changingCredentials) await clearAdminCookie();
    return NextResponse.json({ ok: true, username: nextUsername });
  } catch (error) {
    console.error("admin settings error", error);
    return NextResponse.json({ error: "Failed to update admin settings" }, { status: 500 });
  }
}
