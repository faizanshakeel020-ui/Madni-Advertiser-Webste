"use client";

/**
 * Site content store — services + portfolio.
 *
 * Starts from the static bundled content (SSR-safe, zero flash), then loads
 * the live database content via /api/services + /api/portfolio. Admin edits
 * call refresh() and every part of the site updates instantly.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PORTFOLIO, SERVICES } from "./services-data";
import { SITE } from "./constants";
import type { PortfolioProject, ServicePillar } from "./types";

type ContentState = {
  services: ServicePillar[];
  portfolio: PortfolioProject[];
  about: { heroTitle: string; heroText: string; storyTitle: string; storyText: string; mission: string; images: string[] };
  socialLinks: { platform: string; url: string }[];
  /** ["All", ...unique categories in display order] */
  portfolioCategories: string[];
  ready: boolean;
  refresh: () => Promise<void>;
};

const DEFAULT_ABOUT: ContentState["about"] = {
  heroTitle: "The sign-makers behind Pakistan's brightest brands",
  heroText: "For over 12 years, Madni Advertiser has designed, fabricated and installed signage that helps businesses get noticed.",
  storyTitle: "Started with one flex printer. Still obsessed with craft.",
  storyText: "Madni Advertiser began in Lahore as a small printing setup with a simple belief: every business deserves a sign it is proud of.",
  mission: "Make signs that make businesses shine — and keep them shining with honest after-sales service.",
  images: ["/images/about-workshop.png", "/images/about-team.png"],
};

const ContentContext = createContext<ContentState>({
  services: SERVICES,
  portfolio: PORTFOLIO,
  about: DEFAULT_ABOUT,
  socialLinks: [{ platform: "Facebook", url: SITE.social.facebook }, { platform: "Instagram", url: SITE.social.instagram }],
  portfolioCategories: ["All"],
  ready: false,
  refresh: async () => {},
});

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<ServicePillar[]>(SERVICES);
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>(PORTFOLIO);
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([
    { platform: "Facebook", url: SITE.social.facebook },
    { platform: "Instagram", url: SITE.social.instagram },
  ]);
  const [about, setAbout] = useState<ContentState["about"]>(DEFAULT_ABOUT);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [sRes, pRes, settingsRes] = await Promise.all([
        fetch("/api/services").then((r) => r.json()).catch(() => null),
        fetch("/api/portfolio").then((r) => r.json()).catch(() => null),
        fetch("/api/site-settings").then((r) => r.json()).catch(() => null),
      ]);
      if (Array.isArray(sRes) && sRes.length > 0) setServices(sRes as ServicePillar[]);
      if (Array.isArray(pRes)) setPortfolio(pRes as PortfolioProject[]);
      if (Array.isArray((settingsRes as { social?: { links?: { platform: string; url: string }[] } } | null)?.social?.links)) {
        setSocialLinks((settingsRes as { social: { links: { platform: string; url: string }[] } }).social.links);
      }
      const aboutSettings = (settingsRes as { about?: ContentState["about"] } | null)?.about;
      if (aboutSettings) setAbout(aboutSettings);
    } catch {
      // keep the current content — the static fallback already rendered
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const portfolioCategories = useMemo(
    () => ["All", ...Array.from(new Set(portfolio.map((p) => p.category).filter(Boolean)))],
    [portfolio]
  );

  return (
    <ContentContext.Provider value={{ services, portfolio, socialLinks, about, portfolioCategories, ready, refresh }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  return useContext(ContentContext);
}

/** Find a service by slug from the live content. */
export function useService(slug: string): ServicePillar | undefined {
  const { services } = useContent();
  return services.find((s) => s.slug === slug);
}
