"use client"

import { useState, useCallback } from "react"
import * as mathjs from "mathjs"

interface SolveStep {
  label: string
  expression: string
  latex?: string
}

function solveQuadratic(a: number, b: number, c: number): SolveStep[] {
  const steps: SolveStep[] = []

  steps.push({
    label: "Standard form",
    expression: `${a}x² + ${b}x + ${c} = 0`,
    latex: `${a}x^2 ${b >= 0 ? "+" : ""}${b}x ${c >= 0 ? "+" : ""}${c} = 0`,
  })

  const discriminant = b * b - 4 * a * c
  steps.push({
    label: "Compute discriminant",
    expression: `Δ = b² - 4ac = ${b}² - 4(${a})(${c}) = ${discriminant}`,
    latex: `\\Delta = b^2 - 4ac = ${b}^2 - 4(${a})(${c}) = ${discriminant}`,
  })

  if (discriminant < 0) {
    steps.push({
      label: "Result",
      expression: `Δ < 0 → No real roots`,
      latex: `\\Delta < 0 \\implies \\text{No real roots}`,
    })
    const realPart = (-b / (2 * a)).toFixed(4)
    const imagPart = (Math.sqrt(-discriminant) / (2 * a)).toFixed(4)
    steps.push({
      label: "Complex roots",
      expression: `x = ${realPart} ± ${imagPart}i`,
      latex: `x = ${realPart} \\pm ${imagPart}i`,
    })
  } else if (discriminant === 0) {
    const root = -b / (2 * a)
    steps.push({
      label: "Δ = 0 → One repeated root",
      expression: `x = -b / 2a = ${-b} / ${2 * a} = ${root}`,
      latex: `x = \\frac{-b}{2a} = \\frac{${-b}}{${2 * a}} = ${Number(root.toFixed(6))}`,
    })
  } else {
    steps.push({
      label: "Apply quadratic formula",
      expression: `x = (-b ± √Δ) / 2a`,
      latex: `x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}`,
    })

    const sqrtD = Math.sqrt(discriminant)
    steps.push({
      label: "Substitute values",
      expression: `x = (${-b} ± √${discriminant}) / ${2 * a}`,
      latex: `x = \\frac{${-b} \\pm \\sqrt{${discriminant}}}{${2 * a}}`,
    })

    const x1 = (-b + sqrtD) / (2 * a)
    const x2 = (-b - sqrtD) / (2 * a)
    steps.push({
      label: "Compute roots",
      expression: `x₁ = ${Number(x1.toFixed(6))}, x₂ = ${Number(x2.toFixed(6))}`,
      latex: `x_1 = ${Number(x1.toFixed(6))}, \\quad x_2 = ${Number(x2.toFixed(6))}`,
    })

    // Verify
    steps.push({
      label: "Verify",
      expression: `f(${Number(x1.toFixed(4))}) = ${Number((a * x1 * x1 + b * x1 + c).toFixed(6))}`,
    })
  }

  return steps
}

function solveLinear(a: number, b: number): SolveStep[] {
  const steps: SolveStep[] = []
  steps.push({
    label: "Linear equation",
    expression: `${a}x + ${b} = 0`,
    latex: `${a}x ${b >= 0 ? "+" : ""}${b} = 0`,
  })
  steps.push({
    label: "Isolate x",
    expression: `${a}x = ${-b}`,
    latex: `${a}x = ${-b}`,
  })
  const root = -b / a
  steps.push({
    label: "Solve",
    expression: `x = ${Number(root.toFixed(6))}`,
    latex: `x = \\frac{${-b}}{${a}} = ${Number(root.toFixed(6))}`,
  })
  return steps
}

