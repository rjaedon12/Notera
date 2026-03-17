"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { usePyodide, type CASResult } from "@/hooks/usePyodide"
import "katex/dist/katex.min.css"
import { BlockMath } from "react-katex"
import {
  Loader2,
  Play,
  XCircle,
  Trash2,
  Clock,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Zap,
  Copy,
  Check,
} from "lucide-react"

/* ── Operation categories for the toolbar ─────────────────────────────── */

interface CASOperation {
  label: string
  template: string
  description: string
}

interface CASCategory {
  name: string
  operations: CASOperation[]
}

const categories: CASCategory[] = [
  {
    name: "Simplify & Rewrite",
    operations: [
      { label: "Simplify", template: "simplify()", description: "Simplify an expression" },
      { label: "Expand", template: "expand()", description: "Expand products and powers" },
      { label: "Factor", template: "factor()", description: "Factor a polynomial" },
      { label: "Collect", template: "collect(, x)", description: "Collect terms by a symbol" },
      { label: "Cancel", template: "cancel()", description: "Cancel common factors in a fraction" },
      { label: "Apart", template: "apart(, x)", description: "Partial fraction decomposition" },
      { label: "Together", template: "together()", description: "Combine fractions over common denominator" },
      { label: "Trig Simplify", template: "trigsimp()", description: "Simplify trigonometric expressions" },
      { label: "Radsimp", template: "radsimp()", description: "Rationalize and simplify radicals" },
    ],
  },
  {
    name: "Solve",
    operations: [
      { label: "Solve", template: "solve(, x)", description: "Solve an equation for x" },
      { label: "Solve System", template: "solve([eq1, eq2], [x, y])", description: "Solve a system of equations" },
      { label: "Roots", template: "roots(, x)", description: "Find roots with multiplicities" },
      { label: "Solve Ineq", template: "solve(  > 0, x)", description: "Solve an inequality" },
      { label: "Diophantine", template: "diophantine()", description: "Solve Diophantine equations" },
      { label: "ODE", template: "dsolve(Eq(f(x).diff(x), ), f(x))", description: "Solve an ODE" },
      { label: "Recurrence", template: "rsolve(, y(n))", description: "Solve a recurrence relation" },
    ],
  },
  {
    name: "Calculus",
    operations: [
      { label: "Differentiate", template: "diff(, x)", description: "Differentiate w.r.t. x" },
      { label: "Nth Derivative", template: "diff(, x, 2)", description: "Higher-order derivative" },
      { label: "Integrate", template: "integrate(, x)", description: "Indefinite integral" },
      { label: "Definite Integral", template: "integrate(, (x, 0, 1))", description: "Definite integral from 0 to 1" },
      { label: "Limit", template: "limit(, x, oo)", description: "Limit as x → ∞" },
      { label: "Series", template: "series(, x, 0, 6)", description: "Taylor series at x=0, 6 terms" },
      { label: "Summation", template: "summation(, (n, 1, oo))", description: "Sum a series" },
      { label: "Product", template: "product(, (n, 1, k))", description: "Product of a sequence" },
    ],
  },
  {
    name: "Linear Algebra",
    operations: [
      { label: "Matrix", template: "Matrix([[1,2],[3,4]])", description: "Create a matrix" },
      { label: "Determinant", template: "Matrix([[1,2],[3,4]]).det()", description: "Matrix determinant" },
      { label: "Inverse", template: "Matrix([[1,2],[3,4]]).inv()", description: "Matrix inverse" },
      { label: "Eigenvalues", template: "Matrix([[1,2],[3,4]]).eigenvals()", description: "Eigenvalues" },
      { label: "Eigenvectors", template: "Matrix([[1,2],[3,4]]).eigenvects()", description: "Eigenvectors" },
      { label: "RREF", template: "Matrix([[1,2,3],[4,5,6]]).rref()", description: "Row-reduced echelon form" },
      { label: "Nullspace", template: "Matrix([[1,2],[2,4]]).nullspace()", description: "Null space" },
      { label: "Char Poly", template: "Matrix([[1,2],[3,4]]).charpoly()", description: "Characteristic polynomial" },
    ],
  },
  {
    name: "Number Theory",
    operations: [
      { label: "Factorint", template: "factorint()", description: "Prime factorisation" },
      { label: "Isprime", template: "isprime()", description: "Primality test" },
      { label: "GCD", template: "gcd(, )", description: "Greatest common divisor" },
      { label: "LCM", template: "lcm(, )", description: "Least common multiple" },
      { label: "Mod Inverse", template: "mod_inverse(, )", description: "Modular inverse" },
      { label: "Totient", template: "totient()", description: "Euler's totient" },
      { label: "Binomial", template: "binomial(, )", description: "Binomial coefficient" },
    ],
  },
  {
    name: "Combinatorics & Discrete",
    operations: [
      { label: "Factorial", template: "factorial()", description: "n!" },
      { label: "Permutations", template: "nP(, )", description: "P(n, r)" },
      { label: "Combinations", template: "nC(, )", description: "C(n, r)" },
      { label: "Fibonacci", template: "fibonacci()", description: "nth Fibonacci number" },
      { label: "Catalan", template: "catalan()", description: "nth Catalan number" },
      { label: "Partition", template: "npartitions()", description: "Number of integer partitions" },
    ],
  },
  {
    name: "Special & Advanced",
    operations: [
      { label: "LaTeX", template: "latex()", description: "Convert expression to LaTeX" },
      { label: "Substitute", template: "().subs(x, )", description: "Substitute values" },
      { label: "N (Float)", template: "N(, 15)", description: "Numerical approximation" },
      { label: "Piecewise", template: "Piecewise((expr1, cond1), (expr2, True))", description: "Piecewise function" },
      { label: "Fourier", template: "fourier_series(, (x, -pi, pi))", description: "Fourier series" },
      { label: "Laplace", template: "laplace_transform(, t, s)", description: "Laplace transform" },
    ],
  },
]

