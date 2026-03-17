"use client"

import Link from "next/link"

export function LandingFooter() {
  return (
    <footer
      className="border-t"
      style={{ borderColor: "var(--glass-border)" }}
    >
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 flex-shrink-0" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">
                <defs>
                  <linearGradient id="footer-spark" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#34AAFF"/>
                    <stop offset="45%" stopColor="#007AFF"/>
                    <stop offset="100%" stopColor="#5856D6"/>
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="7" fill="#080810"/>
                <path d="M16 4 L19.5 12.5 L28 16 L19.5 19.5 L16 28 L12.5 19.5 L4 16 L12.5 12.5 Z" fill="url(#footer-spark)"/>
              </svg>
            </div>
            <span className="font-heading font-bold text-sm" style={{ color: "var(--foreground)" }}>
              Koda
            </span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6">
            <Link href="/login" className="text-sm transition-colors hover:text-[var(--foreground)]" style={{ color: "var(--muted-foreground)" }}>
              Log in
            </Link>
            <Link href="/signup" className="text-sm transition-colors hover:text-[var(--foreground)]" style={{ color: "var(--muted-foreground)" }}>
              Sign up
            </Link>
            <Link href="/discover" className="text-sm transition-colors hover:text-[var(--foreground)]" style={{ color: "var(--muted-foreground)" }}>
              Discover
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            © {new Date().getFullYear()} Koda. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
