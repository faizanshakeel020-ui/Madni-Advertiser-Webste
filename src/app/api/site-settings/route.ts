import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const fallbackLinks = [
  { platform: "Facebook", url: "https://www.facebook.com/share/19BFHfpMDt/" },
  { platform: "Instagram", url: "https://www.instagram.com/madniadvertiser1999/" },
];
const fallbackAbout = {
  heroTitle: "The sign-makers behind Pakistan's brightest brands",
  heroText: "For over 12 years, Madni Advertiser has designed, fabricated and installed signage that helps businesses get noticed.",
  storyTitle: "Started with one flex printer. Still obsessed with craft.",
  storyText: "Madni Advertiser began in Lahore as a small printing setup with a simple belief: every business deserves a sign it is proud of.",
  mission: "Make signs that make businesses shine — and keep them shining with honest after-sales service.",
  images: ["/images/about-workshop.png", "/images/about-team.png"],
};

export async function GET() {
  const admin = await db.adminUser.findFirst({ select: { settings: true } });
  const settings = (admin?.settings ?? {}) as { social?: { links?: { platform: string; url: string }[]; facebook?: string; instagram?: string }; about?: typeof fallbackAbout };
  const stored = settings.social;
  const links = stored?.links ?? [
    ...(stored?.facebook ? [{ platform: "Facebook", url: stored.facebook }] : []),
    ...(stored?.instagram ? [{ platform: "Instagram", url: stored.instagram }] : []),
  ];

  return NextResponse.json({ social: { links: links.length ? links : fallbackLinks }, about: { ...fallbackAbout, ...settings.about } });
}
