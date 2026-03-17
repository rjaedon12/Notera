"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Enlarged ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: "1100px",
            height: "1100px",
            background: "var(--bg-glow-1)",
            filter: "blur(160px)",
            top: "-25%",
            left: "-15%",
            animation: "orbDrift1 24s ease-in-out infinite alternate",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "800px",
            height: "800px",
            background: "var(--bg-glow-2)",
            filter: "blur(140px)",
            bottom: "-15%",
            right: "-10%",
            animation: "orbDrift2 30s ease-in-out infinite alternate",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "600px",
            height: "600px",
            background: "var(--bg-glow-3)",
            filter: "blur(120px)",
            top: "40%",
            left: "50%",
            transform: "translateX(-50%)",
            animation: "orbDrift3 36s ease-in-out infinite alternate",
            opacity: 0.6,
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            className="inline-flex items-center gap-2 text-xs font-medium px-4 py-1.5 rounded-full mb-8"
            style={{
              background: "var(--glass-fill)",
              border: "1px solid var(--glass-border)",
              color: "var(--accent-color)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-color)] animate-pulse" />
            Free to use · No credit card required
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl font-heading font-bold tracking-tight leading-[1.08] mb-6"
          style={{ color: "var(--foreground)" }}
        >
          Master anything,
          <br />
          <span style={{ color: "var(--accent-color)" }}>one card at a time.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "var(--muted-foreground)" }}
        >
          Flashcards, adaptive study modes, and real-time progress tracking —
          everything you need to learn faster and remember longer.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/signup">
            <Button size="lg" className="rounded-full px-8 text-base gap-2 h-12">
              Start studying — it&apos;s free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="#features">
            <Button variant="ghost" size="lg" className="rounded-full px-8 text-base h-12" style={{ color: "var(--muted-foreground)" }}>
              See how it works
            </Button>
          </a>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="landing-scroll-indicator" />
        </motion.div>
      </div>
    </section>
  )
}
