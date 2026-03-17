"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"

export function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-6xl mx-auto px-6 py-32"
    >
      <div className="text-center">
        <h2 className="text-4xl sm:text-5xl font-heading font-bold tracking-tight mb-5" style={{ color: "var(--foreground)" }}>
          Ready to study smarter?
        </h2>
        <p className="text-lg max-w-md mx-auto mb-10" style={{ color: "var(--muted-foreground)" }}>
          Join thousands of students using Koda to ace their exams and master new subjects.
        </p>
        <Link href="/signup">
          <Button size="lg" className="rounded-full px-10 text-base h-12 gap-2">
            Get started for free
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </motion.section>
  )
}
