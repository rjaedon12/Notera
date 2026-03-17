"use client"

import Link from "next/link"

export function LandingFooter() {
  return (
    <footer style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="max-w-5xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 flex-shrink-0" aria-hidden="true">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">
                  <rect width="32" height="32" rx="7" fill="#1A1A1A"/>
                  <path d="M16 4 L19.5 12.5 L28 16 L19.5 19.5 L16 28 L12.5 19.5 L4 16 L12.5 12.5 Z" fill="#FAF9F6"/>
                </svg>
              </div>
              <span className="font-heading font-bold text-sm" style={{ color: "#1A1A1A" }}>Koda</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#8A8A8A" }}>
              Free flashcard app for students who want results.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-semibold uppercase mb-4" style={{ color: "#8A8A8A", letterSpacing: "0.1em" }}>Product</p>
            <ul className="space-y-2.5">
              <li><Link href="/signup" className="text-sm transition-colors" style={{ color: "#6B6B6B" }}>Get started</Link></li>
              <li><Link href="/discover" className="text-sm transition-colors" style={{ color: "#6B6B6B" }}>Discover sets</Link></li>
              <li><Link href="/login" className="text-sm transition-colors" style={{ color: "#6B6B6B" }}>Log in</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <p className="text-xs font-semibold uppercase mb-4" style={{ color: "#8A8A8A", letterSpacing: "0.1em" }}>Community</p>
            <ul className="space-y-2.5">
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm transition-colors" style={{ color: "#6B6B6B" }}>GitHub</a></li>
              <li><a href="#features" className="text-sm transition-colors" style={{ color: "#6B6B6B" }}>Features</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-semibold uppercase mb-4" style={{ color: "#8A8A8A", letterSpacing: "0.1em" }}>Legal</p>
            <ul className="space-y-2.5">
              <li><span className="text-sm" style={{ color: "#6B6B6B" }}>Privacy</span></li>
              <li><span className="text-sm" style={{ color: "#6B6B6B" }}>Terms</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-xs" style={{ color: "#8A8A8A" }}>
            &copy; {new Date().getFullYear()} Koda. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
