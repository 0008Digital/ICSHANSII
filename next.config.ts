import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  // Request-time appearance cookies personalize the shell; do not prerender a default shell.
  cacheComponents: false,
  turbopack: {
    rules: {
      // Only the application entry uses Tailwind. Upstream CSS stays on Next's native path.
      "src/app/globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
