"use client"

interface DiagramProps {
  className?: string;
}

/** Lesson 10.4 — Inscribed Angle Theorem: angle = ½ intercepted arc */
export function InscribedAngleDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label="Inscribed angle intercepting an arc in a circle">
      <defs>
        <marker id="arrowhead-ia" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--accent-color)" />
        </marker>
      </defs>
      {/* Circle */}
      <circle cx="150" cy="150" r="120" fill="none" stroke="var(--foreground)" strokeWidth="2" opacity="0.7" />
      {/* Center dot */}
      <circle cx="150" cy="150" r="3" fill="var(--muted-foreground)" />
      <text x="157" y="146" fontSize="12" fill="var(--muted-foreground)" fontFamily="sans-serif">O</text>

      {/* Points A, B, C on circle */}
      {/* A at top-left */}
      <circle cx="62" cy="87" r="4" fill="var(--accent-color)" />
      <text x="42" y="82" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">A</text>
      {/* B at bottom */}
      <circle cx="150" cy="270" r="4" fill="var(--accent-color)" />
      <text x="155" y="290" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">B</text>
      {/* C at top-right */}
      <circle cx="252" cy="100" r="4" fill="var(--accent-color)" />
      <text x="260" y="97" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">C</text>

      {/* Inscribed angle sides: BA and BC */}
      <line x1="150" y1="270" x2="62" y2="87" stroke="var(--foreground)" strokeWidth="1.5" />
      <line x1="150" y1="270" x2="252" y2="100" stroke="var(--foreground)" strokeWidth="1.5" />

      {/* Angle arc at B */}
      <path d="M 141,252 A 20,20 0 0,1 160,253" fill="none" stroke="var(--primary)" strokeWidth="1.5" />

      {/* Intercepted arc AC — highlight */}
      <path
        d="M 62,87 A 120,120 0 0,1 252,100"
        fill="none"
        stroke="var(--accent-color)"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Labels */}
      <text x="145" y="58" fontSize="12" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif" textAnchor="middle">
        arc AC
      </text>
      <text x="120" y="258" fontSize="11" fill="var(--primary)" fontFamily="sans-serif">∠B</text>
    </svg>
  );
}

/** Lesson 10.4 — Inscribed Quadrilateral: opposite angles supplementary */
export function InscribedQuadrilateralDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label="Quadrilateral inscribed in a circle with opposite angles marked">
      <circle cx="150" cy="150" r="120" fill="none" stroke="var(--foreground)" strokeWidth="2" opacity="0.7" />
      {/* Quadrilateral vertices on circle */}
      {/* A top */}
      <circle cx="120" cy="33" r="4" fill="var(--accent-color)" />
      <text x="108" y="24" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">A</text>
      {/* B right */}
      <circle cx="265" cy="170" r="4" fill="var(--accent-color)" />
      <text x="272" y="175" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">B</text>
      {/* C bottom */}
      <circle cx="140" cy="269" r="4" fill="var(--accent-color)" />
      <text x="133" y="290" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">C</text>
      {/* D left */}
      <circle cx="33" cy="130" r="4" fill="var(--accent-color)" />
      <text x="14" y="126" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">D</text>

      {/* Quad sides */}
      <polygon
        points="120,33 265,170 140,269 33,130"
        fill="var(--accent-color)"
        fillOpacity="0.06"
        stroke="var(--foreground)"
        strokeWidth="1.5"
      />

      {/* Angle arcs — A and C (opposite) */}
      <path d="M 110,50 A 14,14 0 0,1 130,48" fill="none" stroke="var(--primary)" strokeWidth="2" />
      <path d="M 130,254 A 14,14 0 0,1 148,257" fill="none" stroke="var(--primary)" strokeWidth="2" />

      {/* Labels */}
      <text x="100" y="62" fontSize="10" fill="var(--primary)" fontFamily="sans-serif">α</text>
      <text x="150" y="254" fontSize="10" fill="var(--primary)" fontFamily="sans-serif">β</text>
      <text x="90" y="160" fontSize="11" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">α + β = 180°</text>
    </svg>
  );
}

