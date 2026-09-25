import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SITE } from "@/lib/constants";

const fallbackLinks = [
  { platform: "Facebook", url: "https://www.facebook.com/share/19BFHfpMDt/" },
  { platform: "Instagram", url: "https://www.instagram.com/madniadvertiser1999/" },
];
const fallbackAbout = {
  heroTitle: "The sign-makers behind Pakistan's brightest brands",
  heroText: `Established in ${SITE.establishedYear}, Madni Advertiser has designed, fabricated and installed signage that helps businesses get noticed for over ${SITE.stats.years} years.`,
  storyTitle: `Serving businesses since ${SITE.establishedYear}`,
  storyText: `Madni Advertiser was established in Lahore in ${SITE.establishedYear} with a simple belief: every business deserves a sign it is proud of.`,
  mission: "Make signs that make businesses shine — and keep them shining with honest after-sales service.",
  images: ["/images/about-workshop.png", "/images/about-team.png"],
};

export async function GET() {
  try {
    const admin = await db.adminUser.findFirst({ select: { settings: true } });
    const settings = (admin?.settings ?? {}) as { social?: { links?: { platform: string; url: string }[]; facebook?: string; instagram?: string }; about?: typeof fallbackAbout };
    const stored = settings.social;
    const links = stored?.links ?? [
      ...(stored?.facebook ? [{ platform: "Facebook", url: stored.facebook }] : []),
      ...(stored?.instagram ? [{ platform: "Instagram", url: stored.instagram }] : []),
    ];

    const about = { ...fallbackAbout, ...settings.about };
    if (about.heroText.includes("12 years")) about.heroText = fallbackAbout.heroText;
    if (about.storyTitle === "Started with one flex printer. Still obsessed with craft.") {
      about.storyTitle = fallbackAbout.storyTitle;
    }
    if (about.storyText === "Madni Advertiser began in Lahore as a small printing setup with a simple belief: every business deserves a sign it is proud of.") {
      about.storyText = fallbackAbout.storyText;
    }
    return NextResponse.json({ social: { links: links.length ? links : fallbackLinks }, about });
  } catch (e) {
    console.error("site-settings GET error", e);
    return NextResponse.json({ social: { links: fallbackLinks }, about: fallbackAbout });
  }
}
