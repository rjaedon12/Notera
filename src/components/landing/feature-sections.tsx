"use client"

const features = [
  {
    label: "Study Modes",
    title: "Five ways to learn. One goal: mastery.",
    description:
      "Flashcards, learn, test, match, and timed modes. Switch between them to match your focus and keep sessions effective.",
  },
  {
    label: "Adaptive",
    title: "Cards you miss appear more often.",
    description:
      "The system tracks what you know and what you don't. Weak spots surface automatically so you spend time where it matters.",
  },
  {
    label: "Progress",
    title: "See exactly where you stand.",
    description:
      "Mastery levels, streaks, and study time — all tracked. A clean dashboard shows your growth at a glance.",
  },
  {
    label: "Open",
    title: "Share sets. Study together.",
    description:
      "Create public study sets, discover community content, or keep your cards private. Your call.",
  },
]

export function FeatureSections() {
  return (
    <section id="features" className="max-w-5xl mx-auto px-6" style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
      {/* Section header */}
      <div className="mb-16">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "#6B6B6B", letterSpacing: "0.12em" }}
        >
          Features
        </p>
        <h2
          className="font-heading font-bold leading-[1.1] max-w-md"
          style={{ color: "#1A1A1A", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", letterSpacing: "-0.03em" }}
        >
          Everything you need to study effectively
        </h2>
      </div>

      {/* Feature cards — flat, borderless-ish, editorial */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-14">
        {features.map((f) => (
          <div key={f.label}>
            <p
              className="text-xs font-semibold uppercase mb-3"
              style={{ color: "#8A8A8A", letterSpacing: "0.12em" }}
            >
              {f.label}
            </p>
            <h3
              className="font-heading font-semibold text-lg mb-2"
              style={{ color: "#1A1A1A", letterSpacing: "-0.02em" }}
            >
              {f.title}
            </h3>
            <p
              className="text-[0.938rem] leading-relaxed"
              style={{ color: "#6B6B6B" }}
            >
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
