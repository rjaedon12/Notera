import type { StudyGuide } from "@/types/studyguide";

/**
 * Calculus Study Guide
 * Based on OpenStax Calculus Volume 1 (CC-BY-NC-SA 4.0)
 * Strang & Herman, MIT / University of Wisconsin
 * https://openstax.org/details/books/calculus-volume-1
 *
 * Covers Limits, Derivatives, Derivative Rules, Applications, and Integration.
 */
export const calculus: StudyGuide = {
  id: "calculus",
  title: "Calculus",
  subject: "Mathematics",
  chapter: "1–5",
  description:
    "Master limits and continuity, the definition and rules of differentiation, applications of derivatives, and the Fundamental Theorem of Calculus with step-by-step examples and practice problems.",
  coverColor: "from-emerald-500/20 to-teal-500/20",
  icon: "TrendingUp",
  lessons: [
    // ================================================
    // LESSON 1 — Limits & Continuity
    // ================================================
    {
      id: "calc-1",
      title: "Lesson 1",
      subtitle: "Limits & Continuity",
      order: 1,
      sections: [
        {
          id: "calc-1-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "In this lesson you will study the concept of a limit — the foundation of all of calculus. You'll learn how to evaluate limits graphically, numerically, and algebraically, explore one-sided limits, and understand what it means for a function to be continuous.",
          order: 0,
        },
        // --- Intuitive definition ---
        {
          id: "calc-1-def-limit",
          type: "definition",
          title: "Limit of a Function",
          content:
            "We write\n\n$$\\lim_{x \\to a} f(x) = L$$\n\nand say *\"the limit of $f(x)$ as $x$ approaches $a$ is $L$\"* if the values of $f(x)$ can be made **arbitrarily close** to $L$ by taking $x$ sufficiently close to $a$ (from either side), **without** letting $x = a$.\n\nThe limit describes the *tendency* of a function near a point — even if the function is undefined there.",
          order: 1,
        },
        {
          id: "calc-1-diagram-limit",
          type: "diagram",
          title: "Limit Illustrated on a Graph",
          content:
            "On the graph of $y = f(x)$, the limit as $x \\to a$ equals $L$ when the curve approaches the height $L$ from both the left and the right as $x$ gets close to $a$. A hole at $(a, f(a))$ does **not** affect the limit.",
          imageComponent: "LimitGraphDiagram",
          order: 2,
        },
        // --- One-sided limits ---
        {
          id: "calc-1-def-onesided",
          type: "definition",
          title: "One-Sided Limits",
          content:
            "The **left-hand limit** is:\n$$\\lim_{x \\to a^-} f(x) = L$$\n(approaching $a$ from values less than $a$).\n\nThe **right-hand limit** is:\n$$\\lim_{x \\to a^+} f(x) = L$$\n(approaching $a$ from values greater than $a$).\n\nThe two-sided limit $\\lim_{x \\to a} f(x)$ exists **if and only if** both one-sided limits exist and are equal.",
          order: 3,
        },
        // --- Limit laws ---
        {
          id: "calc-1-thm-laws",
          type: "theorem",
          title: "Limit Laws",
          content:
            "Suppose $\\lim_{x\\to a}f(x) = L$ and $\\lim_{x\\to a}g(x) = M$. Then:\n\n1. **Sum:** $\\lim_{x\\to a}[f(x)+g(x)] = L + M$\n2. **Difference:** $\\lim_{x\\to a}[f(x)-g(x)] = L - M$\n3. **Constant multiple:** $\\lim_{x\\to a}[cf(x)] = cL$\n4. **Product:** $\\lim_{x\\to a}[f(x)\\cdot g(x)] = L \\cdot M$\n5. **Quotient:** $\\lim_{x\\to a}\\frac{f(x)}{g(x)} = \\frac{L}{M}$, provided $M \\neq 0$\n6. **Power:** $\\lim_{x\\to a}[f(x)]^n = L^n$ for any positive integer $n$",
          keyTakeaway:
            "You can break a complicated limit into simpler pieces using these algebraic rules.",
          order: 4,
        },
        {
          id: "calc-1-ex-1",
          type: "example",
          title: "Example — Evaluating a Limit by Factoring",
          content:
            "Find $\\lim_{x \\to 3} \\frac{x^2 - 9}{x - 3}$.",
          steps: [
            "Direct substitution gives $\\frac{0}{0}$ — indeterminate.",
            "Factor the numerator: $x^2 - 9 = (x-3)(x+3)$.",
            "$\\frac{(x-3)(x+3)}{x-3} = x + 3$ for $x \\neq 3$.",
            "$\\lim_{x \\to 3}(x+3) = 6$.",
          ],
          order: 5,
        },
        // --- Squeeze Theorem ---
        {
          id: "calc-1-thm-squeeze",
          type: "theorem",
          title: "The Squeeze Theorem",
          content:
            "If $g(x) \\leq f(x) \\leq h(x)$ for all $x$ near $a$ (except possibly at $a$), and\n\n$$\\lim_{x\\to a}g(x) = \\lim_{x\\to a}h(x) = L$$\n\nthen $\\lim_{x\\to a}f(x) = L$ as well.\n\nClassic application: $\\lim_{x\\to 0}\\frac{\\sin x}{x} = 1$, proved by squeezing between $\\cos x$ and $1$.",
          keyTakeaway:
            "If a function is trapped between two others that share the same limit, it must have that limit too.",
          order: 6,
        },
        {
          id: "calc-1-ex-2",
          type: "example",
          title: "Example — A Famous Limit",
          content:
            "Show that $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$.",
          steps: [
            "For $0 < x < \\frac{\\pi}{2}$, geometric arguments show $\\cos x \\leq \\frac{\\sin x}{x} \\leq 1$.",
            "$\\lim_{x\\to 0}\\cos x = 1$ and $\\lim_{x\\to 0} 1 = 1$.",
            "By the Squeeze Theorem, $\\lim_{x\\to 0}\\frac{\\sin x}{x} = 1$.",
          ],
          order: 7,
        },
        // --- Continuity ---
        {
          id: "calc-1-def-continuity",
          type: "definition",
          title: "Continuity",
          content:
            "A function $f$ is **continuous at** $x = a$ if all three conditions hold:\n\n1. $f(a)$ is defined.\n2. $\\lim_{x \\to a} f(x)$ exists.\n3. $\\lim_{x \\to a} f(x) = f(a)$.\n\nIntuitively, the graph has **no break, jump, or hole** at $x = a$.\n\nPolynomials, rational functions (on their domain), $\\sin x$, $\\cos x$, $e^x$, and $\\ln x$ are all continuous on their domains.",
          order: 8,
        },
        {
          id: "calc-1-thm-ivt",
          type: "theorem",
          title: "Intermediate Value Theorem (IVT)",
          content:
            "If $f$ is **continuous** on $[a, b]$ and $N$ is any number between $f(a)$ and $f(b)$, then there exists at least one $c \\in (a,b)$ such that $f(c) = N$.\n\nIn plain language: a continuous function that goes from one value to another must hit every value in between. This is often used to show that an equation has a solution in an interval.",
          keyTakeaway:
            "Continuous functions can't 'skip' values. If f(a) < 0 and f(b) > 0, there must be a root between a and b.",
          order: 9,
        },
        {
          id: "calc-1-ex-3",
          type: "example",
          title: "Example — Using the IVT",
          content:
            "Show that $x^3 - x - 1 = 0$ has a solution between $x = 1$ and $x = 2$.",
          steps: [
            "Let $f(x) = x^3 - x - 1$. This is a polynomial, so it is continuous everywhere.",
            "$f(1) = 1 - 1 - 1 = -1 < 0$.",
            "$f(2) = 8 - 2 - 1 = 5 > 0$.",
            "Since $f(1) < 0 < f(2)$, the IVT guarantees a $c \\in (1,2)$ with $f(c) = 0$.",
          ],
          order: 10,
        },
        // --- Infinite limits ---
        {
          id: "calc-1-def-infinite",
          type: "definition",
          title: "Infinite Limits & Limits at Infinity",
          content:
            "**Infinite limit:** $\\lim_{x \\to a} f(x) = \\infty$ means $f(x)$ grows without bound as $x \\to a$. The line $x = a$ is a **vertical asymptote**.\n\n**Limit at infinity:** $\\lim_{x \\to \\infty} f(x) = L$ means $f(x) \\to L$ as $x$ grows without bound. The line $y = L$ is a **horizontal asymptote**.\n\nFor rational functions $\\frac{p(x)}{q(x)}$:\n- If $\\deg p < \\deg q$: horizontal asymptote $y = 0$.\n- If $\\deg p = \\deg q$: horizontal asymptote $y = \\frac{\\text{leading coeff of }p}{\\text{leading coeff of }q}$.\n- If $\\deg p > \\deg q$: no horizontal asymptote.",
          order: 11,
        },
        // --- Practice Problems ---
        {
          id: "calc-1-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "Evaluate $\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}$.",
          order: 12,
          problem: {
            id: "calc-1-p1-q",
            choices: [
              { id: "a", text: "4" },
              { id: "b", text: "0" },
              { id: "c", text: "2" },
              { id: "d", text: "Does not exist" },
            ],
            correctAnswerId: "a",
            solution:
              "Factor: $\\frac{x^2-4}{x-2} = \\frac{(x-2)(x+2)}{x-2} = x+2$ for $x \\neq 2$. So $\\lim_{x\\to 2}(x+2) = 4$.",
            difficulty: "easy",
          },
        },
        {
          id: "calc-1-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "Evaluate $\\lim_{x \\to 0} \\frac{\\sin 5x}{x}$.",
          order: 13,
          problem: {
            id: "calc-1-p2-q",
            choices: [
              { id: "a", text: "5" },
              { id: "b", text: "1" },
              { id: "c", text: "0" },
              { id: "d", text: "Does not exist" },
            ],
            correctAnswerId: "a",
            solution:
              "Rewrite: $\\frac{\\sin 5x}{x} = 5 \\cdot \\frac{\\sin 5x}{5x}$. Since $\\lim_{u\\to 0}\\frac{\\sin u}{u}=1$, the answer is $5 \\cdot 1 = 5$.",
            difficulty: "medium",
          },
        },
        {
          id: "calc-1-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "At which value(s) of $x$ is $f(x) = \\frac{x+1}{x^2-1}$ discontinuous?",
          order: 14,
          problem: {
            id: "calc-1-p3-q",
            choices: [
              { id: "a", text: "x = 1 and x = −1" },
              { id: "b", text: "x = 1 only" },
              { id: "c", text: "x = −1 only" },
              { id: "d", text: "Continuous everywhere" },
            ],
            correctAnswerId: "a",
            solution:
              "$x^2 - 1 = (x-1)(x+1) = 0$ when $x = 1$ or $x = -1$. The function is undefined at both points, so it is discontinuous there. (Note: at $x=-1$ the discontinuity is removable since the factor cancels.)",
            difficulty: "medium",
          },
        },
        {
          id: "calc-1-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "Evaluate $\\lim_{x \\to \\infty} \\frac{3x^2 + 2}{5x^2 - 1}$.",
          order: 15,
          problem: {
            id: "calc-1-p4-q",
            choices: [
              { id: "a", text: "3/5" },
              { id: "b", text: "0" },
              { id: "c", text: "∞" },
              { id: "d", text: "1" },
            ],
            correctAnswerId: "a",
            solution:
              "Degrees are equal, so the limit is the ratio of leading coefficients: $\\frac{3}{5}$.",
            difficulty: "easy",
          },
        },
      ],
    },

    // ================================================
    // LESSON 2 — The Derivative
    // ================================================
    {
      id: "calc-2",
      title: "Lesson 2",
      subtitle: "The Derivative",
      order: 2,
      sections: [
        {
          id: "calc-2-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "This lesson introduces the derivative — the central concept of differential calculus. You'll learn the limit definition of the derivative, its interpretation as a rate of change and slope of a tangent line, and how to determine differentiability.",
          order: 0,
        },
        // --- Tangent line motivation ---
        {
          id: "calc-2-def-tangent",
          type: "definition",
          title: "Tangent Line & Secant Line",
          content:
            "A **secant line** connects two points on a curve: $(a, f(a))$ and $(a+h, f(a+h))$. Its slope is the **difference quotient**:\n\n$$m_{\\text{sec}} = \\frac{f(a+h) - f(a)}{h}$$\n\nThe **tangent line** at $x = a$ is the limiting position of the secant line as $h \\to 0$. Its slope is the **derivative**.",
          order: 1,
        },
        {
          id: "calc-2-diagram-tangent",
          type: "diagram",
          title: "Secant Line Approaching the Tangent",
          content:
            "As the second point slides along the curve toward the first, the secant line rotates into the tangent line. The slope of the secant approaches the slope of the tangent.",
          imageComponent: "TangentSecantDiagram",
          order: 2,
        },
        // --- Derivative definition ---
        {
          id: "calc-2-def-derivative",
          type: "definition",
          title: "Definition of the Derivative",
          content:
            "The **derivative** of $f$ at $x = a$ is defined as:\n\n$$f'(a) = \\lim_{h \\to 0} \\frac{f(a+h) - f(a)}{h}$$\n\nprovided this limit exists.\n\nEquivalently:\n$$f'(a) = \\lim_{x \\to a} \\frac{f(x) - f(a)}{x - a}$$\n\nThe **derivative function** is $f'(x) = \\lim_{h \\to 0}\\frac{f(x+h)-f(x)}{h}$.\n\nNotation: $f'(x)$, $\\frac{dy}{dx}$, $\\frac{df}{dx}$, or $Df(x)$.",
          order: 3,
        },
        {
          id: "calc-2-ex-1",
          type: "example",
          title: "Example — Derivative from the Definition",
          content:
            "Find $f'(x)$ for $f(x) = x^2$ using the limit definition.",
          steps: [
            "$f'(x) = \\lim_{h\\to 0}\\frac{(x+h)^2 - x^2}{h}$",
            "$= \\lim_{h\\to 0}\\frac{x^2 + 2xh + h^2 - x^2}{h}$",
            "$= \\lim_{h\\to 0}\\frac{2xh + h^2}{h}$",
            "$= \\lim_{h\\to 0}(2x + h) = 2x$",
          ],
          order: 4,
        },
        // --- Interpretation ---
        {
          id: "calc-2-note-interp",
          type: "note",
          title: "Interpretations of the Derivative",
          content:
            "The derivative $f'(a)$ represents:\n\n1. **Slope of the tangent line** to $y = f(x)$ at $x = a$.\n2. **Instantaneous rate of change** of $f$ with respect to $x$ at $x = a$.\n3. If $s(t)$ is position, then $s'(t)$ is **velocity** and $s''(t)$ is **acceleration**.",
          order: 5,
        },
        {
          id: "calc-2-ex-2",
          type: "example",
          title: "Example — Equation of a Tangent Line",
          content:
            "Find the equation of the tangent line to $f(x) = x^3$ at $x = 2$.",
          steps: [
            "$f(2) = 8$, so the point is $(2, 8)$.",
            "$f'(x) = 3x^2$ (we will prove this rule in Lesson 3), so $f'(2) = 12$.",
            "Tangent line: $y - 8 = 12(x - 2)$, i.e., $y = 12x - 16$.",
          ],
          order: 6,
        },
        // --- Differentiability ---
        {
          id: "calc-2-def-differentiable",
          type: "definition",
          title: "Differentiability",
          content:
            "A function $f$ is **differentiable at** $x = a$ if $f'(a)$ exists (the limit definition gives a finite value).\n\nA function is **not** differentiable at points where it has:\n- A **corner** or **cusp** (sharp change in slope)\n- A **vertical tangent** (slope $\\to \\pm\\infty$)\n- A **discontinuity**\n\n**Key fact:** If $f$ is differentiable at $a$, then $f$ is continuous at $a$. (The converse is false — $|x|$ is continuous at $0$ but not differentiable there.)",
          order: 7,
        },
        {
          id: "calc-2-thm-diff-cont",
          type: "theorem",
          title: "Differentiability Implies Continuity",
          content:
            "If $f$ is differentiable at $x = a$, then $f$ is continuous at $x = a$.\n\n**Proof sketch:** $f(x) - f(a) = \\frac{f(x)-f(a)}{x-a}\\cdot(x-a) \\to f'(a)\\cdot 0 = 0$ as $x \\to a$, so $\\lim_{x\\to a}f(x)=f(a)$.\n\nThe converse is **false**: $f(x) = |x|$ is continuous at $0$ but $f'(0)$ does not exist.",
          keyTakeaway:
            "Differentiable ⟹ Continuous, but Continuous ⟹/ Differentiable.",
          order: 8,
        },
        {
          id: "calc-2-ex-3",
          type: "example",
          title: "Example — Derivative from the Definition (Radical)",
          content:
            "Find $f'(x)$ for $f(x) = \\sqrt{x}$ using the limit definition.",
          steps: [
            "$f'(x) = \\lim_{h\\to 0}\\frac{\\sqrt{x+h}-\\sqrt{x}}{h}$",
            "Multiply by the conjugate: $\\frac{\\sqrt{x+h}-\\sqrt{x}}{h}\\cdot\\frac{\\sqrt{x+h}+\\sqrt{x}}{\\sqrt{x+h}+\\sqrt{x}}$",
            "$= \\frac{(x+h)-x}{h(\\sqrt{x+h}+\\sqrt{x})} = \\frac{1}{\\sqrt{x+h}+\\sqrt{x}}$",
            "As $h \\to 0$: $f'(x) = \\frac{1}{2\\sqrt{x}}$",
          ],
          order: 9,
        },
        // --- Practice ---
        {
          id: "calc-2-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "Using the limit definition, find $f'(x)$ for $f(x) = 3x + 5$.",
          order: 10,
          problem: {
            id: "calc-2-p1-q",
            choices: [
              { id: "a", text: "3" },
              { id: "b", text: "5" },
              { id: "c", text: "3x" },
              { id: "d", text: "0" },
            ],
            correctAnswerId: "a",
            solution:
              "$f'(x) = \\lim_{h\\to 0}\\frac{3(x+h)+5-(3x+5)}{h} = \\lim_{h\\to 0}\\frac{3h}{h} = 3$.",
            difficulty: "easy",
          },
        },
        {
          id: "calc-2-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "What is the slope of the tangent line to $f(x) = x^2$ at $x = -3$?",
          order: 11,
          problem: {
            id: "calc-2-p2-q",
            choices: [
              { id: "a", text: "−6" },
              { id: "b", text: "6" },
              { id: "c", text: "9" },
              { id: "d", text: "−9" },
            ],
            correctAnswerId: "a",
            solution:
              "$f'(x) = 2x$, so $f'(-3) = 2(-3) = -6$.",
            difficulty: "easy",
          },
        },
        {
          id: "calc-2-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "At which point is $f(x) = |x - 2|$ **not** differentiable?",
          order: 12,
          problem: {
            id: "calc-2-p3-q",
            choices: [
              { id: "a", text: "x = 2" },
              { id: "b", text: "x = 0" },
              { id: "c", text: "x = −2" },
              { id: "d", text: "It is differentiable everywhere" },
            ],
            correctAnswerId: "a",
            solution:
              "$|x-2|$ has a corner (sharp turn) at $x = 2$. The left-hand derivative is $-1$ and the right-hand derivative is $+1$, so the derivative does not exist at $x = 2$.",
            difficulty: "medium",
          },
        },
        {
          id: "calc-2-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "If a particle's position is $s(t) = 4t^2 - t + 3$ (meters), what is its instantaneous velocity at $t = 2$ s?",
          order: 13,
          problem: {
            id: "calc-2-p4-q",
            choices: [
              { id: "a", text: "15 m/s" },
              { id: "b", text: "17 m/s" },
              { id: "c", text: "16 m/s" },
              { id: "d", text: "8 m/s" },
            ],
            correctAnswerId: "a",
            solution:
              "$v(t) = s'(t) = 8t - 1$. At $t = 2$: $v(2) = 16 - 1 = 15\\text{ m/s}$.",
            difficulty: "medium",
          },
        },
      ],
    },

    // ================================================
    // LESSON 3 — Differentiation Rules
    // ================================================
    {
      id: "calc-3",
      title: "Lesson 3",
      subtitle: "Differentiation Rules",
      order: 3,
      sections: [
        {
          id: "calc-3-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "This lesson covers the essential differentiation rules — power, product, quotient, and chain rules — plus derivatives of trigonometric, exponential, and logarithmic functions. These rules let you differentiate almost any function without resorting to the limit definition.",
          order: 0,
        },
        // --- Basic rules ---
        {
          id: "calc-3-thm-power",
          type: "theorem",
          title: "Power Rule",
          content:
            "If $f(x) = x^n$ where $n$ is any real number, then:\n\n$$f'(x) = nx^{n-1}$$\n\nExamples:\n- $\\frac{d}{dx}[x^5] = 5x^4$\n- $\\frac{d}{dx}[x^{-2}] = -2x^{-3}$\n- $\\frac{d}{dx}[\\sqrt{x}] = \\frac{d}{dx}[x^{1/2}] = \\frac{1}{2}x^{-1/2}$",
          keyTakeaway:
            "Bring the exponent down and reduce the power by 1. Works for any real exponent.",
          order: 1,
        },
        {
          id: "calc-3-thm-constant",
          type: "theorem",
          title: "Constant & Constant Multiple Rules",
          content:
            "**Constant Rule:** If $f(x) = c$ (a constant), then $f'(x) = 0$.\n\n**Constant Multiple Rule:** $\\frac{d}{dx}[cf(x)] = c \\cdot f'(x)$.\n\n**Sum/Difference Rule:** $\\frac{d}{dx}[f(x) \\pm g(x)] = f'(x) \\pm g'(x)$.\n\nThese let you differentiate any polynomial term by term.",
          order: 2,
        },
        {
          id: "calc-3-ex-1",
          type: "example",
          title: "Example — Differentiating a Polynomial",
          content:
            "Find $\\frac{d}{dx}[4x^5 - 3x^3 + 7x - 2]$.",
          steps: [
            "Differentiate term by term:",
            "$\\frac{d}{dx}[4x^5] = 20x^4$",
            "$\\frac{d}{dx}[-3x^3] = -9x^2$",
            "$\\frac{d}{dx}[7x] = 7$",
            "$\\frac{d}{dx}[-2] = 0$",
            "Result: $20x^4 - 9x^2 + 7$",
          ],
          order: 3,
        },
        // --- Product Rule ---
        {
          id: "calc-3-thm-product",
          type: "theorem",
          title: "Product Rule",
          content:
            "If $f$ and $g$ are differentiable, then:\n\n$$\\frac{d}{dx}[f(x)\\cdot g(x)] = f'(x)\\cdot g(x) + f(x)\\cdot g'(x)$$\n\nMnemonic: *\"derivative of the first times the second, plus the first times the derivative of the second.\"*",
          keyTakeaway:
            "The derivative of a product is NOT the product of derivatives. Use f'g + fg'.",
          order: 4,
        },
        {
          id: "calc-3-ex-2",
          type: "example",
          title: "Example — Product Rule",
          content:
            "Differentiate $h(x) = x^2 \\sin x$.",
          steps: [
            "Let $f(x) = x^2$ and $g(x) = \\sin x$.",
            "$f'(x) = 2x$, $g'(x) = \\cos x$.",
            "$h'(x) = 2x \\sin x + x^2 \\cos x$.",
          ],
          order: 5,
        },
        // --- Quotient Rule ---
        {
          id: "calc-3-thm-quotient",
          type: "theorem",
          title: "Quotient Rule",
          content:
            "If $f$ and $g$ are differentiable and $g(x) \\neq 0$, then:\n\n$$\\frac{d}{dx}\\left[\\frac{f(x)}{g(x)}\\right] = \\frac{f'(x)g(x) - f(x)g'(x)}{[g(x)]^2}$$\n\nMnemonic: *\"lo d-hi minus hi d-lo, over lo-lo.\"*",
          keyTakeaway:
            "(bottom × derivative of top − top × derivative of bottom) / bottom²",
          order: 6,
        },
        {
          id: "calc-3-ex-3",
          type: "example",
          title: "Example — Quotient Rule",
          content:
            "Differentiate $h(x) = \\frac{x^2 + 1}{x - 3}$.",
          steps: [
            "$f(x) = x^2+1$, $g(x) = x-3$.",
            "$f'(x) = 2x$, $g'(x) = 1$.",
            "$h'(x) = \\frac{2x(x-3)-(x^2+1)(1)}{(x-3)^2}$",
            "$= \\frac{2x^2-6x-x^2-1}{(x-3)^2} = \\frac{x^2-6x-1}{(x-3)^2}$",
          ],
          order: 7,
        },
        // --- Chain Rule ---
        {
          id: "calc-3-thm-chain",
          type: "theorem",
          title: "Chain Rule",
          content:
            "If $y = f(g(x))$ (a composite function), then:\n\n$$\\frac{dy}{dx} = f'(g(x)) \\cdot g'(x)$$\n\nIn Leibniz notation, if $y = f(u)$ and $u = g(x)$:\n$$\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}$$\n\nThe chain rule is the **most important** differentiation technique. It appears every time you differentiate a composite function.",
          keyTakeaway:
            "Differentiate the outer function (keeping the inner function intact), then multiply by the derivative of the inner function.",
          order: 8,
        },
        {
          id: "calc-3-ex-4",
          type: "example",
          title: "Example — Chain Rule",
          content:
            "Differentiate $y = (3x^2 + 1)^5$.",
          steps: [
            "Outer: $u^5$, inner: $u = 3x^2 + 1$.",
            "$\\frac{dy}{dx} = 5(3x^2+1)^4 \\cdot \\frac{d}{dx}(3x^2+1)$",
            "$= 5(3x^2+1)^4 \\cdot 6x$",
            "$= 30x(3x^2+1)^4$",
          ],
          order: 9,
        },
        // --- Trig derivatives ---
        {
          id: "calc-3-thm-trig",
          type: "theorem",
          title: "Derivatives of Trigonometric Functions",
          content:
            "$$\\frac{d}{dx}[\\sin x] = \\cos x \\qquad \\frac{d}{dx}[\\cos x] = -\\sin x$$\n$$\\frac{d}{dx}[\\tan x] = \\sec^2 x \\qquad \\frac{d}{dx}[\\cot x] = -\\csc^2 x$$\n$$\\frac{d}{dx}[\\sec x] = \\sec x \\tan x \\qquad \\frac{d}{dx}[\\csc x] = -\\csc x \\cot x$$",
          order: 10,
        },
        // --- Exp and Log ---
        {
          id: "calc-3-thm-explog",
          type: "theorem",
          title: "Derivatives of Exponential & Logarithmic Functions",
          content:
            "$$\\frac{d}{dx}[e^x] = e^x \\qquad \\frac{d}{dx}[a^x] = a^x \\ln a$$\n$$\\frac{d}{dx}[\\ln x] = \\frac{1}{x} \\qquad \\frac{d}{dx}[\\log_a x] = \\frac{1}{x \\ln a}$$\n\nThe exponential function $e^x$ is its **own derivative** — a remarkable property that makes it central to calculus.",
          keyTakeaway:
            "d/dx[eˣ] = eˣ and d/dx[ln x] = 1/x. These are among the most important derivatives.",
          order: 11,
        },
        // --- Practice ---
        {
          id: "calc-3-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "Differentiate $f(x) = 6x^4 - 2x^2 + 9$.",
          order: 12,
          problem: {
            id: "calc-3-p1-q",
            choices: [
              { id: "a", text: "$24x^3 - 4x$" },
              { id: "b", text: "$24x^3 - 4x + 9$" },
              { id: "c", text: "$6x^3 - 2x$" },
              { id: "d", text: "$24x^4 - 4x^2$" },
            ],
            correctAnswerId: "a",
            solution:
              "Power rule term by term: $6(4x^3) - 2(2x) + 0 = 24x^3 - 4x$.",
            difficulty: "easy",
          },
        },
        {
          id: "calc-3-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "Find $\\frac{d}{dx}[x^3 e^x]$.",
          order: 13,
          problem: {
            id: "calc-3-p2-q",
            choices: [
              { id: "a", text: "$3x^2 e^x + x^3 e^x$" },
              { id: "b", text: "$3x^2 e^x$" },
              { id: "c", text: "$x^3 e^x$" },
              { id: "d", text: "$3x^2 + e^x$" },
            ],
            correctAnswerId: "a",
            solution:
              "Product rule: $(3x^2)(e^x) + (x^3)(e^x) = e^x(3x^2 + x^3)$.",
            difficulty: "medium",
          },
        },
        {
          id: "calc-3-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "Differentiate $y = \\sin(x^2)$.",
          order: 14,
          problem: {
            id: "calc-3-p3-q",
            choices: [
              { id: "a", text: "$2x\\cos(x^2)$" },
              { id: "b", text: "$\\cos(x^2)$" },
              { id: "c", text: "$2x\\sin(x^2)$" },
              { id: "d", text: "$x^2\\cos(x^2)$" },
            ],
            correctAnswerId: "a",
            solution:
              "Chain rule: $\\cos(x^2) \\cdot 2x = 2x\\cos(x^2)$.",
            difficulty: "medium",
          },
        },
        {
          id: "calc-3-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "Find $\\frac{d}{dx}[\\ln(3x+1)]$.",
          order: 15,
          problem: {
            id: "calc-3-p4-q",
            choices: [
              { id: "a", text: "$\\frac{3}{3x+1}$" },
              { id: "b", text: "$\\frac{1}{3x+1}$" },
              { id: "c", text: "$\\frac{1}{x}$" },
              { id: "d", text: "$\\frac{3}{x}$" },
            ],
            correctAnswerId: "a",
            solution:
              "Chain rule: $\\frac{1}{3x+1}\\cdot 3 = \\frac{3}{3x+1}$.",
            difficulty: "easy",
          },
        },
      ],
    },

    // ================================================
    // LESSON 4 — Applications of Derivatives
    // ================================================
    {
      id: "calc-4",
      title: "Lesson 4",
      subtitle: "Applications of Derivatives",
      order: 4,
      sections: [
        {
          id: "calc-4-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "This lesson applies derivatives to real problems: finding extreme values, analyzing increasing/decreasing behavior and concavity, sketching curves, solving optimization problems, and understanding related rates. These are among the most important applications in all of calculus.",
          order: 0,
        },
        // --- Critical points & extreme values ---
        {
          id: "calc-4-def-critical",
          type: "definition",
          title: "Critical Points",
          content:
            "A **critical point** (or critical number) of $f$ is a value $c$ in the domain of $f$ where either:\n\n1. $f'(c) = 0$, or\n2. $f'(c)$ does not exist.\n\nCritical points are the **only** candidates for local maxima and minima.",
          order: 1,
        },
        {
          id: "calc-4-thm-evt",
          type: "theorem",
          title: "Extreme Value Theorem",
          content:
            "If $f$ is **continuous** on a **closed interval** $[a,b]$, then $f$ attains both an **absolute maximum** and an **absolute minimum** on $[a,b]$.\n\nTo find them, evaluate $f$ at:\n1. All **critical points** in $(a,b)$.\n2. The **endpoints** $a$ and $b$.\n\nThe largest value is the absolute maximum; the smallest is the absolute minimum.",
          keyTakeaway:
            "On a closed interval, check critical points and endpoints. The biggest and smallest values win.",
          order: 2,
        },
        {
          id: "calc-4-ex-1",
          type: "example",
          title: "Example — Finding Absolute Extrema",
          content:
            "Find the absolute maximum and minimum of $f(x) = x^3 - 3x + 1$ on $[-2, 3]$.",
          steps: [
            "$f'(x) = 3x^2 - 3 = 3(x^2 - 1) = 3(x-1)(x+1)$.",
            "Critical points: $x = 1$ and $x = -1$ (both in $[-2,3]$).",
            "Evaluate: $f(-2) = -8+6+1 = -1$, $f(-1) = -1+3+1 = 3$, $f(1) = 1-3+1 = -1$, $f(3) = 27-9+1 = 19$.",
            "Absolute max: $f(3) = 19$. Absolute min: $f(-2) = f(1) = -1$.",
          ],
          order: 3,
        },
        // --- Mean Value Theorem ---
        {
          id: "calc-4-thm-mvt",
          type: "theorem",
          title: "Mean Value Theorem (MVT)",
          content:
            "If $f$ is continuous on $[a,b]$ and differentiable on $(a,b)$, then there exists at least one $c \\in (a,b)$ such that:\n\n$$f'(c) = \\frac{f(b) - f(a)}{b - a}$$\n\nGeometrically: there is a point where the **tangent line** is parallel to the **secant line** through $(a, f(a))$ and $(b, f(b))$.",
          keyTakeaway:
            "At some point, the instantaneous rate of change equals the average rate of change over the interval.",
          order: 4,
        },
        // --- First derivative test ---
        {
          id: "calc-4-thm-fdt",
          type: "theorem",
          title: "First Derivative Test",
          content:
            "Let $c$ be a critical point of a continuous function $f$:\n\n- If $f'$ changes from **positive to negative** at $c$, then $f$ has a **local maximum** at $c$.\n- If $f'$ changes from **negative to positive** at $c$, then $f$ has a **local minimum** at $c$.\n- If $f'$ does not change sign, then $c$ is **not** a local extremum.\n\n$f' > 0$ means $f$ is **increasing**; $f' < 0$ means $f$ is **decreasing**.",
          keyTakeaway:
            "f' changes + to − ⟹ local max. f' changes − to + ⟹ local min.",
          order: 5,
        },
        // --- Second derivative test ---
        {
          id: "calc-4-thm-sdt",
          type: "theorem",
          title: "Second Derivative Test & Concavity",
          content:
            "**Concavity:**\n- $f''(x) > 0$: the graph is **concave up** (opens upward, like a cup).\n- $f''(x) < 0$: the graph is **concave down** (opens downward, like a cap).\n\nAn **inflection point** is where concavity changes.\n\n**Second Derivative Test:** If $f'(c) = 0$:\n- $f''(c) > 0 \\Rightarrow$ local **minimum** at $c$.\n- $f''(c) < 0 \\Rightarrow$ local **maximum** at $c$.\n- $f''(c) = 0 \\Rightarrow$ test is **inconclusive**.",
          keyTakeaway:
            "f''(c) > 0 at a critical point ⟹ local min (concave up). f''(c) < 0 ⟹ local max (concave down).",
          order: 6,
        },
        {
          id: "calc-4-ex-2",
          type: "example",
          title: "Example — Curve Sketching",
          content:
            "Sketch $f(x) = x^3 - 6x^2 + 9x + 1$ by finding critical points, intervals of increase/decrease, and concavity.",
          steps: [
            "$f'(x) = 3x^2 - 12x + 9 = 3(x-1)(x-3)$. Critical points: $x = 1, 3$.",
            "Sign chart: $f' > 0$ on $(-\\infty,1)$, $f' < 0$ on $(1,3)$, $f' > 0$ on $(3,\\infty)$.",
            "So $f$ has a local max at $x = 1$ ($f(1) = 5$) and local min at $x = 3$ ($f(3) = 1$).",
            "$f''(x) = 6x - 12 = 0 \\Rightarrow x = 2$. Inflection point at $(2, 3)$.",
            "Concave down on $(-\\infty, 2)$; concave up on $(2, \\infty)$.",
          ],
          order: 7,
        },
        // --- L'Hôpital's Rule ---
        {
          id: "calc-4-thm-lhopital",
          type: "theorem",
          title: "L'Hôpital's Rule",
          content:
            "If $\\lim_{x\\to a}\\frac{f(x)}{g(x)}$ gives the indeterminate form $\\frac{0}{0}$ or $\\frac{\\pm\\infty}{\\pm\\infty}$, and $f$ and $g$ are differentiable near $a$ with $g'(x) \\neq 0$, then:\n\n$$\\lim_{x\\to a}\\frac{f(x)}{g(x)} = \\lim_{x\\to a}\\frac{f'(x)}{g'(x)}$$\n\nprovided the right-hand limit exists (or is $\\pm\\infty$). Works for $a = \\pm\\infty$ too.",
          keyTakeaway:
            "0/0 or ∞/∞? Differentiate top and bottom separately, then take the limit again.",
          order: 8,
        },
        {
          id: "calc-4-ex-3",
          type: "example",
          title: "Example — L'Hôpital's Rule",
          content:
            "Evaluate $\\lim_{x \\to 0}\\frac{e^x - 1}{x}$.",
          steps: [
            "Direct substitution: $\\frac{e^0-1}{0} = \\frac{0}{0}$ — indeterminate.",
            "Apply L'Hôpital: $\\lim_{x\\to 0}\\frac{e^x}{1} = e^0 = 1$.",
          ],
          order: 9,
        },
        // --- Optimization ---
        {
          id: "calc-4-note-optimization",
          type: "note",
          title: "Optimization Strategy",
          content:
            "To solve optimization problems:\n\n1. **Draw a picture** and identify variables.\n2. Write an equation for the quantity to **maximize or minimize**.\n3. Express it in terms of **one variable** (use constraints to eliminate others).\n4. Find the **derivative**, set it to zero, and solve.\n5. Verify it's a **max or min** (use the second derivative test or check endpoints).\n6. Answer the question asked.",
          order: 10,
        },
        {
          id: "calc-4-ex-4",
          type: "example",
          title: "Example — Optimization",
          content:
            "A farmer has 200 m of fencing to enclose a rectangular field against a river (no fence needed along the river). What dimensions maximize the area?",
          steps: [
            "Let $x$ = length parallel to river, $y$ = width. Constraint: $x + 2y = 200$.",
            "Area: $A = xy = (200 - 2y)y = 200y - 2y^2$.",
            "$A'(y) = 200 - 4y = 0 \\Rightarrow y = 50\\text{ m}$.",
            "$x = 200 - 2(50) = 100\\text{ m}$.",
            "$A''(y) = -4 < 0$, confirming a maximum.",
            "Maximum area: $100 \\times 50 = 5000\\text{ m}^2$.",
          ],
          order: 11,
        },
        // --- Practice ---
        {
          id: "calc-4-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "Find the critical points of $f(x) = x^3 - 12x + 5$.",
          order: 12,
          problem: {
            id: "calc-4-p1-q",
            choices: [
              { id: "a", text: "x = 2 and x = −2" },
              { id: "b", text: "x = 0" },
              { id: "c", text: "x = 12" },
              { id: "d", text: "x = 2 only" },
            ],
            correctAnswerId: "a",
            solution:
              "$f'(x) = 3x^2 - 12 = 3(x^2-4) = 3(x-2)(x+2) = 0$ when $x = 2$ or $x = -2$.",
            difficulty: "easy",
          },
        },
        {
          id: "calc-4-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "Evaluate $\\lim_{x \\to 0}\\frac{\\sin x - x}{x^3}$ using L'Hôpital's Rule.",
          order: 13,
          problem: {
            id: "calc-4-p2-q",
            choices: [
              { id: "a", text: "$-\\frac{1}{6}$" },
              { id: "b", text: "0" },
              { id: "c", text: "$\\frac{1}{6}$" },
              { id: "d", text: "Does not exist" },
            ],
            correctAnswerId: "a",
            solution:
              "Apply L'Hôpital three times: $\\frac{\\cos x - 1}{3x^2} \\to \\frac{-\\sin x}{6x} \\to \\frac{-\\cos x}{6} \\to \\frac{-1}{6}$.",
            difficulty: "hard",
          },
        },
        {
          id: "calc-4-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "For $f(x) = x^4 - 4x^3$, find the inflection point(s).",
          order: 14,
          problem: {
            id: "calc-4-p3-q",
            choices: [
              { id: "a", text: "x = 0 and x = 2" },
              { id: "b", text: "x = 2 only" },
              { id: "c", text: "x = 3 only" },
              { id: "d", text: "x = 0 only" },
            ],
            correctAnswerId: "a",
            solution:
              "$f''(x) = 12x^2 - 24x = 12x(x-2) = 0$ at $x = 0$ and $x = 2$. Check sign changes: $f''$ changes sign at both, so both are inflection points.",
            difficulty: "medium",
          },
        },
        {
          id: "calc-4-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "Find the absolute maximum of $f(x) = -x^2 + 4x + 1$ on $[0, 5]$.",
          order: 15,
          problem: {
            id: "calc-4-p4-q",
            choices: [
              { id: "a", text: "5" },
              { id: "b", text: "6" },
              { id: "c", text: "1" },
              { id: "d", text: "4" },
            ],
            correctAnswerId: "a",
            solution:
              "$f'(x) = -2x + 4 = 0 \\Rightarrow x = 2$. $f(0) = 1$, $f(2) = -4+8+1 = 5$, $f(5) = -25+20+1 = -4$. Max is $f(2) = 5$.",
            difficulty: "medium",
          },
        },
      ],
    },

    // ================================================
    // LESSON 5 — Integration
    // ================================================
    {
      id: "calc-5",
      title: "Lesson 5",
      subtitle: "Integration",
      order: 5,
      sections: [
        {
          id: "calc-5-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "This lesson introduces the integral — the second pillar of calculus. You'll learn about antiderivatives, indefinite integrals, Riemann sums, the definite integral, the Fundamental Theorem of Calculus, and basic integration techniques including substitution.",
          order: 0,
        },
        // --- Antiderivatives ---
        {
          id: "calc-5-def-antideriv",
          type: "definition",
          title: "Antiderivative",
          content:
            "A function $F$ is an **antiderivative** of $f$ on an interval $I$ if $F'(x) = f(x)$ for all $x$ in $I$.\n\nIf $F$ is one antiderivative of $f$, then the **most general antiderivative** is $F(x) + C$, where $C$ is an arbitrary constant.\n\nExample: $F(x) = \\frac{1}{3}x^3 + C$ is the general antiderivative of $f(x) = x^2$.",
          order: 1,
        },
        {
          id: "calc-5-def-indefinite",
          type: "definition",
          title: "Indefinite Integral",
          content:
            "The **indefinite integral** is notation for the most general antiderivative:\n\n$$\\int f(x)\\,dx = F(x) + C$$\n\nwhere $F'(x) = f(x)$. The $\\int$ is the **integral sign**, $f(x)$ is the **integrand**, $dx$ indicates the variable, and $C$ is the **constant of integration**.",
          order: 2,
        },
        // --- Basic integration rules ---
        {
          id: "calc-5-thm-rules",
          type: "theorem",
          title: "Basic Integration Rules",
          content:
            "**Power Rule:** $\\int x^n\\,dx = \\frac{x^{n+1}}{n+1} + C$ \\quad ($n \\neq -1$)\n\n**Special cases:**\n$$\\int 1\\,dx = x + C$$\n$$\\int x^{-1}\\,dx = \\ln|x| + C$$\n$$\\int e^x\\,dx = e^x + C$$\n$$\\int \\sin x\\,dx = -\\cos x + C$$\n$$\\int \\cos x\\,dx = \\sin x + C$$\n$$\\int \\sec^2 x\\,dx = \\tan x + C$$\n\n**Sum/Constant Multiple:** $\\int [af(x)+bg(x)]\\,dx = a\\int f(x)\\,dx + b\\int g(x)\\,dx$",
          keyTakeaway:
            "Integration reverses differentiation: raise the power by 1 and divide by the new exponent.",
          order: 3,
        },
        {
          id: "calc-5-ex-1",
          type: "example",
          title: "Example — Basic Integrals",
          content:
            "Evaluate $\\int (3x^2 - 4x + 5)\\,dx$.",
          steps: [
            "$\\int 3x^2\\,dx = 3 \\cdot \\frac{x^3}{3} = x^3$",
            "$\\int -4x\\,dx = -4 \\cdot \\frac{x^2}{2} = -2x^2$",
            "$\\int 5\\,dx = 5x$",
            "Result: $x^3 - 2x^2 + 5x + C$",
          ],
          order: 4,
        },
        // --- Riemann sums & definite integral ---
        {
          id: "calc-5-def-riemann",
          type: "definition",
          title: "Riemann Sums & The Definite Integral",
          content:
            "A **Riemann sum** approximates the area under $f(x)$ on $[a,b]$ by dividing it into $n$ rectangles of width $\\Delta x = \\frac{b-a}{n}$:\n\n$$\\sum_{i=1}^{n} f(x_i^*)\\,\\Delta x$$\n\nThe **definite integral** is the limit of Riemann sums as $n \\to \\infty$:\n\n$$\\int_a^b f(x)\\,dx = \\lim_{n\\to\\infty}\\sum_{i=1}^{n} f(x_i^*)\\,\\Delta x$$\n\nGeometrically, it represents the **signed area** between $f(x)$ and the $x$-axis on $[a,b]$ (positive above, negative below).",
          order: 5,
        },
        {
          id: "calc-5-diagram-riemann",
          type: "diagram",
          title: "Riemann Sum Visualization",
          content:
            "The area under the curve $y = f(x)$ from $a$ to $b$ is approximated by the sum of rectangle areas. As the number of rectangles increases, the approximation improves and approaches the exact integral.",
          imageComponent: "RiemannSumDiagram",
          order: 6,
        },
        // --- FTC ---
        {
          id: "calc-5-thm-ftc1",
          type: "theorem",
          title: "Fundamental Theorem of Calculus — Part 1",
          content:
            "If $f$ is continuous on $[a,b]$ and $F(x) = \\int_a^x f(t)\\,dt$, then $F$ is differentiable and:\n\n$$F'(x) = \\frac{d}{dx}\\int_a^x f(t)\\,dt = f(x)$$\n\nIn words: the derivative of the \"area-so-far\" function is the original function. **Differentiation and integration are inverse processes.**",
          keyTakeaway:
            "The derivative of ∫ₐˣ f(t)dt is just f(x). Integration and differentiation undo each other.",
          order: 7,
        },
        {
          id: "calc-5-thm-ftc2",
          type: "theorem",
          title: "Fundamental Theorem of Calculus — Part 2 (Evaluation Theorem)",
          content:
            "If $f$ is continuous on $[a,b]$ and $F$ is any antiderivative of $f$, then:\n\n$$\\int_a^b f(x)\\,dx = F(b) - F(a)$$\n\nThis connects the **definite integral** (area) with **antiderivatives**. Instead of computing a limit of Riemann sums, find an antiderivative and evaluate at the bounds.\n\nNotation: $F(x)\\Big|_a^b = F(b) - F(a)$.",
          keyTakeaway:
            "To evaluate a definite integral: find an antiderivative, plug in the bounds, and subtract. This is the most powerful result in all of calculus.",
          order: 8,
        },
        {
          id: "calc-5-ex-2",
          type: "example",
          title: "Example — Evaluating a Definite Integral",
          content:
            "Evaluate $\\int_1^3 (2x + 1)\\,dx$.",
          steps: [
            "Antiderivative: $F(x) = x^2 + x$.",
            "$F(3) - F(1) = (9 + 3) - (1 + 1) = 12 - 2 = 10$.",
          ],
          order: 9,
        },
        {
          id: "calc-5-ex-3",
          type: "example",
          title: "Example — Area Under a Curve",
          content:
            "Find the area under $f(x) = x^2$ from $x = 0$ to $x = 3$.",
          steps: [
            "$\\int_0^3 x^2\\,dx = \\frac{x^3}{3}\\Big|_0^3$",
            "$= \\frac{27}{3} - \\frac{0}{3} = 9$",
          ],
          order: 10,
        },
        // --- Substitution ---
        {
          id: "calc-5-thm-substitution",
          type: "theorem",
          title: "Integration by Substitution (u-Substitution)",
          content:
            "If $u = g(x)$ is differentiable and $f$ is continuous, then:\n\n$$\\int f(g(x))\\cdot g'(x)\\,dx = \\int f(u)\\,du$$\n\n**Steps:**\n1. Choose $u = g(x)$ (often the \"inner\" function).\n2. Compute $du = g'(x)\\,dx$.\n3. Rewrite the integral entirely in terms of $u$.\n4. Integrate with respect to $u$.\n5. Substitute back $u = g(x)$.\n\nFor definite integrals, change the bounds: when $x = a$, $u = g(a)$; when $x = b$, $u = g(b)$.",
          keyTakeaway:
            "u-sub is the reverse of the chain rule. Let u = inner function, du = its derivative × dx.",
          order: 11,
        },
        {
          id: "calc-5-ex-4",
          type: "example",
          title: "Example — u-Substitution",
          content:
            "Evaluate $\\int 2x\\cos(x^2)\\,dx$.",
          steps: [
            "Let $u = x^2$, so $du = 2x\\,dx$.",
            "The integral becomes $\\int \\cos u\\,du = \\sin u + C$.",
            "Substitute back: $\\sin(x^2) + C$.",
          ],
          order: 12,
        },
        // --- Properties of definite integrals ---
        {
          id: "calc-5-thm-properties",
          type: "theorem",
          title: "Properties of Definite Integrals",
          content:
            "Let $f$ and $g$ be integrable on $[a,b]$.\n\n1. $\\int_a^a f(x)\\,dx = 0$\n2. $\\int_a^b f(x)\\,dx = -\\int_b^a f(x)\\,dx$\n3. $\\int_a^b [f(x)+g(x)]\\,dx = \\int_a^b f(x)\\,dx + \\int_a^b g(x)\\,dx$\n4. $\\int_a^b cf(x)\\,dx = c\\int_a^b f(x)\\,dx$\n5. $\\int_a^b f(x)\\,dx = \\int_a^c f(x)\\,dx + \\int_c^b f(x)\\,dx$ for any $c$\n6. If $f(x) \\geq 0$ on $[a,b]$, then $\\int_a^b f(x)\\,dx \\geq 0$",
          order: 13,
        },
        // --- Practice ---
        {
          id: "calc-5-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "Evaluate $\\int (4x^3 - 6x)\\,dx$.",
          order: 14,
          problem: {
            id: "calc-5-p1-q",
            choices: [
              { id: "a", text: "$x^4 - 3x^2 + C$" },
              { id: "b", text: "$12x^2 - 6 + C$" },
              { id: "c", text: "$x^4 - 6x^2 + C$" },
              { id: "d", text: "$4x^4 - 3x^2 + C$" },
            ],
            correctAnswerId: "a",
            solution:
              "$\\int 4x^3\\,dx = x^4$ and $\\int -6x\\,dx = -3x^2$. Answer: $x^4 - 3x^2 + C$.",
            difficulty: "easy",
          },
        },
        {
          id: "calc-5-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "Evaluate $\\int_0^2 (3x^2 + 1)\\,dx$.",
          order: 15,
          problem: {
            id: "calc-5-p2-q",
            choices: [
              { id: "a", text: "10" },
              { id: "b", text: "14" },
              { id: "c", text: "8" },
              { id: "d", text: "12" },
            ],
            correctAnswerId: "a",
            solution:
              "$F(x) = x^3 + x$. $F(2) - F(0) = (8+2) - 0 = 10$.",
            difficulty: "easy",
          },
        },
        {
          id: "calc-5-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "Using substitution, evaluate $\\int 3x^2 e^{x^3}\\,dx$.",
          order: 16,
          problem: {
            id: "calc-5-p3-q",
            choices: [
              { id: "a", text: "$e^{x^3} + C$" },
              { id: "b", text: "$3e^{x^3} + C$" },
              { id: "c", text: "$x^3 e^{x^3} + C$" },
              { id: "d", text: "$\\frac{e^{x^3}}{x^3} + C$" },
            ],
            correctAnswerId: "a",
            solution:
              "Let $u = x^3$, $du = 3x^2\\,dx$. $\\int e^u\\,du = e^u + C = e^{x^3} + C$.",
            difficulty: "medium",
          },
        },
        {
          id: "calc-5-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "Find $\\frac{d}{dx}\\int_1^x \\cos(t^2)\\,dt$.",
          order: 17,
          problem: {
            id: "calc-5-p4-q",
            choices: [
              { id: "a", text: "$\\cos(x^2)$" },
              { id: "b", text: "$\\sin(x^2)$" },
              { id: "c", text: "$2x\\cos(x^2)$" },
              { id: "d", text: "$-\\sin(x^2)$" },
            ],
            correctAnswerId: "a",
            solution:
              "By the Fundamental Theorem of Calculus Part 1: $\\frac{d}{dx}\\int_1^x f(t)\\,dt = f(x) = \\cos(x^2)$.",
            difficulty: "medium",
          },
        },
      ],
    },
  ],
};
