"use client"

import Link from "next/link"
import { FlaskConical, Users, Beaker, ArrowRight, Sparkles, FileText, Clock } from "lucide-react"
import { motion } from "framer-motion"

const experimentalFeatures = [
  {
    href: "/resources",
    title: "Resources",
    description:
      "Upload and manage study guides, timelines, images, and documents. Organize your study materials in one place and share them with others.",
    icon: <FileText className="h-6 w-6" />,
    color: "#34d399",
    status: "Beta",
  },
  {
    href: "/timeline-builder",
    title: "Timeline Builder",
    description:
      "Create interactive visual timelines for historical events. Drag and drop events, connect them with arrows, and visualize the flow of history.",
    icon: <Clock className="h-6 w-6" />,
    color: "#f59e0b",
    status: "Beta",
  },
  {
    href: "/math",
    title: "Math Lab",
    description:
      "Explore interactive math visualizers including Euler's Totient, prime factorization, modular arithmetic, and more. Perfect for building intuition around number theory concepts.",
    icon: <FlaskConical className="h-6 w-6" />,
    color: "#a78bfa",
    status: "Beta",
  },
  {
    href: "/groups",
    title: "Study Groups",
    description:
      "Collaborate with classmates in study groups. Share flashcard sets, study together, and keep each other on track with group-level progress tracking.",
    icon: <Users className="h-6 w-6" />,
    color: "#60a5fa",
    status: "Beta",
  },
]

export default function ExperimentalPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(167, 139, 250, 0.15)" }}
          >
            <Beaker className="h-5 w-5" style={{ color: "#a78bfa" }} />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-heading">
            Experimental Features
          </h1>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          These features are still being developed and may change or be removed. We&apos;d love your
          feedback — try them out and let us know what you think!
        </p>

        {/* Info banner */}
        <div
          className="mt-5 flex items-start gap-3 rounded-xl border px-4 py-3"
          style={{
            borderColor: "rgba(167, 139, 250, 0.25)",
            background: "rgba(167, 139, 250, 0.06)",
          }}
        >
          <Sparkles className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#a78bfa" }} />
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Experimental features are works-in-progress. They may have bugs, incomplete UI, or
            limited functionality. Your usage helps us improve them for everyone.
          </p>
        </div>
      </motion.div>

      {/* Feature Cards */}
      <div className="grid gap-4">
        {experimentalFeatures.map((feature, i) => (
          <motion.div
            key={feature.href}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
          >
            <Link href={feature.href}>
              <div
                className="group relative rounded-2xl border p-6 transition-all hover:scale-[1.01] hover:shadow-lg cursor-pointer"
                style={{
                  borderColor: "var(--glass-border)",
                  background: "var(--glass-fill)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: `${feature.color}18`,
                        color: feature.color,
                      }}
                    >
                      {feature.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h2 className="text-base font-semibold text-foreground font-heading">
                          {feature.title}
                        </h2>
                        <span
                          className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full"
                          style={{
                            background: `${feature.color}20`,
                            color: feature.color,
                          }}
                        >
                          {feature.status}
                        </span>
                      </div>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    className="h-5 w-5 mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                    style={{ color: "var(--muted-foreground)" }}
                  />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
