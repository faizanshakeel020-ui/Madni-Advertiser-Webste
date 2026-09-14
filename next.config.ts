import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async rewrites() {
    return {
      // Fallback phase: AFTER all real routes (pages, /api/*, public files,
      // dynamic routes) and BEFORE the 404 — so any clean URL the SPA knows
      // (/shop, /portfolio, /casestudy/portfolio/acme, ...) is served by the
      // single "/" page, while /api/* and static assets are untouched.
      fallback: [
        {
          source: "/:path*",
          destination: "/",
        },
      ],
    };
  },
};

export default nextConfig;
