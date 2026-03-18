import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Experimental optimizations
  experimental: {
    // Optimize package imports for popular libraries
    optimizePackageImports: [
      "lucide-react",
      "@tanstack/react-query",
      "framer-motion",
      "react-hot-toast",
    ],
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Compression
  compress: true,

  // Strict mode for better dev experience
  reactStrictMode: true,

  // Reduce powered-by header
  poweredByHeader: false,
};

export default nextConfig;
