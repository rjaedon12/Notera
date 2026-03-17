"use client"

interface DiagramProps {
  className?: string;
}

/** Lesson 1 — Position vs. Time graph showing velocity as slope */
export function PositionTimeDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 260" className={className} role="img" aria-label="Position vs time graph showing slope equals velocity">
      {/* Axes */}
      <line x1="40" y1="220" x2="280" y2="220" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="40" y1="220" x2="40" y2="20" stroke="var(--foreground)" strokeWidth="2" />
      {/* Axis labels */}
      <text x="160" y="250" fontSize="13" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">t (s)</text>
      <text x="16" y="120" fontSize="13" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600" transform="rotate(-90,16,120)">x (m)</text>
      {/* Grid lines */}
      {[60, 100, 140, 180, 220].map((y, i) => (
        <line key={`gy${i}`} x1="40" y1={y} x2="280" y2={y} stroke="var(--foreground)" strokeWidth="0.3" opacity="0.3" />
      ))}
      {[80, 120, 160, 200, 240].map((x, i) => (
        <line key={`gx${i}`} x1={x} y1="220" x2={x} y2="20" stroke="var(--foreground)" strokeWidth="0.3" opacity="0.3" />
      ))}
      {/* Line A — fast (steep) */}
      <line x1="40" y1="200" x2="160" y2="50" stroke="var(--accent-color)" strokeWidth="2.5" strokeLinecap="round" />
      <text x="90" y="100" fontSize="11" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">fast (steep)</text>
      {/* Line B — slow (shallow) */}
      <line x1="40" y1="200" x2="260" y2="140" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
      <text x="180" y="155" fontSize="11" fill="var(--primary)" fontFamily="sans-serif" fontWeight="600">slow (shallow)</text>
      {/* Line C — at rest (horizontal) */}
      <line x1="40" y1="180" x2="260" y2="180" stroke="var(--muted-foreground)" strokeWidth="2" strokeDasharray="6,4" />
      <text x="180" y="195" fontSize="11" fill="var(--muted-foreground)" fontFamily="sans-serif">at rest</text>
      {/* Slope annotation */}
      <text x="160" y="16" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle">slope = velocity</text>
    </svg>
  );
}

/** Lesson 1 — Velocity vs. Time graph: slope = accel, area = displacement */
export function VelocityTimeDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 260" className={className} role="img" aria-label="Velocity vs time graph showing area equals displacement">
      {/* Axes */}
      <line x1="40" y1="220" x2="280" y2="220" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="40" y1="220" x2="40" y2="20" stroke="var(--foreground)" strokeWidth="2" />
      <text x="160" y="250" fontSize="13" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">t (s)</text>
      <text x="16" y="120" fontSize="13" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600" transform="rotate(-90,16,120)">v (m/s)</text>
      {/* Accelerating line */}
      <line x1="40" y1="200" x2="240" y2="60" stroke="var(--accent-color)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Shaded area under the line (displacement) */}
      <polygon points="40,200 240,60 240,220 40,220" fill="var(--accent-color)" fillOpacity="0.1" />
      {/* Area label */}
      <text x="140" y="180" fontSize="11" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">Area = Δx</text>
      {/* Slope annotation */}
      <line x1="100" y1="172" x2="160" y2="172" stroke="var(--primary)" strokeWidth="1" />
      <line x1="160" y1="172" x2="160" y2="130" stroke="var(--primary)" strokeWidth="1" />
      <text x="130" y="165" fontSize="9" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle">Δt</text>
      <text x="172" y="155" fontSize="9" fill="var(--primary)" fontFamily="sans-serif">Δv</text>
      <text x="200" y="40" fontSize="10" fill="var(--primary)" fontFamily="sans-serif">slope = a</text>
    </svg>
  );
}

