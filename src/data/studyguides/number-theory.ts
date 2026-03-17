import type { StudyGuide } from "@/types/studyguide";

/**
 * College Number Theory Study Guide
 * Based on Whitman College "Introduction to Higher Mathematics" — Chapter 3: Number Theory
 * by David Guichard (CC-BY-NC-SA 3.0)
 * https://www.whitman.edu/mathematics/higher_math_online/chapter03.html
 *
 * Also draws from Victor Shoup "A Computational Introduction to Number Theory and Algebra"
 * (freely available) and standard undergraduate number theory curricula.
 *
 * Covers Divisibility & Primes, Modular Arithmetic, GCD & Euclidean Algorithm,
 * Fundamental Theorem of Arithmetic, and Euler's Theorem & RSA.
 */
export const numberTheory: StudyGuide = {
  id: "number-theory",
  title: "College Number Theory",
  subject: "Mathematics",
  chapter: "1–5",
  description:
    "Explore divisibility and primes, modular arithmetic, the Euclidean algorithm, the Fundamental Theorem of Arithmetic, Euler's and Fermat's theorems, and their applications to cryptography.",
  coverColor: "from-violet-500/20 to-purple-500/20",
  icon: "Hash",
  lessons: [
    // ================================================
    // LESSON 1 — Divisibility & Prime Numbers
    // ================================================
    {
      id: "nt-1",
      title: "Lesson 1",
      subtitle: "Divisibility & Prime Numbers",
      order: 1,
      sections: [
        {
          id: "nt-1-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "This lesson introduces the foundational ideas of number theory: divisibility, the Division Algorithm, prime and composite numbers, and basic properties of primes that will be used throughout the course.",
          order: 0,
        },
        // --- Divisibility ---
        {
          id: "nt-1-def-divides",
          type: "definition",
          title: "Divisibility",
          content:
            "Let $a, b \\in \\mathbb{Z}$ with $a \\neq 0$. We say **$a$ divides $b$** (written $a \\mid b$) if there exists an integer $k$ such that:\n\n$$b = ak$$\n\nWe also say $a$ is a **divisor** (or **factor**) of $b$, and $b$ is a **multiple** of $a$.\n\nIf $a$ does not divide $b$, we write $a \\nmid b$.\n\nExamples: $3 \\mid 12$ (since $12 = 3 \\cdot 4$), but $5 \\nmid 12$.",
          order: 1,
        },
        {
          id: "nt-1-thm-div-properties",
          type: "theorem",
          title: "Properties of Divisibility",
          content:
            "Let $a, b, c \\in \\mathbb{Z}$.\n\n1. **Reflexivity:** $a \\mid a$ for all $a \\neq 0$.\n2. **Transitivity:** If $a \\mid b$ and $b \\mid c$, then $a \\mid c$.\n3. **Linearity:** If $a \\mid b$ and $a \\mid c$, then $a \\mid (bx + cy)$ for all $x, y \\in \\mathbb{Z}$.\n4. **Comparison:** If $a \\mid b$ and $b \\neq 0$, then $|a| \\leq |b|$.\n5. If $a \\mid b$ and $b \\mid a$, then $a = \\pm b$.",
          keyTakeaway:
            "Divisibility is transitive and respects linear combinations — key facts used in every proof.",
          order: 2,
        },
        {
          id: "nt-1-ex-1",
          type: "example",
          title: "Example — Proving a Divisibility Statement",
          content:
            "Prove: If $6 \\mid n$, then $3 \\mid n$.",
          steps: [
            "$6 \\mid n$ means $n = 6k$ for some integer $k$.",
            "Rewrite: $n = 3(2k)$.",
            "Since $2k$ is an integer, $3 \\mid n$. ∎",
          ],
          order: 3,
        },
        // --- Division Algorithm ---
        {
          id: "nt-1-thm-divalg",
          type: "theorem",
          title: "The Division Algorithm",
          content:
            "For any integers $a$ and $b$ with $b > 0$, there exist **unique** integers $q$ (quotient) and $r$ (remainder) such that:\n\n$$a = bq + r, \\quad 0 \\leq r < b$$\n\nWe write $q = a \\div b$ (integer quotient) and $r = a \\bmod b$ (remainder).\n\nExample: $a = 23, b = 5$: $23 = 5 \\cdot 4 + 3$, so $q = 4, r = 3$.",
          keyTakeaway:
            "Every integer can be uniquely expressed as bq + r with 0 ≤ r < b. This is the basis of modular arithmetic.",
          order: 4,
        },
        {
          id: "nt-1-ex-2",
          type: "example",
          title: "Example — Division Algorithm",
          content:
            "Find the quotient and remainder when $a = -17$ is divided by $b = 5$.",
          steps: [
            "We need $-17 = 5q + r$ with $0 \\leq r < 5$.",
            "$-17 = 5(-4) + 3$ since $5(-4) = -20$ and $-17 - (-20) = 3$.",
            "So $q = -4$ and $r = 3$.",
            "Check: $5(-4) + 3 = -20 + 3 = -17$. ✓",
          ],
          order: 5,
        },
        // --- Primes ---
        {
          id: "nt-1-def-prime",
          type: "definition",
          title: "Prime & Composite Numbers",
          content:
            "An integer $p > 1$ is **prime** if its only positive divisors are $1$ and $p$ itself.\n\nAn integer $n > 1$ that is **not** prime is called **composite** — it can be written as $n = ab$ where $1 < a, b < n$.\n\nBy convention, $1$ is **neither** prime nor composite.\n\nThe first few primes: $2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, \\ldots$\n\nNote: $2$ is the **only** even prime.",
          order: 6,
        },
        {
          id: "nt-1-thm-infinite-primes",
          type: "theorem",
          title: "Euclid's Theorem — Infinitely Many Primes",
          content:
            "**Theorem (Euclid, c. 300 BCE):** There are **infinitely many** prime numbers.\n\n**Proof (by contradiction):** Suppose there are only finitely many primes: $p_1, p_2, \\ldots, p_n$. Consider:\n$$N = p_1 p_2 \\cdots p_n + 1$$\n$N$ is not divisible by any $p_i$ (since dividing gives remainder $1$). So either $N$ is prime, or $N$ has a prime factor not in our list. Either way, we have a prime not in the list — contradiction. ∎",
          keyTakeaway:
            "One of the most elegant proofs in mathematics: multiply all known primes and add 1 to get a contradiction.",
          order: 7,
        },
        {
          id: "nt-1-thm-prime-divisor",
          type: "theorem",
          title: "Every Integer Has a Prime Divisor",
          content:
            "Every integer $n > 1$ has at least one prime divisor. Moreover, if $n$ is composite, then $n$ has a prime divisor $p \\leq \\sqrt{n}$.\n\n**Proof of the second part:** If $n = ab$ with $1 < a \\leq b < n$, then $a^2 \\leq ab = n$, so $a \\leq \\sqrt{n}$. Since $a > 1$, $a$ has a prime divisor $p \\leq a \\leq \\sqrt{n}$. ∎\n\nThis gives us a primality test: to check if $n$ is prime, only test divisors up to $\\sqrt{n}$.",
          keyTakeaway:
            "To check primality of n, you only need to check prime divisors up to √n.",
          order: 8,
        },
        {
          id: "nt-1-ex-3",
          type: "example",
          title: "Example — Testing Primality",
          content:
            "Is $97$ prime?",
          steps: [
            "$\\sqrt{97} \\approx 9.85$, so we check primes up to $9$: $\\{2, 3, 5, 7\\}$.",
            "$97 / 2 = 48.5$ — not divisible.",
            "$97 / 3 = 32.33\\ldots$ — not divisible (digit sum $= 16$, not divisible by 3).",
            "$97 / 5 = 19.4$ — not divisible (doesn't end in 0 or 5).",
            "$97 / 7 = 13.86\\ldots$ — not divisible.",
            "No prime up to $\\sqrt{97}$ divides $97$, so $97$ is **prime**.",
          ],
          order: 9,
        },
        // --- Sieve of Eratosthenes ---
        {
          id: "nt-1-note-sieve",
          type: "note",
          title: "The Sieve of Eratosthenes",
          content:
            "To find all primes up to $N$:\n\n1. List all integers from $2$ to $N$.\n2. Start with the smallest unmarked number ($2$). Circle it as prime.\n3. Cross out all multiples of $2$ (except $2$ itself).\n4. Move to the next unmarked number ($3$). Circle it.\n5. Cross out all multiples of $3$.\n6. Repeat until you've processed all primes up to $\\sqrt{N}$.\n7. All remaining unmarked numbers are prime.\n\nThis ancient algorithm (c. 240 BCE) is remarkably efficient and still used in practice.",
          order: 10,
        },
        // --- Practice ---
        {
          id: "nt-1-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "Find the quotient and remainder when $47$ is divided by $8$. What is the remainder?",
          order: 11,
          problem: {
            id: "nt-1-p1-q",
            choices: [
              { id: "a", text: "7" },
              { id: "b", text: "5" },
              { id: "c", text: "3" },
              { id: "d", text: "8" },
            ],
            correctAnswerId: "a",
            solution:
              "$47 = 8 \\cdot 5 + 7$, so $q = 5$ and $r = 7$.",
            difficulty: "easy",
          },
        },
        {
          id: "nt-1-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "Is $143$ prime or composite?",
          order: 12,
          problem: {
            id: "nt-1-p2-q",
            choices: [
              { id: "a", text: "Composite (11 × 13)" },
              { id: "b", text: "Prime" },
              { id: "c", text: "Composite (7 × 20 + 3)" },
              { id: "d", text: "Neither" },
            ],
            correctAnswerId: "a",
            solution:
              "$\\sqrt{143} \\approx 11.96$. Check: $143/11 = 13$. So $143 = 11 \\times 13$ — composite.",
            difficulty: "easy",
          },
        },
        {
          id: "nt-1-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "If $a \\mid b$ and $a \\mid c$, does $a \\mid (2b + 3c)$?",
          order: 13,
          problem: {
            id: "nt-1-p3-q",
            choices: [
              { id: "a", text: "Yes, always" },
              { id: "b", text: "No, never" },
              { id: "c", text: "Only if a is prime" },
              { id: "d", text: "Only if b = c" },
            ],
            correctAnswerId: "a",
            solution:
              "By the linearity property: if $a \\mid b$ and $a \\mid c$, then $a \\mid (bx + cy)$ for any integers $x,y$. So $a \\mid (2b + 3c)$.",
            difficulty: "medium",
          },
        },
        {
          id: "nt-1-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "In Euclid's proof, if we take primes $\\{2, 3, 5\\}$ and form $N = 2 \\cdot 3 \\cdot 5 + 1 = 31$, is $N$ prime?",
          order: 14,
          problem: {
            id: "nt-1-p4-q",
            choices: [
              { id: "a", text: "Yes, 31 is prime" },
              { id: "b", text: "No, 31 = 7 × something" },
              { id: "c", text: "No, 31 is composite" },
              { id: "d", text: "Cannot determine" },
            ],
            correctAnswerId: "a",
            solution:
              "$\\sqrt{31} \\approx 5.57$. Check $2, 3, 5$: none divide $31$. So $31$ is prime. Note: $N$ in Euclid's proof is not always prime (e.g., $2\\cdot3\\cdot5\\cdot7\\cdot11\\cdot13+1=30031=59\\times509$), but it always reveals a new prime.",
            difficulty: "medium",
          },
        },
      ],
    },

    // ================================================
    // LESSON 2 — Modular Arithmetic & Congruences
    // ================================================
    {
      id: "nt-2",
      title: "Lesson 2",
      subtitle: "Modular Arithmetic & Congruences",
      order: 2,
      sections: [
        {
          id: "nt-2-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "This lesson introduces the language of congruences — a powerful framework for studying remainders. You'll learn modular arithmetic, properties of congruences, and how to solve linear congruences.",
          order: 0,
        },
        // --- Congruence definition ---
        {
          id: "nt-2-def-congruence",
          type: "definition",
          title: "Congruence Modulo n",
          content:
            "Let $n > 0$ be an integer. We say $a$ is **congruent to** $b$ modulo $n$, written:\n\n$$a \\equiv b \\pmod{n}$$\n\nif $n \\mid (a - b)$, i.e., $a - b = kn$ for some integer $k$.\n\nEquivalently, $a$ and $b$ have the **same remainder** when divided by $n$.\n\nExamples:\n- $17 \\equiv 2 \\pmod{5}$ since $17 - 2 = 15 = 5 \\cdot 3$.\n- $-3 \\equiv 4 \\pmod{7}$ since $-3 - 4 = -7 = 7(-1)$.",
          order: 1,
        },
        {
          id: "nt-2-thm-equiv",
          type: "theorem",
          title: "Congruence Is an Equivalence Relation",
          content:
            "For a fixed modulus $n > 0$, the congruence relation $\\equiv \\pmod{n}$ is:\n\n1. **Reflexive:** $a \\equiv a \\pmod{n}$.\n2. **Symmetric:** If $a \\equiv b$, then $b \\equiv a \\pmod{n}$.\n3. **Transitive:** If $a \\equiv b$ and $b \\equiv c$, then $a \\equiv c \\pmod{n}$.\n\nThis partitions $\\mathbb{Z}$ into $n$ **residue classes** (equivalence classes): $\\{[0], [1], [2], \\ldots, [n-1]\\}$.",
          keyTakeaway:
            "Congruence mod n partitions all integers into exactly n residue classes.",
          order: 2,
        },
        // --- Arithmetic properties ---
        {
          id: "nt-2-thm-arithmetic",
          type: "theorem",
          title: "Arithmetic of Congruences",
          content:
            "If $a \\equiv b \\pmod{n}$ and $c \\equiv d \\pmod{n}$, then:\n\n1. **Addition:** $a + c \\equiv b + d \\pmod{n}$\n2. **Subtraction:** $a - c \\equiv b - d \\pmod{n}$\n3. **Multiplication:** $ac \\equiv bd \\pmod{n}$\n4. **Powers:** $a^k \\equiv b^k \\pmod{n}$ for any $k \\geq 0$\n\n⚠️ **Division is NOT always valid.** $6 \\equiv 0 \\pmod{3}$ but $6/2 \\not\\equiv 0/2 \\pmod{3}$ in the sense that we need $\\gcd(\\text{divisor}, n) = 1$ for cancellation.",
          keyTakeaway:
            "You can add, subtract, multiply, and raise to powers within congruences. Division requires caution.",
          order: 3,
        },
        {
          id: "nt-2-ex-1",
          type: "example",
          title: "Example — Modular Arithmetic",
          content:
            "Find $3^{100} \\bmod 7$.",
          steps: [
            "Compute powers of 3 mod 7:",
            "$3^1 \\equiv 3$, $3^2 \\equiv 2$, $3^3 \\equiv 6$, $3^4 \\equiv 4$, $3^5 \\equiv 5$, $3^6 \\equiv 1 \\pmod{7}$.",
            "The pattern repeats with period 6.",
            "$100 = 6 \\cdot 16 + 4$, so $3^{100} \\equiv 3^4 \\equiv 4 \\pmod{7}$.",
          ],
          order: 4,
        },
        // --- Residue classes (Zn) ---
        {
          id: "nt-2-def-zn",
          type: "definition",
          title: "The Ring $\\mathbb{Z}_n$",
          content:
            "The set $\\mathbb{Z}_n = \\{0, 1, 2, \\ldots, n-1\\}$ with addition and multiplication modulo $n$ forms a **ring**.\n\nIn $\\mathbb{Z}_n$, every arithmetic operation reduces the result to its remainder mod $n$.\n\nExample in $\\mathbb{Z}_7$: $5 + 4 = 9 \\equiv 2$, and $5 \\times 4 = 20 \\equiv 6$.\n\n$\\mathbb{Z}_n$ is a **field** (every nonzero element has a multiplicative inverse) **if and only if** $n$ is prime.",
          order: 5,
        },
        // --- Modular inverses ---
        {
          id: "nt-2-def-inverse",
          type: "definition",
          title: "Modular Inverse",
          content:
            "An integer $a$ has a **multiplicative inverse** modulo $n$ if there exists $b$ such that:\n\n$$ab \\equiv 1 \\pmod{n}$$\n\nWe write $b = a^{-1} \\pmod{n}$.\n\n**Key theorem:** $a$ has an inverse mod $n$ if and only if $\\gcd(a, n) = 1$.\n\nExample: $3^{-1} \\equiv 5 \\pmod{7}$ since $3 \\cdot 5 = 15 \\equiv 1 \\pmod{7}$.",
          order: 6,
        },
        // --- Linear congruences ---
        {
          id: "nt-2-thm-linear",
          type: "theorem",
          title: "Solving Linear Congruences",
          content:
            "The congruence $ax \\equiv b \\pmod{n}$ has a solution if and only if $d = \\gcd(a, n)$ divides $b$.\n\nIf a solution exists:\n- There are exactly $d$ solutions modulo $n$.\n- If $d = 1$: unique solution $x \\equiv a^{-1}b \\pmod{n}$.\n- If $d > 1$: reduce to $\\frac{a}{d}x \\equiv \\frac{b}{d} \\pmod{\\frac{n}{d}}$ and solve.",
          keyTakeaway:
            "ax ≡ b (mod n) is solvable iff gcd(a,n) | b. When gcd(a,n)=1, the solution is x ≡ a⁻¹b.",
          order: 7,
        },
        {
          id: "nt-2-ex-2",
          type: "example",
          title: "Example — Solving a Linear Congruence",
          content:
            "Solve $5x \\equiv 3 \\pmod{7}$.",
          steps: [
            "$\\gcd(5, 7) = 1$, and $1 \\mid 3$, so a unique solution exists.",
            "Find $5^{-1} \\pmod{7}$: try $5 \\cdot 1 = 5$, $5 \\cdot 2 = 10 \\equiv 3$, $5 \\cdot 3 = 15 \\equiv 1$. So $5^{-1} \\equiv 3$.",
            "$x \\equiv 3 \\cdot 3 \\equiv 9 \\equiv 2 \\pmod{7}$.",
            "Check: $5(2) = 10 \\equiv 3 \\pmod{7}$. ✓",
          ],
          order: 8,
        },
        {
          id: "nt-2-ex-3",
          type: "example",
          title: "Example — Last Digit of a Power",
          content:
            "What is the last digit of $7^{2024}$?",
          steps: [
            "Last digit = $7^{2024} \\bmod 10$.",
            "$7^1 \\equiv 7$, $7^2 \\equiv 9$, $7^3 \\equiv 3$, $7^4 \\equiv 1 \\pmod{10}$.",
            "Period = 4. $2024 = 4 \\cdot 506$.",
            "$7^{2024} \\equiv (7^4)^{506} \\equiv 1^{506} \\equiv 1 \\pmod{10}$.",
            "The last digit is $\\boxed{1}$.",
          ],
          order: 9,
        },
        // --- Practice ---
        {
          id: "nt-2-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "What is $23 \\bmod 5$?",
          order: 10,
          problem: {
            id: "nt-2-p1-q",
            choices: [
              { id: "a", text: "3" },
              { id: "b", text: "4" },
              { id: "c", text: "2" },
              { id: "d", text: "1" },
            ],
            correctAnswerId: "a",
            solution:
              "$23 = 5 \\cdot 4 + 3$, so $23 \\bmod 5 = 3$.",
            difficulty: "easy",
          },
        },
        {
          id: "nt-2-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "Find $2^{10} \\bmod 11$.",
          order: 11,
          problem: {
            id: "nt-2-p2-q",
            choices: [
              { id: "a", text: "1" },
              { id: "b", text: "2" },
              { id: "c", text: "10" },
              { id: "d", text: "5" },
            ],
            correctAnswerId: "a",
            solution:
              "$2^{10} = 1024$. $1024 = 93 \\times 11 + 1$. So $2^{10} \\equiv 1 \\pmod{11}$. (This is also a consequence of Fermat's Little Theorem.)",
            difficulty: "medium",
          },
        },
        {
          id: "nt-2-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "Solve $3x \\equiv 1 \\pmod{10}$. What is $x$?",
          order: 12,
          problem: {
            id: "nt-2-p3-q",
            choices: [
              { id: "a", text: "7" },
              { id: "b", text: "3" },
              { id: "c", text: "4" },
              { id: "d", text: "9" },
            ],
            correctAnswerId: "a",
            solution:
              "We need $3^{-1} \\pmod{10}$. Check: $3 \\times 7 = 21 \\equiv 1 \\pmod{10}$. So $x \\equiv 7$.",
            difficulty: "medium",
          },
        },
        {
          id: "nt-2-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "What is the last digit of $3^{2025}$?",
          order: 13,
          problem: {
            id: "nt-2-p4-q",
            choices: [
              { id: "a", text: "3" },
              { id: "b", text: "9" },
              { id: "c", text: "7" },
              { id: "d", text: "1" },
            ],
            correctAnswerId: "a",
            solution:
              "Powers of 3 mod 10: $3, 9, 7, 1, 3, 9, 7, 1, \\ldots$ (period 4). $2025 \\bmod 4 = 1$, so $3^{2025} \\equiv 3^1 \\equiv 3 \\pmod{10}$. Last digit is $3$.",
            difficulty: "medium",
          },
        },
      ],
    },

    // ================================================
    // LESSON 3 — GCD, LCM & The Euclidean Algorithm
    // ================================================
    {
      id: "nt-3",
      title: "Lesson 3",
      subtitle: "GCD, LCM & The Euclidean Algorithm",
      order: 3,
      sections: [
        {
          id: "nt-3-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "This lesson covers the greatest common divisor (GCD), the least common multiple (LCM), and the Euclidean Algorithm — one of the oldest and most efficient algorithms in mathematics. You'll also learn Bézout's identity and the Extended Euclidean Algorithm.",
          order: 0,
        },
        // --- GCD ---
        {
          id: "nt-3-def-gcd",
          type: "definition",
          title: "Greatest Common Divisor (GCD)",
          content:
            "The **greatest common divisor** of integers $a$ and $b$ (not both zero), written $\\gcd(a, b)$, is the largest positive integer that divides both $a$ and $b$.\n\n$$\\gcd(a, b) = \\max\\{d > 0 : d \\mid a \\text{ and } d \\mid b\\}$$\n\nIf $\\gcd(a, b) = 1$, we say $a$ and $b$ are **coprime** (or **relatively prime**).\n\nExamples: $\\gcd(12, 18) = 6$, $\\gcd(15, 28) = 1$ (coprime).",
          order: 1,
        },
        // --- LCM ---
        {
          id: "nt-3-def-lcm",
          type: "definition",
          title: "Least Common Multiple (LCM)",
          content:
            "The **least common multiple** of positive integers $a$ and $b$, written $\\text{lcm}(a,b)$, is the smallest positive integer divisible by both $a$ and $b$.\n\n**Key relation:**\n$$\\gcd(a,b) \\cdot \\text{lcm}(a,b) = |ab|$$\n\nSo once you know the GCD, you can find the LCM:\n$$\\text{lcm}(a,b) = \\frac{|ab|}{\\gcd(a,b)}$$\n\nExample: $\\gcd(12,18) = 6$, so $\\text{lcm}(12,18) = \\frac{216}{6} = 36$.",
          order: 2,
        },
        // --- Euclidean Algorithm ---
        {
          id: "nt-3-thm-euclid-alg",
          type: "theorem",
          title: "The Euclidean Algorithm",
          content:
            "The Euclidean Algorithm computes $\\gcd(a, b)$ using repeated division:\n\n**Key property:** $\\gcd(a, b) = \\gcd(b, a \\bmod b)$.\n\n**Algorithm:**\n1. If $b = 0$, then $\\gcd(a, b) = a$.\n2. Otherwise, replace $(a, b)$ with $(b, a \\bmod b)$ and repeat.\n\nThe last nonzero remainder is the GCD.\n\nThis algorithm is extremely efficient — it runs in $O(\\log(\\min(a,b)))$ steps, making it practical even for hundreds-of-digits numbers.",
          keyTakeaway:
            "Repeatedly divide and take remainders. The last nonzero remainder is the GCD. Fast and ancient (c. 300 BCE).",
          order: 3,
        },
        {
          id: "nt-3-ex-1",
          type: "example",
          title: "Example — Euclidean Algorithm",
          content:
            "Find $\\gcd(252, 105)$.",
          steps: [
            "$252 = 105 \\cdot 2 + 42$",
            "$105 = 42 \\cdot 2 + 21$",
            "$42 = 21 \\cdot 2 + 0$",
            "Last nonzero remainder: $\\gcd(252, 105) = 21$.",
          ],
          order: 4,
        },
        // --- Bézout's Identity ---
        {
          id: "nt-3-thm-bezout",
          type: "theorem",
          title: "Bézout's Identity",
          content:
            "For any integers $a$ and $b$ (not both zero), there exist integers $x$ and $y$ such that:\n\n$$ax + by = \\gcd(a, b)$$\n\nThese coefficients $x, y$ can be found by **back-substitution** through the Euclidean Algorithm (the Extended Euclidean Algorithm).\n\n**Important corollary:** $\\gcd(a, b) = 1$ if and only if there exist integers $x, y$ with $ax + by = 1$.",
          keyTakeaway:
            "The GCD of a and b can always be written as a linear combination ax + by. This is the key to finding modular inverses.",
          order: 5,
        },
        {
          id: "nt-3-ex-2",
          type: "example",
          title: "Example — Extended Euclidean Algorithm",
          content:
            "Find integers $x, y$ such that $252x + 105y = 21$.",
          steps: [
            "From the Euclidean algorithm: $252 = 105(2) + 42$, $105 = 42(2) + 21$.",
            "Back-substitute: $21 = 105 - 42(2)$.",
            "Replace $42 = 252 - 105(2)$:",
            "$21 = 105 - [252 - 105(2)](2) = 105 - 252(2) + 105(4) = 105(5) - 252(2)$.",
            "So $x = -2, y = 5$: $252(-2) + 105(5) = -504 + 525 = 21$. ✓",
          ],
          order: 6,
        },
        {
          id: "nt-3-ex-3",
          type: "example",
          title: "Example — Finding a Modular Inverse via Bézout",
          content:
            "Find $17^{-1} \\pmod{43}$.",
          steps: [
            "Use Euclidean Algorithm on $43$ and $17$:",
            "$43 = 17(2) + 9$, $17 = 9(1) + 8$, $9 = 8(1) + 1$.",
            "So $\\gcd(43, 17) = 1$. Back-substitute:",
            "$1 = 9 - 8 = 9 - (17 - 9) = 2(9) - 17 = 2(43 - 2 \\cdot 17) - 17 = 2(43) - 5(17)$.",
            "So $17(-5) \\equiv 1 \\pmod{43}$, i.e., $17^{-1} \\equiv -5 \\equiv 38 \\pmod{43}$.",
            "Check: $17 \\times 38 = 646 = 15 \\times 43 + 1$. ✓",
          ],
          order: 7,
        },
        // --- Properties ---
        {
          id: "nt-3-thm-gcd-props",
          type: "theorem",
          title: "Properties of GCD",
          content:
            "1. $\\gcd(a, 0) = |a|$\n2. $\\gcd(a, b) = \\gcd(b, a)$\n3. $\\gcd(a, b) = \\gcd(|a|, |b|)$\n4. $\\gcd(a, b) = \\gcd(a - b, b)$ (subtraction version)\n5. If $p$ is prime and $p \\mid ab$, then $p \\mid a$ or $p \\mid b$ (**Euclid's Lemma**)\n6. If $\\gcd(a, n) = 1$ and $a \\mid bc$, then $a \\mid c$",
          keyTakeaway:
            "Euclid's Lemma (property 5) is crucial: if a prime divides a product, it must divide at least one factor.",
          order: 8,
        },
        // --- Practice ---
        {
          id: "nt-3-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "Use the Euclidean Algorithm to find $\\gcd(78, 30)$.",
          order: 9,
          problem: {
            id: "nt-3-p1-q",
            choices: [
              { id: "a", text: "6" },
              { id: "b", text: "3" },
              { id: "c", text: "2" },
              { id: "d", text: "15" },
            ],
            correctAnswerId: "a",
            solution:
              "$78 = 30(2) + 18$, $30 = 18(1) + 12$, $18 = 12(1) + 6$, $12 = 6(2) + 0$. GCD = $6$.",
            difficulty: "easy",
          },
        },
        {
          id: "nt-3-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "Find $\\text{lcm}(12, 15)$.",
          order: 10,
          problem: {
            id: "nt-3-p2-q",
            choices: [
              { id: "a", text: "60" },
              { id: "b", text: "180" },
              { id: "c", text: "30" },
              { id: "d", text: "3" },
            ],
            correctAnswerId: "a",
            solution:
              "$\\gcd(12,15) = 3$. $\\text{lcm}(12,15) = \\frac{12 \\times 15}{3} = \\frac{180}{3} = 60$.",
            difficulty: "easy",
          },
        },
        {
          id: "nt-3-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "Find integers $x, y$ such that $35x + 12y = 1$. What is $x$?",
          order: 11,
          problem: {
            id: "nt-3-p3-q",
            choices: [
              { id: "a", text: "−1" },
              { id: "b", text: "1" },
              { id: "c", text: "3" },
              { id: "d", text: "12" },
            ],
            correctAnswerId: "a",
            solution:
              "$35 = 12(2) + 11$, $12 = 11(1) + 1$. Back-sub: $1 = 12 - 11 = 12 - (35 - 12 \\cdot 2) = 3(12) - 1(35)$. So $x = -1, y = 3$.",
            difficulty: "medium",
          },
        },
        {
          id: "nt-3-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "Does the equation $6x + 9y = 10$ have integer solutions?",
          order: 12,
          problem: {
            id: "nt-3-p4-q",
            choices: [
              { id: "a", text: "No" },
              { id: "b", text: "Yes, infinitely many" },
              { id: "c", text: "Yes, exactly one" },
              { id: "d", text: "Yes, exactly three" },
            ],
            correctAnswerId: "a",
            solution:
              "$\\gcd(6, 9) = 3$. Since $3 \\nmid 10$, the equation $6x + 9y = 10$ has **no** integer solutions (by Bézout's identity, $6x + 9y$ is always a multiple of 3).",
            difficulty: "medium",
          },
        },
      ],
    },

    // ================================================
    // LESSON 4 — The Fundamental Theorem of Arithmetic
    // ================================================
    {
      id: "nt-4",
      title: "Lesson 4",
      subtitle: "The Fundamental Theorem of Arithmetic",
      order: 4,
      sections: [
        {
          id: "nt-4-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "This lesson presents the Fundamental Theorem of Arithmetic — every integer greater than 1 has a unique prime factorization. You'll explore the proof, learn to work with prime factorizations, and see applications to divisibility and GCD/LCM computation.",
          order: 0,
        },
        // --- FTA ---
        {
          id: "nt-4-thm-fta",
          type: "theorem",
          title: "The Fundamental Theorem of Arithmetic",
          content:
            "Every integer $n > 1$ can be written as a product of primes:\n\n$$n = p_1^{a_1} p_2^{a_2} \\cdots p_k^{a_k}$$\n\nwhere $p_1 < p_2 < \\cdots < p_k$ are primes and $a_i \\geq 1$. Moreover, this representation is **unique** (up to the order of the factors).\n\nThis is why primes are called the \"building blocks\" of the integers — every positive integer is uniquely constructed from primes.",
          keyTakeaway:
            "Every integer > 1 factors uniquely into primes. This is THE foundational result of number theory.",
          order: 1,
        },
        {
          id: "nt-4-note-proof",
          type: "note",
          title: "Proof Sketch",
          content:
            "**Existence** (by strong induction): If $n$ is prime, done. If composite, $n = ab$ with $1 < a, b < n$. By the induction hypothesis, $a$ and $b$ have prime factorizations, so $n$ does too.\n\n**Uniqueness** (uses Euclid's Lemma): Suppose $n = p_1 p_2 \\cdots p_r = q_1 q_2 \\cdots q_s$ are two prime factorizations. Since $p_1 \\mid q_1 q_2 \\cdots q_s$ and $p_1$ is prime, by Euclid's Lemma $p_1 \\mid q_j$ for some $j$. Since $q_j$ is prime, $p_1 = q_j$. Cancel and repeat.",
          order: 2,
        },
        {
          id: "nt-4-ex-1",
          type: "example",
          title: "Example — Prime Factorization",
          content:
            "Find the prime factorization of $2520$.",
          steps: [
            "$2520 ÷ 2 = 1260$",
            "$1260 ÷ 2 = 630$",
            "$630 ÷ 2 = 315$",
            "$315 ÷ 3 = 105$",
            "$105 ÷ 3 = 35$",
            "$35 ÷ 5 = 7$",
            "$2520 = 2^3 \\cdot 3^2 \\cdot 5 \\cdot 7$",
          ],
          order: 3,
        },
        // --- Divisors from factorization ---
        {
          id: "nt-4-thm-divisors",
          type: "theorem",
          title: "Counting Divisors",
          content:
            "If $n = p_1^{a_1} p_2^{a_2} \\cdots p_k^{a_k}$, then:\n\n**Number of positive divisors:**\n$$\\tau(n) = (a_1 + 1)(a_2 + 1) \\cdots (a_k + 1)$$\n\n**Sum of positive divisors:**\n$$\\sigma(n) = \\prod_{i=1}^{k} \\frac{p_i^{a_i+1} - 1}{p_i - 1}$$\n\nA positive divisor of $n$ has the form $p_1^{b_1} p_2^{b_2} \\cdots p_k^{b_k}$ where $0 \\leq b_i \\leq a_i$.",
          keyTakeaway:
            "To count divisors, add 1 to each exponent and multiply. Each exponent can independently range from 0 to its value.",
          order: 4,
        },
        {
          id: "nt-4-ex-2",
          type: "example",
          title: "Example — Counting Divisors",
          content:
            "How many positive divisors does $360$ have?",
          steps: [
            "$360 = 2^3 \\cdot 3^2 \\cdot 5^1$.",
            "$\\tau(360) = (3+1)(2+1)(1+1) = 4 \\cdot 3 \\cdot 2 = 24$.",
            "So $360$ has $24$ positive divisors.",
          ],
          order: 5,
        },
        // --- GCD/LCM from factorization ---
        {
          id: "nt-4-thm-gcd-lcm-factor",
          type: "theorem",
          title: "GCD and LCM from Prime Factorization",
          content:
            "If $a = \\prod p_i^{a_i}$ and $b = \\prod p_i^{b_i}$ (using all primes appearing in either, with exponent 0 if a prime is absent), then:\n\n$$\\gcd(a, b) = \\prod p_i^{\\min(a_i, b_i)}$$\n$$\\text{lcm}(a, b) = \\prod p_i^{\\max(a_i, b_i)}$$\n\nExample: $a = 2^3 \\cdot 3^1 \\cdot 5^2 = 600$, $b = 2^1 \\cdot 3^3 \\cdot 5^1 = 270$.\n- $\\gcd = 2^1 \\cdot 3^1 \\cdot 5^1 = 30$\n- $\\text{lcm} = 2^3 \\cdot 3^3 \\cdot 5^2 = 5400$",
          keyTakeaway:
            "GCD takes the minimum exponents; LCM takes the maximum exponents.",
          order: 6,
        },
        // --- Perfect numbers (fun application) ---
        {
          id: "nt-4-def-perfect",
          type: "definition",
          title: "Perfect Numbers",
          content:
            "A positive integer $n$ is **perfect** if it equals the sum of its proper divisors (all divisors except $n$ itself):\n$$\\sigma(n) = 2n$$\n\nExamples: $6 = 1+2+3$, $28 = 1+2+4+7+14$.\n\n**Euler-Euclid Theorem:** An even number is perfect if and only if it has the form $2^{p-1}(2^p - 1)$ where $2^p - 1$ is prime (a **Mersenne prime**).\n\nWhether odd perfect numbers exist is one of the oldest open problems in mathematics.",
          order: 7,
        },
        // --- Valuation ---
        {
          id: "nt-4-def-valuation",
          type: "definition",
          title: "p-adic Valuation",
          content:
            "For a prime $p$ and integer $n \\neq 0$, the **$p$-adic valuation** $v_p(n)$ is the exponent of $p$ in the prime factorization of $n$.\n\nExamples: $v_2(12) = 2$ (since $12 = 2^2 \\cdot 3$), $v_3(12) = 1$, $v_5(12) = 0$.\n\n**Properties:**\n- $v_p(ab) = v_p(a) + v_p(b)$\n- $v_p(a+b) \\geq \\min(v_p(a), v_p(b))$\n- $p \\mid n \\iff v_p(n) \\geq 1$\n\n**Legendre's formula:** $v_p(n!) = \\sum_{i=1}^{\\infty}\\lfloor n/p^i \\rfloor$",
          order: 8,
        },
        {
          id: "nt-4-ex-3",
          type: "example",
          title: "Example — Legendre's Formula",
          content:
            "Find the highest power of $2$ that divides $20!$.",
          steps: [
            "Use Legendre's formula: $v_2(20!) = \\lfloor 20/2 \\rfloor + \\lfloor 20/4 \\rfloor + \\lfloor 20/8 \\rfloor + \\lfloor 20/16 \\rfloor$",
            "$= 10 + 5 + 2 + 1 = 18$.",
            "So $2^{18} \\mid 20!$ but $2^{19} \\nmid 20!$.",
          ],
          order: 9,
        },
        // --- Practice ---
        {
          id: "nt-4-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "Find the prime factorization of $1764$.",
          order: 10,
          problem: {
            id: "nt-4-p1-q",
            choices: [
              { id: "a", text: "$2^2 \\cdot 3^2 \\cdot 7^2$" },
              { id: "b", text: "$2^2 \\cdot 3 \\cdot 7^3$" },
              { id: "c", text: "$4 \\cdot 9 \\cdot 49$" },
              { id: "d", text: "$2 \\cdot 3^2 \\cdot 7^2 \\cdot 2$" },
            ],
            correctAnswerId: "a",
            solution:
              "$1764 = 2 \\times 882 = 2^2 \\times 441 = 2^2 \\times 21^2 = 2^2 \\times 3^2 \\times 7^2$.",
            difficulty: "easy",
          },
        },
        {
          id: "nt-4-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "How many positive divisors does $72 = 2^3 \\cdot 3^2$ have?",
          order: 11,
          problem: {
            id: "nt-4-p2-q",
            choices: [
              { id: "a", text: "12" },
              { id: "b", text: "6" },
              { id: "c", text: "8" },
              { id: "d", text: "72" },
            ],
            correctAnswerId: "a",
            solution:
              "$\\tau(72) = (3+1)(2+1) = 4 \\times 3 = 12$.",
            difficulty: "easy",
          },
        },
        {
          id: "nt-4-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "Using prime factorizations, find $\\gcd(180, 252)$.",
          order: 12,
          problem: {
            id: "nt-4-p3-q",
            choices: [
              { id: "a", text: "36" },
              { id: "b", text: "12" },
              { id: "c", text: "18" },
              { id: "d", text: "6" },
            ],
            correctAnswerId: "a",
            solution:
              "$180 = 2^2 \\cdot 3^2 \\cdot 5$, $252 = 2^2 \\cdot 3^2 \\cdot 7$. Take min exponents: $\\gcd = 2^2 \\cdot 3^2 = 36$.",
            difficulty: "medium",
          },
        },
        {
          id: "nt-4-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "What is the highest power of $5$ dividing $100!$?",
          order: 13,
          problem: {
            id: "nt-4-p4-q",
            choices: [
              { id: "a", text: "24" },
              { id: "b", text: "20" },
              { id: "c", text: "25" },
              { id: "d", text: "50" },
            ],
            correctAnswerId: "a",
            solution:
              "$v_5(100!) = \\lfloor 100/5 \\rfloor + \\lfloor 100/25 \\rfloor = 20 + 4 = 24$. (No higher powers since $125 > 100$.)",
            difficulty: "medium",
          },
        },
      ],
    },

    // ================================================
    // LESSON 5 — Euler's Theorem, Fermat's Little Theorem & Applications
    // ================================================
    {
      id: "nt-5",
      title: "Lesson 5",
      subtitle: "Euler's & Fermat's Theorems",
      order: 5,
      sections: [
        {
          id: "nt-5-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "This lesson covers Euler's phi function, Euler's theorem, Fermat's little theorem, Wilson's theorem, and the Chinese Remainder Theorem. You'll also see how these results underpin the RSA cryptosystem.",
          order: 0,
        },
        // --- Euler's phi function ---
        {
          id: "nt-5-def-euler-phi",
          type: "definition",
          title: "Euler's Totient Function $\\phi(n)$",
          content:
            "**Euler's totient function** $\\phi(n)$ counts the number of integers from $1$ to $n$ that are **coprime** to $n$:\n\n$$\\phi(n) = |\\{k : 1 \\leq k \\leq n, \\gcd(k, n) = 1\\}|$$\n\n**Key values:**\n- $\\phi(1) = 1$\n- If $p$ is prime: $\\phi(p) = p - 1$\n- If $p$ is prime: $\\phi(p^k) = p^k - p^{k-1} = p^{k-1}(p-1)$\n- If $\\gcd(m,n) = 1$: $\\phi(mn) = \\phi(m)\\phi(n)$ (**multiplicativity**)\n\n**General formula:** If $n = p_1^{a_1}\\cdots p_k^{a_k}$:\n$$\\phi(n) = n\\prod_{p \\mid n}\\left(1 - \\frac{1}{p}\\right)$$",
          order: 1,
        },
        {
          id: "nt-5-ex-1",
          type: "example",
          title: "Example — Computing $\\phi(n)$",
          content:
            "Compute $\\phi(60)$.",
          steps: [
            "$60 = 2^2 \\cdot 3 \\cdot 5$.",
            "$\\phi(60) = 60\\left(1 - \\frac{1}{2}\\right)\\left(1 - \\frac{1}{3}\\right)\\left(1 - \\frac{1}{5}\\right)$",
            "$= 60 \\cdot \\frac{1}{2} \\cdot \\frac{2}{3} \\cdot \\frac{4}{5}$",
            "$= 60 \\cdot \\frac{8}{30} = 16$.",
            "So there are $16$ integers from $1$ to $60$ that are coprime to $60$.",
          ],
          order: 2,
        },
        // --- Fermat's Little Theorem ---
        {
          id: "nt-5-thm-fermat",
          type: "theorem",
          title: "Fermat's Little Theorem",
          content:
            "If $p$ is prime and $\\gcd(a, p) = 1$ (i.e., $p \\nmid a$), then:\n\n$$a^{p-1} \\equiv 1 \\pmod{p}$$\n\nEquivalently, for **any** integer $a$: $a^p \\equiv a \\pmod{p}$.\n\nThis is a special case of Euler's theorem (with $n = p$ and $\\phi(p) = p-1$).\n\nExample: $2^{10} \\equiv 1 \\pmod{11}$ (since $11$ is prime).",
          keyTakeaway:
            "If p is prime and p ∤ a, then a^(p−1) ≡ 1 (mod p). Extremely useful for computing large powers mod primes.",
          order: 3,
        },
        // --- Euler's Theorem ---
        {
          id: "nt-5-thm-euler",
          type: "theorem",
          title: "Euler's Theorem",
          content:
            "If $\\gcd(a, n) = 1$, then:\n\n$$a^{\\phi(n)} \\equiv 1 \\pmod{n}$$\n\nThis generalizes Fermat's Little Theorem to **any** modulus (not just primes).\n\n**Proof idea:** Consider the $\\phi(n)$ integers coprime to $n$: $\\{r_1, \\ldots, r_{\\phi(n)}\\}$. Multiplying each by $a$ permutes this set (since $\\gcd(a,n)=1$). Taking the product of both sides and canceling gives the result.",
          keyTakeaway:
            "a^φ(n) ≡ 1 (mod n) when gcd(a,n) = 1. The cornerstone of RSA cryptography.",
          order: 4,
        },
        {
          id: "nt-5-ex-2",
          type: "example",
          title: "Example — Using Euler's Theorem",
          content:
            "Find $7^{222} \\bmod 10$.",
          steps: [
            "$\\phi(10) = \\phi(2)\\phi(5) = 1 \\cdot 4 = 4$.",
            "$\\gcd(7, 10) = 1$, so $7^4 \\equiv 1 \\pmod{10}$ by Euler's theorem.",
            "$222 = 4 \\cdot 55 + 2$.",
            "$7^{222} = (7^4)^{55} \\cdot 7^2 \\equiv 1^{55} \\cdot 49 \\equiv 9 \\pmod{10}$.",
          ],
          order: 5,
        },
        // --- Wilson's Theorem ---
        {
          id: "nt-5-thm-wilson",
          type: "theorem",
          title: "Wilson's Theorem",
          content:
            "An integer $p > 1$ is **prime** if and only if:\n\n$$(p-1)! \\equiv -1 \\pmod{p}$$\n\nExample: $(6)! = 720$. $720 \\div 7 = 102$ remainder $6 = -1 \\pmod{7}$. So $7$ is prime.\n\nWhile elegant, Wilson's theorem is computationally impractical for testing primality (computing factorials is too slow). It is primarily a theoretical tool.",
          keyTakeaway:
            "(p−1)! ≡ −1 (mod p) if and only if p is prime. Beautiful, but not practical for primality testing.",
          order: 6,
        },
        // --- Chinese Remainder Theorem ---
        {
          id: "nt-5-thm-crt",
          type: "theorem",
          title: "The Chinese Remainder Theorem (CRT)",
          content:
            "If $n_1, n_2, \\ldots, n_k$ are pairwise coprime ($\\gcd(n_i, n_j) = 1$ for $i \\neq j$), then the system:\n\n$$x \\equiv a_1 \\pmod{n_1}$$\n$$x \\equiv a_2 \\pmod{n_2}$$\n$$\\vdots$$\n$$x \\equiv a_k \\pmod{n_k}$$\n\nhas a **unique** solution modulo $N = n_1 n_2 \\cdots n_k$.\n\nThe CRT establishes an isomorphism: $\\mathbb{Z}_N \\cong \\mathbb{Z}_{n_1} \\times \\mathbb{Z}_{n_2} \\times \\cdots \\times \\mathbb{Z}_{n_k}$.",
          keyTakeaway:
            "A system of congruences with pairwise coprime moduli always has a unique solution mod their product.",
          order: 7,
        },
        {
          id: "nt-5-ex-3",
          type: "example",
          title: "Example — Chinese Remainder Theorem",
          content:
            "Find $x$ such that $x \\equiv 2 \\pmod{3}$ and $x \\equiv 3 \\pmod{5}$.",
          steps: [
            "From the first congruence: $x = 3k + 2$ for some integer $k$.",
            "Substitute into the second: $3k + 2 \\equiv 3 \\pmod{5}$.",
            "$3k \\equiv 1 \\pmod{5}$.",
            "$k \\equiv 3^{-1} \\cdot 1 \\equiv 2 \\pmod{5}$ (since $3 \\cdot 2 = 6 \\equiv 1$).",
            "$k = 5j + 2$, so $x = 3(5j+2)+2 = 15j + 8$.",
            "$x \\equiv 8 \\pmod{15}$.",
            "Check: $8 \\bmod 3 = 2$ ✓, $8 \\bmod 5 = 3$ ✓.",
          ],
          order: 8,
        },
        // --- RSA ---
        {
          id: "nt-5-note-rsa",
          type: "note",
          title: "Application: RSA Cryptography",
          content:
            "The **RSA** public-key cryptosystem (Rivest–Shamir–Adleman, 1977) is built on Euler's theorem:\n\n**Key generation:**\n1. Choose two large primes $p$ and $q$. Let $n = pq$.\n2. Compute $\\phi(n) = (p-1)(q-1)$.\n3. Choose $e$ with $\\gcd(e, \\phi(n)) = 1$.\n4. Compute $d = e^{-1} \\bmod \\phi(n)$.\n5. **Public key:** $(n, e)$. **Private key:** $d$.\n\n**Encryption:** $c = m^e \\bmod n$.\n**Decryption:** $m = c^d \\bmod n$.\n\n**Why it works:** $c^d = (m^e)^d = m^{ed} = m^{1 + k\\phi(n)} = m \\cdot (m^{\\phi(n)})^k \\equiv m \\cdot 1^k = m \\pmod{n}$ by Euler's theorem.\n\n**Security** relies on the difficulty of factoring $n = pq$ when $p$ and $q$ are very large (typically 2048+ bits).",
          order: 9,
        },
        {
          id: "nt-5-ex-4",
          type: "example",
          title: "Example — Tiny RSA",
          content:
            "Set up RSA with $p = 5, q = 11$ and encrypt $m = 4$.",
          steps: [
            "$n = 55$, $\\phi(n) = (4)(10) = 40$.",
            "Choose $e = 3$ ($\\gcd(3, 40) = 1$).",
            "Find $d$: $3d \\equiv 1 \\pmod{40}$. $d = 27$ (since $3 \\times 27 = 81 = 2 \\times 40 + 1$).",
            "Encrypt: $c = 4^3 \\bmod 55 = 64 \\bmod 55 = 9$.",
            "Decrypt: $m = 9^{27} \\bmod 55$. (Fast exponentiation gives $m = 4$.) ✓",
          ],
          order: 10,
        },
        // --- Practice ---
        {
          id: "nt-5-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "Compute $\\phi(36)$.",
          order: 11,
          problem: {
            id: "nt-5-p1-q",
            choices: [
              { id: "a", text: "12" },
              { id: "b", text: "18" },
              { id: "c", text: "24" },
              { id: "d", text: "6" },
            ],
            correctAnswerId: "a",
            solution:
              "$36 = 2^2 \\cdot 3^2$. $\\phi(36) = 36(1 - 1/2)(1 - 1/3) = 36 \\cdot \\frac{1}{2} \\cdot \\frac{2}{3} = 12$.",
            difficulty: "easy",
          },
        },
        {
          id: "nt-5-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "Find $3^{100} \\bmod 13$ using Fermat's Little Theorem.",
          order: 12,
          problem: {
            id: "nt-5-p2-q",
            choices: [
              { id: "a", text: "3" },
              { id: "b", text: "1" },
              { id: "c", text: "9" },
              { id: "d", text: "4" },
            ],
            correctAnswerId: "a",
            solution:
              "$13$ is prime, $\\gcd(3,13)=1$, so by Fermat's Little Theorem $3^{12} \\equiv 1 \\pmod{13}$. Note also $3^3 = 27 \\equiv 1 \\pmod{13}$ (the order of $3$ divides $12$). $100 = 3(33)+1$, so $3^{100} = (3^3)^{33} \\cdot 3^1 \\equiv 1^{33} \\cdot 3 = 3 \\pmod{13}$.",
            difficulty: "medium",
          },
        },
        {
          id: "nt-5-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "Solve: $x \\equiv 1 \\pmod{3}$, $x \\equiv 2 \\pmod{5}$. What is the smallest positive $x$?",
          order: 13,
          problem: {
            id: "nt-5-p3-q",
            choices: [
              { id: "a", text: "7" },
              { id: "b", text: "13" },
              { id: "c", text: "4" },
              { id: "d", text: "2" },
            ],
            correctAnswerId: "a",
            solution:
              "$x = 3k+1$. Substitute: $3k+1 \\equiv 2 \\pmod{5}$, so $3k \\equiv 1 \\pmod{5}$. $3^{-1} \\equiv 2 \\pmod{5}$ (since $3\\cdot 2=6\\equiv 1$). So $k \\equiv 2 \\pmod{5}$, $k = 5j+2$, $x = 15j+7$. Smallest positive: $x = 7$.",
            difficulty: "medium",
          },
        },
        {
          id: "nt-5-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "In a tiny RSA setup with $p=3, q=11$ (so $n=33$), $e=7$. What is the private key $d$?",
          order: 14,
          problem: {
            id: "nt-5-p4-q",
            choices: [
              { id: "a", text: "3" },
              { id: "b", text: "7" },
              { id: "c", text: "13" },
              { id: "d", text: "20" },
            ],
            correctAnswerId: "a",
            solution:
              "$\\phi(33) = (3-1)(11-1) = 20$. Need $7d \\equiv 1 \\pmod{20}$. $7 \\times 3 = 21 \\equiv 1 \\pmod{20}$. So $d = 3$.",
            difficulty: "hard",
          },
        },
      ],
    },
  ],
};
