"use client"

import Link from "next/link"

export function CTASection() {
  return (
    <section className="max-w-5xl mx-auto px-6" style={{ paddingTop: "7rem", paddingBottom: "7rem" }}>
      <div className="text-center">
        <h2
          className="font-heading font-bold leading-[1.1] mb-5"
          style={{
            color: "#1A1A1A",
            fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
            letterSpacing: "-0.03em",
          }}
        >
          Ready to start studying?
        </h2>
        <p
          className="text-[0.938rem] leading-relaxed max-w-md mx-auto mb-10"
          style={{ color: "#6B6B6B" }}
        >
          Create an account in seconds. No credit card, no setup, no friction.
        </p>
        <Link href="/signup" className="landing-btn-primary">
          Get started for free
        </Link>
      </div>
    </section>
  )
}
