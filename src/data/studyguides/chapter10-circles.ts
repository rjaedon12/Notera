import type { StudyGuide } from "@/types/studyguide";

export const chapter10Circles: StudyGuide = {
  id: "ch10-circles",
  title: "Chapter 10: Circles",
  subject: "Geometry",
  chapter: "10",
  description:
    "Master inscribed angles, angle & segment relationships, coordinate-plane equations, arc length, and sector area.",
  coverColor: "from-blue-500/20 to-indigo-500/20",
  icon: "Circle",
  lessons: [
    // ================================================
    // LESSON 10.4 — Inscribed Angles
    // ================================================
    {
      id: "10-4",
      title: "Lesson 10.4",
      subtitle: "Inscribed Angles",
      order: 1,
      sections: [
        {
          id: "10-4-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "In this lesson you'll discover the relationship between an inscribed angle and its intercepted arc, and apply it to angles in semicircles and inscribed quadrilaterals.",
          order: 0,
        },
        {
          id: "10-4-def-inscribed",
          type: "definition",
          title: "Inscribed Angle",
          content:
            "An **inscribed angle** is an angle whose vertex is *on* a circle and whose sides contain chords of the circle. The arc that lies in the interior of the angle is the **intercepted arc**.",
          order: 1,
        },
        {
          id: "10-4-diagram-1",
          type: "diagram",
          title: "Inscribed Angle & Intercepted Arc",
          content: "Point $B$ is on the circle. Rays $\\overline{BA}$ and $\\overline{BC}$ are chords. Arc $AC$ (not containing $B$) is the intercepted arc.",
          imageComponent: "InscribedAngleDiagram",
          order: 2,
        },
        {
          id: "10-4-thm-1",
          type: "theorem",
          title: "Theorem 10.6 — Inscribed Angle Theorem",
          content:
            "The measure of an inscribed angle is **half** the measure of its intercepted arc.\n\n$$m\\angle B = \\frac{1}{2}\\,m\\overset{\\frown}{AC}$$",
          keyTakeaway: "Inscribed angle = ½ × intercepted arc. Always.",
          order: 3,
        },
        {
          id: "10-4-ex-1",
          type: "example",
          title: "Example — Finding an Inscribed Angle",
          content: "In $\\odot O$, $m\\overset{\\frown}{AC} = 130°$. Find $m\\angle B$.",
          steps: [
            "Write the Inscribed Angle Theorem: $m\\angle B = \\frac{1}{2}\\,m\\overset{\\frown}{AC}$",
            "Substitute: $m\\angle B = \\frac{1}{2}(130°) = 65°$",
          ],
          order: 4,
        },
        {
          id: "10-4-thm-2",
          type: "theorem",
          title: "Theorem 10.7 — Congruent Inscribed Angles",
          content:
            "If two inscribed angles of a circle intercept the **same arc**, then the angles are **congruent**.\n\nIf $\\angle B$ and $\\angle D$ both intercept $\\overset{\\frown}{AC}$, then $\\angle B \\cong \\angle D$.",
          order: 5,
        },
        {
          id: "10-4-diagram-semi",
          type: "diagram",
          title: "Angle in a Semicircle",
          content:
            "When the intercepted arc is a semicircle (180°), the inscribed angle is $\\frac{1}{2}(180°) = 90°$.",
          imageComponent: "SemicircleAngleDiagram",
          order: 6,
        },
        {
          id: "10-4-thm-3",
          type: "theorem",
          title: "Theorem 10.8 — Semicircle Theorem",
          content:
            "An inscribed angle that intercepts a **semicircle** is a **right angle** ($90°$).\n\nIf $\\overline{AB}$ is a diameter, any point $C$ on the circle (other than $A$ or $B$) makes $\\angle ACB = 90°$.",
          keyTakeaway: "Diameter as chord ⟹ inscribed angle = 90°.",
          order: 7,
        },
        {
          id: "10-4-ex-2",
          type: "example",
          title: "Example — Angles in a Semicircle",
          content:
            "$\\overline{AB}$ is a diameter of $\\odot O$. $C$ is on the circle and $m\\angle BAC = 35°$. Find $m\\angle ACB$ and $m\\angle ABC$.",
          steps: [
            "$\\overline{AB}$ is a diameter, so $\\angle ACB$ intercepts a semicircle.",
            "By Theorem 10.8: $m\\angle ACB = 90°$.",
            "Triangle angle sum: $m\\angle ABC = 180° - 90° - 35° = 55°$.",
          ],
          order: 8,
        },
        {
          id: "10-4-diagram-quad",
          type: "diagram",
          title: "Inscribed Quadrilateral",
          content:
            "When all four vertices of a quadrilateral lie on a circle, opposite angles are supplementary.",
          imageComponent: "InscribedQuadrilateralDiagram",
          order: 9,
        },
        {
          id: "10-4-thm-4",
          type: "theorem",
          title: "Theorem 10.9 — Inscribed Quadrilateral",
          content:
            "If a quadrilateral is inscribed in a circle, then its **opposite angles are supplementary**.\n\n$$m\\angle A + m\\angle C = 180°$$\n$$m\\angle B + m\\angle D = 180°$$",
          keyTakeaway: "Cyclic quadrilateral ⟹ opposite angles add to 180°.",
          order: 10,
        },
        // --- Practice Problems ---
        {
          id: "10-4-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "In a circle, inscribed angle $\\angle P$ intercepts an arc of $96°$. What is $m\\angle P$?",
          order: 11,
          problem: {
            id: "10-4-p1-q",
            choices: [
              { id: "a", text: "48°" },
              { id: "b", text: "96°" },
              { id: "c", text: "192°" },
              { id: "d", text: "84°" },
            ],
            correctAnswerId: "a",
            solution:
              "By the Inscribed Angle Theorem, $m\\angle P = \\frac{1}{2}(96°) = 48°$.",
            difficulty: "easy",
          },
        },
        {
          id: "10-4-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "$\\overline{QR}$ is a diameter. $S$ is on the circle and $m\\angle RQS = 28°$. Find $m\\angle QSR$.",
          order: 12,
          problem: {
            id: "10-4-p2-q",
            choices: [
              { id: "a", text: "28°" },
              { id: "b", text: "62°" },
              { id: "c", text: "90°" },
              { id: "d", text: "152°" },
            ],
            correctAnswerId: "c",
            solution:
              "Since $\\overline{QR}$ is a diameter, Theorem 10.8 tells us $\\angle QSR = 90°$ (inscribed angle intercepting a semicircle).",
            difficulty: "easy",
          },
        },
        {
          id: "10-4-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "Quadrilateral $ABCD$ is inscribed in a circle. If $m\\angle A = 72°$ and $m\\angle B = 95°$, find $m\\angle C$ and $m\\angle D$.",
          order: 13,
          problem: {
            id: "10-4-p3-q",
            choices: [
              { id: "a", text: "72°" },
              { id: "b", text: "108°" },
              { id: "c", text: "95°" },
              { id: "d", text: "85°" },
            ],
            correctAnswerId: "b",
            solution:
              "Opposite angles in an inscribed quadrilateral are supplementary:\n$m\\angle C = 180° - m\\angle A = 180° - 72° = 108°$\n$m\\angle D = 180° - m\\angle B = 180° - 95° = 85°$.",
            difficulty: "medium",
          },
        },
        {
          id: "10-4-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "Two inscribed angles $\\angle X$ and $\\angle Y$ intercept the same arc of $140°$. True or false: $m\\angle X = m\\angle Y$.",
          order: 14,
          problem: {
            id: "10-4-p4-q",
            choices: [
              { id: "a", text: "70°" },
              { id: "b", text: "140°" },
              { id: "c", text: "280°" },
              { id: "d", text: "35°" },
            ],
            correctAnswerId: "a",
            solution:
              "By Theorem 10.7 both angles are congruent, and by the Inscribed Angle Theorem each equals $\\frac{1}{2}(140°) = 70°$.",
            difficulty: "easy",
          },
        },
      ],
    },

    // ================================================
    // LESSON 10.5 — Angle Relationships in Circles
    // ================================================
    {
      id: "10-5",
      title: "Lesson 10.5",
      subtitle: "Angle Relationships in Circles",
      order: 2,
      sections: [
        {
          id: "10-5-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "This lesson covers angles formed by tangents, chords, and secants — and how to find their measures using intercepted arcs.",
          order: 0,
        },
        {
          id: "10-5-diagram-tc",
          type: "diagram",
          title: "Tangent-Chord Angle",
          content:
            "When a tangent and a chord meet at the point of tangency, the angle equals half the intercepted arc.",
          imageComponent: "TangentChordDiagram",
          order: 1,
        },
        {
          id: "10-5-thm-1",
          type: "theorem",
          title: "Theorem 10.10 — Tangent-Chord Angle",
          content:
            "If a tangent and a chord intersect at a point **on** the circle, then the measure of each angle formed is **half** the measure of its intercepted arc.\n\n$$m\\angle 1 = \\frac{1}{2}\\,m\\overset{\\frown}{AB}$$",
          keyTakeaway:
            "Tangent-chord angle = ½ × intercepted arc (same rule as inscribed angles).",
          order: 2,
        },
        {
          id: "10-5-ex-1",
          type: "example",
          title: "Example — Tangent-Chord Angle",
          content:
            "A tangent and chord form an angle at the point of tangency. The intercepted arc is $210°$. Find the angle.",
          steps: [
            "$m\\angle = \\frac{1}{2}\\,m\\overset{\\frown}{\\text{arc}}$",
            "$m\\angle = \\frac{1}{2}(210°) = 105°$",
          ],
          order: 3,
        },
        {
          id: "10-5-diagram-ci",
          type: "diagram",
          title: "Chords Intersecting Inside a Circle",
          content:
            "When two chords intersect inside a circle, the angle equals half the sum of the intercepted arcs.",
          imageComponent: "ChordsInsideDiagram",
          order: 4,
        },
        {
          id: "10-5-thm-2",
          type: "theorem",
          title: "Theorem 10.11 — Chords-Inside Angle",
          content:
            "If two chords intersect **inside** a circle, then the measure of each angle is **half the sum** of the arcs intercepted by it and its vertical angle.\n\n$$m\\angle 1 = \\frac{1}{2}(m\\overset{\\frown}{AC} + m\\overset{\\frown}{BD})$$",
          keyTakeaway: "Interior angle = ½(sum of intercepted arcs).",
          order: 5,
        },
        {
          id: "10-5-ex-2",
          type: "example",
          title: "Example — Interior Chord Angle",
          content:
            "Two chords intersect inside a circle. The intercepted arcs are $70°$ and $110°$. Find the angle.",
          steps: [
            "$m\\angle = \\frac{1}{2}(m\\overset{\\frown}{\\text{arc}_1} + m\\overset{\\frown}{\\text{arc}_2})$",
            "$m\\angle = \\frac{1}{2}(70° + 110°) = \\frac{1}{2}(180°) = 90°$",
          ],
          order: 6,
        },
        {
          id: "10-5-diagram-se",
          type: "diagram",
          title: "Secants / Tangents from an External Point",
          content:
            "When two secants, a secant and a tangent, or two tangents meet outside the circle, use the difference formula.",
          imageComponent: "SecantsExternalDiagram",
          order: 7,
        },
        {
          id: "10-5-thm-3",
          type: "theorem",
          title: "Theorem 10.12 — Exterior Angle",
          content:
            "If two secants, a secant and a tangent, or two tangents intersect **outside** a circle, then the measure of the angle formed is **half the difference** of the intercepted arcs.\n\n$$m\\angle E = \\frac{1}{2}(m\\overset{\\frown}{BD} - m\\overset{\\frown}{AC})$$",
          keyTakeaway:
            "Exterior angle = ½(far arc − near arc). Bigger arc minus smaller arc.",
          order: 8,
        },
        {
          id: "10-5-ex-3",
          type: "example",
          title: "Example — Exterior Secant Angle",
          content:
            "Two secants from an external point intercept arcs of $160°$ (far) and $40°$ (near). Find the angle.",
          steps: [
            "$m\\angle = \\frac{1}{2}(\\text{far arc} - \\text{near arc})$",
            "$m\\angle = \\frac{1}{2}(160° - 40°) = \\frac{1}{2}(120°) = 60°$",
          ],
          order: 9,
        },
        // --- Practice ---
        {
          id: "10-5-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "A tangent and chord meet at the tangency point. The intercepted arc measures $146°$. Find the angle.",
          order: 10,
          problem: {
            id: "10-5-p1-q",
            choices: [
              { id: "a", text: "73°" },
              { id: "b", text: "146°" },
              { id: "c", text: "292°" },
              { id: "d", text: "107°" },
            ],
            correctAnswerId: "a",
            solution:
              "Tangent-chord angle $= \\frac{1}{2}(146°) = 73°$.",
            difficulty: "easy",
          },
        },
        {
          id: "10-5-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "Two chords cross inside a circle. The two intercepted arcs are $80°$ and $50°$. Find the angle at the intersection.",
          order: 11,
          problem: {
            id: "10-5-p2-q",
            choices: [
              { id: "a", text: "65°" },
              { id: "b", text: "130°" },
              { id: "c", text: "30°" },
              { id: "d", text: "15°" },
            ],
            correctAnswerId: "a",
            solution:
              "$m\\angle = \\frac{1}{2}(80° + 50°) = \\frac{1}{2}(130°) = 65°$.",
            difficulty: "easy",
          },
        },
        {
          id: "10-5-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "Two secants from an external point intercept arcs of $200°$ and $80°$. Find the angle at the external point.",
          order: 12,
          problem: {
            id: "10-5-p3-q",
            choices: [
              { id: "a", text: "60°" },
              { id: "b", text: "140°" },
              { id: "c", text: "120°" },
              { id: "d", text: "160°" },
            ],
            correctAnswerId: "a",
            solution:
              "$m\\angle = \\frac{1}{2}(200° - 80°) = \\frac{1}{2}(120°) = 60°$.",
            difficulty: "medium",
          },
        },
        {
          id: "10-5-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "A secant and a tangent from an external point intercept a far arc of $230°$ and a near arc of $130°$. Find the angle.",
          order: 13,
          problem: {
            id: "10-5-p4-q",
            choices: [
              { id: "a", text: "50°" },
              { id: "b", text: "100°" },
              { id: "c", text: "180°" },
              { id: "d", text: "65°" },
            ],
            correctAnswerId: "a",
            solution:
              "$m\\angle = \\frac{1}{2}(230° - 130°) = \\frac{1}{2}(100°) = 50°$.",
            difficulty: "medium",
          },
        },
      ],
    },

    // ================================================
    // LESSON 10.6 — Segment Relationships in Circles
    // ================================================
    {
      id: "10-6",
      title: "Lesson 10.6",
      subtitle: "Segment Relationships in Circles",
      order: 3,
      sections: [
        {
          id: "10-6-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "This lesson covers segment length relationships when chords, secants, and tangents intersect in or around a circle.",
          order: 0,
        },
        {
          id: "10-6-diagram-cs",
          type: "diagram",
          title: "Intersecting Chords",
          content:
            "When two chords intersect inside a circle, the products of their segments are equal.",
          imageComponent: "ChordSegmentsDiagram",
          order: 1,
        },
        {
          id: "10-6-thm-1",
          type: "theorem",
          title: "Theorem 10.13 — Chord-Chord Product",
          content:
            "If two chords intersect **inside** a circle, then the products of their segments are equal.\n\n$$EA \\cdot EB = EC \\cdot ED$$\n\nIn the diagram, $a \\cdot b = c \\cdot d$.",
          keyTakeaway:
            "Chords cross inside → multiply the two pieces of each chord → products are equal.",
          order: 2,
        },
        {
          id: "10-6-ex-1",
          type: "example",
          title: "Example — Chord Segments",
          content:
            "Two chords intersect inside a circle. One chord is split into segments of $4$ and $6$, and the other chord has one segment of $3$. Find the missing segment $x$.",
          steps: [
            "Apply Theorem 10.13: $4 \\cdot 6 = 3 \\cdot x$",
            "$24 = 3x$",
            "$x = 8$",
          ],
          order: 3,
        },
        {
          id: "10-6-diagram-ss",
          type: "diagram",
          title: "Secant Segments from an External Point",
          content:
            "When two secants extend from the same external point, the products (external × whole) are equal.",
          imageComponent: "SecantSegmentsDiagram",
          order: 4,
        },
        {
          id: "10-6-thm-2",
          type: "theorem",
          title: "Theorem 10.14 — Secant-Secant Product",
          content:
            "If two secants are drawn from an **external** point, then the product of one secant's external segment and its whole length equals the product for the other secant.\n\n$$EA \\cdot EB = EC \\cdot ED$$\n\nwhere $EA$ is the external part and $EB$ is the entire secant length (and likewise for $C$, $D$).",
          keyTakeaway:
            "External × whole = external × whole (for both secants).",
          order: 5,
        },
        {
          id: "10-6-ex-2",
          type: "example",
          title: "Example — Secant Segments",
          content:
            "From an external point, one secant has an external segment of $5$ and passes through the circle for a total length of $12$. The other secant has an external segment of $4$. Find the total length of the second secant.",
          steps: [
            "Apply Theorem 10.14: $5 \\cdot 12 = 4 \\cdot x$",
            "$60 = 4x$",
            "$x = 15$",
          ],
          order: 6,
        },
        {
          id: "10-6-diagram-st",
          type: "diagram",
          title: "Secant-Tangent from External Point",
          content:
            "When a tangent and a secant extend from the same external point, the tangent squared equals the external segment times the whole secant.",
          imageComponent: "SecantTangentDiagram",
          order: 7,
        },
        {
          id: "10-6-thm-3",
          type: "theorem",
          title: "Theorem 10.15 — Secant-Tangent Product",
          content:
            "If a tangent and a secant are drawn from the same **external** point, then:\n\n$$t^2 = a \\cdot (a + b)$$\n\nwhere $t$ is the tangent length, $a$ is the external part of the secant, and $a + b$ is the full secant length.",
          keyTakeaway:
            "Tangent² = external × whole secant.",
          order: 8,
        },
        {
          id: "10-6-ex-3",
          type: "example",
          title: "Example — Tangent-Secant",
          content:
            "From an external point, a tangent has length $8$ and a secant has an external segment of $4$. Find the full secant length.",
          steps: [
            "Apply Theorem 10.15: $8^2 = 4 \\cdot x$",
            "$64 = 4x$",
            "$x = 16$ (full secant length)",
          ],
          order: 9,
        },
        // --- Practice ---
        {
          id: "10-6-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "Two chords intersect inside a circle. One chord has segments $5$ and $8$. The other has one segment of $10$. Find $x$.",
          order: 10,
          problem: {
            id: "10-6-p1-q",
            choices: [
              { id: "a", text: "4" },
              { id: "b", text: "6" },
              { id: "c", text: "8" },
              { id: "d", text: "16" },
            ],
            correctAnswerId: "a",
            solution:
              "$5 \\cdot 8 = 10 \\cdot x \\Rightarrow 40 = 10x \\Rightarrow x = 4$.",
            difficulty: "easy",
          },
        },
        {
          id: "10-6-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "Two secants from an external point. Secant 1: external = $6$, whole = $14$. Secant 2: external = $7$. Find the whole length of secant 2.",
          order: 11,
          problem: {
            id: "10-6-p2-q",
            choices: [
              { id: "a", text: "10" },
              { id: "b", text: "12" },
              { id: "c", text: "14" },
              { id: "d", text: "8" },
            ],
            correctAnswerId: "b",
            solution:
              "$6 \\cdot 14 = 7 \\cdot x \\Rightarrow 84 = 7x \\Rightarrow x = 12$.",
            difficulty: "easy",
          },
        },
        {
          id: "10-6-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "A tangent of length $9$ and a secant (external $= 3$) from the same point. Find the full secant length.",
          order: 12,
          problem: {
            id: "10-6-p3-q",
            choices: [
              { id: "a", text: "27" },
              { id: "b", text: "24" },
              { id: "c", text: "18" },
              { id: "d", text: "12" },
            ],
            correctAnswerId: "a",
            solution:
              "$9^2 = 3 \\cdot x \\Rightarrow 81 = 3x \\Rightarrow x = 27$.",
            difficulty: "medium",
          },
        },
        {
          id: "10-6-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "Two chords intersect inside a circle. One chord has segments $x$ and $12$; the other has segments $6$ and $8$. Solve for $x$.",
          order: 13,
          problem: {
            id: "10-6-p4-q",
            choices: [
              { id: "a", text: "4" },
              { id: "b", text: "6" },
              { id: "c", text: "3" },
              { id: "d", text: "8" },
            ],
            correctAnswerId: "a",
            solution:
              "$x \\cdot 12 = 6 \\cdot 8 \\Rightarrow 12x = 48 \\Rightarrow x = 4$.",
            difficulty: "easy",
          },
        },
      ],
    },

    // ================================================
    // LESSON 10.7 — Circles in the Coordinate Plane
    // ================================================
    {
      id: "10-7",
      title: "Lesson 10.7",
      subtitle: "Circles in the Coordinate Plane",
      order: 4,
      sections: [
        {
          id: "10-7-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "Write and graph equations of circles using center-radius form, and convert general form to standard form by completing the square.",
          order: 0,
        },
        {
          id: "10-7-diagram-cp",
          type: "diagram",
          title: "Circle on the Coordinate Plane",
          content:
            "A circle with center $(h, k)$ and radius $r$ on the coordinate plane. Every point $(x, y)$ on the circle is exactly $r$ units from the center.",
          imageComponent: "CircleCoordinateDiagram",
          order: 1,
        },
        {
          id: "10-7-thm-1",
          type: "theorem",
          title: "Standard Form of a Circle",
          content:
            "The equation of a circle with center $(h, k)$ and radius $r$ is:\n\n$$(x - h)^2 + (y - k)^2 = r^2$$\n\nThis comes directly from the **distance formula** applied to every point on the circle.",
          keyTakeaway:
            "Standard form: (x − h)² + (y − k)² = r². Center is (h, k), radius is r.",
          order: 2,
        },
        {
          id: "10-7-ex-1",
          type: "example",
          title: "Example — Write the Equation",
          content:
            "Write the equation of a circle with center $(3, -2)$ and radius $5$.",
          steps: [
            "Use standard form: $(x - h)^2 + (y - k)^2 = r^2$",
            "Substitute $h = 3$, $k = -2$, $r = 5$",
            "$(x - 3)^2 + (y - (-2))^2 = 5^2$",
            "$(x - 3)^2 + (y + 2)^2 = 25$",
          ],
          order: 3,
        },
        {
          id: "10-7-ex-2",
          type: "example",
          title: "Example — Identify Center & Radius",
          content:
            "Find the center and radius of $(x + 1)^2 + (y - 4)^2 = 36$.",
          steps: [
            "Compare with $(x - h)^2 + (y - k)^2 = r^2$",
            "$(x + 1)^2 = (x - (-1))^2$ → $h = -1$",
            "$(y - 4)^2$ → $k = 4$",
            "$r^2 = 36$ → $r = 6$",
            "Center $(-1, 4)$, radius $6$.",
          ],
          order: 4,
        },
        {
          id: "10-7-def-cs",
          type: "definition",
          title: "Completing the Square",
          content:
            "To convert a circle equation from **general form** $x^2 + y^2 + Dx + Ey + F = 0$ to **standard form**, group $x$ and $y$ terms and complete the square for each variable.\n\nFor $x^2 + bx$: add and subtract $(b/2)^2$.",
          order: 5,
        },
        {
          id: "10-7-ex-3",
          type: "example",
          title: "Example — Completing the Square",
          content:
            "Convert $x^2 + y^2 - 6x + 4y - 3 = 0$ to standard form.",
          steps: [
            "Group: $(x^2 - 6x) + (y^2 + 4y) = 3$",
            "Complete the square for $x$: $(x^2 - 6x + 9) = (x - 3)^2$, add $9$ to both sides",
            "Complete the square for $y$: $(y^2 + 4y + 4) = (y + 2)^2$, add $4$ to both sides",
            "$(x - 3)^2 + (y + 2)^2 = 3 + 9 + 4 = 16$",
            "Center $(3, -2)$, radius $4$.",
          ],
          order: 6,
        },
        // --- Practice ---
        {
          id: "10-7-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "What is the equation of a circle with center $(0, 0)$ and radius $7$?",
          order: 7,
          problem: {
            id: "10-7-p1-q",
            choices: [
              { id: "a", text: "x² + y² = 49" },
              { id: "b", text: "x² + y² = 7" },
              { id: "c", text: "(x − 7)² + (y − 7)² = 49" },
              { id: "d", text: "x² + y² = 14" },
            ],
            correctAnswerId: "a",
            solution:
              "$(x - 0)^2 + (y - 0)^2 = 7^2 \\Rightarrow x^2 + y^2 = 49$.",
            difficulty: "easy",
          },
        },
        {
          id: "10-7-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "$(x - 5)^2 + (y + 3)^2 = 64$. What is the radius?",
          order: 8,
          problem: {
            id: "10-7-p2-q",
            choices: [
              { id: "a", text: "8" },
              { id: "b", text: "64" },
              { id: "c", text: "32" },
              { id: "d", text: "4" },
            ],
            correctAnswerId: "a",
            solution:
              "$r^2 = 64 \\Rightarrow r = \\sqrt{64} = 8$.",
            difficulty: "easy",
          },
        },
        {
          id: "10-7-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "Convert $x^2 + y^2 + 8x - 2y + 8 = 0$ to standard form. What is the center?",
          order: 9,
          problem: {
            id: "10-7-p3-q",
            choices: [
              { id: "a", text: "(−4, 1)" },
              { id: "b", text: "(4, −1)" },
              { id: "c", text: "(−8, 2)" },
              { id: "d", text: "(8, −2)" },
            ],
            correctAnswerId: "a",
            solution:
              "$(x^2 + 8x + 16) + (y^2 - 2y + 1) = -8 + 16 + 1 = 9$\n$(x + 4)^2 + (y - 1)^2 = 9$. Center $= (-4, 1)$, radius $= 3$.",
            difficulty: "hard",
          },
        },
        {
          id: "10-7-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "A circle has center $(-2, 6)$ and passes through the point $(1, 10)$. What is $r^2$?",
          order: 10,
          problem: {
            id: "10-7-p4-q",
            choices: [
              { id: "a", text: "25" },
              { id: "b", text: "5" },
              { id: "c", text: "7" },
              { id: "d", text: "49" },
            ],
            correctAnswerId: "a",
            solution:
              "$r^2 = (1 - (-2))^2 + (10 - 6)^2 = 3^2 + 4^2 = 9 + 16 = 25$.",
            difficulty: "medium",
          },
        },
      ],
    },

    // ================================================
    // LESSON 10.8 — Arc Length and Sector Area
    // ================================================
    {
      id: "10-8",
      title: "Lesson 10.8",
      subtitle: "Arc Length & Sector Area",
      order: 5,
      sections: [
        {
          id: "10-8-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "Calculate arc length and sector area using the ratio of the central angle to the full circle (360°).",
          order: 0,
        },
        {
          id: "10-8-diagram-als",
          type: "diagram",
          title: "Arc Length & Sector",
          content:
            "A sector is a \"pizza slice\" of a circle. The arc is the curved edge. Both depend on the central angle $\\theta$ and the radius $r$.",
          imageComponent: "ArcLengthSectorDiagram",
          order: 1,
        },
        {
          id: "10-8-def-arc",
          type: "definition",
          title: "Arc Length",
          content:
            "**Arc length** is the distance along the curved part of the circle between two points (a fraction of the circumference).",
          order: 2,
        },
        {
          id: "10-8-thm-1",
          type: "postulate",
          title: "Arc Length Formula",
          content:
            "The length $L$ of an arc with central angle $\\theta$ (in degrees) in a circle of radius $r$ is:\n\n$$L = \\frac{\\theta}{360°} \\cdot 2\\pi r$$",
          keyTakeaway:
            "Arc length = (angle / 360) × circumference.",
          order: 3,
        },
        {
          id: "10-8-ex-1",
          type: "example",
          title: "Example — Arc Length",
          content:
            "Find the length of an arc with central angle $60°$ in a circle of radius $9$ cm.",
          steps: [
            "$L = \\frac{\\theta}{360°} \\cdot 2\\pi r$",
            "$L = \\frac{60°}{360°} \\cdot 2\\pi(9)$",
            "$L = \\frac{1}{6} \\cdot 18\\pi = 3\\pi \\approx 9.42$ cm",
          ],
          order: 4,
        },
        {
          id: "10-8-def-sector",
          type: "definition",
          title: "Sector of a Circle",
          content:
            "A **sector** is the region bounded by two radii and their intercepted arc (like a pizza slice).",
          order: 5,
        },
        {
          id: "10-8-thm-2",
          type: "postulate",
          title: "Sector Area Formula",
          content:
            "The area $A$ of a sector with central angle $\\theta$ (in degrees) in a circle of radius $r$ is:\n\n$$A = \\frac{\\theta}{360°} \\cdot \\pi r^2$$",
          keyTakeaway:
            "Sector area = (angle / 360) × total area of circle.",
          order: 6,
        },
        {
          id: "10-8-ex-2",
          type: "example",
          title: "Example — Sector Area",
          content:
            "Find the area of a sector with central angle $90°$ in a circle of radius $10$ in.",
          steps: [
            "$A = \\frac{\\theta}{360°} \\cdot \\pi r^2$",
            "$A = \\frac{90°}{360°} \\cdot \\pi(10)^2$",
            "$A = \\frac{1}{4} \\cdot 100\\pi = 25\\pi \\approx 78.54$ in²",
          ],
          order: 7,
        },
        {
          id: "10-8-ex-3",
          type: "example",
          title: "Example — Working Backward",
          content:
            "An arc has length $5\\pi$ and the radius is $15$. Find the central angle.",
          steps: [
            "$5\\pi = \\frac{\\theta}{360°} \\cdot 2\\pi(15)$",
            "$5\\pi = \\frac{\\theta}{360°} \\cdot 30\\pi$",
            "$\\frac{5\\pi}{30\\pi} = \\frac{\\theta}{360°}$",
            "$\\frac{1}{6} = \\frac{\\theta}{360°}$",
            "$\\theta = 60°$",
          ],
          order: 8,
        },
        // --- Practice ---
        {
          id: "10-8-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "Find the arc length: central angle $= 45°$, radius $= 12$ cm.",
          order: 9,
          problem: {
            id: "10-8-p1-q",
            choices: [
              { id: "a", text: "3π cm" },
              { id: "b", text: "6π cm" },
              { id: "c", text: "9π cm" },
              { id: "d", text: "12π cm" },
            ],
            correctAnswerId: "a",
            solution:
              "$L = \\frac{45}{360} \\cdot 2\\pi(12) = \\frac{1}{8} \\cdot 24\\pi = 3\\pi$ cm.",
            difficulty: "easy",
          },
        },
        {
          id: "10-8-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "Find the sector area: central angle $= 120°$, radius $= 6$ in.",
          order: 10,
          problem: {
            id: "10-8-p2-q",
            choices: [
              { id: "a", text: "12π in²" },
              { id: "b", text: "24π in²" },
              { id: "c", text: "36π in²" },
              { id: "d", text: "6π in²" },
            ],
            correctAnswerId: "a",
            solution:
              "$A = \\frac{120}{360} \\cdot \\pi(6)^2 = \\frac{1}{3} \\cdot 36\\pi = 12\\pi$ in².",
            difficulty: "easy",
          },
        },
        {
          id: "10-8-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "An arc is $10\\pi$ cm long in a circle of radius $20$ cm. What is the central angle?",
          order: 11,
          problem: {
            id: "10-8-p3-q",
            choices: [
              { id: "a", text: "90°" },
              { id: "b", text: "45°" },
              { id: "c", text: "120°" },
              { id: "d", text: "180°" },
            ],
            correctAnswerId: "a",
            solution:
              "$10\\pi = \\frac{\\theta}{360} \\cdot 2\\pi(20) = \\frac{\\theta}{360} \\cdot 40\\pi$\n$\\frac{10\\pi}{40\\pi} = \\frac{\\theta}{360}$\n$\\frac{1}{4} = \\frac{\\theta}{360}$\n$\\theta = 90°$.",
            difficulty: "medium",
          },
        },
        {
          id: "10-8-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "A sector has area $50\\pi$ m² and central angle $72°$. Find the radius.",
          order: 12,
          problem: {
            id: "10-8-p4-q",
            choices: [
              { id: "a", text: "√250 ≈ 15.8 m" },
              { id: "b", text: "10 m" },
              { id: "c", text: "25 m" },
              { id: "d", text: "5√10 m" },
            ],
            correctAnswerId: "d",
            solution:
              "$50\\pi = \\frac{72}{360} \\cdot \\pi r^2 = \\frac{1}{5} \\pi r^2$\n$250 = r^2$\n$r = \\sqrt{250} = 5\\sqrt{10} \\approx 15.81$ m.\n\nBoth (a) and (d) are equivalent — $5\\sqrt{10}$ is the exact answer.",
            difficulty: "hard",
          },
        },
      ],
    },
  ],
};

import { physicsMechanics } from "./physics-mechanics";
import { calculus } from "./calculus";
import { numberTheory } from "./number-theory";
import { physicsEM } from "./physics-em";

/** All available study guides */
export const studyGuides: StudyGuide[] = [chapter10Circles, physicsMechanics, calculus, numberTheory, physicsEM];

/** Lookup a guide by ID */
export function getStudyGuideById(id: string): StudyGuide | undefined {
  return studyGuides.find((g) => g.id === id);
}
