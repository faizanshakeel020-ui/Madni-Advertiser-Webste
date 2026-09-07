"use client";

/**
 * Lightweight hash-based router — the whole site runs on the "/" route
 * with client-side hash navigation (#/shop, #/product/xyz, ...).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

function parseHash(hash: string): Route {
  let raw = hash.replace(/^#/, "");
  if (!raw.startsWith("/")) raw = "/" + raw;
  const [pathPart, queryPart] = raw.split("?");
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

type RouterCtx = {
  route: Route;
  navigate: (to: string, opts?: { replace?: boolean; keepScroll?: boolean }) => void;
};

const RouterContext = createContext<RouterCtx>({
  route: parseHash("/"),
  navigate: () => {},
});

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<Route>(() =>
    parseHash(typeof window === "undefined" ? "/" : window.location.hash)
  );
  const lastPath = useRef(route.path);

  useEffect(() => {
    const handler = () => {
      setRoute(parseHash(window.location.hash));
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  useEffect(() => {
    if (route.path !== lastPath.current) {
      lastPath.current = route.path;
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [route.path]);

  const navigate = useCallback(
    (to: string, opts?: { replace?: boolean; keepScroll?: boolean }) => {
      const target = to.startsWith("/") ? to : `/${to}`;
      const url = `#${target}`;
      if (opts?.replace) {
        window.history.replaceState(null, "", url);
        setRoute(parseHash(url));
      } else {
        if (opts?.keepScroll) lastPath.current = route.path; // suppress scroll reset
        window.location.hash = target;
        if (parseHash(window.location.hash).path === route.path && window.location.hash === url) {
          setRoute(parseHash(url));
        }
      }
    },
    [route.path]
  );

  const value = useMemo(() => ({ route, navigate }), [route, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRoute() {
  return useContext(RouterContext);
}

/** Build a URL with query params for hash navigation */
export function withQuery(path: string, query: Record<string, string | undefined | null>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
