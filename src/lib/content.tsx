"use client";

/**
 * Site content store — services and client project content.
 *
 * Starts from the static bundled content (SSR-safe, zero flash), then loads
 * the live database content via the public content APIs. Admin edits
 * call refresh() and every part of the site updates instantly.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PORTFOLIO, SERVICES } from "./services-data";
import { SITE } from "./constants";
import { fetchClients } from "./api";
import type { Client, PortfolioProject, ServicePillar } from "./types";

type ContentState = {
  services: ServicePillar[];
  portfolio: PortfolioProject[];
  clients: Client[];
  about: { heroTitle: string; heroText: string; storyTitle: string; storyText: string; mission: string; images: string[] };
  socialLinks: { platform: string; url: string }[];
  /** ["All", ...unique categories in display order] */
  portfolioCategories: string[];
  ready: boolean;
  refresh: () => Promise<void>;
};

const DEFAULT_ABOUT: ContentState["about"] = {
  heroTitle: "The sign-makers behind Pakistan's brightest brands",
  heroText: `Established in ${SITE.establishedYear}, Madni Advertiser has designed, fabricated and installed signage that helps businesses get noticed for over ${SITE.stats.years} years.`,
  storyTitle: `Serving businesses since ${SITE.establishedYear}`,
  storyText: `Madni Advertiser was established in Lahore in ${SITE.establishedYear} with a simple belief: every business deserves a sign it is proud of.`,
  mission: "Make signs that make businesses shine — and keep them shining with honest after-sales service.",
  images: ["/images/about-workshop.png", "/images/about-team.png"],
};

const ContentContext = createContext<ContentState>({
  services: SERVICES,
  portfolio: [],
  clients: [],
  about: DEFAULT_ABOUT,
  socialLinks: [{ platform: "Facebook", url: SITE.social.facebook }, { platform: "Instagram", url: SITE.social.instagram }],
  portfolioCategories: ["All"],
  ready: false,
  refresh: async () => {},
});

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<ServicePillar[]>(SERVICES);
  const portfolio: PortfolioProject[] = [];
  const [clients, setClients] = useState<Client[]>([]);
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([
    { platform: "Facebook", url: SITE.social.facebook },
    { platform: "Instagram", url: SITE.social.instagram },
  ]);
  const [about, setAbout] = useState<ContentState["about"]>(DEFAULT_ABOUT);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [sRes, settingsRes, clientRes] = await Promise.all([
        fetch("/api/services").then((r) => r.json()).catch(() => null),
        fetch("/api/site-settings").then((r) => r.json()).catch(() => null),
        fetchClients().catch(() => null),
      ]);
      if (Array.isArray(sRes) && sRes.length > 0) setServices(sRes as ServicePillar[]);
      if (Array.isArray(clientRes)) setClients(clientRes);
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
    () => [
      "All",
      ...Array.from(new Set([
        ...PORTFOLIO.map((project) => project.category),
        ...clients.flatMap((client) =>
          client.projects.flatMap((project) => project.portfolioCategories ?? [])
        ),
      ].filter(Boolean))),
    ],
    [clients]
  );

  return (
    <ContentContext.Provider value={{ services, portfolio, clients, socialLinks, about, portfolioCategories, ready, refresh }}>
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
