"use client"

import Link from "next/link"

export function CTASection() {
  return (
    <section className="max-w-5xl mx-auto px-6" style={{ paddingTop: "7rem", paddingBottom: "7rem" }}>
      <div className="text-center">
        <h2
          className="font-heading font-bold leading-[1.1] mb-5"
          style={{
            color: "var(--landing-fg)",
            fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
            letterSpacing: "-0.03em",
          }}
        >
          Ready to level up how you learn?
        </h2>
        <p
          className="text-[0.938rem] leading-relaxed max-w-md mx-auto mb-10"
          style={{ color: "var(--landing-muted)" }}
        >
          Join Notera for free. No setup, no friction — just start learning.
        </p>
        <Link href="/signup" className="landing-btn-primary">
          Get started for free
        </Link>
      </div>
    </section>
  )
}
