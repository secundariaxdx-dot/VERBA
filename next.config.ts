import type { NextConfig } from "next";
import path from "node:path";

// Pin Turbopack's root to this project so a lockfile in a parent folder is never picked up.
const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(import.meta.dirname),
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
};

export default nextConfig;