/** Lesson 2 — Free-Body Diagram: box with gravity, normal, friction, applied force */
export function FreeBodyDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label="Free body diagram showing forces on a box">
      <defs>
        <marker id="arrow-fbd" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--accent-color)" />
        </marker>
        <marker id="arrow-fbd-red" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
        </marker>
        <marker id="arrow-fbd-green" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
        </marker>
        <marker id="arrow-fbd-blue" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
        </marker>
      </defs>
      {/* Box */}
      <rect x="120" y="120" width="60" height="60" fill="var(--muted)" stroke="var(--foreground)" strokeWidth="2" rx="4" />
      <text x="150" y="155" fontSize="12" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">m</text>
      {/* Weight (down) */}
      <line x1="150" y1="180" x2="150" y2="250" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#arrow-fbd-red)" />
      <text x="165" y="245" fontSize="11" fill="#ef4444" fontFamily="sans-serif" fontWeight="600">W = mg</text>
      {/* Normal (up) */}
      <line x1="150" y1="120" x2="150" y2="50" stroke="#22c55e" strokeWidth="2.5" markerEnd="url(#arrow-fbd-green)" />
      <text x="165" y="58" fontSize="11" fill="#22c55e" fontFamily="sans-serif" fontWeight="600">F_N</text>
      {/* Applied force (right) */}
      <line x1="180" y1="150" x2="260" y2="150" stroke="var(--accent-color)" strokeWidth="2.5" markerEnd="url(#arrow-fbd)" />
      <text x="230" y="142" fontSize="11" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">F_push</text>
      {/* Friction (left) */}
      <line x1="120" y1="150" x2="50" y2="150" stroke="#3b82f6" strokeWidth="2.5" markerEnd="url(#arrow-fbd-blue)" />
      <text x="45" y="142" fontSize="11" fill="#3b82f6" fontFamily="sans-serif" fontWeight="600">f</text>
      {/* Ground */}
      <line x1="30" y1="182" x2="270" y2="182" stroke="var(--foreground)" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.4" />
      {/* Dot at center */}
      <circle cx="150" cy="150" r="3" fill="var(--foreground)" />
    </svg>
  );
}

/** Lesson 2 — Action-Reaction: person pushing wall */
export function ActionReactionDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 240" className={className} role="img" aria-label="Action reaction pair showing person pushing wall">
      <defs>
        <marker id="arrow-ar-right" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--accent-color)" />
        </marker>
        <marker id="arrow-ar-left" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto">
          <polygon points="8 0, 0 3, 8 6" fill="#ef4444" />
        </marker>
      </defs>
      {/* Wall */}
      <rect x="200" y="40" width="20" height="160" fill="var(--muted)" stroke="var(--foreground)" strokeWidth="2" rx="2" />
      {/* Wall hash marks */}
      {[60, 80, 100, 120, 140, 160, 180].map((y, i) => (
        <line key={i} x1="220" y1={y} x2="235" y2={y - 10} stroke="var(--foreground)" strokeWidth="1" opacity="0.5" />
      ))}
      {/* Person (simplified) */}
      <circle cx="120" cy="70" r="18" fill="none" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="120" y1="88" x2="120" y2="150" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="120" y1="150" x2="100" y2="200" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="120" y1="150" x2="140" y2="200" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="120" y1="110" x2="195" y2="120" stroke="var(--foreground)" strokeWidth="2" />
      {/* Action force arrow (person → wall) */}
      <line x1="148" y1="115" x2="195" y2="115" stroke="var(--accent-color)" strokeWidth="3" markerEnd="url(#arrow-ar-right)" />
      <text x="155" y="106" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">F (person→wall)</text>
      {/* Reaction force arrow (wall → person) */}
      <line x1="195" y1="135" x2="148" y2="135" stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow-ar-left)" />
      <text x="148" y="155" fontSize="10" fill="#ef4444" fontFamily="sans-serif" fontWeight="600">F (wall→person)</text>
      {/* Equal label */}
      <text x="150" y="228" fontSize="11" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">Equal magnitude, opposite direction</text>
    </svg>
  );
}