function parseAndSolve(input: string): { steps: SolveStep[]; error: string | null } {
  try {
    // Normalize: remove spaces, handle "= 0"
    let expr = input.replace(/\s+/g, "").replace(/=0$/, "")

    // Try to parse with mathjs and extract polynomial coefficients
    const node = mathjs.parse(expr)
    const simplified = mathjs.simplify(node)

    // Evaluate at a few points to detect polynomial degree
    const fn = simplified.compile()
    const f = (x: number) => fn.evaluate({ x }) as number

    // Check if constant
    if (typeof f(0) === "number" && typeof f(1) === "number") {
      // Use finite differences to determine degree
      const y0 = f(0), y1 = f(1), y2 = f(2), y3 = f(3)
      const d1_0 = y1 - y0, d1_1 = y2 - y1, d1_2 = y3 - y2
      const d2_0 = d1_1 - d1_0, d2_1 = d1_2 - d1_1
      const d3_0 = d2_1 - d2_0

      if (Math.abs(d3_0) < 1e-10 && Math.abs(d2_0) > 1e-10) {
        // Quadratic: a = d2/2, b = d1_0 - a, c = y0
        const a = d2_0 / 2
        const b = d1_0 - a
        const c = y0
        return { steps: solveQuadratic(a, b, c), error: null }
      } else if (Math.abs(d2_0) < 1e-10 && Math.abs(d1_0) > 1e-10) {
        // Linear
        const a = d1_0
        const b = y0
        return { steps: solveLinear(a, b), error: null }
      } else if (Math.abs(d1_0) < 1e-10) {
        return {
          steps: [{ label: "Result", expression: `${y0} = 0 is ${Math.abs(y0) < 1e-10 ? "always true" : "never true"}` }],
          error: null,
        }
      }
    }

    return { steps: [], error: "Could not determine polynomial form. Try: ax^2+bx+c" }
  } catch (e: any) {
    return { steps: [], error: e.message || "Failed to parse expression" }
  }
}

export function EquationSolver() {
  const [input, setInput] = useState("2x^2 + 5x - 3")
  const [result, setResult] = useState<{ steps: SolveStep[]; error: string | null }>({ steps: [], error: null })

  const solve = useCallback(() => {
    setResult(parseAndSolve(input))
  }, [input])

  return {
    canvas: (
      <div
        className="w-full rounded-2xl overflow-hidden p-5 min-h-[300px]"
        style={{
          background: "var(--glass-fill)",
          border: "1px solid var(--glass-border)",
        }}
      >
        {result.error && (
          <div
            className="p-3 rounded-xl text-sm mb-4"
            style={{ background: "rgba(255,69,58,0.1)", color: "#FF453A", border: "1px solid rgba(255,69,58,0.2)" }}
          >
            {result.error}
          </div>
        )}

        {result.steps.length === 0 && !result.error && (
          <div className="text-center py-12" style={{ color: "var(--muted-foreground)" }}>
            <p className="text-lg mb-1">Enter an equation and click Solve</p>
            <p className="text-sm">Supports linear and quadratic equations</p>
          </div>
        )}

        {result.steps.length > 0 && (
          <div className="space-y-4">
            {result.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    background: i === result.steps.length - 1 ? "rgba(48,209,88,0.15)" : "var(--muted)",
                    color: i === result.steps.length - 1 ? "#30d158" : "var(--muted-foreground)",
                  }}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>
                    {step.label}
                  </p>
                  <p
                    className="font-mono text-sm px-3 py-2 rounded-lg"
                    style={{
                      background: "var(--muted)",
                      color: "var(--foreground)",
                    }}
                  >
                    {step.expression}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    controls: (
      <div className="space-y-4">
        {/* Equation input */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>
            Equation (set equal to 0)
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && solve()}
            placeholder="2x^2 + 5x - 3"
            className="flex h-10 w-full rounded-xl px-3 py-2 text-sm backdrop-blur-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            style={{
              background: "var(--glass-fill)",
              border: "1px solid var(--glass-border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        <button
          onClick={solve}
          className="w-full h-9 rounded-xl text-sm font-medium"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          Solve
        </button>

        {/* Examples */}
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
            Try these:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {["x^2 - 4", "2x^2 + 5x - 3", "x^2 + 1", "3x + 7", "x^2 - 6x + 9"].map((ex) => (
              <button
                key={ex}
                onClick={() => { setInput(ex); setResult(parseAndSolve(ex)) }}
                className="text-xs px-2.5 py-1 rounded-full font-mono"
                style={{
                  background: "var(--muted)",
                  color: "var(--foreground)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    ),
  }
}
