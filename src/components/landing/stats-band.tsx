"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const duration = 1500
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [isInView, target])

  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString()}{suffix}
    </span>
  )
}

export function StatsBand() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  const stats = [
    { value: 10000, suffix: "+", label: "Flashcards created" },
    { value: 50, suffix: "+", label: "Study sets available" },
    { value: 5, suffix: "", label: "Study modes" },
    { value: 99, suffix: "%", label: "Free to use" },
  ]

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-6xl mx-auto px-6 py-20"
    >
      <div
        className="rounded-2xl px-8 py-10"
        style={{
          background: "var(--glass-fill)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--glass-shadow), inset 0 1px 0 0 var(--glass-highlight)",
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-heading font-bold mb-1" style={{ color: "var(--foreground)" }}>
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
