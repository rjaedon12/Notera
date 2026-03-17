import type { StudyGuide } from "@/types/studyguide";

/**
 * Physics: Mechanics Study Guide
 * Based on OpenStax College Physics 2e (CC-BY 4.0)
 * https://openstax.org/details/books/college-physics-2e
 *
 * Covers Chapters 2, 4, 6, 7, 8 — the core of introductory mechanics.
 */
export const physicsMechanics: StudyGuide = {
  id: "physics-mechanics",
  title: "Physics: Mechanics",
  subject: "Physics",
  chapter: "1–5",
  description:
    "Master one-dimensional kinematics, Newton's laws of motion, work & energy, impulse & momentum, and rotational motion with step-by-step examples and practice problems.",
  coverColor: "from-orange-500/20 to-red-500/20",
  icon: "Atom",
  lessons: [
    // ================================================
    // LESSON 1 — One-Dimensional Kinematics
    // ================================================
    {
      id: "phys-1",
      title: "Lesson 1",
      subtitle: "One-Dimensional Kinematics",
      order: 1,
      sections: [
        {
          id: "phys-1-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "In this lesson you'll study motion along a straight line — displacement, velocity, acceleration — and the kinematic equations that relate them under constant acceleration.",
          order: 0,
        },
        // --- Definitions ---
        {
          id: "phys-1-def-displacement",
          type: "definition",
          title: "Displacement",
          content:
            "**Displacement** ($\\Delta x$) is the *change in position* of an object. It is a **vector** quantity (has magnitude and direction).\n\n$$\\Delta x = x_f - x_i$$\n\nDisplacement can be positive (forward / right) or negative (backward / left). It differs from *distance*, which is the total path length traveled (always positive).",
          order: 1,
        },
        {
          id: "phys-1-def-velocity",
          type: "definition",
          title: "Velocity vs. Speed",
          content:
            "**Average velocity** is displacement divided by elapsed time:\n\n$$\\bar{v} = \\frac{\\Delta x}{\\Delta t} = \\frac{x_f - x_i}{t_f - t_i}$$\n\nVelocity is a **vector** (has direction). **Speed** is the *magnitude* of velocity (always positive).\n\n**Instantaneous velocity** is the velocity at a single moment — the limit of average velocity as $\\Delta t \\to 0$.",
          order: 2,
        },
        {
          id: "phys-1-diagram-displacement",
          type: "diagram",
          title: "Position vs. Time Graph",
          content:
            "On a position-vs-time graph the **slope** of the line equals the velocity. A steeper line means greater speed. A horizontal line means the object is at rest.",
          imageComponent: "PositionTimeDiagram",
          order: 3,
        },
        {
          id: "phys-1-def-acceleration",
          type: "definition",
          title: "Acceleration",
          content:
            "**Average acceleration** is the rate of change of velocity:\n\n$$\\bar{a} = \\frac{\\Delta v}{\\Delta t} = \\frac{v_f - v_i}{t_f - t_i}$$\n\nAcceleration is a **vector**. When velocity and acceleration have the *same* sign the object speeds up; when they have *opposite* signs the object slows down (decelerates).\n\nSI unit: $\\text{m/s}^2$.",
          order: 4,
        },
        {
          id: "phys-1-diagram-accel",
          type: "diagram",
          title: "Velocity vs. Time Graph",
          content:
            "On a velocity-vs-time graph the **slope** equals the acceleration and the **area under the curve** equals the displacement.",
          imageComponent: "VelocityTimeDiagram",
          order: 5,
        },
        // --- Kinematic Equations ---
        {
          id: "phys-1-thm-kinematic",
          type: "theorem",
          title: "Kinematic Equations (Constant Acceleration)",
          content:
            "When acceleration $a$ is **constant**, the following four equations relate position $x$, velocity $v$, acceleration $a$, and time $t$:\n\n$$v = v_0 + at$$\n$$x = x_0 + v_0 t + \\tfrac{1}{2}at^2$$\n$$v^2 = v_0^2 + 2a(x - x_0)$$\n$$x = x_0 + \\tfrac{1}{2}(v_0 + v)t$$\n\nChoose the equation that contains the three known quantities and the one unknown.",
          keyTakeaway:
            "Four equations, five variables (x, v, v₀, a, t). Each equation leaves out one variable.",
          order: 6,
        },
        {
          id: "phys-1-ex-1",
          type: "example",
          title: "Example — Braking Car",
          content:
            "A car traveling at $30\\text{ m/s}$ applies the brakes and decelerates uniformly at $-5\\text{ m/s}^2$. How far does it travel before stopping?",
          steps: [
            "Identify knowns: $v_0 = 30\\text{ m/s}$, $v = 0$, $a = -5\\text{ m/s}^2$. Unknown: $\\Delta x$.",
            "Choose the equation without $t$: $v^2 = v_0^2 + 2a\\Delta x$",
            "$0 = (30)^2 + 2(-5)\\Delta x$",
            "$0 = 900 - 10\\Delta x$",
            "$\\Delta x = 90\\text{ m}$",
          ],
          order: 7,
        },
        // --- Free Fall ---
        {
          id: "phys-1-def-freefall",
          type: "definition",
          title: "Free Fall",
          content:
            "**Free fall** is motion under the influence of gravity alone (ignoring air resistance). Near Earth's surface the acceleration due to gravity is:\n\n$$g \\approx 9.80\\text{ m/s}^2 \\text{ (downward)}$$\n\nAll kinematic equations apply with $a = -g$ (taking *up* as positive).",
          order: 8,
        },
        {
          id: "phys-1-ex-2",
          type: "example",
          title: "Example — Ball Thrown Upward",
          content:
            "A ball is thrown straight up with $v_0 = 15\\text{ m/s}$. How high does it rise?",
          steps: [
            "At the peak, $v = 0$. Use $v^2 = v_0^2 + 2a\\Delta y$",
            "$0 = (15)^2 + 2(-9.8)\\Delta y$",
            "$0 = 225 - 19.6\\,\\Delta y$",
            "$\\Delta y = \\frac{225}{19.6} \\approx 11.5\\text{ m}$",
          ],
          order: 9,
        },
        // --- Practice Problems ---
        {
          id: "phys-1-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "A sprinter accelerates from rest at $3.0\\text{ m/s}^2$ for $4.0\\text{ s}$. What is her final velocity?",
          order: 10,
          problem: {
            id: "phys-1-p1-q",
            choices: [
              { id: "a", text: "12 m/s" },
              { id: "b", text: "6 m/s" },
              { id: "c", text: "24 m/s" },
              { id: "d", text: "9.8 m/s" },
            ],
            correctAnswerId: "a",
            solution:
              "$v = v_0 + at = 0 + (3.0)(4.0) = 12\\text{ m/s}$.",
            difficulty: "easy",
          },
        },
        {
          id: "phys-1-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "A car accelerates from $10\\text{ m/s}$ to $30\\text{ m/s}$ over a distance of $200\\text{ m}$. What is the acceleration?",
          order: 11,
          problem: {
            id: "phys-1-p2-q",
            choices: [
              { id: "a", text: "2.0 m/s²" },
              { id: "b", text: "0.5 m/s²" },
              { id: "c", text: "4.0 m/s²" },
              { id: "d", text: "1.0 m/s²" },
            ],
            correctAnswerId: "a",
            solution:
              "$v^2 = v_0^2 + 2a\\Delta x \\Rightarrow 900 = 100 + 400a \\Rightarrow a = \\frac{800}{400} = 2.0\\text{ m/s}^2$.",
            difficulty: "medium",
          },
        },
        {
          id: "phys-1-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "An object is dropped from rest. How far does it fall in $3.0\\text{ s}$? (Use $g = 9.8\\text{ m/s}^2$.)",
          order: 12,
          problem: {
            id: "phys-1-p3-q",
            choices: [
              { id: "a", text: "44.1 m" },
              { id: "b", text: "29.4 m" },
              { id: "c", text: "14.7 m" },
              { id: "d", text: "88.2 m" },
            ],
            correctAnswerId: "a",
            solution:
              "$\\Delta y = v_0 t + \\frac{1}{2}gt^2 = 0 + \\frac{1}{2}(9.8)(3.0)^2 = \\frac{1}{2}(9.8)(9) = 44.1\\text{ m}$.",
            difficulty: "easy",
          },
        },
        {
          id: "phys-1-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "A ball is thrown straight up at $20\\text{ m/s}$. How long until it returns to the same height? (Use $g = 10\\text{ m/s}^2$ for simplicity.)",
          order: 13,
          problem: {
            id: "phys-1-p4-q",
            choices: [
              { id: "a", text: "4.0 s" },
              { id: "b", text: "2.0 s" },
              { id: "c", text: "1.0 s" },
              { id: "d", text: "8.0 s" },
            ],
            correctAnswerId: "a",
            solution:
              "Time to peak: $t_{\\text{up}} = \\frac{v_0}{g} = \\frac{20}{10} = 2\\text{ s}$. Total round-trip = $2 \\times 2 = 4.0\\text{ s}$.",
            difficulty: "medium",
          },
        },
      ],
    },

    // ================================================
    // LESSON 2 — Newton's Laws of Motion
    // ================================================
    {
      id: "phys-2",
      title: "Lesson 2",
      subtitle: "Newton's Laws of Motion",
      order: 2,
      sections: [
        {
          id: "phys-2-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "In this lesson you'll study the three fundamental laws that govern how forces affect motion, and learn to draw free-body diagrams and solve for unknown forces and accelerations.",
          order: 0,
        },
        // --- Force definition ---
        {
          id: "phys-2-def-force",
          type: "definition",
          title: "Force",
          content:
            "A **force** is a push or pull on an object. Force is a **vector** with both magnitude and direction. The SI unit of force is the **newton** (N).\n\n$$1\\text{ N} = 1\\text{ kg} \\cdot \\text{m/s}^2$$\n\nForces can be **contact forces** (friction, tension, normal) or **non-contact forces** (gravity, electromagnetism).",
          order: 1,
        },
        // --- Newton's First Law ---
        {
          id: "phys-2-thm-n1",
          type: "theorem",
          title: "Newton's First Law — Law of Inertia",
          content:
            "An object at rest stays at rest, and an object in motion continues with **constant velocity**, unless acted upon by a **net external force**.\n\n$$\\sum \\vec{F} = 0 \\implies \\vec{v} = \\text{constant}$$\n\n**Inertia** is the tendency of an object to resist changes in its state of motion. Mass is a measure of inertia.",
          keyTakeaway:
            "No net force → no change in velocity (object stays at rest or moves at constant speed in a straight line).",
          order: 2,
        },
        {
          id: "phys-2-diagram-fbd",
          type: "diagram",
          title: "Free-Body Diagram",
          content:
            "A **free-body diagram** (FBD) shows all forces acting on a single object as arrows pointing away from the object's center. Each arrow represents one force (gravity, normal, tension, friction, applied, etc.).",
          imageComponent: "FreeBodyDiagram",
          order: 3,
        },
        // --- Newton's Second Law ---
        {
          id: "phys-2-thm-n2",
          type: "theorem",
          title: "Newton's Second Law",
          content:
            "The acceleration of an object is directly proportional to the **net force** acting on it and inversely proportional to its **mass**:\n\n$$\\vec{F}_{\\text{net}} = m\\vec{a}$$\n\nor equivalently:\n\n$$\\vec{a} = \\frac{\\vec{F}_{\\text{net}}}{m}$$\n\nThe direction of the acceleration is the same as the direction of the net force.",
          keyTakeaway:
            "F = ma. Doubling the force doubles the acceleration; doubling the mass halves the acceleration.",
          order: 4,
        },
        {
          id: "phys-2-ex-1",
          type: "example",
          title: "Example — Pushing a Box",
          content:
            "A $10\\text{ kg}$ box on a frictionless floor is pushed with a horizontal force of $40\\text{ N}$. Find its acceleration.",
          steps: [
            "Draw FBD: Forces are $F_{\\text{push}} = 40\\text{ N}$ (right), $F_g = mg = 98\\text{ N}$ (down), $F_N = 98\\text{ N}$ (up).",
            "Vertical forces cancel: $F_N = F_g$.",
            "Apply Newton's 2nd law horizontally: $a = \\frac{F_{\\text{net}}}{m} = \\frac{40}{10} = 4.0\\text{ m/s}^2$.",
          ],
          order: 5,
        },
        // --- Newton's Third Law ---
        {
          id: "phys-2-thm-n3",
          type: "theorem",
          title: "Newton's Third Law — Action-Reaction",
          content:
            "For every action force there is an **equal and opposite** reaction force. If object A exerts a force on object B, then B exerts a force of equal magnitude but **opposite direction** on A.\n\n$$\\vec{F}_{A \\to B} = -\\vec{F}_{B \\to A}$$\n\nImportant: The two forces act on *different* objects — they never cancel each other.",
          keyTakeaway:
            "Action and reaction are always equal and opposite, but they act on different objects.",
          order: 6,
        },
        {
          id: "phys-2-diagram-n3",
          type: "diagram",
          title: "Action-Reaction Pairs",
          content:
            "A person pushes on a wall. The wall pushes back on the person with an equal force. The forces are on *different* objects (person and wall), so they do not cancel.",
          imageComponent: "ActionReactionDiagram",
          order: 7,
        },
        // --- Common forces ---
        {
          id: "phys-2-def-weight",
          type: "definition",
          title: "Weight, Normal Force & Friction",
          content:
            "**Weight** ($W$): The gravitational force on an object, $W = mg$, directed downward.\n\n**Normal force** ($F_N$): The support force perpendicular to a surface. On a flat surface with no vertical acceleration, $F_N = mg$.\n\n**Friction** ($f$): A force that opposes sliding motion.\n- *Static friction*: $f_s \\leq \\mu_s F_N$\n- *Kinetic friction*: $f_k = \\mu_k F_N$\n\nwhere $\\mu$ is the coefficient of friction.",
          order: 8,
        },
        {
          id: "phys-2-ex-2",
          type: "example",
          title: "Example — Box on a Rough Surface",
          content:
            "A $5\\text{ kg}$ box is pushed with $25\\text{ N}$ on a surface with $\\mu_k = 0.3$. Find the acceleration.",
          steps: [
            "$F_N = mg = 5(9.8) = 49\\text{ N}$",
            "$f_k = \\mu_k F_N = 0.3(49) = 14.7\\text{ N}$",
            "$F_{\\text{net}} = F_{\\text{push}} - f_k = 25 - 14.7 = 10.3\\text{ N}$",
            "$a = \\frac{F_{\\text{net}}}{m} = \\frac{10.3}{5} = 2.06\\text{ m/s}^2$",
          ],
          order: 9,
        },
        // --- Practice ---
        {
          id: "phys-2-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "What net force is needed to accelerate a $1500\\text{ kg}$ car at $2.0\\text{ m/s}^2$?",
          order: 10,
          problem: {
            id: "phys-2-p1-q",
            choices: [
              { id: "a", text: "3000 N" },
              { id: "b", text: "750 N" },
              { id: "c", text: "1500 N" },
              { id: "d", text: "6000 N" },
            ],
            correctAnswerId: "a",
            solution:
              "$F = ma = (1500)(2.0) = 3000\\text{ N}$.",
            difficulty: "easy",
          },
        },
        {
          id: "phys-2-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "A $60\\text{ kg}$ person stands on a scale in an elevator accelerating upward at $2.0\\text{ m/s}^2$. What does the scale read?",
          order: 11,
          problem: {
            id: "phys-2-p2-q",
            choices: [
              { id: "a", text: "708 N" },
              { id: "b", text: "588 N" },
              { id: "c", text: "468 N" },
              { id: "d", text: "120 N" },
            ],
            correctAnswerId: "a",
            solution:
              "The scale reads the normal force: $F_N = m(g + a) = 60(9.8 + 2.0) = 60(11.8) = 708\\text{ N}$.",
            difficulty: "medium",
          },
        },
        {
          id: "phys-2-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "A $2\\text{ kg}$ book sits on a table. What is the normal force acting on the book?",
          order: 12,
          problem: {
            id: "phys-2-p3-q",
            choices: [
              { id: "a", text: "19.6 N" },
              { id: "b", text: "2 N" },
              { id: "c", text: "9.8 N" },
              { id: "d", text: "0 N" },
            ],
            correctAnswerId: "a",
            solution:
              "On a flat surface at rest: $F_N = mg = 2(9.8) = 19.6\\text{ N}$.",
            difficulty: "easy",
          },
        },
        {
          id: "phys-2-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "A $10\\text{ kg}$ crate is pushed across a floor ($\\mu_k = 0.4$) at constant velocity. What applied force is needed?",
          order: 13,
          problem: {
            id: "phys-2-p4-q",
            choices: [
              { id: "a", text: "39.2 N" },
              { id: "b", text: "98 N" },
              { id: "c", text: "49 N" },
              { id: "d", text: "19.6 N" },
            ],
            correctAnswerId: "a",
            solution:
              "Constant velocity → $a = 0$ → $F_{\\text{push}} = f_k = \\mu_k mg = 0.4(10)(9.8) = 39.2\\text{ N}$.",
            difficulty: "medium",
          },
        },
      ],
    },

    // ================================================
    // LESSON 3 — Work, Energy & Power
    // ================================================
    {
      id: "phys-3",
      title: "Lesson 3",
      subtitle: "Work, Energy & Power",
      order: 3,
      sections: [
        {
          id: "phys-3-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "This lesson introduces the scalar concepts of work, kinetic energy, potential energy, and the work-energy theorem — powerful tools for analyzing motion without tracking forces over time.",
          order: 0,
        },
        // --- Work ---
        {
          id: "phys-3-def-work",
          type: "definition",
          title: "Work",
          content:
            "**Work** ($W$) is done on an object when a force causes a displacement. For a constant force at angle $\\theta$ to the displacement:\n\n$$W = Fd\\cos\\theta$$\n\n- $\\theta = 0°$: force is in the direction of motion → positive work.\n- $\\theta = 90°$: force is perpendicular → **zero** work (e.g., normal force).\n- $\\theta = 180°$: force opposes motion → negative work (e.g., friction).\n\nSI unit: **joule** (J) $= 1\\text{ N}\\cdot\\text{m}$.",
          order: 1,
        },
        {
          id: "phys-3-diagram-work",
          type: "diagram",
          title: "Work Done by a Force at an Angle",
          content:
            "A force $F$ is applied at angle $\\theta$ above the horizontal as an object moves a displacement $d$ along the surface. Only the component $F\\cos\\theta$ does work.",
          imageComponent: "WorkAngleDiagram",
          order: 2,
        },
        {
          id: "phys-3-ex-1",
          type: "example",
          title: "Example — Pulling a Sled",
          content:
            "A child pulls a sled $50\\text{ m}$ with a force of $100\\text{ N}$ at $30°$ above horizontal. How much work is done?",
          steps: [
            "$W = Fd\\cos\\theta$",
            "$W = (100)(50)\\cos 30°$",
            "$W = 5000 \\times 0.866 = 4330\\text{ J}$",
          ],
          order: 3,
        },
        // --- Kinetic Energy ---
        {
          id: "phys-3-def-ke",
          type: "definition",
          title: "Kinetic Energy",
          content:
            "**Kinetic energy** ($KE$) is the energy of motion:\n\n$$KE = \\frac{1}{2}mv^2$$\n\nKinetic energy is always **non-negative** (mass and $v^2$ are both positive). Doubling the speed quadruples the kinetic energy.",
          order: 4,
        },
        {
          id: "phys-3-thm-wet",
          type: "theorem",
          title: "Work-Energy Theorem",
          content:
            "The **net work** done on an object equals the change in its kinetic energy:\n\n$$W_{\\text{net}} = \\Delta KE = \\frac{1}{2}mv_f^2 - \\frac{1}{2}mv_i^2$$\n\nIf positive net work is done, kinetic energy increases (object speeds up). If negative net work is done, kinetic energy decreases (object slows down).",
          keyTakeaway:
            "Net work = change in kinetic energy. This bypasses the need to find acceleration explicitly.",
          order: 5,
        },
        {
          id: "phys-3-ex-2",
          type: "example",
          title: "Example — Stopping a Car",
          content:
            "A $1000\\text{ kg}$ car traveling at $20\\text{ m/s}$ brakes to a stop. How much work does friction do?",
          steps: [
            "$W_{\\text{net}} = \\Delta KE = \\frac{1}{2}mv_f^2 - \\frac{1}{2}mv_i^2$",
            "$W_{\\text{net}} = 0 - \\frac{1}{2}(1000)(20)^2$",
            "$W_{\\text{net}} = -200{,}000\\text{ J} = -200\\text{ kJ}$",
            "Friction does $-200\\text{ kJ}$ of work (negative because it opposes motion).",
          ],
          order: 6,
        },
        // --- Potential Energy ---
        {
          id: "phys-3-def-pe",
          type: "definition",
          title: "Gravitational Potential Energy",
          content:
            "**Gravitational potential energy** is the energy stored due to an object's height above a reference point:\n\n$$PE_g = mgh$$\n\nwhere $h$ is the height above the chosen reference level. The reference point ($h = 0$) is arbitrary.",
          order: 7,
        },
        // --- Conservation of Energy ---
        {
          id: "phys-3-thm-conservation",
          type: "theorem",
          title: "Conservation of Mechanical Energy",
          content:
            "In the absence of non-conservative forces (like friction), the **total mechanical energy** is conserved:\n\n$$KE_i + PE_i = KE_f + PE_f$$\n\nor equivalently:\n\n$$\\frac{1}{2}mv_i^2 + mgh_i = \\frac{1}{2}mv_f^2 + mgh_f$$\n\nEnergy transforms between kinetic and potential forms but the total remains constant.",
          keyTakeaway:
            "When only gravity does work: KE + PE = constant. Use this to avoid complicated force/acceleration analysis.",
          order: 8,
        },
        {
          id: "phys-3-ex-3",
          type: "example",
          title: "Example — Roller Coaster Drop",
          content:
            "A roller coaster car ($m = 500\\text{ kg}$) starts from rest at the top of a $40\\text{ m}$ hill. What is its speed at the bottom? (Ignore friction.)",
          steps: [
            "Use conservation of energy: $KE_i + PE_i = KE_f + PE_f$",
            "$0 + mgh = \\frac{1}{2}mv^2 + 0$",
            "Mass cancels: $gh = \\frac{1}{2}v^2$",
            "$v = \\sqrt{2gh} = \\sqrt{2(9.8)(40)} = \\sqrt{784} = 28\\text{ m/s}$",
          ],
          order: 9,
        },
        // --- Power ---
        {
          id: "phys-3-def-power",
          type: "definition",
          title: "Power",
          content:
            "**Power** is the rate at which work is done (or energy is transferred):\n\n$$P = \\frac{W}{t}$$\n\nAlternatively, for a constant force moving at velocity $v$: $P = Fv$.\n\nSI unit: **watt** (W) $= 1\\text{ J/s}$. $1\\text{ horsepower} = 746\\text{ W}$.",
          order: 10,
        },
        // --- Practice ---
        {
          id: "phys-3-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "How much work is done lifting a $20\\text{ kg}$ box to a shelf $1.5\\text{ m}$ high?",
          order: 11,
          problem: {
            id: "phys-3-p1-q",
            choices: [
              { id: "a", text: "294 J" },
              { id: "b", text: "30 J" },
              { id: "c", text: "196 J" },
              { id: "d", text: "150 J" },
            ],
            correctAnswerId: "a",
            solution:
              "$W = mgh = (20)(9.8)(1.5) = 294\\text{ J}$.",
            difficulty: "easy",
          },
        },
        {
          id: "phys-3-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "A $0.5\\text{ kg}$ ball is thrown at $10\\text{ m/s}$. What is its kinetic energy?",
          order: 12,
          problem: {
            id: "phys-3-p2-q",
            choices: [
              { id: "a", text: "25 J" },
              { id: "b", text: "50 J" },
              { id: "c", text: "5 J" },
              { id: "d", text: "100 J" },
            ],
            correctAnswerId: "a",
            solution:
              "$KE = \\frac{1}{2}mv^2 = \\frac{1}{2}(0.5)(10)^2 = 25\\text{ J}$.",
            difficulty: "easy",
          },
        },
        {
          id: "phys-3-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "A pendulum is released from a height of $0.8\\text{ m}$ above its lowest point. What is its speed at the bottom?",
          order: 13,
          problem: {
            id: "phys-3-p3-q",
            choices: [
              { id: "a", text: "3.96 m/s" },
              { id: "b", text: "7.84 m/s" },
              { id: "c", text: "2.8 m/s" },
              { id: "d", text: "1.96 m/s" },
            ],
            correctAnswerId: "a",
            solution:
              "$v = \\sqrt{2gh} = \\sqrt{2(9.8)(0.8)} = \\sqrt{15.68} \\approx 3.96\\text{ m/s}$.",
            difficulty: "medium",
          },
        },
        {
          id: "phys-3-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "An engine does $60{,}000\\text{ J}$ of work in $30\\text{ s}$. What is its power output?",
          order: 14,
          problem: {
            id: "phys-3-p4-q",
            choices: [
              { id: "a", text: "2000 W" },
              { id: "b", text: "1800 W" },
              { id: "c", text: "200 W" },
              { id: "d", text: "20,000 W" },
            ],
            correctAnswerId: "a",
            solution:
              "$P = \\frac{W}{t} = \\frac{60{,}000}{30} = 2000\\text{ W} = 2\\text{ kW}$.",
            difficulty: "easy",
          },
        },
      ],
    },

    // ================================================
    // LESSON 4 — Impulse & Momentum
    // ================================================
    {
      id: "phys-4",
      title: "Lesson 4",
      subtitle: "Impulse & Momentum",
      order: 4,
      sections: [
        {
          id: "phys-4-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "This lesson covers linear momentum, impulse, the impulse-momentum theorem, and the law of conservation of momentum — the key to analyzing collisions and explosions.",
          order: 0,
        },
        // --- Momentum ---
        {
          id: "phys-4-def-momentum",
          type: "definition",
          title: "Linear Momentum",
          content:
            "**Linear momentum** ($\\vec{p}$) is the product of an object's mass and velocity:\n\n$$\\vec{p} = m\\vec{v}$$\n\nMomentum is a **vector** — it has the same direction as velocity. SI unit: $\\text{kg} \\cdot \\text{m/s}$.\n\nA fast-moving car and a slow-moving truck can have the same momentum if mass × velocity is equal.",
          order: 1,
        },
        // --- Impulse ---
        {
          id: "phys-4-def-impulse",
          type: "definition",
          title: "Impulse",
          content:
            "**Impulse** ($\\vec{J}$) is the product of force and the time interval over which it acts:\n\n$$\\vec{J} = \\vec{F}\\,\\Delta t$$\n\nImpulse has the same units as momentum: $\\text{N} \\cdot \\text{s} = \\text{kg} \\cdot \\text{m/s}$.",
          order: 2,
        },
        {
          id: "phys-4-thm-impulse",
          type: "theorem",
          title: "Impulse-Momentum Theorem",
          content:
            "The impulse applied to an object equals the **change in its momentum**:\n\n$$\\vec{J} = \\Delta\\vec{p} = m\\vec{v}_f - m\\vec{v}_i$$\n\nor equivalently:\n\n$$\\vec{F}\\,\\Delta t = m\\Delta\\vec{v}$$\n\nA large force over a short time produces the same impulse as a small force over a long time.",
          keyTakeaway:
            "Force × time = change in momentum. This is why airbags work — they increase Δt to reduce force.",
          order: 3,
        },
        {
          id: "phys-4-diagram-impulse",
          type: "diagram",
          title: "Impulse and Force-Time Graph",
          content:
            "On a force-vs-time graph, the **area under the curve** equals the impulse. A tall, narrow rectangle (large force, short time) and a short, wide rectangle (small force, long time) can have the same area.",
          imageComponent: "ImpulseGraphDiagram",
          order: 4,
        },
        {
          id: "phys-4-ex-1",
          type: "example",
          title: "Example — Catching a Ball",
          content:
            "A $0.15\\text{ kg}$ baseball traveling at $40\\text{ m/s}$ is caught and brought to rest in $0.01\\text{ s}$. What average force does the catcher's glove exert?",
          steps: [
            "$\\Delta p = mv_f - mv_i = 0 - (0.15)(40) = -6\\text{ kg·m/s}$",
            "$F = \\frac{\\Delta p}{\\Delta t} = \\frac{-6}{0.01} = -600\\text{ N}$",
            "The glove exerts $600\\text{ N}$ on the ball (opposite to its motion).",
          ],
          order: 5,
        },
        // --- Conservation of Momentum ---
        {
          id: "phys-4-thm-conservation",
          type: "theorem",
          title: "Conservation of Linear Momentum",
          content:
            "In an **isolated system** (no external net force), the total momentum before an event equals the total momentum after:\n\n$$\\sum \\vec{p}_i = \\sum \\vec{p}_f$$\n\nFor two objects:\n$$m_1 v_{1i} + m_2 v_{2i} = m_1 v_{1f} + m_2 v_{2f}$$\n\nThis holds for **all** types of collisions and explosions.",
          keyTakeaway:
            "Total momentum is always conserved when no external net force acts. Works for collisions, explosions, and recoil.",
          order: 6,
        },
        {
          id: "phys-4-diagram-collision",
          type: "diagram",
          title: "Types of Collisions",
          content:
            "**Elastic**: Both momentum and kinetic energy are conserved (bouncy). **Inelastic**: Momentum is conserved but KE is not. **Perfectly inelastic**: Objects stick together after collision.",
          imageComponent: "CollisionTypesDiagram",
          order: 7,
        },
        {
          id: "phys-4-ex-2",
          type: "example",
          title: "Example — Perfectly Inelastic Collision",
          content:
            "A $2\\text{ kg}$ ball moving at $3\\text{ m/s}$ collides with and sticks to a $1\\text{ kg}$ ball at rest. Find the final velocity.",
          steps: [
            "Use conservation of momentum: $m_1 v_1 + m_2 v_2 = (m_1 + m_2)v_f$",
            "$(2)(3) + (1)(0) = (2 + 1)v_f$",
            "$6 = 3v_f$",
            "$v_f = 2\\text{ m/s}$",
          ],
          order: 8,
        },
        {
          id: "phys-4-ex-3",
          type: "example",
          title: "Example — Recoil",
          content:
            "A $50\\text{ kg}$ astronaut at rest throws a $0.5\\text{ kg}$ wrench at $10\\text{ m/s}$. What is the astronaut's recoil velocity?",
          steps: [
            "Initial total momentum = 0 (both at rest).",
            "By conservation: $0 = m_a v_a + m_w v_w$",
            "$0 = (50)v_a + (0.5)(10)$",
            "$v_a = \\frac{-5}{50} = -0.1\\text{ m/s}$ (opposite direction to wrench)",
          ],
          order: 9,
        },
        // --- Practice ---
        {
          id: "phys-4-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "What is the momentum of a $70\\text{ kg}$ runner moving at $8\\text{ m/s}$?",
          order: 10,
          problem: {
            id: "phys-4-p1-q",
            choices: [
              { id: "a", text: "560 kg·m/s" },
              { id: "b", text: "8.75 kg·m/s" },
              { id: "c", text: "78 kg·m/s" },
              { id: "d", text: "280 kg·m/s" },
            ],
            correctAnswerId: "a",
            solution:
              "$p = mv = (70)(8) = 560\\text{ kg·m/s}$.",
            difficulty: "easy",
          },
        },
        {
          id: "phys-4-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "A $0.4\\text{ kg}$ ball hits a wall at $15\\text{ m/s}$ and bounces back at $10\\text{ m/s}$. What is the impulse on the ball?",
          order: 11,
          problem: {
            id: "phys-4-p2-q",
            choices: [
              { id: "a", text: "−10 kg·m/s" },
              { id: "b", text: "−2 kg·m/s" },
              { id: "c", text: "10 kg·m/s" },
              { id: "d", text: "2 kg·m/s" },
            ],
            correctAnswerId: "a",
            solution:
              "Taking initial direction as positive: $J = m v_f - m v_i = (0.4)(-10) - (0.4)(15) = -4 - 6 = -10\\text{ kg·m/s}$.",
            difficulty: "medium",
          },
        },
        {
          id: "phys-4-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "Two $3\\text{ kg}$ carts collide and stick together. Cart A was moving at $4\\text{ m/s}$ (right) and Cart B at $-2\\text{ m/s}$ (left). Find the final velocity.",
          order: 12,
          problem: {
            id: "phys-4-p3-q",
            choices: [
              { id: "a", text: "1 m/s" },
              { id: "b", text: "2 m/s" },
              { id: "c", text: "3 m/s" },
              { id: "d", text: "0 m/s" },
            ],
            correctAnswerId: "a",
            solution:
              "$m_1 v_1 + m_2 v_2 = (m_1 + m_2)v_f \\Rightarrow (3)(4) + (3)(-2) = 6v_f \\Rightarrow 12 - 6 = 6v_f \\Rightarrow v_f = 1\\text{ m/s}$ (right).",
            difficulty: "medium",
          },
        },
        {
          id: "phys-4-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "A $5\\text{ kg}$ rifle fires a $0.01\\text{ kg}$ bullet at $500\\text{ m/s}$. What is the recoil speed of the rifle?",
          order: 13,
          problem: {
            id: "phys-4-p4-q",
            choices: [
              { id: "a", text: "1.0 m/s" },
              { id: "b", text: "5.0 m/s" },
              { id: "c", text: "0.1 m/s" },
              { id: "d", text: "50 m/s" },
            ],
            correctAnswerId: "a",
            solution:
              "$0 = m_r v_r + m_b v_b \\Rightarrow v_r = -\\frac{m_b v_b}{m_r} = -\\frac{(0.01)(500)}{5} = -1.0\\text{ m/s}$. Speed = $1.0\\text{ m/s}$.",
            difficulty: "easy",
          },
        },
      ],
    },

    // ================================================
    // LESSON 5 — Rotational Motion & Torque
    // ================================================
    {
      id: "phys-5",
      title: "Lesson 5",
      subtitle: "Rotational Motion & Torque",
      order: 5,
      sections: [
        {
          id: "phys-5-intro",
          type: "note",
          title: "What You'll Learn",
          content:
            "This lesson extends the ideas of kinematics and Newton's laws to rotation — angular displacement, angular velocity, angular acceleration, torque, and rotational equilibrium.",
          order: 0,
        },
        // --- Angular quantities ---
        {
          id: "phys-5-def-angular",
          type: "definition",
          title: "Angular Displacement, Velocity & Acceleration",
          content:
            "**Angular displacement** ($\\theta$) is measured in **radians** (rad). One full revolution $= 2\\pi$ rad $= 360°$.\n\n**Angular velocity** ($\\omega$) is the rate of change of angular displacement:\n$$\\omega = \\frac{\\Delta\\theta}{\\Delta t}$$\nSI unit: rad/s.\n\n**Angular acceleration** ($\\alpha$) is the rate of change of angular velocity:\n$$\\alpha = \\frac{\\Delta\\omega}{\\Delta t}$$\nSI unit: rad/s².",
          order: 1,
        },
        {
          id: "phys-5-thm-rotkin",
          type: "theorem",
          title: "Rotational Kinematic Equations",
          content:
            "The rotational kinematic equations mirror the linear ones, with $\\theta \\leftrightarrow x$, $\\omega \\leftrightarrow v$, $\\alpha \\leftrightarrow a$:\n\n$$\\omega = \\omega_0 + \\alpha t$$\n$$\\theta = \\omega_0 t + \\tfrac{1}{2}\\alpha t^2$$\n$$\\omega^2 = \\omega_0^2 + 2\\alpha\\theta$$\n$$\\theta = \\tfrac{1}{2}(\\omega_0 + \\omega)t$$",
          keyTakeaway:
            "Same four equations as linear kinematics — just swap x→θ, v→ω, a→α.",
          order: 2,
        },
        {
          id: "phys-5-def-linear-angular",
          type: "definition",
          title: "Relating Linear and Angular Quantities",
          content:
            "For a point at distance $r$ from the axis of rotation:\n\n$$s = r\\theta \\quad \\text{(arc length)}$$\n$$v = r\\omega \\quad \\text{(tangential velocity)}$$\n$$a_t = r\\alpha \\quad \\text{(tangential acceleration)}$$\n\n**Centripetal acceleration** always points toward the center:\n$$a_c = \\frac{v^2}{r} = r\\omega^2$$",
          order: 3,
        },
        {
          id: "phys-5-diagram-rotation",
          type: "diagram",
          title: "Rotational Variables",
          content:
            "A wheel rotates about its axis. Each point on the rim has the same angular velocity $\\omega$ but different tangential velocities $v = r\\omega$ depending on the distance from the center.",
          imageComponent: "RotationalMotionDiagram",
          order: 4,
        },
        {
          id: "phys-5-ex-1",
          type: "example",
          title: "Example — Spinning Wheel",
          content:
            "A wheel starts from rest and accelerates at $2.0\\text{ rad/s}^2$ for $5.0\\text{ s}$. Find the final angular velocity and the number of revolutions.",
          steps: [
            "$\\omega = \\omega_0 + \\alpha t = 0 + (2.0)(5.0) = 10\\text{ rad/s}$",
            "$\\theta = \\omega_0 t + \\frac{1}{2}\\alpha t^2 = 0 + \\frac{1}{2}(2.0)(25) = 25\\text{ rad}$",
            "Revolutions: $\\frac{25}{2\\pi} \\approx 3.98 \\approx 4.0$ revolutions",
          ],
          order: 5,
        },
        // --- Torque ---
        {
          id: "phys-5-def-torque",
          type: "definition",
          title: "Torque",
          content:
            "**Torque** ($\\tau$) is the rotational equivalent of force. It measures the tendency of a force to cause rotation about an axis:\n\n$$\\tau = rF\\sin\\theta$$\n\nwhere $r$ is the distance from the axis to the point where the force is applied, $F$ is the force, and $\\theta$ is the angle between $\\vec{r}$ and $\\vec{F}$.\n\nSI unit: $\\text{N} \\cdot \\text{m}$ (not joules — torque is not energy).\n\nConvention: counterclockwise torques are **positive**, clockwise torques are **negative**.",
          order: 6,
        },
        {
          id: "phys-5-diagram-torque",
          type: "diagram",
          title: "Torque on a Door",
          content:
            "Pushing farther from the hinge (larger $r$) or pushing perpendicular to the door (maximizing $\\sin\\theta$) creates the greatest torque. Pushing at the hinge produces zero torque.",
          imageComponent: "TorqueDiagram",
          order: 7,
        },
        {
          id: "phys-5-thm-newton-rot",
          type: "theorem",
          title: "Newton's Second Law for Rotation",
          content:
            "The angular acceleration of an object is proportional to the net torque and inversely proportional to the **moment of inertia** ($I$):\n\n$$\\sum\\tau = I\\alpha$$\n\nThis is the rotational analog of $F = ma$. The **moment of inertia** depends on the mass distribution:\n- Point mass: $I = mr^2$\n- Solid disk/cylinder: $I = \\frac{1}{2}mr^2$\n- Solid sphere: $I = \\frac{2}{5}mr^2$\n- Thin rod (center): $I = \\frac{1}{12}mL^2$",
          keyTakeaway:
            "τ = Iα is the rotational F = ma. Moment of inertia is 'rotational mass' — it depends on how mass is distributed.",
          order: 8,
        },
        {
          id: "phys-5-ex-2",
          type: "example",
          title: "Example — Torque on a Bolt",
          content:
            "A mechanic applies a force of $200\\text{ N}$ at the end of a $0.30\\text{ m}$ wrench, perpendicular to the handle. What is the torque?",
          steps: [
            "$\\tau = rF\\sin\\theta = (0.30)(200)\\sin 90°$",
            "$\\tau = 60 \\times 1 = 60\\text{ N·m}$",
          ],
          order: 9,
        },
        // --- Rotational Equilibrium ---
        {
          id: "phys-5-thm-equilibrium",
          type: "theorem",
          title: "Rotational Equilibrium",
          content:
            "An object is in **rotational equilibrium** when the net torque about any point is zero:\n\n$$\\sum\\tau = 0$$\n\nCombined with translational equilibrium ($\\sum F = 0$), this gives the conditions for **static equilibrium** — the object is at rest and remains at rest.",
          keyTakeaway:
            "For an object to be completely in equilibrium: ΣF = 0 AND Στ = 0.",
          order: 10,
        },
        {
          id: "phys-5-ex-3",
          type: "example",
          title: "Example — Balanced Seesaw",
          content:
            "A $30\\text{ kg}$ child sits $2.0\\text{ m}$ from the pivot of a seesaw. Where should a $20\\text{ kg}$ child sit to balance?",
          steps: [
            "For balance: $\\sum\\tau = 0$ about the pivot.",
            "$\\tau_1 = \\tau_2 \\Rightarrow m_1 g r_1 = m_2 g r_2$",
            "The $g$ cancels: $m_1 r_1 = m_2 r_2$",
            "$(30)(2.0) = (20)(r_2)$",
            "$r_2 = 3.0\\text{ m}$",
          ],
          order: 11,
        },
        // --- Practice ---
        {
          id: "phys-5-p1",
          type: "practice",
          title: "Practice 1",
          content:
            "Convert $3.0$ revolutions to radians.",
          order: 12,
          problem: {
            id: "phys-5-p1-q",
            choices: [
              { id: "a", text: "6π rad ≈ 18.8 rad" },
              { id: "b", text: "3π rad" },
              { id: "c", text: "9.42 rad" },
              { id: "d", text: "360 rad" },
            ],
            correctAnswerId: "a",
            solution:
              "$3.0 \\times 2\\pi = 6\\pi \\approx 18.85\\text{ rad}$.",
            difficulty: "easy",
          },
        },
        {
          id: "phys-5-p2",
          type: "practice",
          title: "Practice 2",
          content:
            "A force of $50\\text{ N}$ is applied at the end of a $0.80\\text{ m}$ wrench at $60°$ to the handle. What torque is produced?",
          order: 13,
          problem: {
            id: "phys-5-p2-q",
            choices: [
              { id: "a", text: "34.6 N·m" },
              { id: "b", text: "40 N·m" },
              { id: "c", text: "20 N·m" },
              { id: "d", text: "25 N·m" },
            ],
            correctAnswerId: "a",
            solution:
              "$\\tau = rF\\sin\\theta = (0.80)(50)\\sin 60° = 40(0.866) = 34.6\\text{ N·m}$.",
            difficulty: "medium",
          },
        },
        {
          id: "phys-5-p3",
          type: "practice",
          title: "Practice 3",
          content:
            "A solid disk ($m = 4\\text{ kg}$, $r = 0.5\\text{ m}$) has a net torque of $10\\text{ N·m}$ applied. What is its angular acceleration?",
          order: 14,
          problem: {
            id: "phys-5-p3-q",
            choices: [
              { id: "a", text: "20 rad/s²" },
              { id: "b", text: "10 rad/s²" },
              { id: "c", text: "5 rad/s²" },
              { id: "d", text: "40 rad/s²" },
            ],
            correctAnswerId: "a",
            solution:
              "$I = \\frac{1}{2}mr^2 = \\frac{1}{2}(4)(0.5)^2 = 0.5\\text{ kg·m}^2$.\n$\\alpha = \\frac{\\tau}{I} = \\frac{10}{0.5} = 20\\text{ rad/s}^2$.",
            difficulty: "medium",
          },
        },
        {
          id: "phys-5-p4",
          type: "practice",
          title: "Practice 4",
          content:
            "A wheel rotating at $12\\text{ rad/s}$ decelerates uniformly at $-3\\text{ rad/s}^2$. How many radians does it turn before stopping?",
          order: 15,
          problem: {
            id: "phys-5-p4-q",
            choices: [
              { id: "a", text: "24 rad" },
              { id: "b", text: "48 rad" },
              { id: "c", text: "12 rad" },
              { id: "d", text: "36 rad" },
            ],
            correctAnswerId: "a",
            solution:
              "$\\omega^2 = \\omega_0^2 + 2\\alpha\\theta \\Rightarrow 0 = 144 + 2(-3)\\theta \\Rightarrow 6\\theta = 144 \\Rightarrow \\theta = 24\\text{ rad}$.",
            difficulty: "medium",
          },
        },
      ],
    },
  ],
};
