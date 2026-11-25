import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Old pages that were folded into the dashboard and activity. Query strings are kept.
  async redirects() {
    return [
      { source: "/learning-logs", destination: "/activity", permanent: false },
      { source: "/integrations", destination: "/connect", permanent: false },
    ];
  },
  partialPrefetching: true,
  // Logos never change name, so browsers can keep them for a day and refresh quietly in the background.
  async headers() {
    const cache = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }];
    return [
      { source: "/brand/:path*", headers: cache },
      { source: "/lily/:path*", headers: cache },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
