import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "worker-src 'self' blob:",
      "connect-src 'self' https: wss:",
    ].join("; "),
  },
]

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

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