/** Lesson 10.5 — Tangent-Chord Angle */
export function TangentChordDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label="Tangent line meeting a chord at the point of tangency">
      <circle cx="150" cy="140" r="110" fill="none" stroke="var(--foreground)" strokeWidth="2" opacity="0.7" />
      {/* Tangent point B at bottom of circle */}
      <circle cx="150" cy="250" r="4" fill="var(--accent-color)" />
      <text x="155" y="268" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">B</text>

      {/* Tangent line — horizontal through B */}
      <line x1="20" y1="250" x2="280" y2="250" stroke="var(--foreground)" strokeWidth="1.5" strokeDasharray="6,3" />
      <text x="265" y="242" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif">tangent</text>

      {/* Chord from B to A (upper-left on circle) */}
      <circle cx="62" cy="82" r="4" fill="var(--accent-color)" />
      <text x="44" y="76" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">A</text>
      <line x1="150" y1="250" x2="62" y2="82" stroke="var(--foreground)" strokeWidth="1.8" />

      {/* Intercepted arc AB */}
      <path
        d="M 62,82 A 110,110 0 0,0 150,250"
        fill="none"
        stroke="var(--accent-color)"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Angle arc at B between tangent and chord */}
      <path d="M 170,250 A 20,20 0 0,0 157,233" fill="none" stroke="var(--primary)" strokeWidth="2" />
      <text x="175" y="240" fontSize="10" fill="var(--primary)" fontFamily="sans-serif">θ</text>

      {/* Formula */}
      <text x="150" y="22" fontSize="11" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">
        θ = ½ · arc AB
      </text>
    </svg>
  );
}

/** Lesson 10.5 — Two Chords Intersecting Inside Circle */
export function ChordsInsideDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label="Two chords intersecting inside a circle">
      <circle cx="150" cy="150" r="120" fill="none" stroke="var(--foreground)" strokeWidth="2" opacity="0.7" />

      {/* Chord 1: A to C */}
      <circle cx="42" cy="100" r="4" fill="var(--accent-color)" />
      <text x="22" y="98" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">A</text>
      <circle cx="268" cy="120" r="4" fill="var(--accent-color)" />
      <text x="274" y="118" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">C</text>
      <line x1="42" y1="100" x2="268" y2="120" stroke="var(--foreground)" strokeWidth="1.5" />

      {/* Chord 2: B to D */}
      <circle cx="100" cy="264" r="4" fill="var(--accent-color)" />
      <text x="88" y="284" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">B</text>
      <circle cx="220" cy="42" r="4" fill="var(--accent-color)" />
      <text x="226" y="36" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">D</text>
      <line x1="100" y1="264" x2="220" y2="42" stroke="var(--foreground)" strokeWidth="1.5" />

      {/* Intersection point E */}
      <circle cx="155" cy="112" r="4" fill="var(--primary)" />
      <text x="161" y="106" fontSize="13" fill="var(--primary)" fontWeight="600" fontFamily="sans-serif">E</text>

      {/* Angle arc at E */}
      <path d="M 170,107 A 16,16 0 0,0 160,95" fill="none" stroke="var(--primary)" strokeWidth="2" />
      <text x="175" y="96" fontSize="10" fill="var(--primary)" fontFamily="sans-serif">θ</text>

      {/* Intercepted arcs highlight */}
      <path d="M 220,42 A 120,120 0 0,1 268,120" fill="none" stroke="var(--accent-color)" strokeWidth="3" opacity="0.6" />
      <path d="M 42,100 A 120,120 0 0,1 100,264" fill="none" stroke="var(--primary)" strokeWidth="3" opacity="0.4" />

      <text x="150" y="290" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">
        θ = ½(arc AC + arc BD)
      </text>
    </svg>
  );
}

