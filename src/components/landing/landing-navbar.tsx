"use client"

import Link from "next/link"
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
          ? "border-b bg-[#FAF9F6]/90 backdrop-blur-sm"
          : "border-b border-transparent bg-transparent"
      }`}
      style={{ borderColor: scrolled ? "var(--landing-border)" : "transparent" }}
    >
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-7 w-7 flex-shrink-0" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-7">
              <rect width="32" height="32" rx="7" fill="#1A1A1A"/>
              <path d="M16 4 L19.5 12.5 L28 16 L19.5 19.5 L16 28 L12.5 19.5 L4 16 L12.5 12.5 Z" fill="#FAF9F6"/>
            </svg>
          </div>
          <span className="font-heading font-bold text-[1.1rem]" style={{ color: "#1A1A1A", letterSpacing: "-0.03em" }}>
            Koda
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#explore" className="landing-nav-link">Sets</a>
        </nav>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium transition-colors" style={{ color: "#6B6B6B" }}>
            Log in
          </Link>
          <Link href="/signup" className="landing-btn-primary" style={{ padding: "0.5rem 1.5rem", fontSize: "0.875rem" }}>
            Get started
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg transition-colors"
          style={{ color: "#1A1A1A" }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t overflow-hidden"
          style={{ background: "#FAF9F6", borderColor: "rgba(0,0,0,0.08)" }}
        >
          <div className="px-6 py-5 flex flex-col gap-4">
            <a href="#features" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-1" style={{ color: "#6B6B6B" }}>Features</a>
            <a href="#explore" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-1" style={{ color: "#6B6B6B" }}>Sets</a>
            <hr className="landing-divider" />
            <div className="flex gap-3 pt-1">
              <Link href="/login" className="flex-1 text-center text-sm font-medium py-2.5 rounded-full border transition-colors" style={{ borderColor: "rgba(0,0,0,0.08)", color: "#1A1A1A" }}>
                Log in
              </Link>
              <Link href="/signup" className="flex-1 landing-btn-primary text-center" style={{ padding: "0.625rem 1rem", fontSize: "0.875rem" }}>
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
