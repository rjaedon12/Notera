"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b shadow-sm"
          : "border-b border-transparent"
      }`}
      style={{
        background: scrolled ? "var(--sidebar-bg)" : "transparent",
        borderColor: scrolled ? "var(--glass-border)" : "transparent",
        backdropFilter: scrolled ? "saturate(180%) blur(48px)" : "none",
        WebkitBackdropFilter: scrolled ? "saturate(180%) blur(48px)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 flex-shrink-0" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
              <defs>
                <linearGradient id="landing-spark" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#34AAFF"/>
                  <stop offset="45%" stopColor="#007AFF"/>
                  <stop offset="100%" stopColor="#5856D6"/>
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="7" fill="#080810"/>
              <path d="M16 4 L19.5 12.5 L28 16 L19.5 19.5 L16 28 L12.5 19.5 L4 16 L12.5 12.5 Z" fill="url(#landing-spark)"/>
            </svg>
          </div>
          <span className="font-heading font-bold text-[1.2rem] tracking-tight" style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}>
            Koda
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium transition-colors hover:text-[var(--foreground)]" style={{ color: "var(--muted-foreground)" }}>
            Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium transition-colors hover:text-[var(--foreground)]" style={{ color: "var(--muted-foreground)" }}>
            How it works
          </a>
          <a href="#explore" className="text-sm font-medium transition-colors hover:text-[var(--foreground)]" style={{ color: "var(--muted-foreground)" }}>
            Explore
          </a>
        </nav>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-sm">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="text-sm rounded-full px-5">
              Get started
            </Button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl hover:bg-[var(--glass-fill)] transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden border-t overflow-hidden"
            style={{
              background: "var(--sidebar-bg)",
              borderColor: "var(--glass-border)",
              backdropFilter: "saturate(180%) blur(48px)",
            }}
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              <a href="#features" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2" style={{ color: "var(--muted-foreground)" }}>Features</a>
              <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2" style={{ color: "var(--muted-foreground)" }}>How it works</a>
              <a href="#explore" onClick={() => setMobileOpen(false)} className="text-sm font-medium py-2" style={{ color: "var(--muted-foreground)" }}>Explore</a>
              <div className="flex gap-3 pt-3 border-t" style={{ borderColor: "var(--glass-border)" }}>
                <Link href="/login" className="flex-1"><Button variant="outline" className="w-full">Log in</Button></Link>
                <Link href="/signup" className="flex-1"><Button className="w-full">Get started</Button></Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