/** Lesson 3 — Work done at an angle */
export function WorkAngleDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 220" className={className} role="img" aria-label="Force applied at angle theta above horizontal to move object along displacement d">
      <defs>
        <marker id="arrow-work" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--accent-color)" />
        </marker>
        <marker id="arrow-work-d" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--primary)" />
        </marker>
      </defs>
      {/* Ground */}
      <line x1="20" y1="170" x2="280" y2="170" stroke="var(--foreground)" strokeWidth="1.5" opacity="0.4" />
      {/* Box */}
      <rect x="60" y="135" width="40" height="35" fill="var(--muted)" stroke="var(--foreground)" strokeWidth="2" rx="3" />
      <text x="80" y="157" fontSize="11" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle">m</text>
      {/* Displacement arrow d */}
      <line x1="60" y1="185" x2="230" y2="185" stroke="var(--primary)" strokeWidth="2" markerEnd="url(#arrow-work-d)" />
      <text x="145" y="202" fontSize="12" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">d</text>
      {/* Force arrow F at angle */}
      <line x1="100" y1="152" x2="220" y2="72" stroke="var(--accent-color)" strokeWidth="2.5" markerEnd="url(#arrow-work)" />
      <text x="170" y="95" fontSize="12" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">F</text>
      {/* Horizontal component (dashed) */}
      <line x1="100" y1="152" x2="220" y2="152" stroke="var(--accent-color)" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.6" />
      <text x="170" y="145" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle" opacity="0.8">F cos θ</text>
      {/* Angle arc */}
      <path d="M 135,152 A 35,35 0 0,0 125,128" fill="none" stroke="var(--foreground)" strokeWidth="1.2" />
      <text x="142" y="138" fontSize="12" fill="var(--foreground)" fontFamily="sans-serif">θ</text>
      {/* Formula */}
      <text x="150" y="18" fontSize="11" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">W = Fd cos θ</text>
    </svg>
  );
}

/** Lesson 4 — Impulse: Force vs Time graph, area = impulse */
export function ImpulseGraphDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 240" className={className} role="img" aria-label="Force vs time graph showing area equals impulse">
      {/* Axes */}
      <line x1="40" y1="200" x2="270" y2="200" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="40" y1="200" x2="40" y2="20" stroke="var(--foreground)" strokeWidth="2" />
      <text x="155" y="230" fontSize="13" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">t (s)</text>
      <text x="16" y="110" fontSize="13" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600" transform="rotate(-90,16,110)">F (N)</text>
      {/* Large force, short time (tall narrow) */}
      <rect x="60" y="50" width="40" height="150" fill="var(--accent-color)" fillOpacity="0.2" stroke="var(--accent-color)" strokeWidth="2" rx="2" />
      <text x="80" y="130" fontSize="9" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">Large F</text>
      <text x="80" y="145" fontSize="9" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle">Short Δt</text>
      {/* Small force, long time (short wide) */}
      <rect x="140" y="140" width="110" height="60" fill="var(--primary)" fillOpacity="0.15" stroke="var(--primary)" strokeWidth="2" rx="2" />
      <text x="195" y="168" fontSize="9" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">Small F</text>
      <text x="195" y="183" fontSize="9" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle">Long Δt</text>
      {/* Equal area label */}
      <text x="155" y="35" fontSize="11" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">Same area = same impulse (J)</text>
    </svg>
  );
}

