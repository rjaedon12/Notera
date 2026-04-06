"use client"

import Link from "next/link"
import Image from "next/image"

export function LandingFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--landing-border)" }}>
      <div className="max-w-5xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 flex-shrink-0" aria-hidden="true">
                <Image src="/notera-logo.png" alt="" width={24} height={24} className="h-6 w-6 rounded-[22%]" />
              </div>
              <span className="font-heading font-bold text-sm" style={{ color: "var(--landing-fg)" }}>Notera</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--landing-subtle)" }}>
              The all in one education and productivity app.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-semibold uppercase mb-4" style={{ color: "var(--landing-subtle)", letterSpacing: "0.1em" }}>Product</p>
            <ul className="space-y-2.5">
              <li><Link href="/signup" className="text-sm transition-colors" style={{ color: "var(--landing-muted)" }}>Sign up</Link></li>
              <li><Link href="/discover" className="text-sm transition-colors" style={{ color: "var(--landing-muted)" }}>Discover sets</Link></li>
              <li><Link href="/login" className="text-sm transition-colors" style={{ color: "var(--landing-muted)" }}>Log in</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <p className="text-xs font-semibold uppercase mb-4" style={{ color: "var(--landing-subtle)", letterSpacing: "0.1em" }}>Features</p>
            <ul className="space-y-2.5">
              <li><a href="#features" className="text-sm transition-colors" style={{ color: "var(--landing-muted)" }}>Study Modes</a></li>
              <li><a href="#features" className="text-sm transition-colors" style={{ color: "var(--landing-muted)" }}>Notes</a></li>
              <li><a href="#features" className="text-sm transition-colors" style={{ color: "var(--landing-muted)" }}>Whiteboards</a></li>
              <li><Link href="/forum" className="text-sm transition-colors" style={{ color: "var(--landing-muted)" }}>Forum</Link></li>
            </ul>
          </div>


        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6" style={{ borderTop: "1px solid var(--landing-border)" }}>
          <p className="text-xs" style={{ color: "var(--landing-subtle)" }}>
            &copy; {new Date().getFullYear()} Notera. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
