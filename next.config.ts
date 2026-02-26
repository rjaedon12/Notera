import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the seeded SQLite snapshot is bundled into every Vercel
  // serverless function so the copy-to-/tmp logic can find it at runtime.
  outputFileTracingIncludes: {
    "/**": ["./prisma/seeded.db"],
  },
};

export default nextConfig;