/** Lesson 10.5 — Two Secants from External Point */
export function SecantsExternalDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 340 300" className={className} role="img" aria-label="Two secants from an external point">
      <circle cx="180" cy="150" r="110" fill="none" stroke="var(--foreground)" strokeWidth="2" opacity="0.7" />

      {/* External point E */}
      <circle cx="30" cy="150" r="4" fill="var(--primary)" />
      <text x="12" y="148" fontSize="13" fill="var(--primary)" fontWeight="600" fontFamily="sans-serif">E</text>

      {/* Secant 1: E through A,B */}
      <circle cx="85" cy="93" r="4" fill="var(--accent-color)" />
      <text x="75" y="82" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">A</text>
      <circle cx="270" cy="68" r="4" fill="var(--accent-color)" />
      <text x="277" y="64" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">B</text>
      <line x1="30" y1="150" x2="270" y2="68" stroke="var(--foreground)" strokeWidth="1.3" />

      {/* Secant 2: E through C,D */}
      <circle cx="85" cy="207" r="4" fill="var(--accent-color)" />
      <text x="75" y="222" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">C</text>
      <circle cx="270" cy="232" r="4" fill="var(--accent-color)" />
      <text x="277" y="240" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">D</text>
      <line x1="30" y1="150" x2="270" y2="232" stroke="var(--foreground)" strokeWidth="1.3" />

      {/* Angle at E */}
      <path d="M 50,140 A 20,20 0 0,0 50,160" fill="none" stroke="var(--primary)" strokeWidth="2" />
      <text x="56" y="154" fontSize="10" fill="var(--primary)" fontFamily="sans-serif">θ</text>

      {/* Arc highlights */}
      <path d="M 270,68 A 110,110 0 0,1 270,232" fill="none" stroke="var(--accent-color)" strokeWidth="3" opacity="0.6" />
      <path d="M 85,93 A 110,110 0 0,0 85,207" fill="none" stroke="var(--primary)" strokeWidth="2.5" opacity="0.4" />

      <text x="170" y="290" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">
        θ = ½(arc BD − arc AC)
      </text>
    </svg>
  );
}

/** Lesson 10.6 — Chord Segments: EA·EB = EC·ED */
export function ChordSegmentsDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label="Two chords intersecting inside a circle showing segment products">
      <circle cx="150" cy="150" r="120" fill="none" stroke="var(--foreground)" strokeWidth="2" opacity="0.7" />

      {/* Chord 1: A—B */}
      <circle cx="37" cy="110" r="4" fill="var(--accent-color)" />
      <text x="18" y="106" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">A</text>
      <circle cx="262" cy="82" r="4" fill="var(--accent-color)" />
      <text x="268" y="78" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">B</text>
      <line x1="37" y1="110" x2="262" y2="82" stroke="var(--foreground)" strokeWidth="1.5" />

      {/* Chord 2: C—D */}
      <circle cx="80" cy="258" r="4" fill="var(--accent-color)" />
      <text x="64" y="270" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">C</text>
      <circle cx="210" cy="38" r="4" fill="var(--accent-color)" />
      <text x="216" y="32" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">D</text>
      <line x1="80" y1="258" x2="210" y2="38" stroke="var(--foreground)" strokeWidth="1.5" />

      {/* Intersection point E */}
      <circle cx="150" cy="95" r="5" fill="var(--primary)" />
      <text x="156" y="88" fontSize="13" fill="var(--primary)" fontWeight="600" fontFamily="sans-serif">E</text>

      {/* Segment length labels */}
      <text x="86" y="95" fontSize="11" fill="var(--primary)" fontFamily="sans-serif" fontWeight="500">a</text>
      <text x="205" y="85" fontSize="11" fill="var(--primary)" fontFamily="sans-serif" fontWeight="500">b</text>
      <text x="118" y="180" fontSize="11" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="500">c</text>
      <text x="176" y="62" fontSize="11" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="500">d</text>

      <text x="150" y="288" fontSize="12" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">
        a · b = c · d
      </text>
    </svg>
  );
}

/** Lesson 10.6 — Secant-Tangent: tangent² = external·whole */
export function SecantTangentDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 340 300" className={className} role="img" aria-label="Secant and tangent from external point">
      <circle cx="190" cy="150" r="110" fill="none" stroke="var(--foreground)" strokeWidth="2" opacity="0.7" />

      {/* External point E */}
      <circle cx="35" cy="190" r="4" fill="var(--primary)" />
      <text x="15" y="194" fontSize="13" fill="var(--primary)" fontWeight="600" fontFamily="sans-serif">E</text>

      {/* Tangent from E to T */}
      <circle cx="96" cy="96" r="4" fill="var(--accent-color)" />
      <text x="80" y="88" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">T</text>
      <line x1="35" y1="190" x2="96" y2="96" stroke="var(--accent-color)" strokeWidth="2" />

      {/* Small square at tangent point */}
      <rect x="94" y="97" width="8" height="8" fill="none" stroke="var(--muted-foreground)" strokeWidth="1" transform="rotate(-25,96,96)" />

      {/* Secant from E through A,B */}
      <circle cx="95" cy="212" r="4" fill="var(--accent-color)" />
      <text x="78" y="225" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">A</text>
      <circle cx="290" cy="196" r="4" fill="var(--accent-color)" />
      <text x="296" y="200" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">B</text>
      <line x1="35" y1="190" x2="290" y2="196" stroke="var(--foreground)" strokeWidth="1.3" />

      {/* Labels */}
      <text x="55" y="145" fontSize="11" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="500">t</text>
      <text x="58" y="205" fontSize="11" fill="var(--primary)" fontFamily="sans-serif" fontWeight="500">a</text>
      <text x="190" y="208" fontSize="11" fill="var(--primary)" fontFamily="sans-serif" fontWeight="500">b</text>

      <text x="170" y="288" fontSize="12" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">
        t² = a · (a + b)
      </text>
    </svg>
  );
}

