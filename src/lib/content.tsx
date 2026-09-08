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
import type { PortfolioProject, ServicePillar } from "./types";

type ContentState = {
  services: ServicePillar[];
  portfolio: PortfolioProject[];
  /** ["All", ...unique categories in display order] */
  portfolioCategories: string[];
  ready: boolean;
  refresh: () => Promise<void>;
};

const ContentContext = createContext<ContentState>({
  services: SERVICES,
  portfolio: PORTFOLIO,
  portfolioCategories: ["All"],
  ready: false,
  refresh: async () => {},
});

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<ServicePillar[]>(SERVICES);
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>(PORTFOLIO);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        fetch("/api/services").then((r) => r.json()).catch(() => null),
        fetch("/api/portfolio").then((r) => r.json()).catch(() => null),
      ]);
      if (Array.isArray(sRes) && sRes.length > 0) setServices(sRes as ServicePillar[]);
      if (Array.isArray(pRes)) setPortfolio(pRes as PortfolioProject[]);
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
    <ContentContext.Provider value={{ services, portfolio, portfolioCategories, ready, refresh }}>
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
