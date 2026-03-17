"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Grid3X3,
  Clock,
  Hash,
  GitBranch,
  LineChart,
  Calculator,
  BarChart3,
  Box,
  AreaChart,
  Binary,
  Sigma,
  ArrowRight,
} from "lucide-react"

interface ConceptCard {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  difficulty: "high-school" | "college" | "both"
  color: string
  borderColor: string
}

const difficultyConfig = {
  "high-school": { label: "High School", variant: "default" as const, bg: "rgba(0,122,255,0.12)", text: "#007AFF" },
  college: { label: "College", variant: "default" as const, bg: "rgba(160,80,220,0.12)", text: "#a050dc" },
  both: { label: "HS + College", variant: "default" as const, bg: "rgba(48,209,88,0.12)", text: "#30d158" },
}

const concepts: ConceptCard[] = [
  {
    title: "Sieve of Eratosthenes",
    description: "Watch prime numbers reveal themselves step-by-step as composites are eliminated from a visual grid.",
    href: "/math/sieve",
    icon: <Grid3X3 className="h-6 w-6" />,
    difficulty: "high-school",
    color: "rgba(0,122,255,0.15)",
    borderColor: "rgba(0,122,255,0.25)",
  },
  {
    title: "Modular Clock",
    description: "Explore modular arithmetic on a clock face. See how step sizes create patterns and discover generators.",
    href: "/math/modular-clock",
    icon: <Clock className="h-6 w-6" />,
    difficulty: "high-school",
    color: "rgba(255,159,10,0.15)",
    borderColor: "rgba(255,159,10,0.25)",
  },
  {
    title: "Euler's Totient",
    description: "Visualize which numbers are coprime to n and understand the totient function through interactive exploration.",
    href: "/math/euler-totient",
    icon: <Hash className="h-6 w-6" />,
    difficulty: "college",
    color: "rgba(160,80,220,0.15)",
    borderColor: "rgba(160,80,220,0.25)",
  },
  {
    title: "GCD Visualizer",
    description: "See the Euclidean algorithm in action — watch rectangles tile as the greatest common divisor emerges.",
    href: "/math/gcd",
    icon: <GitBranch className="h-6 w-6" />,
    difficulty: "both",
    color: "rgba(48,209,88,0.15)",
    borderColor: "rgba(48,209,88,0.25)",
  },
  {
    title: "Graphing Calculator",
    description: "Plot multiple functions, zoom and pan, find roots and intersections — a Desmos-style experience.",
    href: "/math/graphing",
    icon: <LineChart className="h-6 w-6" />,
    difficulty: "both",
    color: "rgba(255,69,58,0.15)",
    borderColor: "rgba(255,69,58,0.25)",
  },
  {
    title: "Equation Solver",
    description: "Enter any polynomial equation and see every algebraic step, from factoring to the quadratic formula.",
    href: "/math/solver",
    icon: <Calculator className="h-6 w-6" />,
    difficulty: "high-school",
    color: "rgba(0,199,190,0.15)",
    borderColor: "rgba(0,199,190,0.25)",
  },
  {
    title: "Statistics Playground",
    description: "Enter data or upload a CSV. Instantly see mean, median, mode, std dev, histograms, and box plots.",
    href: "/math/stats",
    icon: <BarChart3 className="h-6 w-6" />,
    difficulty: "both",
    color: "rgba(88,86,214,0.15)",
    borderColor: "rgba(88,86,214,0.25)",
  },
  {
    title: "Matrix Visualizer",
    description: "Multiply, transpose, and find determinants — see how 2×2 transforms stretch and rotate a grid.",
    href: "/math/matrix",
    icon: <Box className="h-6 w-6" />,
    difficulty: "college",
    color: "rgba(255,214,10,0.15)",
    borderColor: "rgba(255,214,10,0.25)",
  },
  {
    title: "Riemann Sum",
    description: "Approximate integrals with rectangles. Drag sliders and watch the error shrink as n approaches infinity.",
    href: "/math/riemann",
    icon: <AreaChart className="h-6 w-6" />,
    difficulty: "college",
    color: "rgba(94,92,230,0.15)",
    borderColor: "rgba(94,92,230,0.25)",
  },
  {
    title: "Base Converter",
    description: "Convert between binary, octal, decimal, and hex. See positional breakdowns and flip individual bits.",
    href: "/math/base-converter",
    icon: <Binary className="h-6 w-6" />,
    difficulty: "high-school",
    color: "rgba(175,82,222,0.15)",
    borderColor: "rgba(175,82,222,0.25)",
  },
  {
    title: "Computer Algebra",
    description: "A full SymPy-powered CAS in your browser. Simplify, factor, integrate, solve, and more — with LaTeX output.",
    href: "/math/computer-algebra",
    icon: <Sigma className="h-6 w-6" />,
    difficulty: "college",
    color: "rgba(220,80,160,0.15)",
    borderColor: "rgba(220,80,160,0.25)",
  },
]

export default function MathLabPage() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {concepts.map((concept) => {
        const diff = difficultyConfig[concept.difficulty]
        return (
          <Link key={concept.href} href={concept.href}>
            <Card className="h-full cursor-pointer group">
              <CardContent className="p-5 flex flex-col h-full">
                {/* Icon + Badge row */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: concept.color,
                      border: `1px solid ${concept.borderColor}`,
                      color: concept.borderColor.replace("0.25", "1"),
                    }}
                  >
                    {concept.icon}
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: diff.bg, color: diff.text }}
                  >
                    {diff.label}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold font-heading mb-1.5" style={{ color: "var(--card-foreground)" }}>
                  {concept.title}
                </h3>

                {/* Description */}
                <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: "var(--muted-foreground)" }}>
                  {concept.description}
                </p>

                {/* Explore link */}
                <div
                  className="flex items-center gap-1 text-sm font-medium transition-all group-hover:gap-2"
                  style={{ color: "var(--primary)" }}
                >
                  Explore
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