/** Lesson 10.7 — Circle in Coordinate Plane */
export function CircleCoordinateDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label="Circle on coordinate plane with center (h,k) and radius r">
      {/* Grid lines */}
      {[50, 100, 150, 200, 250].map((v) => (
        <g key={v}>
          <line x1={v} y1="20" x2={v} y2="280" stroke="var(--foreground)" strokeWidth="0.3" opacity="0.2" />
          <line x1="20" y1={v} x2="280" y2={v} stroke="var(--foreground)" strokeWidth="0.3" opacity="0.2" />
        </g>
      ))}

      {/* Axes */}
      <line x1="150" y1="20" x2="150" y2="280" stroke="var(--foreground)" strokeWidth="1.2" opacity="0.5" />
      <line x1="20" y1="150" x2="280" y2="150" stroke="var(--foreground)" strokeWidth="1.2" opacity="0.5" />
      <text x="283" y="147" fontSize="11" fill="var(--foreground)" fontFamily="sans-serif" opacity="0.6">x</text>
      <text x="153" y="18" fontSize="11" fill="var(--foreground)" fontFamily="sans-serif" opacity="0.6">y</text>

      {/* Circle at (h,k) = (190, 110) in SVG coords  ≈ (2, 2) in math coords */}
      <circle cx="190" cy="110" r="70" fill="var(--accent-color)" fillOpacity="0.06" stroke="var(--accent-color)" strokeWidth="2.5" />

      {/* Center point */}
      <circle cx="190" cy="110" r="4" fill="var(--primary)" />
      <text x="196" y="105" fontSize="12" fill="var(--primary)" fontWeight="600" fontFamily="sans-serif">(h, k)</text>

      {/* Radius line */}
      <line x1="190" y1="110" x2="260" y2="110" stroke="var(--primary)" strokeWidth="1.8" strokeDasharray="5,3" />
      <text x="220" y="103" fontSize="11" fill="var(--primary)" fontWeight="600" fontFamily="sans-serif">r</text>

      {/* Point on circle */}
      <circle cx="260" cy="110" r="3.5" fill="var(--accent-color)" />
      <text x="263" y="103" fontSize="11" fill="var(--accent-color)" fontWeight="500" fontFamily="sans-serif">(x, y)</text>

      <text x="150" y="296" fontSize="11" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">
        (x − h)² + (y − k)² = r²
      </text>
    </svg>
  );
}

/** Lesson 10.8 — Arc Length and Sector Area */
export function ArcLengthSectorDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label="Circle sector showing arc length and sector area">
      {/* Full circle (faded) */}
      <circle cx="150" cy="160" r="110" fill="none" stroke="var(--foreground)" strokeWidth="1.5" opacity="0.25" />

      {/* Sector fill */}
      <path
        d="M 150,160 L 260,160 A 110,110 0 0,0 205,65 Z"
        fill="var(--accent-color)"
        fillOpacity="0.12"
        stroke="none"
      />

      {/* Sector boundary lines (radii) */}
      <line x1="150" y1="160" x2="260" y2="160" stroke="var(--foreground)" strokeWidth="1.8" />
      <line x1="150" y1="160" x2="205" y2="65" stroke="var(--foreground)" strokeWidth="1.8" />

      {/* Arc — the emphasized part */}
      <path
        d="M 260,160 A 110,110 0 0,0 205,65"
        fill="none"
        stroke="var(--accent-color)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Center */}
      <circle cx="150" cy="160" r="3.5" fill="var(--primary)" />
      <text x="135" y="158" fontSize="12" fill="var(--primary)" fontFamily="sans-serif" fontWeight="600">O</text>

      {/* Radius label */}
      <text x="198" y="175" fontSize="12" fill="var(--foreground)" fontFamily="sans-serif" opacity="0.7">r</text>

      {/* Angle arc at center */}
      <path d="M 175,160 A 25,25 0 0,0 170,147" fill="none" stroke="var(--primary)" strokeWidth="1.8" />
      <text x="179" y="148" fontSize="11" fill="var(--primary)" fontFamily="sans-serif" fontWeight="500">θ</text>

      {/* Arc length label */}
      <text x="248" y="105" fontSize="12" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">L</text>

      {/* Sector area label */}
      <text x="195" y="130" fontSize="11" fill="var(--muted-foreground)" fontFamily="sans-serif" fontStyle="italic">A</text>

      {/* Formulas */}
      <text x="150" y="20" fontSize="11" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">
        L = (θ/360)·2πr    A = (θ/360)·πr²
      </text>
    </svg>
  );
}

