"use client"

import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative flex items-center justify-center" style={{ minHeight: "100vh", paddingTop: "5rem" }}>
      <div className="max-w-3xl mx-auto px-6 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{
            background: "color-mix(in srgb, var(--landing-fg) 6%, transparent)",
            border: "1px solid color-mix(in srgb, var(--landing-fg) 10%, transparent)",
          }}
        >
          <span className="text-xs font-medium" style={{ color: "var(--landing-muted)" }}>
            ✨ Education &amp; Productivity, unified
          </span>
        </div>

        {/* Main headline — Bricolage 700, tight tracking */}
        <h1
          className="font-heading font-bold leading-[1.06] mb-6"
          style={{
            color: "var(--landing-fg)",
            letterSpacing: "-0.035em",
            fontSize: "clamp(2.75rem, 7vw, 4.5rem)",
          }}
        >
          The all in one
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, var(--landing-fg) 0%, color-mix(in srgb, var(--landing-fg) 60%, #3B82F6) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            education &amp; productivity
          </span>
          <br />
          app.
        </h1>

        {/* Subline — Bricolage 300, relaxed */}
        <p
          className="font-heading leading-relaxed mb-12 max-w-lg mx-auto"
          style={{
            color: "var(--landing-muted)",
            fontWeight: 300,
            fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
            letterSpacing: "-0.01em",
          }}
        >
          Flashcards, notes, quizzes, study guides, whiteboards, and more.
          <br />
          Everything you need to learn, create, and stay organized.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup" className="landing-btn-primary">
            Get started — it&apos;s free
          </Link>
          <a href="#features" className="landing-btn-ghost">
            See what&apos;s inside
          </a>
        </div>

        {/* Trust line */}
        <p
          className="mt-10 text-xs"
          style={{ color: "color-mix(in srgb, var(--landing-muted) 60%, transparent)" }}
        >
          No credit card required · Free forever for students
        </p>
      </div>
    </section>
  )
}
