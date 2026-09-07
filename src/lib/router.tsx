"use client";

/**
 * Lightweight History-API router — the whole site is served from the "/"
 * route (all other paths are rewritten to it) with real clean URLs:
 * /shop, /product/xyz, /casestudy/portfolio/acme, ...
 *
 * - navigate() uses history.pushState / replaceState (no page reload)
 * - popstate keeps browser Back/Forward buttons in sync
 * - legacy "#/shop" hash links are redirected to "/shop" on load
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type Route = {
  /** e.g. "/product/acrylic-sign" */
  path: string;
  /** path split into segments, e.g. ["product", "acrylic-sign"] */
  segments: string[];
  /** parsed query params */
  query: Record<string, string>;
};

function parsePath(raw: string): Route {
  let target = raw.startsWith("/") ? raw : `/${raw}`;
  // strip any embedded hash (e.g. "/shop#section")
  const [beforeHash] = target.split("#");
  const [pathPart, queryPart] = beforeHash.split("?");
  const path = pathPart.replace(/\/+$/, "") || "/";
  const query: Record<string, string> = {};
  if (queryPart) {
    for (const [k, v] of new URLSearchParams(queryPart).entries()) {
      query[k] = v;
    }
  }
  const segments = path.split("/").filter(Boolean);
  return { path, segments, query };
}

/** Current route from the browser location (pathname + search). */
function currentRoute(): Route {
  if (typeof window === "undefined") return parsePath("/");
  return parsePath(`${window.location.pathname}${window.location.search}`);
}

/**
 * Legacy hash support — old "#/shop" links are converted to "/shop".
 * Returns the effective route and normalizes the URL bar.
 */
function resolveInitialRoute(): Route {
  const hash = window.location.hash;
  if (hash.startsWith("#/")) {
    const legacy = parsePath(hash.replace(/^#/, ""));
    window.history.replaceState(null, "", `${legacy.path}${location.search || ""}`);
    return legacy;
  }
  return currentRoute();
}

type RouterCtx = {
  route: Route;
  navigate: (to: string, opts?: { replace?: boolean; keepScroll?: boolean }) => void;
};

const RouterContext = createContext<RouterCtx>({
  route: parsePath("/"),
  navigate: () => {},
});

export function RouterProvider({ children }: { children: React.ReactNode }) {
  // Start with "/" so SSR HTML and the first client render match (no hydration
  // mismatch); the real URL is applied in a layout effect before first paint.
  const [route, setRoute] = useState<Route>(() => parsePath("/"));
  const lastPath = useRef(route.path);

  // Sync to the real URL before the browser paints (no visible flash).
  // setState is intentional here: the route can only be read from window
  // after mount, and useLayoutEffect runs before paint.
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoute(resolveInitialRoute());
  }, []);

  // Back/Forward buttons
  useEffect(() => {
    const handler = () => setRoute(currentRoute());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // Reset scroll when the path changes
  useEffect(() => {
    if (route.path !== lastPath.current) {
      lastPath.current = route.path;
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [route.path]);

  const navigate = useCallback(
    (to: string, opts?: { replace?: boolean; keepScroll?: boolean }) => {
      const target = parsePath(to);
      const url = `${target.path}${to.includes("?") ? `?${to.split("?")[1]}` : ""}`;
      if (opts?.keepScroll) lastPath.current = route.path; // suppress scroll reset
      if (opts?.replace) {
        window.history.replaceState(null, "", url);
      } else {
        window.history.pushState(null, "", url);
      }
      setRoute(target);
    },
    [route.path]
  );

  const value = useMemo(() => ({ route, navigate }), [route, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRoute() {
  return useContext(RouterContext);
}

/** Build a URL with query params */
export function withQuery(path: string, query: Record<string, string | undefined | null>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
