"use client"

import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative flex items-center justify-center" style={{ minHeight: "100vh", paddingTop: "5rem" }}>
      <div className="max-w-3xl mx-auto px-6 text-center">
        {/* Main headline — Bricolage 700, tight tracking */}
        <h1
          className="font-heading font-bold leading-[1.06] mb-6"
          style={{
            color: "#1A1A1A",
            letterSpacing: "-0.035em",
            fontSize: "clamp(2.75rem, 7vw, 4.5rem)",
          }}
        >
          Master anything,
          <br />
          one card at a time.
        </h1>

        {/* Subline — Bricolage 300, relaxed */}
        <p
          className="font-heading leading-relaxed mb-12 max-w-lg mx-auto"
          style={{
            color: "#6B6B6B",
            fontWeight: 300,
            fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
            letterSpacing: "-0.01em",
          }}
        >
          Flashcards, adaptive study modes, and progress tracking.
          Free, fast, and built for how you actually learn.
        </p>

        {/* Single CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup" className="landing-btn-primary">
            Start studying
          </Link>
          <a href="#features" className="landing-btn-ghost">
            See how it works
          </a>
        </div>
      </div>
    </section>
  )
}
