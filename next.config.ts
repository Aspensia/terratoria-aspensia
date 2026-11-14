import type { NextConfig } from "next";

// Static export: the whole app is HTML/CSS/JS plus JSON, with no server.
// Set NEXT_PUBLIC_BASE_PATH (e.g. "/terratoria") when hosting under a sub-path such as GitHub Pages.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  images: { unoptimized: true },
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
