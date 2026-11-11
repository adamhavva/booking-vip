import type { NextConfig } from "next";

// Public host of the R2 bucket (r2.dev subdomain or a custom domain) —
// derived so `next/image` only accepts exactly the configured host.
const r2Host = (() => {
  try {
    return new URL(process.env["R2_PUBLIC_BASE_URL"] ?? "").hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  images: {
    remotePatterns: r2Host
      ? [{ protocol: "https", hostname: r2Host }]
      : [{ protocol: "https", hostname: "pub-**.r2.dev" }],
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
