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

  // Redirects
  async redirects() {
    return [
      {
        source: "/teacher/homework",
        destination: "/library?tab=homework",
        permanent: true,
      },
      {
        source: "/groups",
        destination: "/spaces",
        permanent: true,
      },
      {
        source: "/groups/:path*",
        destination: "/spaces/:path*",
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
