import type { StudyGuide } from "@/types/studyguide";

// ═══════════════════════════════════════════════════════════════════════════
// Unit 1 — Electric Charge & Coulomb's Law
// References: Griffiths Ch.2.1; OpenStax University Physics Vol.2 Ch.5
// ═══════════════════════════════════════════════════════════════════════════

const unit1 = {
  id: "em-1",
  title: "Unit 1",
  subtitle: "Electric Charge & Coulomb's Law",
  order: 1,
  sections: [
    {
      id: "em-1-intro",
      type: "note" as const,
      title: "What You'll Learn",
      content:
        "In this unit you will master the fundamental properties of electric charge — quantization, conservation, and the two-sign convention — then derive and apply **Coulomb's law** in scalar and vector form. You will practice superposition for multi-charge systems and distinguish conductors from insulators at the atomic level. Use the Desmos panel to plot force-vs-distance curves and verify the inverse-square relationship.",
      order: 0,
    },
    {
      id: "em-1-def-charge",
      type: "definition" as const,
      title: "Electric Charge",
      content:
        "**Electric charge** ($q$) is an intrinsic property of matter that causes it to experience a force in an electromagnetic field. Charge is **quantized**: the smallest free charge is the elementary charge $e = 1.602 \\times 10^{-19}\\;\\text{C}$. Any observable charge satisfies $q = ne$ where $n$ is an integer. Charge is a **scalar** — positive or negative — and obeys a **conservation law**: the net charge of an isolated system never changes.",
      order: 1,
    },
    {
      id: "em-1-def-conductor",
      type: "definition" as const,
      title: "Conductors & Insulators",
      content:
        "A **conductor** is a material in which charge carriers (typically electrons in metals) move freely under an applied electric field. In electrostatic equilibrium, all excess charge resides on the surface and $\\vec{E} = 0$ inside. An **insulator** (dielectric) has charges bound to atoms; they can polarize but not flow freely. **Semiconductors** fall between the two extremes, with conductivity that depends on temperature and doping.",
      order: 2,
    },
    {
      id: "em-1-diagram-conductor",
      type: "diagram" as const,
      title: "Conductors vs. Insulators",
      content:
        "In a conductor excess charges migrate to the surface so the interior field vanishes. In an insulator charges remain fixed where they are deposited.",
      imageComponent: "ConductorInsulatorDiagram",
      order: 3,
    },
    {
      id: "em-1-def-coulomb",
      type: "definition" as const,
      title: "Coulomb's Law (Scalar Form)",
      content:
        "The magnitude of the electrostatic force between two point charges $q_1$ and $q_2$ separated by distance $r$ is $$F = k_e \\frac{|q_1 q_2|}{r^2}$$ where **Coulomb's constant** $k_e = \\frac{1}{4\\pi\\varepsilon_0} \\approx 8.99 \\times 10^9\\;\\text{N·m}^2/\\text{C}^2$ and $\\varepsilon_0 = 8.854 \\times 10^{-12}\\;\\text{C}^2/(\\text{N·m}^2)$ is the **permittivity of free space**.",
      order: 4,
    },
    {
      id: "em-1-thm-coulomb-vec",
      type: "theorem" as const,
      title: "Coulomb's Law (Vector Form)",
      content:
        "The force on charge $q_2$ due to charge $q_1$ is $$\\vec{F}_{12} = k_e \\frac{q_1 q_2}{r^2}\\,\\hat{r}_{12}$$ where $\\hat{r}_{12}$ points from $q_1$ to $q_2$. The force is **repulsive** ($\\vec{F}$ along $\\hat{r}$) for like signs and **attractive** (opposite $\\hat{r}$) for unlike signs. Newton's third law guarantees $\\vec{F}_{21} = -\\vec{F}_{12}$.",
      keyTakeaway:
        "Coulomb's force is an inverse-square law: doubling the distance reduces the force to one-quarter.",
      order: 5,
    },
    {
      id: "em-1-diagram-coulomb",
      type: "diagram" as const,
      title: "Coulomb Force Between Two Charges",
      content:
        "Two like charges repel with equal-magnitude, opposite-direction forces. The dashed line indicates the separation $r$.",
      imageComponent: "CoulombForceDiagram",
      order: 6,
    },
    {
      id: "em-1-thm-superposition",
      type: "theorem" as const,
      title: "Principle of Superposition",
      content:
        "The net force on a charge $q_0$ due to $N$ other point charges is the **vector sum** of the individual Coulomb forces: $$\\vec{F}_{\\text{net}} = \\sum_{i=1}^{N} k_e \\frac{q_0 q_i}{r_{0i}^2}\\,\\hat{r}_{0i}$$ Each pair interacts independently; intermediate charges do not screen one another.",
      keyTakeaway:
        "Always break forces into components ($x$, $y$) before summing; magnitudes alone are not enough.",
      order: 7,
    },
    {
      id: "em-1-def-charging",
      type: "definition" as const,
      title: "Methods of Charging",
      content:
        "Objects can be charged by **friction** (triboelectric effect), **conduction** (direct contact transfers charge), or **induction** (a nearby charged object polarizes a conductor; grounding then removes one sign of charge). In induction the inducing object never touches the target, so its own charge is unchanged.",
      order: 8,
    },
    {
      id: "em-1-def-polarization",
      type: "definition" as const,
      title: "Polarization of Insulators",
      content:
        "Even though charges in an insulator cannot flow, an external electric field slightly shifts the electron clouds relative to nuclei, creating tiny **induced dipoles**. The net effect is a layer of bound surface charge that partially cancels the applied field inside the material. This phenomenon is called **dielectric polarization** and is characterized by the polarization vector $\\vec{P}$.",
      order: 9,
    },
    {
      id: "em-1-ex-1",
      type: "example" as const,
      title: "Example — Force Between Two Point Charges",
      content:
        "Two charges $q_1 = +3\\;\\mu\\text{C}$ and $q_2 = -5\\;\\mu\\text{C}$ are $0.20\\;\\text{m}$ apart. Find the magnitude and direction of the force on $q_2$.",
      steps: [
        "Identify the knowns: $q_1 = 3 \\times 10^{-6}\\;\\text{C}$, $q_2 = -5 \\times 10^{-6}\\;\\text{C}$, $r = 0.20\\;\\text{m}$.",
        "Apply Coulomb's law: $F = k_e \\frac{|q_1||q_2|}{r^2} = (8.99 \\times 10^9)\\frac{(3 \\times 10^{-6})(5 \\times 10^{-6})}{(0.20)^2}$.",
        "Compute: $(8.99 \\times 10^9)(15 \\times 10^{-12}) / 0.04 = 3.37\\;\\text{N}$.",
        "Direction: opposite signs attract, so $\\vec{F}$ on $q_2$ points **toward** $q_1$.",
      ],
      order: 10,
    },
    {
      id: "em-1-ex-2",
      type: "example" as const,
      title: "Example — Superposition with Three Collinear Charges",
      content:
        "Charges $q_A = +2\\;\\mu\\text{C}$, $q_B = -4\\;\\mu\\text{C}$, and $q_C = +1\\;\\mu\\text{C}$ sit on the $x$-axis at $x = 0$, $x = 0.30\\;\\text{m}$, and $x = 0.50\\;\\text{m}$. Find the net force on $q_B$.",
      steps: [
        "Force from $q_A$ on $q_B$: $F_{AB} = k_e(2)(4)\\times10^{-12}/(0.30)^2 = 0.799\\;\\text{N}$, attractive, toward $q_A$ (negative $x$).",
        "Force from $q_C$ on $q_B$: $F_{CB} = k_e(4)(1)\\times10^{-12}/(0.20)^2 = 0.899\\;\\text{N}$, attractive, toward $q_C$ (positive $x$).",
        "Net force: $F_{\\text{net}} = 0.899 - 0.799 = 0.100\\;\\text{N}$ in the $+x$ direction.",
        "The closer, larger force from $q_C$ wins, pulling $q_B$ to the right.",
      ],
      order: 11,
    },
    {
      id: "em-1-ex-3",
      type: "example" as const,
      title: "Example — 2-D Superposition: Equilateral Triangle",
      content:
        "Three identical charges $q = +4\\;\\mu\\text{C}$ sit at the vertices of an equilateral triangle with side $a = 0.10\\;\\text{m}$. Find the net force on the charge at the top vertex.",
      steps: [
        "Each bottom charge repels the top charge with $F = k_e q^2/a^2 = 14.38\\;\\text{N}$.",
        "Left charge: $F_x = F\\cos 30° = 12.45\\;\\text{N}$, $F_y = F\\sin 30° = 7.19\\;\\text{N}$.",
        "Right charge: $F_x = -12.45\\;\\text{N}$, $F_y = 7.19\\;\\text{N}$.",
        "Sum: $F_{x,\\text{net}} = 0$; $F_{y,\\text{net}} = 14.38\\;\\text{N}$ straight up.",
        "By symmetry the horizontal components cancel; the net force is purely vertical.",
      ],
      order: 12,
    },
    {
      id: "em-1-note-desmos",
      type: "note" as const,
      title: "Desmos Exploration — Inverse-Square Law",
      content:
        "Open the **Desmos panel** and plot $F(r) = k \\cdot q_1 \\cdot q_2 / r^2$. Set sliders for $q_1$, $q_2$, and $k = 8.99 \\times 10^9$. Observe how the force curve steepens as charges increase and flattens as $r$ grows.",
      order: 13,
    },
    {
      id: "em-1-p1",
      type: "practice" as const,
      title: "Practice 1 — Nuclear Force Scale",
      content:
        "Two protons ($q = 1.6 \\times 10^{-19}\\;\\text{C}$) are separated by $1.0 \\times 10^{-15}\\;\\text{m}$. What is the electrostatic force between them?",
      order: 14,
      problem: {
        id: "em-1-p1-q",
        choices: [
          { id: "a", text: "$230\\;\\text{N}$" },
          { id: "b", text: "$2.3 \\times 10^{-4}\\;\\text{N}$" },
          { id: "c", text: "$23\\;\\text{N}$" },
          { id: "d", text: "$2.3 \\times 10^{2}\\;\\text{N}$" },
        ],
        correctAnswerId: "a",
        solution:
          "$F = k_e q^2/r^2 = (8.99 \\times 10^9)(2.56 \\times 10^{-38})/(10^{-30}) \\approx 230\\;\\text{N}$. This enormous force is overcome by the even stronger nuclear force.",
        hint: "Compute $k_e q^2$ first, then divide by $r^2$.",
        difficulty: "medium" as const,
      },
    },
    {
      id: "em-1-p2",
      type: "practice" as const,
      title: "Practice 2 — Zero-Force Position",
      content:
        "Charge $A = +6\\;\\mu\\text{C}$ is at the origin. Charge $B = -3\\;\\mu\\text{C}$ is at $(0.40,0)$. Where on the $x$-axis is the net force on a test charge zero?",
      order: 15,
      problem: {
        id: "em-1-p2-q",
        choices: [
          { id: "a", text: "$x = 0.97\\;\\text{m}$" },
          { id: "b", text: "$x = -0.97\\;\\text{m}$" },
          { id: "c", text: "$x = 0.20\\;\\text{m}$" },
          { id: "d", text: "$x = 1.37\\;\\text{m}$" },
        ],
        correctAnswerId: "a",
        solution:
          "Zero-force point lies to the right of $B$ (outside). Set $6/x^2 = 3/(x-0.40)^2$. Solve: $x^2 - 1.6x + 0.32 = 0 \\Rightarrow x = 0.97\\;\\text{m}$.",
        hint: "The zero-force point lies outside the two charges, on the side of the smaller one.",
        difficulty: "hard" as const,
      },
    },
    {
      id: "em-1-p3",
      type: "practice" as const,
      title: "Practice 3 — Charge Quantization",
      content:
        "A rubber rod acquires charge $-4.8 \\times 10^{-7}\\;\\text{C}$. How many excess electrons does it have?",
      order: 16,
      problem: {
        id: "em-1-p3-q",
        choices: [
          { id: "a", text: "$3.0 \\times 10^{12}$" },
          { id: "b", text: "$3.0 \\times 10^{14}$" },
          { id: "c", text: "$3.0 \\times 10^{10}$" },
          { id: "d", text: "$7.7 \\times 10^{11}$" },
        ],
        correctAnswerId: "a",
        solution:
          "$n = |q|/e = 4.8 \\times 10^{-7}/1.6 \\times 10^{-19} = 3.0 \\times 10^{12}$ electrons.",
        hint: "Divide the magnitude of charge by the elementary charge $e$.",
        difficulty: "medium" as const,
      },
    },
    {
      id: "em-1-p4",
      type: "practice" as const,
      title: "Practice 4 — Charging by Induction",
      content:
        "A positively charged rod is brought near (but not touching) a grounded metal sphere. The ground wire is removed, then the rod is removed. The sphere's final charge is:",
      order: 17,
      problem: {
        id: "em-1-p4-q",
        choices: [
          { id: "a", text: "Negative" },
          { id: "b", text: "Positive" },
          { id: "c", text: "Zero" },
          { id: "d", text: "Cannot be determined" },
        ],
        correctAnswerId: "a",
        solution:
          "The rod attracts electrons from ground onto the sphere. Removing the ground wire traps those electrons. Removing the rod leaves net **negative** charge.",
        hint: "Which charge carriers can flow through the ground wire while the rod is nearby?",
        difficulty: "medium" as const,
      },
    },
    {
      id: "em-1-p5",
      type: "practice" as const,
      title: "Practice 5 — Charge Sharing",
      content:
        "Two identical conducting spheres carry $+5Q$ and $-3Q$. After touching and separating, each has charge:",
      order: 18,
      problem: {
        id: "em-1-p5-q",
        choices: [
          { id: "a", text: "$+Q$" },
          { id: "b", text: "$+2Q$" },
          { id: "c", text: "$+4Q$ and $-2Q$" },
          { id: "d", text: "$0$" },
        ],
        correctAnswerId: "a",
        solution:
          "Total charge conserved: $+5Q - 3Q = +2Q$. Identical spheres share equally: $+Q$ each.",
        difficulty: "medium" as const,
      },
    },
    {
      id: "em-1-p6",
      type: "practice" as const,
      title: "Practice 6 — Equilibrium Position",
      content:
        "Fixed charges $+Q$ and $+4Q$ are separated by $d$. A third charge is in equilibrium at distance from $+Q$ of:",
      order: 19,
      problem: {
        id: "em-1-p6-q",
        choices: [
          { id: "a", text: "$d/3$" },
          { id: "b", text: "$d/2$" },
          { id: "c", text: "$2d/3$" },
          { id: "d", text: "$d/5$" },
        ],
        correctAnswerId: "a",
        solution:
          "Set $kQ/x^2 = k(4Q)/(d-x)^2$. Then $(d-x)^2 = 4x^2 \\Rightarrow d - x = 2x \\Rightarrow x = d/3$.",
        hint: "Set the two Coulomb forces equal; the equilibrium is closer to the smaller charge.",
        difficulty: "medium" as const,
      },
    },
    {
      id: "em-1-p7",
      type: "practice" as const,
      title: "Practice 7 — Inverse-Square Scaling",
      content:
        "If the distance between two charges is tripled, the electrostatic force:",
      order: 20,
      problem: {
        id: "em-1-p7-q",
        choices: [
          { id: "a", text: "Decreases to $1/9$" },
          { id: "b", text: "Decreases to $1/3$" },
          { id: "c", text: "Increases by $9$" },
          { id: "d", text: "Stays the same" },
        ],
        correctAnswerId: "a",
        solution: "$F \\propto 1/r^2$. If $r \\to 3r$, then $F \\to F/9$.",
        difficulty: "medium" as const,
      },
    },
    {
      id: "em-1-p8",
      type: "practice" as const,
      title: "Practice 8 — 2-D Resultant Force",
      content:
        "$q_1 = +4\\;\\mu\\text{C}$ at origin, $q_2 = -2\\;\\mu\\text{C}$ at $(3,0)\\;\\text{m}$, $q_3 = +1\\;\\mu\\text{C}$ at $(0,4)\\;\\text{m}$. Magnitude of net force on $q_1$?",
      order: 21,
      problem: {
        id: "em-1-p8-q",
        choices: [
          { id: "a", text: "$\\approx 8.3 \\times 10^{-3}\\;\\text{N}$" },
          { id: "b", text: "$8.0 \\times 10^{-3}\\;\\text{N}$" },
          { id: "c", text: "$1.0 \\times 10^{-2}\\;\\text{N}$" },
          { id: "d", text: "$5.5 \\times 10^{-3}\\;\\text{N}$" },
        ],
        correctAnswerId: "a",
        solution:
          "$F_{21} = k(8\\times10^{-12})/9 = 7.99\\times10^{-3}\\;\\text{N}$ (toward $q_2$, $+x$). $F_{31} = k(4\\times10^{-12})/16 = 2.25\\times10^{-3}\\;\\text{N}$ (away from $q_3$, $-y$). $F = \\sqrt{7.99^2+2.25^2}\\times10^{-3} \\approx 8.3\\times10^{-3}\\;\\text{N}$.",
        hint: "Compute each force independently, decompose into $x$/$y$, then Pythagorean.",
        difficulty: "hard" as const,
      },
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// Unit 2 — Electric Fields
// References: Griffiths Ch.2.1-2.2; OpenStax Vol.2 Ch.5.4-5.6
// ═══════════════════════════════════════════════════════════════════════════

const unit2 = {
  id: "em-2",
  title: "Unit 2",
  subtitle: "Electric Fields",
  order: 2,
  sections: [
    {
      id: "em-2-intro",
      type: "note" as const,
      title: "What You'll Learn",
      content:
        "This unit introduces the **electric field** as the mediator of electrostatic interactions. You will compute $\\vec{E}$ for point charges, superpose fields for discrete and continuous distributions, interpret field-line diagrams, and study the electric dipole.",
      order: 0,
    },
    {
      id: "em-2-def-efield",
      type: "definition" as const,
      title: "Electric Field",
      content:
        "The **electric field** at a point in space is the force per unit positive test charge: $$\\vec{E} = \\frac{\\vec{F}}{q_0}$$ Units: $\\text{N/C}$ or $\\text{V/m}$. The field exists whether or not a test charge is present — it is a property of the source charges and the point in space.",
      order: 1,
    },
    {
      id: "em-2-thm-point-field",
      type: "theorem" as const,
      title: "Field of a Point Charge",
      content:
        "$$\\vec{E} = k_e \\frac{Q}{r^2}\\,\\hat{r}$$ The field points away from positive charges and toward negative charges. Falls off as $1/r^2$.",
      keyTakeaway:
        "The direction is purely radial; the magnitude is the same at all points equidistant from $Q$.",
      order: 2,
    },
    {
      id: "em-2-diagram-point-field",
      type: "diagram" as const,
      title: "Field Lines of a Point Charge",
      content:
        "Eight evenly spaced field lines radiate outward from $+Q$. Closer lines mean stronger field.",
      imageComponent: "PointChargeFieldDiagram",
      order: 3,
    },
    {
      id: "em-2-def-fieldlines",
      type: "definition" as const,
      title: "Electric Field Lines",
      content:
        "**Field lines** are curves whose tangent at every point gives the direction of $\\vec{E}$. Rules: (1) lines begin on $+$ and end on $-$ charges; (2) number of lines is proportional to $|q|$; (3) lines never cross; (4) denser lines = stronger field.",
      order: 4,
    },
    {
      id: "em-2-def-dipole",
      type: "definition" as const,
      title: "Electric Dipole",
      content:
        "An **electric dipole** consists of $+q$ and $-q$ separated by $d$. The **dipole moment** is $\\vec{p} = q\\vec{d}$ (from $-$ to $+$). Far from the dipole, the field falls off as $1/r^3$.",
      order: 5,
    },
    {
      id: "em-2-diagram-dipole",
      type: "diagram" as const,
      title: "Dipole Field Lines",
      content:
        "Field lines curve from $+q$ to $-q$. Far away the field weakens as $1/r^3$.",
      imageComponent: "DipoleDiagram",
      order: 6,
    },
    {
      id: "em-2-thm-superposition-field",
      type: "theorem" as const,
      title: "Superposition of Electric Fields",
      content:
        "$$\\vec{E}_{\\text{net}} = \\sum_i k_e \\frac{q_i}{r_i^2}\\,\\hat{r}_i$$ For continuous distributions: $\\vec{E} = k_e \\int \\frac{dq}{r^2}\\,\\hat{r}$.",
      keyTakeaway:
        "Discrete sums for point charges, integrals for continuous distributions.",
      order: 7,
    },
    {
      id: "em-2-def-charge-densities",
      type: "definition" as const,
      title: "Charge Densities",
      content:
        "**Linear**: $\\lambda = dq/dl$ ($\\text{C/m}$). **Surface**: $\\sigma = dq/dA$ ($\\text{C/m}^2$). **Volume**: $\\rho = dq/dV$ ($\\text{C/m}^3$).",
      order: 8,
    },
    {
      id: "em-2-thm-dipole-torque",
      type: "theorem" as const,
      title: "Dipole in a Uniform Field",
      content:
        "A dipole in a uniform external field $\\vec{E}$ experiences no net force but a **torque** $\\vec{\\tau} = \\vec{p} \\times \\vec{E}$ (magnitude $pE\\sin\\theta$) and has potential energy $U = -\\vec{p} \\cdot \\vec{E}$. The torque tends to align $\\vec{p}$ with $\\vec{E}$.",
      keyTakeaway:
        "Minimum energy at $\\theta = 0$ (aligned); maximum at $\\theta = 180°$ (anti-aligned).",
      order: 9,
    },
    {
      id: "em-2-diagram-plates",
      type: "diagram" as const,
      title: "Uniform Field Between Parallel Plates",
      content:
        "Between large parallel plates carrying $+\\sigma$ and $-\\sigma$ the field is approximately uniform: $E = \\sigma/\\varepsilon_0$.",
      imageComponent: "ParallelPlateFieldDiagram",
      order: 10,
    },
    {
      id: "em-2-ex-1",
      type: "example" as const,
      title: "Example — Field on Axis of a Charged Ring",
      content:
        "A ring of radius $R$ carries total charge $Q$. Find $\\vec{E}$ at distance $x$ from the center on the axis.",
      steps: [
        "By symmetry, transverse components cancel.",
        "Each element $dq$ contributes $dE_x = k_e\\,dq \\cdot x/(x^2+R^2)^{3/2}$.",
        "Integrate: $E_x = k_e Qx/(x^2+R^2)^{3/2}$.",
        "At $x = 0$: $E = 0$. For $x \\gg R$: $E \\approx k_e Q/x^2$ (point charge).",
        "Maximum on axis at $x = R/\\sqrt{2}$.",
      ],
      order: 11,
    },
    {
      id: "em-2-ex-2",
      type: "example" as const,
      title: "Example — Dipole Torque",
      content:
        "A dipole $p = 6.0 \\times 10^{-30}\\;\\text{C·m}$ in field $E = 5.0 \\times 10^5\\;\\text{N/C}$. Find max torque and energy at $\\theta = 0$ and $180°$.",
      steps: [
        "$\\tau_{\\max} = pE\\sin 90° = 3.0 \\times 10^{-24}\\;\\text{N·m}$.",
        "$U(0°) = -pE = -3.0\\times10^{-24}\\;\\text{J}$ (stable).",
        "$U(180°) = +pE = +3.0\\times10^{-24}\\;\\text{J}$ (unstable).",
        "Energy difference: $\\Delta U = 2pE = 6.0\\times10^{-24}\\;\\text{J}$.",
      ],
      order: 12,
    },
    {
      id: "em-2-ex-3",
      type: "example" as const,
      title: "Example — Field of a Finite Rod",
      content:
        "A rod of length $L$ and charge $Q$ along the $x$-axis. Find $E$ at distance $d$ on the perpendicular bisector.",
      steps: [
        "$\\lambda = Q/L$. By symmetry, $x$-components cancel.",
        "$dE_y = k_e \\lambda\\,dx \\cdot d/(x^2+d^2)^{3/2}$.",
        "Integrate: $E_y = k_e Q/(d\\sqrt{d^2+(L/2)^2})$.",
        "As $L \\to \\infty$: $E = 2k_e\\lambda/d = \\lambda/(2\\pi\\varepsilon_0 d)$.",
        "As $d \\gg L$: $E \\approx k_e Q/d^2$ (point charge).",
      ],
      order: 13,
    },
    {
      id: "em-2-p1",
      type: "practice" as const,
      title: "Practice 1 — Point-Charge Field",
      content: "What is $E$ at $0.50\\;\\text{m}$ from $+8\\;\\mu\\text{C}$?",
      order: 14,
      problem: {
        id: "em-2-p1-q",
        choices: [
          { id: "a", text: "$2.88 \\times 10^5\\;\\text{N/C}$" },
          { id: "b", text: "$1.44 \\times 10^5\\;\\text{N/C}$" },
          { id: "c", text: "$5.76 \\times 10^5\\;\\text{N/C}$" },
          { id: "d", text: "$7.19 \\times 10^4\\;\\text{N/C}$" },
        ],
        correctAnswerId: "a",
        solution:
          "$E = k_e Q/r^2 = (8.99\\times10^9)(8\\times10^{-6})/0.25 = 2.88\\times10^5\\;\\text{N/C}$.",
        difficulty: "medium" as const,
      },
    },
    {
      id: "em-2-p2",
      type: "practice" as const,
      title: "Practice 2 — Dipole Field Direction",
      content:
        "$+Q$ at $(+a,0)$ and $-Q$ at $(-a,0)$. Direction of net $\\vec{E}$ at the origin?",
      order: 15,
      problem: {
        id: "em-2-p2-q",
        choices: [
          { id: "a", text: "$-x$ direction" },
          { id: "b", text: "$+x$ direction" },
          { id: "c", text: "$+y$ direction" },
          { id: "d", text: "Zero" },
        ],
        correctAnswerId: "a",
        solution:
          "$\\vec{E}$ from $+Q$ points away (in $-x$). $\\vec{E}$ from $-Q$ points toward $-Q$ (also $-x$). Both add in $-x$.",
        hint: "Sketch each field vector at the origin separately.",
        difficulty: "medium" as const,
      },
    },
    {
      id: "em-2-p3",
      type: "practice" as const,
      title: "Practice 3 — Ring On-Axis",
      content:
        "Ring of radius $R = 0.10\\;\\text{m}$, $Q = 5\\;\\mu\\text{C}$. Find $E$ at $x = R$ on the axis.",
      order: 16,
      problem: {
        id: "em-2-p3-q",
        choices: [
          { id: "a", text: "$1.6 \\times 10^6\\;\\text{N/C}$" },
          { id: "b", text: "$3.2 \\times 10^6\\;\\text{N/C}$" },
          { id: "c", text: "$8.0 \\times 10^5\\;\\text{N/C}$" },
          { id: "d", text: "$4.5 \\times 10^6\\;\\text{N/C}$" },
        ],
        correctAnswerId: "a",
        solution:
          "$E = k_eQx/(x^2+R^2)^{3/2}$. At $x = R$: $E = k_eQR/(2R^2)^{3/2} = k_eQ/(2\\sqrt{2}R^2) \\approx 1.6\\times10^6\\;\\text{N/C}$.",
        hint: "At $x=R$, $x^2+R^2 = 2R^2$.",
        difficulty: "hard" as const,
      },
    },
    {
      id: "em-2-p4",
      type: "practice" as const,
      title: "Practice 4 — Field Lines",
      content: "Which statement about field lines is FALSE?",
      order: 17,
      problem: {
        id: "em-2-p4-q",
        choices: [
          { id: "a", text: "They can cross where $E = 0$" },
          { id: "b", text: "They start on $+$ and end on $-$ charges" },
          { id: "c", text: "Their density indicates field strength" },
          { id: "d", text: "They are perpendicular to equipotentials" },
        ],
        correctAnswerId: "a",
        solution:
          "Field lines **never** cross. At any point $\\vec{E}$ has a unique direction.",
        difficulty: "medium" as const,
      },
    },
    {
      id: "em-2-p5",
      type: "practice" as const,
      title: "Practice 5 — Infinite Plane Limit",
      content:
        "Disk field on axis: $E = \\frac{\\sigma}{2\\varepsilon_0}\\left(1 - \\frac{x}{\\sqrt{x^2+R^2}}\\right)$. As $R \\to \\infty$:",
      order: 18,
      problem: {
        id: "em-2-p5-q",
        choices: [
          { id: "a", text: "$\\sigma/(2\\varepsilon_0)$" },
          { id: "b", text: "$\\sigma/\\varepsilon_0$" },
          { id: "c", text: "$0$" },
          { id: "d", text: "$\\infty$" },
        ],
        correctAnswerId: "a",
        solution:
          "As $R \\to \\infty$, the second term vanishes: $E \\to \\sigma/(2\\varepsilon_0)$.",
        hint: "What happens to $x/\\sqrt{x^2+R^2}$ as $R$ dominates?",
        difficulty: "medium" as const,
      },
    },
    {
      id: "em-2-p6",
      type: "practice" as const,
      title: "Practice 6 — Dipole Torque Calculation",
      content:
        "Dipole $p = 4\\times10^{-29}\\;\\text{C·m}$ at $60°$ to $E = 2\\times10^6\\;\\text{N/C}$. Find the torque.",
      order: 19,
      problem: {
        id: "em-2-p6-q",
        choices: [
          { id: "a", text: "$6.9 \\times 10^{-23}\\;\\text{N·m}$" },
          { id: "b", text: "$8.0 \\times 10^{-23}\\;\\text{N·m}$" },
          { id: "c", text: "$4.0 \\times 10^{-23}\\;\\text{N·m}$" },
          { id: "d", text: "$3.5 \\times 10^{-23}\\;\\text{N·m}$" },
        ],
        correctAnswerId: "a",
        solution:
          "$\\tau = pE\\sin 60° = (4\\times10^{-29})(2\\times10^6)(0.866) = 6.9\\times10^{-23}\\;\\text{N·m}$.",
        difficulty: "medium" as const,
      },
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// Unit 3 — Gauss's Law
// References: Griffiths Ch.2.3; OpenStax Vol.2 Ch.6
// ═══════════════════════════════════════════════════════════════════════════

const unit3 = {
  id: "em-3",
  title: "Unit 3",
  subtitle: "Gauss's Law",
  order: 3,
  sections: [
    { id: "em-3-intro", type: "note" as const, title: "What You'll Learn", content: "Gauss's law is one of the most powerful tools in electrostatics. You will learn electric flux, Gaussian surfaces, and derive fields for spherical, cylindrical, and planar distributions. You'll also prove why $\\vec{E} = 0$ inside conductors.", order: 0 },
    { id: "em-3-def-flux", type: "definition" as const, title: "Electric Flux", content: "$$\\Phi_E = \\oint_S \\vec{E} \\cdot d\\vec{A}$$ Flux measures how much field passes through a surface. Units: $\\text{N·m}^2/\\text{C}$. For a uniform field through a flat surface: $\\Phi_E = EA\\cos\\theta$.", order: 1 },
    { id: "em-3-thm-gauss", type: "theorem" as const, title: "Gauss's Law", content: "$$\\oint_S \\vec{E} \\cdot d\\vec{A} = \\frac{Q_{\\text{enc}}}{\\varepsilon_0}$$ The total electric flux through any closed surface equals the enclosed charge divided by $\\varepsilon_0$. This is Maxwell's first equation in integral form.", keyTakeaway: "Choose a surface where $\\vec{E}$ is constant on the surface and parallel (or perpendicular) to $d\\vec{A}$ — symmetry turns the integral into a product.", order: 2 },
    { id: "em-3-def-gaussian-surface", type: "definition" as const, title: "Gaussian Surface", content: "An imaginary closed surface chosen to exploit symmetry. Three canonical forms: **spherical** (concentric sphere), **cylindrical** (coaxial cylinder), **planar** (pill-box).", order: 3 },
    { id: "em-3-diagram-sphere", type: "diagram" as const, title: "Spherical Gaussian Surface", content: "A dashed sphere of radius $r$ centered on $+Q$. On this surface $\\vec{E}$ is radial and constant.", imageComponent: "GaussianSphereDiagram", order: 4 },
    { id: "em-3-thm-shell", type: "theorem" as const, title: "Spherical Shell", content: "A thin shell of radius $R$, charge $Q$: $$E = \\begin{cases} 0 & r < R \\\\ k_e Q/r^2 & r > R \\end{cases}$$ Outside it behaves as a point charge. Inside the field is zero.", keyTakeaway: "Newton's shell theorem, electrostatic edition.", order: 5 },
    { id: "em-3-diagram-cylinder", type: "diagram" as const, title: "Cylindrical Gaussian Surface", content: "A coaxial cylinder of radius $r$ and length $L$ around infinite line charge $\\lambda$. Flux exits only the curved surface.", imageComponent: "GaussianCylinderDiagram", order: 6 },
    { id: "em-3-thm-line", type: "theorem" as const, title: "Infinite Line Charge", content: "$$E = \\frac{\\lambda}{2\\pi\\varepsilon_0 r}$$ Derived via cylindrical Gaussian surface. The $1/r$ dependence reflects one-dimensional symmetry.", keyTakeaway: "Unlike $1/r^2$ for a point charge, a line charge falls off as $1/r$.", order: 7 },
    { id: "em-3-thm-plane", type: "theorem" as const, title: "Infinite Plane of Charge", content: "$$E = \\frac{\\sigma}{2\\varepsilon_0}$$ Independent of distance. Derived with a pill-box: $2EA = \\sigma A/\\varepsilon_0$.", keyTakeaway: "Constant $E$ everywhere — the basis for parallel-plate capacitors.", order: 8 },
    { id: "em-3-def-conductor", type: "definition" as const, title: "Conductors in Equilibrium", content: "In electrostatic equilibrium: (1) $\\vec{E} = 0$ inside; (2) excess charge on surface; (3) $E = \\sigma/\\varepsilon_0$ at surface (perpendicular); (4) charge concentrates at points of high curvature.", order: 9 },
    { id: "em-3-ex-1", type: "example" as const, title: "Example — Solid Insulating Sphere", content: "Uniform volume charge density $\\rho$, radius $R$. Find $E(r)$.", steps: ["Outside ($r > R$): $E = Q/(4\\pi\\varepsilon_0 r^2)$ where $Q = \\frac{4}{3}\\pi R^3\\rho$.", "Inside ($r < R$): $Q_{\\text{enc}} = \\frac{4}{3}\\pi r^3\\rho$.", "$E(4\\pi r^2) = \\rho r^3/(3\\varepsilon_0) \\cdot 4\\pi/4\\pi$. So $E = \\rho r/(3\\varepsilon_0)$.", "Inside: $E$ grows linearly with $r$. At $r = R$ both expressions agree."], order: 10 },
    { id: "em-3-ex-2", type: "example" as const, title: "Example — Coaxial Cable", content: "Inner conductor (radius $a$, $+\\lambda$), outer conductor (inner radius $b$, $-\\lambda$).", steps: ["$r < a$: $E = 0$ (inside conductor).", "$a < r < b$: $E = \\lambda/(2\\pi\\varepsilon_0 r)$.", "$r > b$: enclosed charge $= 0$, so $E = 0$.", "Field confined between conductors — this is why coax cables shield against EMI."], order: 11 },
    { id: "em-3-p1", type: "practice" as const, title: "Practice 1 — Flux Through a Cube", content: "$Q = 3.0\\;\\mu\\text{C}$ at the center of a cube. Total flux?", order: 12, problem: { id: "em-3-p1-q", choices: [{ id: "a", text: "$3.39 \\times 10^5\\;\\text{N·m}^2/\\text{C}$" }, { id: "b", text: "$5.65 \\times 10^4\\;\\text{N·m}^2/\\text{C}$" }, { id: "c", text: "$6.78 \\times 10^5\\;\\text{N·m}^2/\\text{C}$" }, { id: "d", text: "$1.70 \\times 10^5\\;\\text{N·m}^2/\\text{C}$" }], correctAnswerId: "a", solution: "$\\Phi = Q/\\varepsilon_0 = 3.0\\times10^{-6}/8.854\\times10^{-12} = 3.39\\times10^5$. Shape doesn't matter.", difficulty: "medium" as const } },
    { id: "em-3-p2", type: "practice" as const, title: "Practice 2 — Flux Through One Face", content: "Same cube. Flux through one face?", order: 13, problem: { id: "em-3-p2-q", choices: [{ id: "a", text: "$5.65 \\times 10^4\\;\\text{N·m}^2/\\text{C}$" }, { id: "b", text: "$3.39 \\times 10^5\\;\\text{N·m}^2/\\text{C}$" }, { id: "c", text: "$1.13 \\times 10^5\\;\\text{N·m}^2/\\text{C}$" }, { id: "d", text: "$0$" }], correctAnswerId: "a", solution: "By symmetry: $\\Phi_{\\text{face}} = \\Phi_{\\text{total}}/6 = 5.65\\times10^4$.", hint: "Six identical faces share the total flux equally.", difficulty: "medium" as const } },
    { id: "em-3-p3", type: "practice" as const, title: "Practice 3 — Inside a Solid Sphere", content: "$\\rho = 2.0\\times10^{-6}\\;\\text{C/m}^3$, $R = 0.05\\;\\text{m}$. $E$ at $r = 0.02\\;\\text{m}$?", order: 14, problem: { id: "em-3-p3-q", choices: [{ id: "a", text: "$1.51\\;\\text{N/C}$" }, { id: "b", text: "$150\\;\\text{N/C}$" }, { id: "c", text: "$0.75\\;\\text{N/C}$" }, { id: "d", text: "$3.77\\;\\text{N/C}$" }], correctAnswerId: "a", solution: "$E = \\rho r/(3\\varepsilon_0) = (2.0\\times10^{-6})(0.02)/(3\\times8.854\\times10^{-12}) \\approx 1.51\\;\\text{N/C}$.", hint: "Use $E = \\rho r/(3\\varepsilon_0)$ for the interior.", difficulty: "medium" as const } },
    { id: "em-3-p4", type: "practice" as const, title: "Practice 4 — Hollow Conductor", content: "A hollow conducting sphere ($+Q$ net) has charge $-q$ at its center. Charge on the inner surface?", order: 15, problem: { id: "em-3-p4-q", choices: [{ id: "a", text: "$+q$" }, { id: "b", text: "$-q$" }, { id: "c", text: "$+Q$" }, { id: "d", text: "$Q - q$" }], correctAnswerId: "a", solution: "Gaussian surface inside the conductor: $E = 0 \\Rightarrow Q_{\\text{enc}} = 0 \\Rightarrow Q_{\\text{inner}} = +q$. Outer surface: $Q - q$.", hint: "Apply Gauss's law in the conductor where $E = 0$.", difficulty: "hard" as const } },
    { id: "em-3-p5", type: "practice" as const, title: "Practice 5 — Two Infinite Planes", content: "Parallel planes with $+\\sigma$ and $-\\sigma$. Field between them?", order: 16, problem: { id: "em-3-p5-q", choices: [{ id: "a", text: "$\\sigma/\\varepsilon_0$ (from $+$ to $-$)" }, { id: "b", text: "$\\sigma/(2\\varepsilon_0)$" }, { id: "c", text: "$2\\sigma/\\varepsilon_0$" }, { id: "d", text: "$0$" }], correctAnswerId: "a", solution: "Each plane: $\\sigma/(2\\varepsilon_0)$. Between them both point $+$ to $-$, so they add: $\\sigma/\\varepsilon_0$.", difficulty: "medium" as const } },
    { id: "em-3-p6", type: "practice" as const, title: "Practice 6 — When Is Gauss's Law Useful?", content: "Gauss's law is most useful for computing $E$ when:", order: 17, problem: { id: "em-3-p6-q", choices: [{ id: "a", text: "The charge distribution has high symmetry" }, { id: "b", text: "All charges are positive" }, { id: "c", text: "The charges are in vacuum" }, { id: "d", text: "The surface is always a sphere" }], correctAnswerId: "a", solution: "High symmetry (spherical, cylindrical, planar) lets you factor $E$ out of the integral.", difficulty: "medium" as const } },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// Unit 4 — Electric Potential
// ═══════════════════════════════════════════════════════════════════════════

const unit4 = {
  id: "em-4",
  title: "Unit 4",
  subtitle: "Electric Potential",
  order: 4,
  sections: [
    { id: "em-4-intro", type: "note" as const, title: "What You'll Learn", content: "Electric potential energy, voltage, equipotential surfaces, and the gradient relationship $\\vec{E} = -\\nabla V$. You will move freely between field and potential descriptions.", order: 0 },
    { id: "em-4-def-pe", type: "definition" as const, title: "Electric Potential Energy", content: "$$U = -\\int_\\infty^{\\vec{r}} q\\vec{E} \\cdot d\\vec{l}$$ For two point charges: $U = k_e q_1 q_2/r$. Positive $U$ = repulsive configuration.", order: 1 },
    { id: "em-4-def-voltage", type: "definition" as const, title: "Electric Potential (Voltage)", content: "$$V = \\frac{U}{q_0} = -\\int_\\infty^{\\vec{r}} \\vec{E} \\cdot d\\vec{l}$$ Units: **volts** ($\\text{V} = \\text{J/C}$). Potential is a scalar. Potential difference: $\\Delta V = -\\int_A^B \\vec{E} \\cdot d\\vec{l}$.", order: 2 },
    { id: "em-4-thm-point-V", type: "theorem" as const, title: "Potential of a Point Charge", content: "$$V = k_e Q/r$$ Potentials add as scalars: $V = \\sum_i k_e q_i/r_i$ — no vector algebra needed.", keyTakeaway: "Scalar superposition makes potential calculations simpler than field calculations.", order: 3 },
    { id: "em-4-def-equipotential", type: "definition" as const, title: "Equipotential Surfaces", content: "All points at the same $V$. No work done moving along them. Always **perpendicular** to field lines.", order: 4 },
    { id: "em-4-diagram-equip", type: "diagram" as const, title: "Equipotentials & Field Lines", content: "Dashed circles show equipotentials ($V_1 > V_2 > V_3$). Solid arrows show $\\vec{E}$ perpendicular to each equipotential.", imageComponent: "EquipotentialDiagram", order: 5 },
    { id: "em-4-thm-gradient", type: "theorem" as const, title: "E = -nabla V", content: "$$\\vec{E} = -\\left(\\frac{\\partial V}{\\partial x}\\hat{x} + \\frac{\\partial V}{\\partial y}\\hat{y} + \\frac{\\partial V}{\\partial z}\\hat{z}\\right)$$ In 1-D: $E_x = -dV/dx$. $\\vec{E}$ points toward decreasing $V$.", keyTakeaway: "If you know $V(x,y,z)$ you can find $\\vec{E}$ by differentiation — no integration needed.", order: 6 },
    { id: "em-4-diagram-gradient", type: "diagram" as const, title: "V(x) and the Gradient", content: "A decreasing $V(x)$ curve. Negative slope means positive $E_x$: field points toward lower potential.", imageComponent: "PotentialGradientDiagram", order: 7 },
    { id: "em-4-def-ev", type: "definition" as const, title: "Electron-Volt", content: "$1\\;\\text{eV} = 1.602 \\times 10^{-19}\\;\\text{J}$. The kinetic energy gained by an electron through $1\\;\\text{V}$.", order: 8 },
    { id: "em-4-ex-1", type: "example" as const, title: "Example — Dipole Potential", content: "Find $V$ at large distance $r \\gg d$ from a dipole at angle $\\theta$.", steps: ["$V = k_e(q/r_+ - q/r_-)$.", "For $r \\gg d$: $V \\approx k_e p\\cos\\theta/r^2$ where $p = qd$.", "Falls off as $1/r^2$ (faster than $1/r$ for a monopole).", "Maximum on axis ($\\theta=0$), zero in midplane ($\\theta=90°$)."], order: 9 },
    { id: "em-4-ex-2", type: "example" as const, title: "Example — E from V", content: "$V(x,y) = 3x^2 - 2y + 5$ (V). Find $\\vec{E}$.", steps: ["$E_x = -\\partial V/\\partial x = -6x$.", "$E_y = -\\partial V/\\partial y = 2$.", "$\\vec{E} = (-6x\\,\\hat{x} + 2\\,\\hat{y})\\;\\text{V/m}$.", "At origin: $\\vec{E} = 2\\hat{y}\\;\\text{V/m}$."], order: 10 },
    { id: "em-4-ex-3", type: "example" as const, title: "Example — Electron Accelerated Through deltaV", content: "An electron at rest accelerated through $500\\;\\text{V}$. Find final speed.", steps: ["$q\\Delta V = \\frac{1}{2}mv^2 \\Rightarrow v = \\sqrt{2e\\Delta V/m_e}$.", "$v = \\sqrt{2(1.6\\times10^{-19})(500)/9.11\\times10^{-31}}$.", "$v = 1.33 \\times 10^7\\;\\text{m/s}$ (about 4.4% speed of light)."], order: 11 },
    { id: "em-4-p1", type: "practice" as const, title: "Practice 1 — Potential at Midpoint", content: "$+3\\;\\mu\\text{C}$ and $-3\\;\\mu\\text{C}$ at $(0,0)$ and $(0.4,0)$. $V$ at midpoint?", order: 12, problem: { id: "em-4-p1-q", choices: [{ id: "a", text: "$0$" }, { id: "b", text: "$2.7 \\times 10^5\\;\\text{V}$" }, { id: "c", text: "$-2.7 \\times 10^5\\;\\text{V}$" }, { id: "d", text: "$5.4 \\times 10^5\\;\\text{V}$" }], correctAnswerId: "a", solution: "$V = k_e(+3\\mu\\text{C}/0.2 + (-3\\mu\\text{C})/0.2) = 0$. (Note: $E \\neq 0$ there!)", difficulty: "medium" as const } },
    { id: "em-4-p2", type: "practice" as const, title: "Practice 2 — Energy of Assembly", content: "Three charges $+q$ at vertices of equilateral triangle side $a$. Total $U$?", order: 13, problem: { id: "em-4-p2-q", choices: [{ id: "a", text: "$3k_e q^2/a$" }, { id: "b", text: "$k_e q^2/a$" }, { id: "c", text: "$6k_e q^2/a$" }, { id: "d", text: "$\\frac{3}{2}k_e q^2/a$" }], correctAnswerId: "a", solution: "3 pairs, each $k_eq^2/a$. Total: $3k_eq^2/a$.", hint: "Count unique pairs: $\\binom{3}{2} = 3$.", difficulty: "medium" as const } },
    { id: "em-4-p3", type: "practice" as const, title: "Practice 3 — E from V", content: "$V = 100 - 50x + 20y^2$. What is $E_y$ at $(1,2)$?", order: 14, problem: { id: "em-4-p3-q", choices: [{ id: "a", text: "$-80\\;\\text{V/m}$" }, { id: "b", text: "$80\\;\\text{V/m}$" }, { id: "c", text: "$-40\\;\\text{V/m}$" }, { id: "d", text: "$40\\;\\text{V/m}$" }], correctAnswerId: "a", solution: "$E_y = -\\partial V/\\partial y = -40y$. At $y = 2$: $E_y = -80\\;\\text{V/m}$.", difficulty: "medium" as const } },
    { id: "em-4-p4", type: "practice" as const, title: "Practice 4 — Electron KE", content: "An electron moves from low $V$ to high $V$. Its KE:", order: 15, problem: { id: "em-4-p4-q", choices: [{ id: "a", text: "Increases" }, { id: "b", text: "Decreases" }, { id: "c", text: "Stays the same" }, { id: "d", text: "Depends on path" }], correctAnswerId: "a", solution: "$\\Delta KE = -q\\Delta V = -(-e)(V_h - V_l) > 0$. Negative charge gains KE moving to higher $V$.", hint: "Remember $q = -e$ for an electron, so the signs flip.", difficulty: "medium" as const } },
    { id: "em-4-p5", type: "practice" as const, title: "Practice 5 — Conducting Sphere Potential", content: "Sphere $R = 0.10\\;\\text{m}$, $Q = 4\\;\\mu\\text{C}$. $V$ at surface?", order: 16, problem: { id: "em-4-p5-q", choices: [{ id: "a", text: "$3.6 \\times 10^5\\;\\text{V}$" }, { id: "b", text: "$7.2 \\times 10^5\\;\\text{V}$" }, { id: "c", text: "$9.0 \\times 10^4\\;\\text{V}$" }, { id: "d", text: "$1.8 \\times 10^5\\;\\text{V}$" }], correctAnswerId: "a", solution: "$V = k_eQ/R = (8.99\\times10^9)(4\\times10^{-6})/0.10 = 3.6\\times10^5\\;\\text{V}$.", hint: "Treat as a point charge at $r = R$.", difficulty: "medium" as const } },
    { id: "em-4-p6", type: "practice" as const, title: "Practice 6 — Work by Field", content: "Field moves $+2\\;\\mu\\text{C}$ from $V = 300\\;\\text{V}$ to $V = 100\\;\\text{V}$. Work done?", order: 17, problem: { id: "em-4-p6-q", choices: [{ id: "a", text: "$4.0 \\times 10^{-4}\\;\\text{J}$" }, { id: "b", text: "$-4.0 \\times 10^{-4}\\;\\text{J}$" }, { id: "c", text: "$6.0 \\times 10^{-4}\\;\\text{J}$" }, { id: "d", text: "$2.0 \\times 10^{-4}\\;\\text{J}$" }], correctAnswerId: "a", solution: "$W = q(V_A - V_B) = (2\\times10^{-6})(200) = 4.0\\times10^{-4}\\;\\text{J}$. Positive work: field pushes $+q$ from high to low $V$.", difficulty: "medium" as const } },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// Unit 5 — Capacitance & Dielectrics
// ═══════════════════════════════════════════════════════════════════════════

const unit5 = {
  id: "em-5",
  title: "Unit 5",
  subtitle: "Capacitance & Dielectrics",
  order: 5,
  sections: [
    { id: "em-5-intro", type: "note" as const, title: "What You'll Learn", content: "Capacitors store energy in electric fields. You will derive capacitance for parallel-plate, cylindrical, and spherical geometries, combine capacitors in series and parallel, and understand how dielectrics increase capacitance.", order: 0 },
    { id: "em-5-def-capacitance", type: "definition" as const, title: "Capacitance", content: "$$C = \\frac{Q}{V}$$ Units: **farads** ($\\text{F} = \\text{C/V}$). Capacitance is a geometric property — it depends only on the shape, size, and material between the conductors, not on $Q$ or $V$.", order: 1 },
    { id: "em-5-thm-parallel-plate", type: "theorem" as const, title: "Parallel-Plate Capacitor", content: "$$C = \\varepsilon_0 A/d$$ where $A$ is the plate area and $d$ the separation. The field between plates is $E = \\sigma/\\varepsilon_0 = V/d$.", keyTakeaway: "Larger area and smaller separation lead to larger $C$.", order: 2 },
    { id: "em-5-diagram-capacitor", type: "diagram" as const, title: "Parallel-Plate Capacitor with Dielectric", content: "A dielectric slab of constant $\\kappa$ fills the gap, increasing $C$ by factor $\\kappa$.", imageComponent: "CapacitorDielectricDiagram", order: 3 },
    { id: "em-5-def-dielectric", type: "definition" as const, title: "Dielectrics", content: "A **dielectric** is an insulating material that, when placed between capacitor plates, reduces the internal field by factor $\\kappa$ (the **dielectric constant**). This increases capacitance: $C = \\kappa C_0$. The permittivity becomes $\\varepsilon = \\kappa\\varepsilon_0$.", order: 4 },
    { id: "em-5-thm-energy", type: "theorem" as const, title: "Energy Stored in a Capacitor", content: "$$U = \\frac{1}{2}CV^2 = \\frac{Q^2}{2C} = \\frac{1}{2}QV$$ Energy density: $u = \\frac{1}{2}\\varepsilon_0 E^2$ (in vacuum).", keyTakeaway: "Energy grows quadratically with voltage — doubling $V$ quadruples $U$.", order: 5 },
    { id: "em-5-thm-series-parallel", type: "theorem" as const, title: "Capacitors in Series & Parallel", content: "**Parallel** (same $V$): $C_{\\text{eq}} = C_1 + C_2 + \\cdots$. **Series** (same $Q$): $\\frac{1}{C_{\\text{eq}}} = \\frac{1}{C_1} + \\frac{1}{C_2} + \\cdots$.", keyTakeaway: "Parallel adds capacitances; series adds reciprocals (like resistors in the opposite configuration).", order: 6 },
    { id: "em-5-diagram-circuit", type: "diagram" as const, title: "Series & Parallel Capacitors", content: "Two capacitors in series share charge; two in parallel share voltage.", imageComponent: "CapacitorCircuitDiagram", order: 7 },
    { id: "em-5-ex-1", type: "example" as const, title: "Example — Parallel-Plate Capacitor", content: "Plates $A = 0.01\\;\\text{m}^2$, separation $d = 1\\;\\text{mm}$. Find $C$.", steps: ["$C = \\varepsilon_0 A/d = (8.854\\times10^{-12})(0.01)/(10^{-3})$.", "$C = 8.854\\times10^{-11}\\;\\text{F} = 88.5\\;\\text{pF}$.", "With dielectric $\\kappa = 3.0$: $C = 3.0 \\times 88.5 = 265\\;\\text{pF}$."], order: 8 },
    { id: "em-5-ex-2", type: "example" as const, title: "Example — Series Combination", content: "$C_1 = 4\\;\\mu\\text{F}$ and $C_2 = 6\\;\\mu\\text{F}$ in series across $12\\;\\text{V}$.", steps: ["$1/C_{\\text{eq}} = 1/4 + 1/6 = 5/12 \\Rightarrow C_{\\text{eq}} = 2.4\\;\\mu\\text{F}$.", "$Q = C_{\\text{eq}} V = 2.4 \\times 12 = 28.8\\;\\mu\\text{C}$ (same on both).", "$V_1 = Q/C_1 = 28.8/4 = 7.2\\;\\text{V}$; $V_2 = 28.8/6 = 4.8\\;\\text{V}$.", "Check: $V_1 + V_2 = 12\\;\\text{V}$. Confirmed."], order: 9 },
    { id: "em-5-p1", type: "practice" as const, title: "Practice 1 — Capacitance Calculation", content: "Parallel plates: $A = 0.02\\;\\text{m}^2$, $d = 0.5\\;\\text{mm}$. $C = $?", order: 10, problem: { id: "em-5-p1-q", choices: [{ id: "a", text: "$354\\;\\text{pF}$" }, { id: "b", text: "$177\\;\\text{pF}$" }, { id: "c", text: "$708\\;\\text{pF}$" }, { id: "d", text: "$88.5\\;\\text{pF}$" }], correctAnswerId: "a", solution: "$C = \\varepsilon_0 A/d = (8.854\\times10^{-12})(0.02)/(5\\times10^{-4}) = 354\\;\\text{pF}$.", difficulty: "medium" as const } },
    { id: "em-5-p2", type: "practice" as const, title: "Practice 2 — Dielectric Effect", content: "A $100\\;\\text{pF}$ capacitor has dielectric $\\kappa = 4$ inserted. New $C$?", order: 11, problem: { id: "em-5-p2-q", choices: [{ id: "a", text: "$400\\;\\text{pF}$" }, { id: "b", text: "$25\\;\\text{pF}$" }, { id: "c", text: "$200\\;\\text{pF}$" }, { id: "d", text: "$100\\;\\text{pF}$" }], correctAnswerId: "a", solution: "$C = \\kappa C_0 = 4 \\times 100 = 400\\;\\text{pF}$.", difficulty: "medium" as const } },
    { id: "em-5-p3", type: "practice" as const, title: "Practice 3 — Parallel Capacitors", content: "Three $6\\;\\mu\\text{F}$ capacitors in parallel. $C_{\\text{eq}}$?", order: 12, problem: { id: "em-5-p3-q", choices: [{ id: "a", text: "$18\\;\\mu\\text{F}$" }, { id: "b", text: "$2\\;\\mu\\text{F}$" }, { id: "c", text: "$6\\;\\mu\\text{F}$" }, { id: "d", text: "$9\\;\\mu\\text{F}$" }], correctAnswerId: "a", solution: "Parallel: $C_{\\text{eq}} = 6 + 6 + 6 = 18\\;\\mu\\text{F}$.", difficulty: "medium" as const } },
    { id: "em-5-p4", type: "practice" as const, title: "Practice 4 — Energy Stored", content: "$5\\;\\mu\\text{F}$ at $200\\;\\text{V}$. Energy?", order: 13, problem: { id: "em-5-p4-q", choices: [{ id: "a", text: "$0.10\\;\\text{J}$" }, { id: "b", text: "$0.20\\;\\text{J}$" }, { id: "c", text: "$0.05\\;\\text{J}$" }, { id: "d", text: "$1.0\\;\\text{J}$" }], correctAnswerId: "a", solution: "$U = \\frac{1}{2}(5\\times10^{-6})(200)^2 = 0.10\\;\\text{J}$.", difficulty: "medium" as const } },
    { id: "em-5-p5", type: "practice" as const, title: "Practice 5 — Disconnect + Dielectric", content: "A charged capacitor is disconnected from the battery, then a dielectric is inserted. The voltage:", order: 14, problem: { id: "em-5-p5-q", choices: [{ id: "a", text: "Decreases by factor $\\kappa$" }, { id: "b", text: "Increases by factor $\\kappa$" }, { id: "c", text: "Stays the same" }, { id: "d", text: "Drops to zero" }], correctAnswerId: "a", solution: "Charge is fixed ($Q$ constant). $C$ increases by $\\kappa$. $V = Q/C$ decreases by $\\kappa$.", hint: "When disconnected, $Q$ is conserved. $V = Q/C$ and $C$ increases.", difficulty: "hard" as const } },
    { id: "em-5-p6", type: "practice" as const, title: "Practice 6 — Energy Density", content: "$E = 3 \\times 10^6\\;\\text{V/m}$ in vacuum. Energy density $u$?", order: 15, problem: { id: "em-5-p6-q", choices: [{ id: "a", text: "$39.8\\;\\text{J/m}^3$" }, { id: "b", text: "$79.7\\;\\text{J/m}^3$" }, { id: "c", text: "$13.3\\;\\text{J/m}^3$" }, { id: "d", text: "$4.0\\;\\text{J/m}^3$" }], correctAnswerId: "a", solution: "$u = \\frac{1}{2}\\varepsilon_0 E^2 = \\frac{1}{2}(8.854\\times10^{-12})(9\\times10^{12}) = 39.8\\;\\text{J/m}^3$.", difficulty: "medium" as const } },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// Unit 6 — Current, Resistance & DC Circuits
// ═══════════════════════════════════════════════════════════════════════════

const unit6 = {
  id: "em-6",
  title: "Unit 6",
  subtitle: "Current, Resistance & DC Circuits",
  order: 6,
  sections: [
    { id: "em-6-intro", type: "note" as const, title: "What You'll Learn", content: "Moving from electrostatics to steady currents: current, drift velocity, Ohm's law, resistivity, power dissipation, Kirchhoff's rules, and RC circuits.", order: 0 },
    { id: "em-6-def-current", type: "definition" as const, title: "Electric Current", content: "$$I = \\frac{dQ}{dt}$$ Units: **amperes** ($\\text{A} = \\text{C/s}$). Conventional current flows from $+$ to $-$ (opposite to electron drift). Current density: $\\vec{J} = nq\\vec{v}_d$ where $n$ is carrier density and $\\vec{v}_d$ is drift velocity.", order: 1 },
    { id: "em-6-def-resistance", type: "definition" as const, title: "Resistance & Ohm's Law", content: "$$V = IR \\qquad R = \\rho L/A$$ $R$ in **ohms** ($\\Omega$), $\\rho$ is **resistivity** ($\\Omega\\cdot\\text{m}$). Ohm's law is empirical — valid for **ohmic** materials where $R$ is constant.", order: 2 },
    { id: "em-6-thm-power", type: "theorem" as const, title: "Power Dissipation", content: "$$P = IV = I^2R = V^2/R$$ Power dissipated as heat in a resistor. Units: watts (W).", keyTakeaway: "At fixed voltage, halving $R$ doubles the power.", order: 3 },
    { id: "em-6-thm-series-parallel-R", type: "theorem" as const, title: "Resistors in Series & Parallel", content: "**Series** (same $I$): $R_{\\text{eq}} = R_1 + R_2 + \\cdots$. **Parallel** (same $V$): $\\frac{1}{R_{\\text{eq}}} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\cdots$.", keyTakeaway: "Opposite of capacitors: series adds, parallel adds reciprocals.", order: 4 },
    { id: "em-6-diagram-circuit", type: "diagram" as const, title: "Simple DC Circuit", content: "A battery (EMF $\\mathcal{E}$) drives current through a resistor.", imageComponent: "SimpleCircuitDiagram", order: 5 },
    { id: "em-6-thm-kirchhoff", type: "theorem" as const, title: "Kirchhoff's Rules", content: "**Junction rule** (charge conservation): $\\sum I_{\\text{in}} = \\sum I_{\\text{out}}$. **Loop rule** (energy conservation): $\\sum \\Delta V = 0$ around any closed loop.", keyTakeaway: "Use junction + loop rules to solve any circuit, no matter how complex.", order: 6 },
    { id: "em-6-diagram-kirchhoff", type: "diagram" as const, title: "Multi-Loop Circuit", content: "Two loops sharing a branch. Assign current directions, write junction and loop equations, solve the system.", imageComponent: "KirchhoffDiagram", order: 7 },
    { id: "em-6-def-emf", type: "definition" as const, title: "EMF & Internal Resistance", content: "The **electromotive force** $\\mathcal{E}$ of a battery is the work per unit charge done by its internal chemistry. Real batteries have internal resistance $r$: terminal voltage $V = \\mathcal{E} - Ir$.", order: 8 },
    { id: "em-6-thm-rc", type: "theorem" as const, title: "RC Circuits", content: "**Charging**: $q(t) = C\\mathcal{E}(1 - e^{-t/RC})$, $I(t) = (\\mathcal{E}/R)e^{-t/RC}$. **Discharging**: $q(t) = Q_0 e^{-t/RC}$. Time constant: $\\tau = RC$.", keyTakeaway: "After $5\\tau$ the circuit is about 99% to its final state.", order: 9 },
    { id: "em-6-diagram-rc", type: "diagram" as const, title: "RC Circuit Charging Curve", content: "Charge rises exponentially toward $C\\mathcal{E}$; current decays exponentially from $\\mathcal{E}/R$.", imageComponent: "RCCircuitDiagram", order: 10 },
    { id: "em-6-ex-1", type: "example" as const, title: "Example — Kirchhoff's Rules", content: "Two batteries and three resistors in a two-loop network. Find the currents.", steps: ["Assign currents $I_1$, $I_2$, $I_3$ at the junction: $I_1 = I_2 + I_3$.", "Loop 1: $12 - 4I_1 - 8I_2 = 0$.", "Loop 2: $-6 + 8I_2 - 6I_3 = 0$.", "Substitute $I_3 = I_1 - I_2$ into Loop 2: $-6I_1 + 14I_2 = 6$.", "Solve: $I_2 = 0.92\\;\\text{A}$, $I_1 = 1.15\\;\\text{A}$, $I_3 = 0.23\\;\\text{A}$."], order: 11 },
    { id: "em-6-ex-2", type: "example" as const, title: "Example — RC Time Constant", content: "$R = 5.0\\;\\text{k}\\Omega$, $C = 2.0\\;\\mu\\text{F}$, $\\mathcal{E} = 10\\;\\text{V}$.", steps: ["$\\tau = RC = (5000)(2\\times10^{-6}) = 10\\;\\text{ms}$.", "$q(\\tau) = C\\mathcal{E}(1 - e^{-1}) = 12.6\\;\\mu\\text{C}$.", "Final charge: $Q = C\\mathcal{E} = 20\\;\\mu\\text{C}$. At $t = \\tau$, 63.2% charged."], order: 12 },
    { id: "em-6-p1", type: "practice" as const, title: "Practice 1 — Ohm's Law", content: "$V = 9\\;\\text{V}$ across $R = 150\\;\\Omega$. Current?", order: 13, problem: { id: "em-6-p1-q", choices: [{ id: "a", text: "$0.060\\;\\text{A}$" }, { id: "b", text: "$0.60\\;\\text{A}$" }, { id: "c", text: "$1350\\;\\text{A}$" }, { id: "d", text: "$6.0\\;\\text{A}$" }], correctAnswerId: "a", solution: "$I = V/R = 9/150 = 0.060\\;\\text{A}$.", difficulty: "medium" as const } },
    { id: "em-6-p2", type: "practice" as const, title: "Practice 2 — Power", content: "$I = 2\\;\\text{A}$ through $R = 10\\;\\Omega$. Power?", order: 14, problem: { id: "em-6-p2-q", choices: [{ id: "a", text: "$40\\;\\text{W}$" }, { id: "b", text: "$20\\;\\text{W}$" }, { id: "c", text: "$5\\;\\text{W}$" }, { id: "d", text: "$80\\;\\text{W}$" }], correctAnswerId: "a", solution: "$P = I^2 R = 4 \\times 10 = 40\\;\\text{W}$.", difficulty: "medium" as const } },
    { id: "em-6-p3", type: "practice" as const, title: "Practice 3 — Equivalent Resistance", content: "$R_1 = 6\\;\\Omega$ and $R_2 = 3\\;\\Omega$ in parallel. $R_{\\text{eq}}$?", order: 15, problem: { id: "em-6-p3-q", choices: [{ id: "a", text: "$2\\;\\Omega$" }, { id: "b", text: "$9\\;\\Omega$" }, { id: "c", text: "$4.5\\;\\Omega$" }, { id: "d", text: "$1.5\\;\\Omega$" }], correctAnswerId: "a", solution: "$1/R = 1/6 + 1/3 = 1/2$. $R_{\\text{eq}} = 2\\;\\Omega$.", hint: "Parallel: $1/R_{\\text{eq}} = 1/R_1 + 1/R_2$.", difficulty: "medium" as const } },
    { id: "em-6-p4", type: "practice" as const, title: "Practice 4 — Internal Resistance", content: "Battery $\\mathcal{E} = 12\\;\\text{V}$, $r = 0.5\\;\\Omega$, load $R = 5.5\\;\\Omega$. Terminal voltage?", order: 16, problem: { id: "em-6-p4-q", choices: [{ id: "a", text: "$11\\;\\text{V}$" }, { id: "b", text: "$12\\;\\text{V}$" }, { id: "c", text: "$10\\;\\text{V}$" }, { id: "d", text: "$6\\;\\text{V}$" }], correctAnswerId: "a", solution: "$I = 12/6 = 2\\;\\text{A}$. $V = 12 - 2(0.5) = 11\\;\\text{V}$.", hint: "Find total current first, then subtract the drop across $r$.", difficulty: "medium" as const } },
    { id: "em-6-p5", type: "practice" as const, title: "Practice 5 — RC Discharge", content: "$10\\;\\mu\\text{F}$ discharges through $50\\;\\text{k}\\Omega$. Time constant?", order: 17, problem: { id: "em-6-p5-q", choices: [{ id: "a", text: "$0.50\\;\\text{s}$" }, { id: "b", text: "$5.0\\;\\text{s}$" }, { id: "c", text: "$0.050\\;\\text{s}$" }, { id: "d", text: "$500\\;\\text{s}$" }], correctAnswerId: "a", solution: "$\\tau = RC = (50\\times10^3)(10\\times10^{-6}) = 0.50\\;\\text{s}$.", difficulty: "medium" as const } },
    { id: "em-6-p6", type: "practice" as const, title: "Practice 6 — Kirchhoff Conceptual", content: "The junction rule is a statement of conservation of:", order: 18, problem: { id: "em-6-p6-q", choices: [{ id: "a", text: "Charge" }, { id: "b", text: "Energy" }, { id: "c", text: "Momentum" }, { id: "d", text: "Current" }], correctAnswerId: "a", solution: "The junction rule reflects conservation of **charge** — charge does not accumulate at a node in steady state. The loop rule reflects energy conservation.", difficulty: "medium" as const } },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// Unit 7 — Magnetic Fields & Forces
// ═══════════════════════════════════════════════════════════════════════════

const unit7 = {
  id: "em-7",
  title: "Unit 7",
  subtitle: "Magnetic Fields & Forces",
  order: 7,
  sections: [
    { id: "em-7-intro", type: "note" as const, title: "What You'll Learn", content: "The Lorentz force law, motion of charged particles in magnetic fields, force on current-carrying wires, magnetic dipole moments, and the Hall effect.", order: 0 },
    { id: "em-7-def-bfield", type: "definition" as const, title: "Magnetic Field", content: "The **magnetic field** $\\vec{B}$ is defined operationally through the force on a moving charge. Units: **tesla** ($\\text{T} = \\text{kg/(A·s}^2\\text{)}$). $1\\;\\text{T} = 10^4\\;\\text{gauss}$. Earth's field is roughly $50\\;\\mu\\text{T}$.", order: 1 },
    { id: "em-7-thm-lorentz", type: "theorem" as const, title: "Lorentz Force Law", content: "$$\\vec{F} = q\\vec{v} \\times \\vec{B}$$ The magnetic force is perpendicular to both $\\vec{v}$ and $\\vec{B}$. Because $\\vec{F} \\perp \\vec{v}$, the magnetic force does **no work** — it changes direction but not speed.", keyTakeaway: "A magnetic field cannot change a particle's kinetic energy.", order: 2 },
    { id: "em-7-diagram-lorentz", type: "diagram" as const, title: "Lorentz Force — Right-Hand Rule", content: "Fingers point along $\\vec{v}$, curl toward $\\vec{B}$; thumb gives $\\vec{F}$ for positive charge.", imageComponent: "LorentzForceDiagram", order: 3 },
    { id: "em-7-thm-circular", type: "theorem" as const, title: "Circular Motion in Uniform B", content: "A charge moving perpendicular to $\\vec{B}$ follows a circle: $$r = \\frac{mv}{qB}$$ Cyclotron frequency: $\\omega = qB/m$. Period: $T = 2\\pi m/(qB)$.", keyTakeaway: "The period is independent of speed — this is the cyclotron principle.", order: 4 },
    { id: "em-7-diagram-cyclotron", type: "diagram" as const, title: "Cyclotron Motion", content: "A positive charge spirals in a circle. Faster particles trace larger circles.", imageComponent: "CyclotronMotionDiagram", order: 5 },
    { id: "em-7-thm-wire-force", type: "theorem" as const, title: "Force on a Current-Carrying Wire", content: "$$\\vec{F} = I\\vec{L} \\times \\vec{B}$$ For a straight wire in uniform $B$: $F = BIL\\sin\\theta$.", keyTakeaway: "Two parallel wires carrying currents in the same direction attract; opposite directions repel.", order: 6 },
    { id: "em-7-def-dipole-moment", type: "definition" as const, title: "Magnetic Dipole Moment", content: "A current loop of area $A$ carrying current $I$ has magnetic dipole moment $\\vec{\\mu} = NIA\\hat{n}$. Torque: $\\vec{\\tau} = \\vec{\\mu} \\times \\vec{B}$, energy: $U = -\\vec{\\mu} \\cdot \\vec{B}$.", order: 7 },
    { id: "em-7-def-hall", type: "definition" as const, title: "Hall Effect", content: "When current flows through a conductor in a magnetic field, the Lorentz force pushes carriers to one side, creating a transverse **Hall voltage**. The Hall effect reveals the sign and density of charge carriers.", order: 8 },
    { id: "em-7-ex-1", type: "example" as const, title: "Example — Cyclotron Radius", content: "A proton with $v = 3.0\\times10^6\\;\\text{m/s}$ enters $B = 0.50\\;\\text{T}$.", steps: ["$r = mv/(qB) = (1.67\\times10^{-27})(3.0\\times10^6)/((1.6\\times10^{-19})(0.50))$.", "$r = 0.063\\;\\text{m} = 6.3\\;\\text{cm}$.", "$T = 2\\pi m/(qB) = 1.31\\times10^{-7}\\;\\text{s}$."], order: 9 },
    { id: "em-7-ex-2", type: "example" as const, title: "Example — Force on a Wire", content: "A $0.50\\;\\text{m}$ wire with $3.0\\;\\text{A}$ perpendicular to $B = 0.20\\;\\text{T}$.", steps: ["$F = BIL = (0.20)(3.0)(0.50) = 0.30\\;\\text{N}$.", "Direction: right-hand rule on $I\\vec{L} \\times \\vec{B}$."], order: 10 },
    { id: "em-7-p1", type: "practice" as const, title: "Practice 1 — Lorentz Force", content: "Electron ($v = 10^7\\;\\text{m/s}$) perpendicular to $B = 0.01\\;\\text{T}$. Force?", order: 11, problem: { id: "em-7-p1-q", choices: [{ id: "a", text: "$1.6 \\times 10^{-14}\\;\\text{N}$" }, { id: "b", text: "$1.6 \\times 10^{-12}\\;\\text{N}$" }, { id: "c", text: "$1.6 \\times 10^{-16}\\;\\text{N}$" }, { id: "d", text: "$0$" }], correctAnswerId: "a", solution: "$F = qvB = (1.6\\times10^{-19})(10^7)(0.01) = 1.6\\times10^{-14}\\;\\text{N}$.", difficulty: "medium" as const } },
    { id: "em-7-p2", type: "practice" as const, title: "Practice 2 — No Work", content: "A magnetic field does no work on a charged particle because:", order: 12, problem: { id: "em-7-p2-q", choices: [{ id: "a", text: "The force is always perpendicular to the velocity" }, { id: "b", text: "The field is zero" }, { id: "c", text: "The particle has no charge" }, { id: "d", text: "The force is parallel to $\\vec{B}$" }], correctAnswerId: "a", solution: "$\\vec{F} \\perp \\vec{v}$ means $\\vec{F} \\cdot \\vec{v} = 0$, so no work is done.", difficulty: "medium" as const } },
    { id: "em-7-p3", type: "practice" as const, title: "Practice 3 — Cyclotron Period", content: "If a proton's speed doubles in uniform $B$, the cyclotron period:", order: 13, problem: { id: "em-7-p3-q", choices: [{ id: "a", text: "Stays the same" }, { id: "b", text: "Doubles" }, { id: "c", text: "Halves" }, { id: "d", text: "Quadruples" }], correctAnswerId: "a", solution: "$T = 2\\pi m/(qB)$ — independent of $v$!", hint: "$T$ depends only on $m$, $q$, and $B$.", difficulty: "medium" as const } },
    { id: "em-7-p4", type: "practice" as const, title: "Practice 4 — Parallel Wires", content: "Two parallel wires carry currents in the **same** direction. They:", order: 14, problem: { id: "em-7-p4-q", choices: [{ id: "a", text: "Attract" }, { id: "b", text: "Repel" }, { id: "c", text: "No force" }, { id: "d", text: "Twist" }], correctAnswerId: "a", solution: "Same-direction currents attract. The field of one wire exerts an inward force on the other.", difficulty: "medium" as const } },
    { id: "em-7-p5", type: "practice" as const, title: "Practice 5 — Velocity Selector", content: "Crossed $\\vec{E}$ and $\\vec{B}$. Undeflected speed?", order: 15, problem: { id: "em-7-p5-q", choices: [{ id: "a", text: "$v = E/B$" }, { id: "b", text: "$v = B/E$" }, { id: "c", text: "$v = EB$" }, { id: "d", text: "$v = \\sqrt{E/B}$" }], correctAnswerId: "a", solution: "$qE = qvB \\Rightarrow v = E/B$.", hint: "Balance electric and magnetic forces.", difficulty: "medium" as const } },
    { id: "em-7-p6", type: "practice" as const, title: "Practice 6 — Torque on a Loop", content: "$100$-turn coil, area $0.01\\;\\text{m}^2$, $2\\;\\text{A}$, $B = 0.5\\;\\text{T}$. Max torque?", order: 16, problem: { id: "em-7-p6-q", choices: [{ id: "a", text: "$1.0\\;\\text{N·m}$" }, { id: "b", text: "$0.01\\;\\text{N·m}$" }, { id: "c", text: "$0.1\\;\\text{N·m}$" }, { id: "d", text: "$10\\;\\text{N·m}$" }], correctAnswerId: "a", solution: "$\\tau_{\\max} = NIAB = (100)(2)(0.01)(0.5) = 1.0\\;\\text{N·m}$.", difficulty: "medium" as const } },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// Unit 8 — Sources of Magnetic Fields
// ═══════════════════════════════════════════════════════════════════════════

const unit8 = {
  id: "em-8",
  title: "Unit 8",
  subtitle: "Sources of Magnetic Fields",
  order: 8,
  sections: [
    { id: "em-8-intro", type: "note" as const, title: "What You'll Learn", content: "How currents **create** magnetic fields: the Biot-Savart law, Ampere's law, fields of wires, loops, solenoids, and toroids.", order: 0 },
    { id: "em-8-thm-biot-savart", type: "theorem" as const, title: "Biot-Savart Law", content: "$$d\\vec{B} = \\frac{\\mu_0}{4\\pi} \\frac{I\\,d\\vec{l} \\times \\hat{r}}{r^2}$$ where $\\mu_0 = 4\\pi \\times 10^{-7}\\;\\text{T·m/A}$. Integrate over the current to find total $\\vec{B}$.", keyTakeaway: "Biot-Savart is the magnetic analogue of Coulomb's law — general but requires integration.", order: 1 },
    { id: "em-8-thm-wire", type: "theorem" as const, title: "Field of an Infinite Straight Wire", content: "$$B = \\frac{\\mu_0 I}{2\\pi r}$$ Direction: right-hand rule. The field circles the wire and falls off as $1/r$.", keyTakeaway: "The wire's field is circumferential: it wraps around the wire in circles.", order: 2 },
    { id: "em-8-diagram-wire", type: "diagram" as const, title: "Magnetic Field of a Long Wire", content: "Concentric circles of $\\vec{B}$ around a current-carrying wire.", imageComponent: "WireFieldDiagram", order: 3 },
    { id: "em-8-thm-ampere", type: "theorem" as const, title: "Ampere's Law", content: "$$\\oint \\vec{B} \\cdot d\\vec{l} = \\mu_0 I_{\\text{enc}}$$ The line integral of $\\vec{B}$ around a closed loop equals $\\mu_0$ times the enclosed current.", keyTakeaway: "Choose an Amperian loop where $\\vec{B}$ is constant and tangent (or perpendicular) to the loop.", order: 4 },
    { id: "em-8-thm-solenoid", type: "theorem" as const, title: "Solenoid", content: "An ideal solenoid ($n$ turns/length): $$B = \\mu_0 n I$$ inside, $B = 0$ outside. Uniform and parallel to the axis.", keyTakeaway: "The field depends only on $n$ and $I$, not on the radius.", order: 5 },
    { id: "em-8-diagram-solenoid", type: "diagram" as const, title: "Solenoid Field", content: "Uniform $\\vec{B}$ inside; field lines are parallel. Outside, $B \\approx 0$.", imageComponent: "SolenoidDiagram", order: 6 },
    { id: "em-8-thm-toroid", type: "theorem" as const, title: "Toroid", content: "A toroid with $N$ turns, mean radius $R$: $$B = \\frac{\\mu_0 NI}{2\\pi r}$$ inside. $B = 0$ elsewhere.", order: 7 },
    { id: "em-8-def-loop", type: "definition" as const, title: "Field at Center of a Circular Loop", content: "$$B = \\frac{\\mu_0 I}{2R}$$ at the center of a single loop of radius $R$.", order: 8 },
    { id: "em-8-ex-1", type: "example" as const, title: "Example — Wire Field", content: "$I = 10\\;\\text{A}$ wire. Find $B$ at $r = 0.05\\;\\text{m}$.", steps: ["$B = \\mu_0 I/(2\\pi r) = (4\\pi\\times10^{-7})(10)/(2\\pi \\times 0.05)$.", "$B = 40\\;\\mu\\text{T}$.", "Direction: circles around the wire via right-hand rule."], order: 9 },
    { id: "em-8-ex-2", type: "example" as const, title: "Example — Solenoid", content: "$n = 2000\\;\\text{turns/m}$, $I = 5\\;\\text{A}$.", steps: ["$B = \\mu_0 nI = (4\\pi\\times10^{-7})(2000)(5) = 12.6\\;\\text{mT}$.", "Uniform throughout the interior."], order: 10 },
    { id: "em-8-p1", type: "practice" as const, title: "Practice 1 — Wire", content: "$I = 20\\;\\text{A}$. $B$ at $r = 0.10\\;\\text{m}$?", order: 11, problem: { id: "em-8-p1-q", choices: [{ id: "a", text: "$40\\;\\mu\\text{T}$" }, { id: "b", text: "$4\\;\\mu\\text{T}$" }, { id: "c", text: "$400\\;\\mu\\text{T}$" }, { id: "d", text: "$0.4\\;\\mu\\text{T}$" }], correctAnswerId: "a", solution: "$B = \\mu_0 I/(2\\pi r) = (4\\pi\\times10^{-7})(20)/(2\\pi\\times0.10) = 40\\;\\mu\\text{T}$.", difficulty: "medium" as const } },
    { id: "em-8-p2", type: "practice" as const, title: "Practice 2 — Solenoid", content: "$1000$ turns, length $0.50\\;\\text{m}$, $I = 3\\;\\text{A}$. $B$ inside?", order: 12, problem: { id: "em-8-p2-q", choices: [{ id: "a", text: "$7.5\\;\\text{mT}$" }, { id: "b", text: "$75\\;\\text{mT}$" }, { id: "c", text: "$0.75\\;\\text{mT}$" }, { id: "d", text: "$3.77\\;\\text{mT}$" }], correctAnswerId: "a", solution: "$n = 2000$. $B = \\mu_0 nI = 7.5\\;\\text{mT}$.", difficulty: "medium" as const } },
    { id: "em-8-p3", type: "practice" as const, title: "Practice 3 — Inside a Thick Wire", content: "Thick wire radius $R$, uniform current $I$. $B$ at $r < R$?", order: 13, problem: { id: "em-8-p3-q", choices: [{ id: "a", text: "$\\mu_0 Ir/(2\\pi R^2)$" }, { id: "b", text: "$\\mu_0 I/(2\\pi r)$" }, { id: "c", text: "$\\mu_0 I/(2\\pi R)$" }, { id: "d", text: "$0$" }], correctAnswerId: "a", solution: "$I_{\\text{enc}} = I(r^2/R^2)$. $B(2\\pi r) = \\mu_0 Ir^2/R^2$. $B = \\mu_0 Ir/(2\\pi R^2)$.", hint: "Inside: $I_{\\text{enc}} \\propto r^2$.", difficulty: "hard" as const } },
    { id: "em-8-p4", type: "practice" as const, title: "Practice 4 — Loop Center", content: "Loop $R = 0.05\\;\\text{m}$, $I = 2\\;\\text{A}$. $B$ at center?", order: 14, problem: { id: "em-8-p4-q", choices: [{ id: "a", text: "$25.1\\;\\mu\\text{T}$" }, { id: "b", text: "$12.6\\;\\mu\\text{T}$" }, { id: "c", text: "$50.3\\;\\mu\\text{T}$" }, { id: "d", text: "$6.3\\;\\mu\\text{T}$" }], correctAnswerId: "a", solution: "$B = \\mu_0 I/(2R) = (4\\pi\\times10^{-7})(2)/0.10 = 25.1\\;\\mu\\text{T}$.", difficulty: "medium" as const } },
    { id: "em-8-p5", type: "practice" as const, title: "Practice 5 — Force Between Wires", content: "Two wires $0.10\\;\\text{m}$ apart, each $5\\;\\text{A}$ same direction. Force per meter?", order: 15, problem: { id: "em-8-p5-q", choices: [{ id: "a", text: "$5.0 \\times 10^{-5}\\;\\text{N/m}$ (attractive)" }, { id: "b", text: "$5.0 \\times 10^{-5}\\;\\text{N/m}$ (repulsive)" }, { id: "c", text: "$2.5 \\times 10^{-5}\\;\\text{N/m}$" }, { id: "d", text: "$1.0 \\times 10^{-4}\\;\\text{N/m}$" }], correctAnswerId: "a", solution: "$F/L = \\mu_0 I_1 I_2/(2\\pi d) = 5.0\\times10^{-5}\\;\\text{N/m}$. Same direction = attractive.", hint: "Use $F/L = \\mu_0 I_1 I_2/(2\\pi d)$.", difficulty: "medium" as const } },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// Unit 9 — Electromagnetic Induction
// ═══════════════════════════════════════════════════════════════════════════

const unit9 = {
  id: "em-9",
  title: "Unit 9",
  subtitle: "Electromagnetic Induction",
  order: 9,
  sections: [
    { id: "em-9-intro", type: "note" as const, title: "What You'll Learn", content: "Faraday's law, Lenz's law, motional EMF, inductance, energy stored in magnetic fields, RL circuits, and mutual inductance.", order: 0 },
    { id: "em-9-def-magnetic-flux", type: "definition" as const, title: "Magnetic Flux", content: "$$\\Phi_B = \\int_S \\vec{B} \\cdot d\\vec{A}$$ Units: **weber** ($\\text{Wb} = \\text{T·m}^2$). For uniform $B$ through flat loop: $\\Phi_B = BA\\cos\\theta$.", order: 1 },
    { id: "em-9-thm-faraday", type: "theorem" as const, title: "Faraday's Law", content: "$$\\mathcal{E} = -\\frac{d\\Phi_B}{dt}$$ A changing magnetic flux induces an EMF. For $N$ turns: $\\mathcal{E} = -N\\,d\\Phi_B/dt$.", keyTakeaway: "It is the **change** in flux that matters — constant flux produces no EMF.", order: 2 },
    { id: "em-9-thm-lenz", type: "theorem" as const, title: "Lenz's Law", content: "The induced current flows in a direction that **opposes** the change in flux that produced it. This is the minus sign in Faraday's law and a consequence of energy conservation.", keyTakeaway: "Nature resists changes in magnetic flux.", order: 3 },
    { id: "em-9-diagram-faraday", type: "diagram" as const, title: "Faraday's Law — Changing Flux", content: "A bar magnet approaches a loop. The increasing flux induces a current that opposes the approach.", imageComponent: "FaradayDiagram", order: 4 },
    { id: "em-9-def-motional", type: "definition" as const, title: "Motional EMF", content: "A conductor of length $L$ moving with velocity $v$ perpendicular to $\\vec{B}$: $$\\mathcal{E} = BLv$$", order: 5 },
    { id: "em-9-def-inductance", type: "definition" as const, title: "Self-Inductance", content: "$$L = N\\Phi_B/I$$ Units: **henrys** ($\\text{H}$). Self-induced EMF: $\\mathcal{E}_L = -L\\,dI/dt$. For a solenoid: $L = \\mu_0 n^2 Al$.", order: 6 },
    { id: "em-9-thm-energy-B", type: "theorem" as const, title: "Energy in a Magnetic Field", content: "$$U = \\frac{1}{2}LI^2$$ Energy density: $u = B^2/(2\\mu_0)$.", keyTakeaway: "Inductors store energy in magnetic fields, just as capacitors store energy in electric fields.", order: 7 },
    { id: "em-9-thm-rl", type: "theorem" as const, title: "RL Circuits", content: "**Growth**: $I(t) = (\\mathcal{E}/R)(1 - e^{-t/\\tau})$ where $\\tau = L/R$. **Decay**: $I(t) = I_0 e^{-t/\\tau}$.", keyTakeaway: "Same exponential form as RC circuits — replace $RC$ with $L/R$.", order: 8 },
    { id: "em-9-diagram-rl", type: "diagram" as const, title: "RL Circuit — Current Growth", content: "Current rises exponentially toward $\\mathcal{E}/R$. The inductor resists sudden changes.", imageComponent: "RLCircuitDiagram", order: 9 },
    { id: "em-9-def-mutual", type: "definition" as const, title: "Mutual Inductance", content: "Changing current in coil 1 induces EMF in coil 2: $\\mathcal{E}_2 = -M\\,dI_1/dt$. $M$ is symmetric: $M_{12} = M_{21}$.", order: 10 },
    { id: "em-9-ex-1", type: "example" as const, title: "Example — Faraday's Law", content: "$50$-turn coil, area $0.01\\;\\text{m}^2$, field drops from $0.5\\;\\text{T}$ to $0$ in $0.02\\;\\text{s}$.", steps: ["$\\Delta\\Phi_B = (0-0.5)(0.01) = -5\\times10^{-3}\\;\\text{Wb}$.", "$\\mathcal{E} = -N\\Delta\\Phi_B/\\Delta t = -(50)(-5\\times10^{-3})/(0.02) = 12.5\\;\\text{V}$."], order: 11 },
    { id: "em-9-ex-2", type: "example" as const, title: "Example — RL Time Constant", content: "$L = 2.0\\;\\text{H}$, $R = 10\\;\\Omega$, $\\mathcal{E} = 20\\;\\text{V}$.", steps: ["$\\tau = L/R = 0.20\\;\\text{s}$.", "$I_{\\max} = 2.0\\;\\text{A}$.", "$I(\\tau) = 2.0(1-e^{-1}) = 1.26\\;\\text{A}$."], order: 12 },
    { id: "em-9-p1", type: "practice" as const, title: "Practice 1 — Faraday's Law", content: "$100$-turn coil, area $0.02\\;\\text{m}^2$, $dB/dt = 2\\;\\text{T/s}$. EMF?", order: 13, problem: { id: "em-9-p1-q", choices: [{ id: "a", text: "$4\\;\\text{V}$" }, { id: "b", text: "$0.04\\;\\text{V}$" }, { id: "c", text: "$200\\;\\text{V}$" }, { id: "d", text: "$40\\;\\text{V}$" }], correctAnswerId: "a", solution: "$|\\mathcal{E}| = NA\\,|dB/dt| = (100)(0.02)(2) = 4\\;\\text{V}$.", difficulty: "medium" as const } },
    { id: "em-9-p2", type: "practice" as const, title: "Practice 2 — Lenz's Law", content: "North pole approaches a loop. Induced current (from magnet's view):", order: 14, problem: { id: "em-9-p2-q", choices: [{ id: "a", text: "Counterclockwise" }, { id: "b", text: "Clockwise" }, { id: "c", text: "Zero" }, { id: "d", text: "Alternating" }], correctAnswerId: "a", solution: "Increasing flux into loop induces current that opposes it = counterclockwise (from magnet's view).", hint: "The induced field must oppose the change in flux.", difficulty: "medium" as const } },
    { id: "em-9-p3", type: "practice" as const, title: "Practice 3 — Motional EMF", content: "$0.50\\;\\text{m}$ rod at $3\\;\\text{m/s}$ in $B = 0.20\\;\\text{T}$. EMF?", order: 15, problem: { id: "em-9-p3-q", choices: [{ id: "a", text: "$0.30\\;\\text{V}$" }, { id: "b", text: "$0.03\\;\\text{V}$" }, { id: "c", text: "$3.0\\;\\text{V}$" }, { id: "d", text: "$0.10\\;\\text{V}$" }], correctAnswerId: "a", solution: "$\\mathcal{E} = BLv = (0.20)(0.50)(3) = 0.30\\;\\text{V}$.", difficulty: "medium" as const } },
    { id: "em-9-p4", type: "practice" as const, title: "Practice 4 — Inductance Energy", content: "$L = 0.50\\;\\text{H}$, $I = 4\\;\\text{A}$. Energy?", order: 16, problem: { id: "em-9-p4-q", choices: [{ id: "a", text: "$4.0\\;\\text{J}$" }, { id: "b", text: "$2.0\\;\\text{J}$" }, { id: "c", text: "$8.0\\;\\text{J}$" }, { id: "d", text: "$1.0\\;\\text{J}$" }], correctAnswerId: "a", solution: "$U = \\frac{1}{2}LI^2 = \\frac{1}{2}(0.50)(16) = 4.0\\;\\text{J}$.", difficulty: "medium" as const } },
    { id: "em-9-p5", type: "practice" as const, title: "Practice 5 — RL Time Constant", content: "$L = 0.10\\;\\text{H}$, $R = 50\\;\\Omega$. $\\tau$?", order: 17, problem: { id: "em-9-p5-q", choices: [{ id: "a", text: "$2.0\\;\\text{ms}$" }, { id: "b", text: "$5.0\\;\\text{ms}$" }, { id: "c", text: "$0.50\\;\\text{ms}$" }, { id: "d", text: "$500\\;\\text{ms}$" }], correctAnswerId: "a", solution: "$\\tau = L/R = 0.10/50 = 2.0\\;\\text{ms}$.", difficulty: "medium" as const } },
    { id: "em-9-p6", type: "practice" as const, title: "Practice 6 — Inductor Behavior at t=0", content: "At the instant a switch is closed in an RL circuit, the inductor behaves as:", order: 18, problem: { id: "em-9-p6-q", choices: [{ id: "a", text: "An open circuit" }, { id: "b", text: "A short circuit" }, { id: "c", text: "A resistor" }, { id: "d", text: "A capacitor" }], correctAnswerId: "a", solution: "At $t = 0$ the inductor opposes any current change: $I(0) = 0$ in growth mode, so it acts like an open circuit. After a long time it acts like a wire.", hint: "What is $I(0)$ in the growth equation?", difficulty: "medium" as const } },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// Unit 10 — Maxwell's Equations & EM Waves
// ═══════════════════════════════════════════════════════════════════════════

const unit10 = {
  id: "em-10",
  title: "Unit 10",
  subtitle: "Maxwell's Equations & Electromagnetic Waves",
  order: 10,
  sections: [
    { id: "em-10-intro", type: "note" as const, title: "What You'll Learn", content: "The grand unification: Maxwell's four equations, displacement current, electromagnetic waves, the speed of light, energy and momentum of EM radiation, and the electromagnetic spectrum.", order: 0 },
    { id: "em-10-thm-maxwell", type: "theorem" as const, title: "Maxwell's Equations (Integral Form)", content: "$$\\text{I. }\\oint \\vec{E}\\cdot d\\vec{A} = Q_{\\text{enc}}/\\varepsilon_0 \\quad \\text{(Gauss for E)}$$ $$\\text{II. }\\oint \\vec{B}\\cdot d\\vec{A} = 0 \\quad \\text{(Gauss for B — no monopoles)}$$ $$\\text{III. }\\oint \\vec{E}\\cdot d\\vec{l} = -d\\Phi_B/dt \\quad \\text{(Faraday)}$$ $$\\text{IV. }\\oint \\vec{B}\\cdot d\\vec{l} = \\mu_0(I + \\varepsilon_0\\,d\\Phi_E/dt) \\quad \\text{(Ampere-Maxwell)}$$", keyTakeaway: "These four equations completely describe classical electromagnetism.", order: 1 },
    { id: "em-10-def-displacement", type: "definition" as const, title: "Displacement Current", content: "Maxwell added the **displacement current** $I_d = \\varepsilon_0\\,d\\Phi_E/dt$ to Ampere's law. It represents the current due to a changing electric flux (e.g., between capacitor plates during charging).", order: 2 },
    { id: "em-10-diagram-displacement", type: "diagram" as const, title: "Displacement Current in a Capacitor", content: "While charging, the changing $\\vec{E}$ between plates acts as a displacement current, closing the loop for Ampere's law.", imageComponent: "DisplacementCurrentDiagram", order: 3 },
    { id: "em-10-thm-wave", type: "theorem" as const, title: "Electromagnetic Waves", content: "Maxwell's equations in free space yield wave equations. The speed: $$c = \\frac{1}{\\sqrt{\\mu_0\\varepsilon_0}} = 3.00 \\times 10^8\\;\\text{m/s}$$ Maxwell recognized this as the speed of light — proving light is an electromagnetic wave.", keyTakeaway: "The speed of light emerges purely from electromagnetic constants $\\mu_0$ and $\\varepsilon_0$.", order: 4 },
    { id: "em-10-diagram-emwave", type: "diagram" as const, title: "Electromagnetic Wave", content: "$\\vec{E}$ and $\\vec{B}$ oscillate perpendicular to each other and to the propagation direction. Both are in phase.", imageComponent: "EMWaveDiagram", order: 5 },
    { id: "em-10-thm-properties", type: "theorem" as const, title: "Properties of EM Waves", content: "1. Transverse: $\\vec{E} \\perp \\vec{B} \\perp \\vec{v}$.\n2. In phase: $E$ and $B$ peak simultaneously.\n3. Amplitude ratio: $E_0/B_0 = c$.\n4. Speed in vacuum: $c = 1/\\sqrt{\\mu_0\\varepsilon_0}$.\n5. No medium required.", keyTakeaway: "$E/B = c$ at all times.", order: 6 },
    { id: "em-10-def-poynting", type: "definition" as const, title: "Poynting Vector & Intensity", content: "$$\\vec{S} = \\frac{1}{\\mu_0}\\vec{E} \\times \\vec{B}$$ Units: $\\text{W/m}^2$. Time-averaged intensity: $I = E_0^2/(2\\mu_0 c)$.", order: 7 },
    { id: "em-10-def-spectrum", type: "definition" as const, title: "Electromagnetic Spectrum", content: "All EM waves travel at $c$ in vacuum. From low to high frequency: **radio**, **microwave**, **infrared**, **visible**, **ultraviolet**, **X-ray**, **gamma ray**. $c = f\\lambda$.", order: 8 },
    { id: "em-10-thm-radiation-pressure", type: "theorem" as const, title: "Radiation Pressure", content: "EM waves carry momentum: $p = U/c$. Radiation pressure on absorber: $P = I/c$. For a reflector: $P = 2I/c$.", keyTakeaway: "Light pushes — the basis for solar sails.", order: 9 },
    { id: "em-10-postulate-no-monopole", type: "postulate" as const, title: "No Magnetic Monopoles", content: "Maxwell's second equation ($\\oint \\vec{B}\\cdot d\\vec{A} = 0$) states magnetic field lines always close on themselves — no isolated poles exist.", order: 10 },
    { id: "em-10-note-desmos", type: "note" as const, title: "Desmos Exploration — EM Wave", content: "In the Desmos panel, plot $E(x,t) = E_0\\sin(kx - \\omega t)$ with sliders for $k$ and $\\omega$. Verify $c = \\omega/k$. Watch the wave propagate!", order: 11 },
    { id: "em-10-ex-1", type: "example" as const, title: "Example — Speed of Light", content: "Verify $c = 1/\\sqrt{\\mu_0\\varepsilon_0}$.", steps: ["$\\mu_0\\varepsilon_0 = (4\\pi\\times10^{-7})(8.854\\times10^{-12}) = 1.112\\times10^{-17}$.", "$c = 1/\\sqrt{1.112\\times10^{-17}} = 3.00\\times10^8\\;\\text{m/s}$."], order: 12 },
    { id: "em-10-ex-2", type: "example" as const, title: "Example — Sunlight Intensity", content: "$I = 1000\\;\\text{W/m}^2$. Find $E_0$ and $B_0$.", steps: ["$E_0 = \\sqrt{2\\mu_0 c I} = 868\\;\\text{V/m}$.", "$B_0 = E_0/c = 2.89\\;\\mu\\text{T}$.", "Radiation pressure: $P = I/c = 3.33\\times10^{-6}\\;\\text{Pa}$."], order: 13 },
    { id: "em-10-p1", type: "practice" as const, title: "Practice 1 — Displacement Current", content: "Electric flux changes at $10^{10}\\;\\text{V·m/s}$. Displacement current?", order: 14, problem: { id: "em-10-p1-q", choices: [{ id: "a", text: "$0.089\\;\\text{A}$" }, { id: "b", text: "$0.89\\;\\text{A}$" }, { id: "c", text: "$8.9 \\times 10^{-3}\\;\\text{A}$" }, { id: "d", text: "$8.9\\;\\text{A}$" }], correctAnswerId: "a", solution: "$I_d = \\varepsilon_0(d\\Phi_E/dt) = (8.854\\times10^{-12})(10^{10}) = 0.089\\;\\text{A}$.", difficulty: "medium" as const } },
    { id: "em-10-p2", type: "practice" as const, title: "Practice 2 — E/B Ratio", content: "EM wave with $E_0 = 600\\;\\text{V/m}$. Find $B_0$.", order: 15, problem: { id: "em-10-p2-q", choices: [{ id: "a", text: "$2.0 \\times 10^{-6}\\;\\text{T}$" }, { id: "b", text: "$2.0 \\times 10^{-4}\\;\\text{T}$" }, { id: "c", text: "$1.8 \\times 10^{11}\\;\\text{T}$" }, { id: "d", text: "$6.0 \\times 10^{-8}\\;\\text{T}$" }], correctAnswerId: "a", solution: "$B_0 = E_0/c = 600/3\\times10^8 = 2.0\\times10^{-6}\\;\\text{T}$.", difficulty: "medium" as const } },
    { id: "em-10-p3", type: "practice" as const, title: "Practice 3 — Wavelength", content: "Radio station at $f = 100\\;\\text{MHz}$. Wavelength?", order: 16, problem: { id: "em-10-p3-q", choices: [{ id: "a", text: "$3.0\\;\\text{m}$" }, { id: "b", text: "$30\\;\\text{m}$" }, { id: "c", text: "$0.30\\;\\text{m}$" }, { id: "d", text: "$300\\;\\text{m}$" }], correctAnswerId: "a", solution: "$\\lambda = c/f = 3\\times10^8/10^8 = 3.0\\;\\text{m}$.", difficulty: "medium" as const } },
    { id: "em-10-p4", type: "practice" as const, title: "Practice 4 — Radiation Pressure", content: "Laser ($I = 10^{12}\\;\\text{W/m}^2$) hits absorber. Pressure?", order: 17, problem: { id: "em-10-p4-q", choices: [{ id: "a", text: "$3.33 \\times 10^3\\;\\text{Pa}$" }, { id: "b", text: "$3.33 \\times 10^6\\;\\text{Pa}$" }, { id: "c", text: "$6.67 \\times 10^3\\;\\text{Pa}$" }, { id: "d", text: "$3.33 \\times 10^{20}\\;\\text{Pa}$" }], correctAnswerId: "a", solution: "$P = I/c = 10^{12}/3\\times10^8 = 3.33\\times10^3\\;\\text{Pa}$.", hint: "For a reflector it would be $2I/c$.", difficulty: "medium" as const } },
    { id: "em-10-p5", type: "practice" as const, title: "Practice 5 — No Monopoles", content: "Which Maxwell equation implies no magnetic monopoles?", order: 18, problem: { id: "em-10-p5-q", choices: [{ id: "a", text: "$\\oint \\vec{B} \\cdot d\\vec{A} = 0$" }, { id: "b", text: "$\\oint \\vec{E} \\cdot d\\vec{A} = Q/\\varepsilon_0$" }, { id: "c", text: "Faraday's law" }, { id: "d", text: "Ampere-Maxwell law" }], correctAnswerId: "a", solution: "$\\oint \\vec{B} \\cdot d\\vec{A} = 0$ means $B$-field lines always close — no monopoles.", difficulty: "medium" as const } },
    { id: "em-10-p6", type: "practice" as const, title: "Practice 6 — Intensity", content: "$E_0 = 400\\;\\text{V/m}$. Intensity?", order: 19, problem: { id: "em-10-p6-q", choices: [{ id: "a", text: "$212\\;\\text{W/m}^2$" }, { id: "b", text: "$424\\;\\text{W/m}^2$" }, { id: "c", text: "$106\\;\\text{W/m}^2$" }, { id: "d", text: "$848\\;\\text{W/m}^2$" }], correctAnswerId: "a", solution: "$I = E_0^2/(2\\mu_0 c) \\approx 212\\;\\text{W/m}^2$.", hint: "Use $I = c\\varepsilon_0 E_0^2/2$ equivalently.", difficulty: "hard" as const } },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// Export the complete study guide
// ═══════════════════════════════════════════════════════════════════════════

export const physicsEM: StudyGuide = {
  id: "physics-em",
  title: "Physics: Electricity & Magnetism",
  subject: "Physics",
  chapter: "1-10",
  description:
    "A comprehensive 10-unit course covering electric charge, fields, Gauss's law, potential, capacitors, DC circuits, magnetic forces and sources, electromagnetic induction, and Maxwell's equations. Advanced level, aligned with Griffiths and OpenStax University Physics Vol. 2.",
  coverColor: "from-blue-500/20 to-cyan-500/20",
  icon: "Zap",
  lessons: [unit1, unit2, unit3, unit4, unit5, unit6, unit7, unit8, unit9, unit10],
};