/** Lesson 4 — Collision types */
export function CollisionTypesDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 280" className={className} role="img" aria-label="Three types of collisions: elastic, inelastic, perfectly inelastic">
      {/* Section 1: Elastic */}
      <text x="150" y="20" fontSize="11" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">Elastic</text>
      <circle cx="80" cy="50" r="16" fill="var(--accent-color)" fillOpacity="0.2" stroke="var(--accent-color)" strokeWidth="2" />
      <text x="80" y="54" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle">A</text>
      <line x1="96" y1="50" x2="115" y2="50" stroke="var(--accent-color)" strokeWidth="1.5" markerEnd="url(#arrow-coll)" />
      <circle cx="140" cy="50" r="16" fill="var(--accent-color)" fillOpacity="0.1" stroke="var(--accent-color)" strokeWidth="2" />
      <text x="140" y="54" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle">B</text>
      {/* After */}
      <text x="190" y="45" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif">→</text>
      <circle cx="210" cy="50" r="16" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeDasharray="3,2" />
      <circle cx="255" cy="50" r="16" fill="var(--accent-color)" fillOpacity="0.2" stroke="var(--accent-color)" strokeWidth="2" />
      <text x="150" y="80" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">KE conserved ✓ p conserved ✓</text>

      <defs>
        <marker id="arrow-coll" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
          <polygon points="0 0, 6 2.5, 0 5" fill="var(--accent-color)" />
        </marker>
      </defs>

      {/* Section 2: Inelastic */}
      <line x1="30" y1="95" x2="270" y2="95" stroke="var(--foreground)" strokeWidth="0.5" opacity="0.3" />
      <text x="150" y="115" fontSize="11" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">Inelastic</text>
      <circle cx="80" cy="145" r="16" fill="var(--primary)" fillOpacity="0.2" stroke="var(--primary)" strokeWidth="2" />
      <text x="80" y="149" fontSize="10" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle">A</text>
      <circle cx="140" cy="145" r="16" fill="var(--primary)" fillOpacity="0.1" stroke="var(--primary)" strokeWidth="2" />
      <text x="140" y="149" fontSize="10" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle">B</text>
      <text x="190" y="140" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif">→</text>
      <circle cx="220" cy="145" r="16" fill="var(--primary)" fillOpacity="0.15" stroke="var(--primary)" strokeWidth="2" />
      <circle cx="260" cy="145" r="14" fill="var(--primary)" fillOpacity="0.1" stroke="var(--primary)" strokeWidth="2" />
      <text x="150" y="175" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">KE NOT conserved ✗ p conserved ✓</text>

      {/* Section 3: Perfectly Inelastic */}
      <line x1="30" y1="190" x2="270" y2="190" stroke="var(--foreground)" strokeWidth="0.5" opacity="0.3" />
      <text x="150" y="210" fontSize="11" fill="#ef4444" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">Perfectly Inelastic</text>
      <circle cx="80" cy="240" r="16" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="2" />
      <text x="80" y="244" fontSize="10" fill="#ef4444" fontFamily="sans-serif" textAnchor="middle">A</text>
      <circle cx="140" cy="240" r="16" fill="#ef4444" fillOpacity="0.1" stroke="#ef4444" strokeWidth="2" />
      <text x="140" y="244" fontSize="10" fill="#ef4444" fontFamily="sans-serif" textAnchor="middle">B</text>
      <text x="190" y="235" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif">→</text>
      {/* Merged object */}
      <rect x="215" y="224" width="50" height="32" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="2" rx="16" />
      <text x="240" y="244" fontSize="9" fill="#ef4444" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">A+B</text>
      <text x="150" y="272" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">Objects stick together. p conserved ✓</text>
    </svg>
  );
}