/* ── Quick examples ────────────────────────────────────────────────────── */

const quickExamples = [
  { label: "Factor x⁴ − 1", code: "factor(x**4 - 1)" },
  { label: "Integrate sin(x)·eˣ", code: "integrate(sin(x)*exp(x), x)" },
  { label: "Solve x² − 5x + 6 = 0", code: "solve(x**2 - 5*x + 6, x)" },
  { label: "Taylor series of eˣ", code: "series(exp(x), x, 0, 8)" },
  { label: "Limit sin(x)/x", code: "limit(sin(x)/x, x, 0)" },
  { label: "3×3 Determinant", code: "Matrix([[1,2,3],[4,5,6],[7,8,0]]).det()" },
  { label: "Partial fractions", code: "apart(1/(x**3 - 1), x)" },
  { label: "diff(x³·sin(x), x)", code: "diff(x**3 * sin(x), x)" },
  { label: "Σ 1/n² (n=1 to ∞)", code: "summation(1/n**2, (n, 1, oo))" },
  { label: "Prime factor 360", code: "factorint(360)" },
]

/* ── Helper: copy to clipboard ─────────────────────────────────────────── */

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 1500)
    })
  }, [])
  return { copied, copy }
}

/* ── Result card sub-component ─────────────────────────────────────────── */

