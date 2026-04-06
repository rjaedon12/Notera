"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b bg-[var(--landing-bg)]/90 backdrop-blur-sm"
          : "border-b border-transparent bg-transparent"
      }`}
      style={{ borderColor: scrolled ? "var(--landing-border)" : "transparent" }}
    >
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-7 w-7 flex-shrink-0" aria-hidden="true">
            <Image src="/notera-logo.png" alt="" width={28} height={28} className="h-7 w-7 rounded-[22%]" />
          </div>
          <span className="font-heading font-bold text-[1.1rem]" style={{ color: "var(--landing-fg)", letterSpacing: "-0.03em" }}>
            Notera
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#explore" className="landing-nav-link">Sets</a>
        </nav>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium transition-colors" style={{ color: "var(--landing-muted)" }}>
            Log in
          </Link>
          <Link href="/signup" className="landing-btn-primary" style={{ padding: "0.5rem 1.5rem", fontSize: "0.875rem" }}>
            Sign up
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg transition-colors"
          style={{ color: "var(--landing-fg)" }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t overflow-hidden"
          style={{ background: "var(--landing-bg)", borderColor: "var(--landing-border)" }}
        >
          <div className="px-6 py-5 flex flex-col gap-4">
            <a href="#features" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-1" style={{ color: "var(--landing-muted)" }}>Features</a>
            <a href="#explore" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-1" style={{ color: "var(--landing-muted)" }}>Sets</a>
            <hr className="landing-divider" />
            <div className="flex gap-3 pt-1">
              <Link href="/login" className="flex-1 text-center text-sm font-medium py-2.5 rounded-full border transition-colors" style={{ borderColor: "var(--landing-border)", color: "var(--landing-fg)" }}>
                Log in
              </Link>
              <Link href="/signup" className="flex-1 landing-btn-primary text-center" style={{ padding: "0.625rem 1rem", fontSize: "0.875rem" }}>
                Sign up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
