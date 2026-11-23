import type { NextConfig } from "next";
import path from "node:path";

// GitHub Pages build: STATIC_EXPORT=1 and BASE_PATH=/<repository name> (see scripts/build-pages.mjs).
const isStatic = process.env.STATIC_EXPORT === "1";
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(isStatic ? { output: "export" as const, trailingSlash: true, images: { unoptimized: true } } : {}),
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_STATIC: isStatic ? "1" : "" },
  // Pin Turbopack's root to this project so a lockfile in a parent folder is never picked up.
  turbopack: {
    root: path.resolve(import.meta.dirname),
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
};

export default nextConfig;