function ResultCard({
  result,
  onReuse,
  copied,
  onCopy,
}: {
  result: CASResult
  onReuse: (code: string) => void
  copied: string | null
  onCopy: (text: string, id: string) => void
}) {
  const hasError = !!result.error
  const hasLatex = result.latex && result.latex.length > 0

  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{
        background: hasError ? "rgba(255,69,58,0.06)" : "var(--glass-fill)",
        border: `1px solid ${hasError ? "rgba(255,69,58,0.2)" : "var(--glass-border)"}`,
      }}
    >
      {/* Input expression */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <code
          className="text-xs px-2 py-1 rounded-md flex-1 break-all"
          style={{ background: "var(--muted)", color: "var(--foreground)" }}
        >
          {result.input}
        </code>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onReuse(result.input)}
            className="p-1 rounded-md transition-colors hover:bg-[var(--muted)]"
            title="Reuse expression"
          >
            <RotateCcw className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
          </button>
          {!hasError && result.plain && (
            <button
              onClick={() => onCopy(result.latex || result.plain, result.id)}
              className="p-1 rounded-md transition-colors hover:bg-[var(--muted)]"
              title="Copy result"
            >
              {copied === result.id ? (
                <Check className="h-3.5 w-3.5" style={{ color: "#30d158" }} />
              ) : (
                <Copy className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Result */}
      {hasError ? (
        <p className="text-sm" style={{ color: "#FF453A" }}>
          {result.error}
        </p>
      ) : hasLatex ? (
        <div className="overflow-x-auto py-1" style={{ color: "var(--foreground)" }}>
          <BlockMath math={result.latex} />
        </div>
      ) : (
        <p className="text-sm font-mono" style={{ color: "var(--foreground)" }}>
          {result.plain}
        </p>
      )}

      {/* Timestamp */}
      <p className="text-[10px] mt-2" style={{ color: "var(--muted-foreground)" }}>
        {new Date(result.timestamp).toLocaleTimeString()}
      </p>
    </div>
  )
}

/* ── Main export: ComputerAlgebra ──────────────────────────────────────── */

export function ComputerAlgebra() {
  const {
    status,
    loadingStage,
    isComputing,
    history,
    init,
    execute,
    cancel,
    clearHistory,
  } = usePyodide()

  const [input, setInput] = useState("")
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const { copied, copy } = useCopy()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const resultsEndRef = useRef<HTMLDivElement>(null)

  // Auto-init on mount
  useEffect(() => {
    init()
  }, [init])

  // Scroll to latest result
  useEffect(() => {
    if (history.length > 0) {
      resultsEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [history.length])

  /* ── Handlers ──────────────────────────────────────────────────────── */

  const handleExecute = useCallback(async () => {
    const code = input.trim()
    if (!code) return
    await execute(code)
    setInput("")
    inputRef.current?.focus()
  }, [input, execute])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleExecute()
      }
    },
    [handleExecute],
  )

  const insertTemplate = useCallback((template: string) => {
    setInput(template)
    setOpenCategory(null)
    // Focus the input after inserting
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const reuseExpression = useCallback((code: string) => {
    setInput(code)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  /* ── Canvas (main area) ────────────────────────────────────────────── */

  const canvas = (
    <div
      className="w-full rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "var(--glass-fill)",
        border: "1px solid var(--glass-border)",
        minHeight: 420,
        maxHeight: "calc(100vh - 260px)",
      }}
    >
      {/* ── Loading overlay ─────────────────────────────────────────── */}
      {status === "loading" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(160,80,220,0.12)", border: "1px solid rgba(160,80,220,0.2)" }}
            >
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#a050dc" }} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
              Loading Computer Algebra System
            </p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {loadingStage || "Preparing…"}
            </p>
            <p className="text-[10px] mt-2" style={{ color: "var(--muted-foreground)" }}>
              First load downloads ~20 MB (cached after)
            </p>
          </div>
          {/* Skeleton shimmer bars */}
          <div className="w-full max-w-xs space-y-2 mt-2">
            {[80, 60, 70].map((w, i) => (
              <div
                key={i}
                className="h-3 rounded-full animate-pulse"
                style={{ width: `${w}%`, background: "var(--muted)" }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Error state ─────────────────────────────────────────────── */}
      {status === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3">
          <XCircle className="h-10 w-10" style={{ color: "#FF453A" }} />
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Failed to load CAS engine
          </p>
          <p className="text-xs text-center max-w-xs" style={{ color: "var(--muted-foreground)" }}>
            {loadingStage}
          </p>
          <button
            onClick={init}
            className="mt-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Ready state — idle ──────────────────────────────────────── */}
      {status === "ready" && history.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(160,80,220,0.12)", border: "1px solid rgba(160,80,220,0.2)" }}
          >
            <Zap className="h-6 w-6" style={{ color: "#a050dc" }} />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold mb-1" style={{ color: "var(--foreground)" }}>
              CAS Engine Ready
            </p>
            <p className="text-sm max-w-sm" style={{ color: "var(--muted-foreground)" }}>
              Type a SymPy expression below or pick an operation from the toolbar.
              Pre-defined symbols: x, y, z, t, n, k, m, a, b, c
            </p>
          </div>
          {/* Quick examples */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-2 max-w-md">
            {quickExamples.slice(0, 6).map((ex) => (
              <button
                key={ex.code}
                onClick={() => {
                  setInput(ex.code)
                  setTimeout(() => inputRef.current?.focus(), 50)
                }}
                className="text-xs px-2.5 py-1 rounded-full font-mono transition-colors hover:opacity-80"
                style={{
                  background: "var(--muted)",
                  color: "var(--foreground)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Results list ────────────────────────────────────────────── */}
      {status === "ready" && history.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div ref={resultsEndRef} />
          {[...history].reverse().map((result) => (
            <ResultCard
              key={result.id}
              result={result}
              onReuse={reuseExpression}
              copied={copied}
              onCopy={copy}
            />
          ))}
        </div>
      )}

      {/* ── Input bar (always visible when ready or idle) ──────────── */}
      {(status === "ready" || status === "idle") && (
        <div
          className="p-3 flex-shrink-0"
          style={{ borderTop: "1px solid var(--glass-border)" }}
        >
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a SymPy expression… (⌘+Enter to run)"
              rows={2}
              className="flex-1 rounded-xl px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={{
                background: "var(--muted)",
                border: "1px solid var(--glass-border)",
                color: "var(--foreground)",
              }}
              disabled={status !== "ready"}
            />
            <div className="flex flex-col gap-1.5">
              <button
                onClick={handleExecute}
                disabled={!input.trim() || isComputing || status !== "ready"}
                className="h-full min-w-[44px] rounded-xl flex items-center justify-center transition-opacity disabled:opacity-40"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                title="Run (⌘+Enter)"
              >
                {isComputing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>
              {isComputing && (
                <button
                  onClick={cancel}
                  className="min-w-[44px] h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: "rgba(255,69,58,0.12)",
                    color: "#FF453A",
                    border: "1px solid rgba(255,69,58,0.2)",
                  }}
                  title="Cancel"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  /* ── Controls (sidebar) ────────────────────────────────────────────── */

  const controls = (
    <div className="space-y-4">
      {/* Operation categories — accordion */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>
          Operations
        </p>
        <div className="space-y-1">
          {categories.map((cat) => (
            <div key={cat.name}>
              <button
                onClick={() => setOpenCategory(openCategory === cat.name ? null : cat.name)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--muted)]"
                style={{ color: "var(--foreground)" }}
              >
                {cat.name}
                {openCategory === cat.name ? (
                  <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
                )}
              </button>
              {openCategory === cat.name && (
                <div className="pl-2 pr-1 pb-1.5 grid grid-cols-2 gap-1">
                  {cat.operations.map((op) => (
                    <button
                      key={op.label}
                      onClick={() => insertTemplate(op.template)}
                      className="text-[11px] px-2 py-1.5 rounded-md text-left truncate transition-colors hover:bg-[var(--muted)]"
                      style={{
                        color: "var(--foreground)",
                        border: "1px solid var(--glass-border)",
                      }}
                      title={op.description}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick examples */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>
          Examples
        </p>
        <div className="flex flex-wrap gap-1.5">
          {quickExamples.map((ex) => (
            <button
              key={ex.code}
              onClick={() => {
                setInput(ex.code)
                setTimeout(() => inputRef.current?.focus(), 50)
              }}
              className="text-[11px] px-2 py-1 rounded-full font-mono transition-colors hover:opacity-80"
              style={{
                background: "var(--muted)",
                color: "var(--foreground)",
                border: "1px solid var(--glass-border)",
              }}
              title={ex.code}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* History controls */}
      {history.length > 0 && (
        <div
          className="pt-3"
          style={{ borderTop: "1px solid var(--glass-border)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
              <Clock className="h-3 w-3" />
              {history.length} result{history.length !== 1 && "s"}
            </span>
            <button
              onClick={clearHistory}
              className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-[var(--muted)]"
              style={{ color: "var(--muted-foreground)" }}
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            background:
              status === "ready"
                ? "#30d158"
                : status === "loading"
                  ? "#FF9F0A"
                  : status === "error"
                    ? "#FF453A"
                    : "var(--muted-foreground)",
          }}
        />
        {status === "ready" && "Engine ready"}
        {status === "loading" && (loadingStage || "Loading…")}
        {status === "error" && "Engine error"}
        {status === "idle" && "Not started"}
      </div>
    </div>
  )

  return { canvas, controls }
}
