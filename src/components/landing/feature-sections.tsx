"use client"

const features = [
  {
    label: "Study Modes",
    title: "Five ways to master any subject.",
    description:
      "Flashcards, learn, test, match, and timed modes. Adaptive algorithms surface weak spots so you study what matters most.",
  },
  {
    label: "Notes",
    title: "Write, organize, think clearly.",
    description:
      "A full rich-text editor with folders and instant search. Capture ideas in class or build structured study notes — all in one place.",
  },
  {
    label: "Quizzes & DBQ",
    title: "Practice that mirrors the real thing.",
    description:
      "Multiple-choice quiz banks and document-based-question practice with AI scoring. Prep for AP exams, finals, and everything in between.",
  },
  {
    label: "Whiteboard",
    title: "Sketch it out. See the big picture.",
    description:
      "An infinite canvas for diagrams, mind maps, and visual brainstorming. Great for planning essays or mapping out complex topics.",
  },
  {
    label: "Study Guides",
    title: "Turn notes into guided review.",
    description:
      "Generate structured study guides from your content. Organize by topic, add key terms, and review efficiently before exams.",
  },
  {
    label: "Progress",
    title: "See exactly where you stand.",
    description:
      "Mastery levels, streaks, and study time — all tracked. A clean dashboard shows your growth at a glance across every tool.",
  },
]

export function FeatureSections() {
  return (
    <section id="features" className="max-w-5xl mx-auto px-6" style={{ paddingTop: "6rem", paddingBottom: "6rem" }}>
      {/* Section header */}
      <div className="mb-16">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "var(--landing-muted)", letterSpacing: "0.12em" }}
        >
          Everything you need
        </p>
        <h2
          className="font-heading font-bold leading-[1.1] max-w-md"
          style={{ color: "var(--landing-fg)", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", letterSpacing: "-0.03em" }}
        >
          One app. Every tool for school.
        </h2>
      </div>

      {/* Feature cards — 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-14">
        {features.map((f) => (
          <div key={f.label}>
            <p
              className="text-xs font-semibold uppercase mb-3"
              style={{ color: "var(--landing-subtle)", letterSpacing: "0.12em" }}
            >
              {f.label}
            </p>
            <h3
              className="font-heading font-semibold text-lg mb-2"
              style={{ color: "var(--landing-fg)", letterSpacing: "-0.02em" }}
            >
              {f.title}
            </h3>
            <p
              className="text-[0.938rem] leading-relaxed"
              style={{ color: "var(--landing-muted)" }}
            >
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