/** Lesson 10.4 — Semicircle Inscribed Angle (right angle) */
export function SemicircleAngleDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 260" className={className} role="img" aria-label="Inscribed angle in a semicircle forming a right angle">
      <circle cx="150" cy="150" r="100" fill="none" stroke="var(--foreground)" strokeWidth="2" opacity="0.7" />

      {/* Diameter AB */}
      <line x1="50" y1="150" x2="250" y2="150" stroke="var(--foreground)" strokeWidth="2" />
      <circle cx="50" cy="150" r="4" fill="var(--accent-color)" />
      <text x="32" y="152" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">A</text>
      <circle cx="250" cy="150" r="4" fill="var(--accent-color)" />
      <text x="258" y="152" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">B</text>

      {/* Point C on circle (top) */}
      <circle cx="180" cy="54" r="4" fill="var(--accent-color)" />
      <text x="186" y="48" fontSize="13" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">C</text>

      {/* Lines CA and CB */}
      <line x1="50" y1="150" x2="180" y2="54" stroke="var(--foreground)" strokeWidth="1.5" />
      <line x1="250" y1="150" x2="180" y2="54" stroke="var(--foreground)" strokeWidth="1.5" />

      {/* Right angle indicator at C */}
      <rect x="172" y="56" width="10" height="10" fill="none" stroke="var(--primary)" strokeWidth="1.5" transform="rotate(-25,180,54)" />

      {/* Label */}
      <text x="150" y="246" fontSize="11" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">
        ∠C = 90° (semicircle)
      </text>
    </svg>
  );
}

/** Lesson 10.6 — Two Secants from External Point (segments) */
export function SecantSegmentsDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 340 300" className={className} role="img" aria-label="Two secants from external point showing segment products">
      <circle cx="200" cy="150" r="100" fill="none" stroke="var(--foreground)" strokeWidth="2" opacity="0.7" />

      {/* External point */}
      <circle cx="45" cy="150" r="4" fill="var(--primary)" />
      <text x="25" y="154" fontSize="13" fill="var(--primary)" fontWeight="600" fontFamily="sans-serif">E</text>

      {/* Secant 1: E→A→B */}
      <circle cx="114" cy="96" r="3.5" fill="var(--accent-color)" />
      <text x="102" y="86" fontSize="12" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">A</text>
      <circle cx="286" cy="102" r="3.5" fill="var(--accent-color)" />
      <text x="292" y="100" fontSize="12" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">B</text>
      <line x1="45" y1="150" x2="286" y2="102" stroke="var(--foreground)" strokeWidth="1.3" />

      {/* Secant 2: E→C→D */}
      <circle cx="114" cy="204" r="3.5" fill="var(--accent-color)" />
      <text x="102" y="220" fontSize="12" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">C</text>
      <circle cx="286" cy="198" r="3.5" fill="var(--accent-color)" />
      <text x="292" y="205" fontSize="12" fill="var(--accent-color)" fontWeight="600" fontFamily="sans-serif">D</text>
      <line x1="45" y1="150" x2="286" y2="198" stroke="var(--foreground)" strokeWidth="1.3" />

      {/* Segment labels */}
      <text x="74" y="120" fontSize="10" fill="var(--primary)" fontFamily="sans-serif" fontWeight="600">EA</text>
      <text x="194" y="93" fontSize="10" fill="var(--primary)" fontFamily="sans-serif" fontWeight="600">EB</text>
      <text x="74" y="182" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">EC</text>
      <text x="194" y="208" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">ED</text>

      <text x="170" y="288" fontSize="12" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">
        EA · EB = EC · ED
      </text>
    </svg>
  );
}
