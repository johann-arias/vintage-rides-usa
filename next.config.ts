import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only www.vintageridesusa.com may be indexed. dev.vintageridesusa.com (Stripe
  // test mode) and the *.vercel.app aliases serve the full site: tell search
  // engines to leave them out (SEO audit of 2026-09-26).
  async headers() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "(?!www\\.vintageridesusa\\.com$).*" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "vintage-rides-usa.vercel.app" }],
        destination: "https://www.vintageridesusa.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "vintage-rides-usa-johannarias-projects.vercel.app" }],
        destination: "https://www.vintageridesusa.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