/** Lesson 5 — Rotational motion: wheel with angular variables */
export function RotationalMotionDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label="Rotating wheel showing angular velocity and tangential velocity">
      <defs>
        <marker id="arrow-rot" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--accent-color)" />
        </marker>
        <marker id="arrow-rot-p" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--primary)" />
        </marker>
      </defs>
      {/* Outer circle (wheel) */}
      <circle cx="150" cy="150" r="110" fill="none" stroke="var(--foreground)" strokeWidth="2" opacity="0.6" />
      {/* Inner circle */}
      <circle cx="150" cy="150" r="50" fill="none" stroke="var(--foreground)" strokeWidth="1" opacity="0.3" strokeDasharray="4,3" />
      {/* Center */}
      <circle cx="150" cy="150" r="4" fill="var(--foreground)" />
      <text x="158" y="146" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif">O</text>
      {/* Radius line to rim point */}
      <line x1="150" y1="150" x2="260" y2="150" stroke="var(--foreground)" strokeWidth="1.5" />
      {/* Point on rim */}
      <circle cx="260" cy="150" r="5" fill="var(--accent-color)" />
      <text x="268" y="147" fontSize="11" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">P</text>
      {/* r label */}
      <text x="205" y="143" fontSize="11" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle">r</text>
      {/* Tangential velocity arrow (perpendicular to radius, upward at point P) */}
      <line x1="260" y1="150" x2="260" y2="70" stroke="var(--accent-color)" strokeWidth="2.5" markerEnd="url(#arrow-rot)" />
      <text x="272" y="100" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">v = rω</text>
      {/* Angular velocity curved arrow */}
      <path d="M 175,100 A 55,55 0 0,1 200,115" fill="none" stroke="var(--primary)" strokeWidth="2" markerEnd="url(#arrow-rot-p)" />
      <text x="195" y="95" fontSize="11" fill="var(--primary)" fontFamily="sans-serif" fontWeight="600">ω</text>
      {/* Point on inner circle */}
      <circle cx="200" cy="150" r="4" fill="var(--primary)" />
      <text x="208" y="165" fontSize="10" fill="var(--primary)" fontFamily="sans-serif">Q</text>
      {/* Smaller v arrow at inner point */}
      <line x1="200" y1="150" x2="200" y2="110" stroke="var(--primary)" strokeWidth="2" markerEnd="url(#arrow-rot-p)" />
      <text x="208" y="126" fontSize="9" fill="var(--primary)" fontFamily="sans-serif">v'</text>
      {/* Note */}
      <text x="150" y="285" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">Same ω, different v (depends on r)</text>
    </svg>
  );
}

/** Lesson 5 — Torque on a door */
export function TorqueDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 220" className={className} role="img" aria-label="Torque diagram showing force applied to a door at different distances from hinge">
      <defs>
        <marker id="arrow-torque" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--accent-color)" />
        </marker>
        <marker id="arrow-torque-weak" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--muted-foreground)" />
        </marker>
      </defs>
      {/* Door (top view, horizontal bar) */}
      <rect x="40" y="95" width="220" height="12" fill="var(--muted)" stroke="var(--foreground)" strokeWidth="2" rx="2" />
      {/* Hinge */}
      <circle cx="40" cy="101" r="7" fill="var(--foreground)" />
      <text x="40" y="85" fontSize="10" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">Hinge</text>
      {/* Force at far end (max torque) */}
      <line x1="250" y1="101" x2="250" y2="40" stroke="var(--accent-color)" strokeWidth="3" markerEnd="url(#arrow-torque)" />
      <text x="260" y="55" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">F</text>
      <text x="250" y="130" fontSize="9" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle">r = large</text>
      <text x="250" y="142" fontSize="9" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">τ = max</text>
      {/* Force at middle (medium torque) */}
      <line x1="150" y1="101" x2="150" y2="55" stroke="var(--primary)" strokeWidth="2.5" markerEnd="url(#arrow-torque)" />
      <text x="160" y="65" fontSize="10" fill="var(--primary)" fontFamily="sans-serif">F</text>
      <text x="150" y="130" fontSize="9" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle">r = medium</text>
      {/* Force at hinge (zero torque) */}
      <line x1="50" y1="101" x2="50" y2="55" stroke="var(--muted-foreground)" strokeWidth="2" markerEnd="url(#arrow-torque-weak)" />
      <text x="60" y="65" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif">F</text>
      <text x="55" y="130" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">r ≈ 0</text>
      <text x="55" y="142" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">τ = 0</text>
      {/* r brackets */}
      <line x1="40" y1="115" x2="250" y2="115" stroke="var(--accent-color)" strokeWidth="1" strokeDasharray="4,2" />
      {/* Formula */}
      <text x="150" y="175" fontSize="11" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">τ = r F sin θ</text>
      <text x="150" y="195" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">Push far from hinge for maximum torque</text>
    </svg>
  );
}
