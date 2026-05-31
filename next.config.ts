import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Long-cache the non-hashed static assets in /public. Hashed
        // /_next/static files already get immutable caching from Next.js.
        source: "/favicon.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/vs/:code", destination: "/games", permanent: true },
      { source: "/games/countryle", destination: "/games", permanent: true },
      { source: "/games/countryle/play", destination: "/games", permanent: true },
    ];
  },
};

export default nextConfig;
