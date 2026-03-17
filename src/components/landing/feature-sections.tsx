"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import {
  Layers,
  BarChart3,
  Users,
  Brain,
  Timer,
  Sparkles,
  TrendingUp,
  Share2,
  Globe,
} from "lucide-react"

function SectionWrapper({ children, id }: { children: React.ReactNode; id?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <motion.div
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ── Feature card for the grid ─────────────────────────────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  description,
  accent,
}: {
  icon: React.ElementType
  title: string
  description: string
  accent: string
}) {
  return (
    <div
      className="group rounded-2xl p-6 transition-all duration-300 glass-card-hover"
      style={{
        background: "var(--glass-fill)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--glass-shadow), inset 0 1px 0 0 var(--glass-highlight)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{
          background: `color-mix(in srgb, ${accent} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${accent} 20%, transparent)`,
        }}
      >
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <h3 className="font-heading font-semibold text-base mb-2" style={{ color: "var(--foreground)" }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        {description}
      </p>
    </div>
  )
}

// ── Study modes visual mockup ─────────────────────────────────────────────────
function StudyModesMockup() {
  const modes = [
    { name: "Flashcards", icon: Layers, active: true },
    { name: "Learn", icon: Brain, active: false },
    { name: "Test", icon: Sparkles, active: false },
    { name: "Match", icon: Timer, active: false },
  ]

  return (
    <div
      className="rounded-2xl p-6 w-full max-w-md mx-auto"
      style={{
        background: "var(--glass-fill)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--glass-shadow)",
      }}
    >
      {/* Mode tabs */}
      <div className="flex gap-2 mb-5">
        {modes.map((mode) => (
          <div
            key={mode.name}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: mode.active ? "var(--accent)" : "transparent",
              color: mode.active ? "var(--accent-color)" : "var(--muted-foreground)",
            }}
          >
            <mode.icon className="h-3.5 w-3.5" />
            {mode.name}
          </div>
        ))}
      </div>

      {/* Mock flashcard */}
      <div
        className="rounded-xl p-8 text-center"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--glass-border)",
          minHeight: "160px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: "var(--muted-foreground)" }}>
          Term
        </p>
        <p className="text-xl font-heading font-semibold" style={{ color: "var(--foreground)" }}>
          Photosynthesis
        </p>
        <p className="text-xs mt-4" style={{ color: "var(--muted-foreground)" }}>
          Tap to flip
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 mt-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all"
            style={{
              width: i === 0 ? "20px" : "6px",
              height: "6px",
              background: i === 0 ? "var(--accent-color)" : "var(--glass-border)",
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Progress tracking visual mockup ───────────────────────────────────────────
function ProgressMockup() {
  const bars = [40, 65, 80, 55, 90, 72, 95]

  return (
    <div
      className="rounded-2xl p-6 w-full max-w-md mx-auto"
      style={{
        background: "var(--glass-fill)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--glass-shadow)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm font-heading font-semibold" style={{ color: "var(--foreground)" }}>Weekly Progress</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Cards mastered this week</p>
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: "#42d9a0" }}>
          <TrendingUp className="h-3.5 w-3.5" />
          +24%
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2 h-28">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-md transition-all"
              style={{
                height: `${h}%`,
                background: i === bars.length - 1
                  ? "var(--accent-color)"
                  : "color-mix(in srgb, var(--accent-color) 25%, transparent)",
                borderRadius: "4px",
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="flex-1 text-center">{d}</span>
        ))}
      </div>

      {/* Streak indicator */}
      <div
        className="flex items-center gap-3 mt-5 rounded-xl px-4 py-3"
        style={{
          background: "color-mix(in srgb, var(--accent-color) 8%, transparent)",
          border: "1px solid color-mix(in srgb, var(--accent-color) 15%, transparent)",
        }}
      >
        <span className="text-2xl">🔥</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>7-day streak</p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Keep it up!</p>
        </div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function FeatureSections() {
  return (
    <div>
      {/* ─── Feature grid ─── */}
      <SectionWrapper id="features">
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--accent-color)" }}>
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight mb-4" style={{ color: "var(--foreground)" }}>
              Everything you need to study effectively
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: "var(--muted-foreground)" }}>
              Built for students who want results. Every feature is designed to help you learn faster and retain more.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={Layers}
              title="Multiple Study Modes"
              description="Switch between Flashcards, Learn, Test, Match, and Timed modes to keep study sessions fresh and engaging."
              accent="var(--accent-color)"
            />
            <FeatureCard
              icon={Brain}
              title="Adaptive Learning"
              description="Cards you struggle with appear more often. The system adapts to your knowledge gaps in real time."
              accent="#a855f7"
            />
            <FeatureCard
              icon={BarChart3}
              title="Progress Analytics"
              description="Track mastery levels, streaks, and study time. See exactly where you stand at a glance."
              accent="#42d9a0"
            />
            <FeatureCard
              icon={Timer}
              title="Timed Challenges"
              description="Test yourself under pressure with timed rounds. Great for exam prep and building speed."
              accent="#f59e0b"
            />
            <FeatureCard
              icon={Share2}
              title="Share & Collaborate"
              description="Create public study sets, share with classmates, or discover community-made content."
              accent="#ec4899"
            />
            <FeatureCard
              icon={Globe}
              title="Study Anywhere"
              description="Access your flashcards on any device. Your progress syncs seamlessly across platforms."
              accent="#06b6d4"
            />
          </div>
        </section>
      </SectionWrapper>

      {/* ─── Study modes showcase ─── */}
      <SectionWrapper id="how-it-works">
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--accent-color)" }}>
                Study modes
              </p>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight mb-5" style={{ color: "var(--foreground)" }}>
                Five ways to study.
                <br />
                One goal: mastery.
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: "var(--muted-foreground)" }}>
                Not every subject is the same, and neither is every study session. Switch between modes to match your focus — 
                whether you&apos;re learning new material or reviewing before an exam.
              </p>
              <ul className="space-y-3">
                {[
                  { label: "Flashcards", desc: "Classic flip-and-review" },
                  { label: "Learn", desc: "Guided study with feedback" },
                  { label: "Test", desc: "Multiple choice & written" },
                  { label: "Match", desc: "Drag-and-drop pairing game" },
                  { label: "Timed", desc: "Beat the clock challenges" },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <div
                      className="h-5 w-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
                      style={{
                        background: "color-mix(in srgb, var(--accent-color) 15%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--accent-color) 25%, transparent)",
                      }}
                    >
                      <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent-color)" }} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{item.label}</span>
                      <span className="text-sm ml-2" style={{ color: "var(--muted-foreground)" }}>— {item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <StudyModesMockup />
          </div>
        </section>
      </SectionWrapper>

      {/* ─── Progress & analytics showcase ─── */}
      <SectionWrapper>
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <ProgressMockup />
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#42d9a0" }}>
                Progress tracking
              </p>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight mb-5" style={{ color: "var(--foreground)" }}>
                See your growth.
                <br />
                Stay motivated.
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: "var(--muted-foreground)" }}>
                Detailed analytics show your mastery over time. Track daily streaks, identify weak spots, 
                and celebrate progress — all in one clean dashboard.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { stat: "Mastery %", desc: "Per-card accuracy" },
                  { stat: "Streaks", desc: "Daily study habits" },
                  { stat: "Weak spots", desc: "Auto-identified gaps" },
                  { stat: "Time spent", desc: "Session analytics" },
                ].map((item) => (
                  <div
                    key={item.stat}
                    className="rounded-xl px-4 py-3"
                    style={{
                      background: "var(--glass-fill)",
                      border: "1px solid var(--glass-border)",
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{item.stat}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </SectionWrapper>
    </div>
  )
}
