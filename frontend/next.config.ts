import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: undefined,
  async headers() {
    return [
      {
        // HTML pages must never be cached by the CDN — they reference hashed chunk filenames
        // that change on every deploy. A stale cached HTML page causes CSS/JS 404s.
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        // Static chunks have content-hash filenames — safe to cache forever
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
