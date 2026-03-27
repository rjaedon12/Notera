"use client"

interface DiagramProps {
  className?: string;
}

// ═══════════════════════════════════════════════════════════════
// Unit 1 — Electric Charge & Coulomb's Law
// ═══════════════════════════════════════════════════════════════

/** Two point charges with Coulomb force vectors */
export function CoulombForceDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 340 180" className={className} role="img" aria-label="Coulomb's law: two point charges with equal and opposite force vectors">
      <defs>
        <marker id="arr-cf-r" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#ef4444" /></marker>
        <marker id="arr-cf-b" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#3b82f6" /></marker>
      </defs>
      {/* Charge +q₁ */}
      <circle cx="80" cy="90" r="22" fill="#ef4444" fillOpacity="0.15" stroke="#ef4444" strokeWidth="2" />
      <text x="80" y="95" fontSize="14" fill="#ef4444" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">+q₁</text>
      {/* Charge +q₂ */}
      <circle cx="260" cy="90" r="22" fill="#3b82f6" fillOpacity="0.15" stroke="#3b82f6" strokeWidth="2" />
      <text x="260" y="95" fontSize="14" fill="#3b82f6" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">+q₂</text>
      {/* r distance */}
      <line x1="102" y1="90" x2="238" y2="90" stroke="var(--muted-foreground)" strokeWidth="1" strokeDasharray="5,3" />
      <text x="170" y="85" fontSize="12" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">r</text>
      {/* Force on q₁ (repulsion left) */}
      <line x1="58" y1="90" x2="10" y2="90" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#arr-cf-r)" />
      <text x="30" y="78" fontSize="10" fill="#ef4444" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">F₁₂</text>
      {/* Force on q₂ (repulsion right) */}
      <line x1="282" y1="90" x2="330" y2="90" stroke="#3b82f6" strokeWidth="2.5" markerEnd="url(#arr-cf-b)" />
      <text x="310" y="78" fontSize="10" fill="#3b82f6" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">F₂₁</text>
      {/* Formula */}
      <text x="170" y="155" fontSize="11" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">|F| = kq₁q₂ / r²</text>
      <text x="170" y="172" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">Like charges repel — equal magnitude, opposite direction</text>
    </svg>
  );
}

/** Conductors vs insulators — charge distribution */
export function ConductorInsulatorDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 340 200" className={className} role="img" aria-label="Conductor has free surface charges; insulator has fixed interior charges">
      {/* Conductor */}
      <rect x="20" y="30" width="130" height="90" rx="8" fill="var(--muted)" stroke="var(--accent-color)" strokeWidth="2" />
      <text x="85" y="22" fontSize="11" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">Conductor</text>
      {[{x:24,y:50},{x:24,y:75},{x:24,y:100},{x:146,y:50},{x:146,y:75},{x:146,y:100},{x:60,y:33},{x:100,y:33},{x:60,y:117},{x:100,y:117}].map((p,i) => (
        <text key={`c${i}`} x={p.x} y={p.y} fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle">−</text>
      ))}
      <text x="85" y="80" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">E = 0 inside</text>
      {/* Insulator */}
      <rect x="190" y="30" width="130" height="90" rx="8" fill="var(--muted)" stroke="var(--primary)" strokeWidth="2" />
      <text x="255" y="22" fontSize="11" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">Insulator</text>
      {[{x:210,y:55},{x:240,y:50},{x:275,y:60},{x:220,y:80},{x:255,y:75},{x:290,y:85},{x:230,y:105},{x:260,y:100},{x:300,y:95}].map((p,i) => (
        <text key={`i${i}`} x={p.x} y={p.y} fontSize="10" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle">−</text>
      ))}
      <text x="255" y="145" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">Charges fixed in place</text>
      <text x="85" y="145" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">Charges free to move</text>
      <text x="170" y="185" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">Charges migrate to surface in conductors</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Unit 2 — Electric Fields
// ═══════════════════════════════════════════════════════════════

/** Electric field lines from a positive point charge (radial outward) */
export function PointChargeFieldDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label="Electric field lines radiating outward from a positive point charge">
      <defs>
        <marker id="arr-ef" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="var(--accent-color)" /></marker>
      </defs>
      <circle cx="150" cy="150" r="18" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="2" />
      <text x="150" y="155" fontSize="14" fill="#ef4444" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">+Q</text>
      {[0,45,90,135,180,225,270,315].map((angle,i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 150 + 24 * Math.cos(rad);
        const y1 = 150 + 24 * Math.sin(rad);
        const x2 = 150 + 120 * Math.cos(rad);
        const y2 = 150 + 120 * Math.sin(rad);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--accent-color)" strokeWidth="1.8" markerEnd="url(#arr-ef)" />;
      })}
      <text x="150" y="290" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">Field lines point away from +Q</text>
    </svg>
  );
}

/** Electric dipole field lines */
export function DipoleDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 320 240" className={className} role="img" aria-label="Electric field lines of a dipole flowing from positive to negative charge">
      <defs>
        <marker id="arr-dip" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto"><polygon points="0 0,6 2.5,0 5" fill="var(--accent-color)" /></marker>
      </defs>
      <circle cx="100" cy="120" r="16" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="2" />
      <text x="100" y="125" fontSize="13" fill="#ef4444" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">+</text>
      <circle cx="220" cy="120" r="16" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="2" />
      <text x="220" y="125" fontSize="13" fill="#3b82f6" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">−</text>
      <path d="M 116,120 C 160,120 180,120 204,120" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" markerEnd="url(#arr-dip)" />
      <path d="M 114,108 C 145,60 190,60 218,108" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" markerEnd="url(#arr-dip)" />
      <path d="M 114,132 C 145,180 190,180 218,132" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" markerEnd="url(#arr-dip)" />
      <path d="M 108,105 C 130,20 200,20 214,105" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" markerEnd="url(#arr-dip)" />
      <path d="M 108,135 C 130,220 200,220 214,135" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" markerEnd="url(#arr-dip)" />
      <path d="M 84,120 L 20,120" fill="none" stroke="var(--accent-color)" strokeWidth="1.2" />
      <path d="M 88,108 L 40,70" fill="none" stroke="var(--accent-color)" strokeWidth="1.2" />
      <path d="M 88,132 L 40,170" fill="none" stroke="var(--accent-color)" strokeWidth="1.2" />
      <path d="M 236,120 L 300,120" fill="none" stroke="var(--accent-color)" strokeWidth="1.2" />
      <path d="M 232,108 L 280,70" fill="none" stroke="var(--accent-color)" strokeWidth="1.2" />
      <path d="M 232,132 L 280,170" fill="none" stroke="var(--accent-color)" strokeWidth="1.2" />
      <text x="160" y="230" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">p⃗ points from − to + (by convention)</text>
    </svg>
  );
}

/** Parallel-plate uniform field */
export function ParallelPlateFieldDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 240" className={className} role="img" aria-label="Uniform electric field between parallel plates">
      <defs>
        <marker id="arr-pp" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="var(--accent-color)" /></marker>
      </defs>
      <rect x="50" y="30" width="10" height="180" fill="#ef4444" fillOpacity="0.3" stroke="#ef4444" strokeWidth="2" rx="2" />
      {[60,80,100,120,140,160,180].map((y,i) => (
        <text key={`p${i}`} x="44" y={y} fontSize="12" fill="#ef4444" fontFamily="sans-serif" textAnchor="middle">+</text>
      ))}
      <rect x="240" y="30" width="10" height="180" fill="#3b82f6" fillOpacity="0.3" stroke="#3b82f6" strokeWidth="2" rx="2" />
      {[60,80,100,120,140,160,180].map((y,i) => (
        <text key={`n${i}`} x="256" y={y} fontSize="12" fill="#3b82f6" fontFamily="sans-serif" textAnchor="middle">−</text>
      ))}
      {[60,80,100,120,140,160,180].map((y,i) => (
        <line key={`f${i}`} x1="65" y1={y} x2="235" y2={y} stroke="var(--accent-color)" strokeWidth="1.5" markerEnd="url(#arr-pp)" />
      ))}
      <text x="150" y="225" fontSize="11" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">E⃗ uniform between plates: E = σ/ε₀</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Unit 3 — Gauss's Law
// ═══════════════════════════════════════════════════════════════

/** Spherical Gaussian surface around a point charge */
export function GaussianSphereDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label="Spherical Gaussian surface enclosing a positive point charge with radial E-field">
      <defs>
        <marker id="arr-gs" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="var(--accent-color)" /></marker>
      </defs>
      <circle cx="150" cy="150" r="100" fill="none" stroke="var(--primary)" strokeWidth="2" strokeDasharray="8,4" />
      <text x="260" y="90" fontSize="10" fill="var(--primary)" fontFamily="sans-serif" fontWeight="600">Gaussian</text>
      <text x="260" y="103" fontSize="10" fill="var(--primary)" fontFamily="sans-serif" fontWeight="600">surface</text>
      <circle cx="150" cy="150" r="14" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="2" />
      <text x="150" y="155" fontSize="12" fill="#ef4444" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">+Q</text>
      {[0,45,90,135,180,225,270,315].map((angle,i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 150 + 100 * Math.cos(rad);
        const y1 = 150 + 100 * Math.sin(rad);
        const x2 = 150 + 130 * Math.cos(rad);
        const y2 = 150 + 130 * Math.sin(rad);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--accent-color)" strokeWidth="2" markerEnd="url(#arr-gs)" />;
      })}
      <text x="245" y="160" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">E⃗·dA⃗</text>
      <line x1="150" y1="150" x2="250" y2="150" stroke="var(--foreground)" strokeWidth="1" strokeDasharray="4,2" />
      <text x="200" y="143" fontSize="11" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle">r</text>
      <text x="150" y="285" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">Φ = ∮ E⃗·dA⃗ = Q_enc / ε₀</text>
    </svg>
  );
}

/** Cylindrical Gaussian surface around an infinite line charge */
export function GaussianCylinderDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 320 240" className={className} role="img" aria-label="Cylindrical Gaussian surface around a line charge with radial E-field">
      <defs>
        <marker id="arr-gc" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="var(--accent-color)" /></marker>
      </defs>
      <line x1="160" y1="20" x2="160" y2="220" stroke="#ef4444" strokeWidth="3" />
      <text x="170" y="18" fontSize="10" fill="#ef4444" fontFamily="sans-serif" fontWeight="600">λ (C/m)</text>
      <ellipse cx="160" cy="50" rx="80" ry="20" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeDasharray="6,3" />
      <ellipse cx="160" cy="190" rx="80" ry="20" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeDasharray="6,3" />
      <line x1="80" y1="50" x2="80" y2="190" stroke="var(--primary)" strokeWidth="1.8" strokeDasharray="6,3" />
      <line x1="240" y1="50" x2="240" y2="190" stroke="var(--primary)" strokeWidth="1.8" strokeDasharray="6,3" />
      {[70,100,130,160].map((y,i) => (
        <g key={i}>
          <line x1="240" y1={y} x2="290" y2={y} stroke="var(--accent-color)" strokeWidth="1.8" markerEnd="url(#arr-gc)" />
          <line x1="80" y1={y} x2="30" y2={y} stroke="var(--accent-color)" strokeWidth="1.8" markerEnd="url(#arr-gc)" />
        </g>
      ))}
      <text x="295" y="115" fontSize="9" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">E⃗</text>
      <line x1="160" y1="120" x2="240" y2="120" stroke="var(--foreground)" strokeWidth="1" strokeDasharray="3,2" />
      <text x="200" y="115" fontSize="10" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle">r</text>
      <text x="160" y="235" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">E = λ / (2πε₀r)</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Unit 4 — Electric Potential
// ═══════════════════════════════════════════════════════════════

/** Equipotential lines around a point charge */
export function EquipotentialDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label="Equipotential surfaces as concentric circles around a point charge, with radial E-field lines">
      <defs>
        <marker id="arr-eq" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><polygon points="0 0,6 2,0 4" fill="var(--accent-color)" /></marker>
      </defs>
      <circle cx="150" cy="150" r="40" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="4,3" />
      <circle cx="150" cy="150" r="70" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="4,3" />
      <circle cx="150" cy="150" r="100" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="4,3" />
      <circle cx="150" cy="150" r="130" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="4,3" />
      <text x="195" y="145" fontSize="9" fill="var(--primary)" fontFamily="sans-serif" fontWeight="600">V₁</text>
      <text x="225" y="145" fontSize="9" fill="var(--primary)" fontFamily="sans-serif" fontWeight="600">V₂</text>
      <text x="255" y="145" fontSize="9" fill="var(--primary)" fontFamily="sans-serif" fontWeight="600">V₃</text>
      {[0,60,120,180,240,300].map((angle,i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 150 + 20 * Math.cos(rad);
        const y1 = 150 + 20 * Math.sin(rad);
        const x2 = 150 + 130 * Math.cos(rad);
        const y2 = 150 + 130 * Math.sin(rad);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--accent-color)" strokeWidth="1.2" markerEnd="url(#arr-eq)" />;
      })}
      <circle cx="150" cy="150" r="14" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="2" />
      <text x="150" y="155" fontSize="11" fill="#ef4444" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">+Q</text>
      <text x="150" y="292" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">{"E⃗ ⊥ equipotential surfaces; V₁ > V₂ > V₃"}</text>
    </svg>
  );
}

/** E = −∇V: potential hill & gradient */
export function PotentialGradientDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 220" className={className} role="img" aria-label="Graph showing V vs x and E pointing in direction of decreasing potential">
      <defs>
        <marker id="arr-pg" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="var(--accent-color)" /></marker>
      </defs>
      <line x1="40" y1="170" x2="280" y2="170" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="40" y1="170" x2="40" y2="20" stroke="var(--foreground)" strokeWidth="2" />
      <text x="160" y="195" fontSize="12" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">x</text>
      <text x="25" y="95" fontSize="12" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600" transform="rotate(-90,25,95)">V</text>
      <path d="M 50,40 C 90,42 120,60 160,100 S 230,155 270,160" fill="none" stroke="var(--primary)" strokeWidth="2.5" />
      <text x="130" y="58" fontSize="10" fill="var(--primary)" fontFamily="sans-serif" fontWeight="600">V(x)</text>
      <line x1="110" y1="50" x2="210" y2="150" stroke="var(--foreground)" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
      <text x="215" y="142" fontSize="9" fill="var(--foreground)" fontFamily="sans-serif">slope = dV/dx</text>
      <line x1="100" y1="210" x2="200" y2="210" stroke="var(--accent-color)" strokeWidth="2.5" markerEnd="url(#arr-pg)" />
      <text x="150" y="207" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">E⃗</text>
      <text x="150" y="220" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">E points toward decreasing V</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Unit 5 — Capacitance & Dielectrics
// ═══════════════════════════════════════════════════════════════

/** Parallel-plate capacitor with dielectric */
export function CapacitorDielectricDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 220" className={className} role="img" aria-label="Parallel plate capacitor with dielectric slab inserted between plates">
      <rect x="60" y="30" width="8" height="150" fill="#ef4444" fillOpacity="0.3" stroke="#ef4444" strokeWidth="2" rx="1" />
      <text x="50" y="20" fontSize="11" fill="#ef4444" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">+Q</text>
      <rect x="232" y="30" width="8" height="150" fill="#3b82f6" fillOpacity="0.3" stroke="#3b82f6" strokeWidth="2" rx="1" />
      <text x="250" y="20" fontSize="11" fill="#3b82f6" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">−Q</text>
      <rect x="110" y="35" width="80" height="140" fill="var(--primary)" fillOpacity="0.1" stroke="var(--primary)" strokeWidth="2" rx="4" />
      <text x="150" y="110" fontSize="11" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">κ</text>
      <text x="150" y="125" fontSize="9" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle">(dielectric)</text>
      {[55,80,105,130,155].map((y,i) => (
        <g key={i}>
          <line x1="72" y1={y} x2="108" y2={y} stroke="var(--accent-color)" strokeWidth="1.5" />
          <line x1="112" y1={y} x2="188" y2={y} stroke="var(--accent-color)" strokeWidth="0.8" strokeDasharray="3,2" />
          <line x1="192" y1={y} x2="230" y2={y} stroke="var(--accent-color)" strokeWidth="1.5" />
        </g>
      ))}
      <text x="85" y="195" fontSize="9" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle">E₀</text>
      <text x="150" y="195" fontSize="9" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle">E₀/κ</text>
      <text x="215" y="195" fontSize="9" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle">E₀</text>
      <text x="150" y="215" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">C = κε₀A/d — dielectric increases capacitance</text>
    </svg>
  );
}

/** Capacitors in series vs parallel */
export function CapacitorCircuitDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 320 200" className={className} role="img" aria-label="Capacitors connected in series and in parallel with equivalent formulas">
      {/* Series section */}
      <text x="80" y="18" fontSize="12" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">Series</text>
      <line x1="10" y1="55" x2="40" y2="55" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="40" y1="35" x2="40" y2="75" stroke="var(--foreground)" strokeWidth="2.5" />
      <line x1="50" y1="35" x2="50" y2="75" stroke="var(--foreground)" strokeWidth="2.5" />
      <text x="45" y="92" fontSize="9" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle">C₁</text>
      <line x1="50" y1="55" x2="90" y2="55" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="90" y1="35" x2="90" y2="75" stroke="var(--foreground)" strokeWidth="2.5" />
      <line x1="100" y1="35" x2="100" y2="75" stroke="var(--foreground)" strokeWidth="2.5" />
      <text x="95" y="92" fontSize="9" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle">C₂</text>
      <line x1="100" y1="55" x2="150" y2="55" stroke="var(--foreground)" strokeWidth="2" />
      <text x="80" y="115" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">1/C_eq = 1/C₁ + 1/C₂</text>
      {/* Parallel section */}
      <text x="245" y="18" fontSize="12" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">Parallel</text>
      <line x1="190" y1="45" x2="220" y2="45" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="220" y1="30" x2="220" y2="60" stroke="var(--foreground)" strokeWidth="2.5" />
      <line x1="228" y1="30" x2="228" y2="60" stroke="var(--foreground)" strokeWidth="2.5" />
      <text x="224" y="75" fontSize="9" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle">C₁</text>
      <line x1="228" y1="45" x2="260" y2="45" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="190" y1="45" x2="190" y2="85" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="190" y1="85" x2="220" y2="85" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="220" y1="70" x2="220" y2="100" stroke="var(--foreground)" strokeWidth="2.5" />
      <line x1="228" y1="70" x2="228" y2="100" stroke="var(--foreground)" strokeWidth="2.5" />
      <text x="224" y="112" fontSize="9" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle">C₂</text>
      <line x1="228" y1="85" x2="260" y2="85" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="260" y1="45" x2="260" y2="85" stroke="var(--foreground)" strokeWidth="2" />
      <text x="245" y="130" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">C_eq = C₁ + C₂</text>
      <line x1="10" y1="150" x2="310" y2="150" stroke="var(--foreground)" strokeWidth="0.5" opacity="0.3" />
      <text x="160" y="175" fontSize="11" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">Energy stored: U = ½CV² = Q²/2C</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Unit 6 — Current, Resistance & DC Circuits
// ═══════════════════════════════════════════════════════════════

/** Simple DC circuit with battery, resistor */
export function SimpleCircuitDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 240" className={className} role="img" aria-label="Simple DC circuit with battery and resistor">
      <line x1="60" y1="50" x2="60" y2="80" stroke="var(--foreground)" strokeWidth="3" />
      <line x1="50" y1="65" x2="70" y2="65" stroke="var(--foreground)" strokeWidth="1.5" />
      <line x1="80" y1="50" x2="80" y2="80" stroke="var(--foreground)" strokeWidth="1.5" />
      <text x="70" y="42" fontSize="10" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">ε</text>
      <text x="85" y="47" fontSize="8" fill="#ef4444" fontFamily="sans-serif">+</text>
      <text x="52" y="47" fontSize="8" fill="#3b82f6" fontFamily="sans-serif">−</text>
      <line x1="80" y1="65" x2="240" y2="65" stroke="var(--foreground)" strokeWidth="2" />
      <polyline points="240,65 245,50 255,80 265,50 275,80 280,65" fill="none" stroke="var(--accent-color)" strokeWidth="2" />
      <text x="260" y="95" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">R</text>
      <line x1="280" y1="65" x2="280" y2="180" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="60" y1="180" x2="280" y2="180" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="60" y1="65" x2="60" y2="180" stroke="var(--foreground)" strokeWidth="2" />
      <text x="170" y="55" fontSize="10" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">I →</text>
      <text x="170" y="215" fontSize="11" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">V = IR  (Ohm&#39;s Law)</text>
      <text x="170" y="232" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">Current flows from + terminal through external circuit</text>
    </svg>
  );
}

/** Kirchhoff's Rules — junction and loop */
export function KirchhoffDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 320 210" className={className} role="img" aria-label="Kirchhoff junction rule and loop rule illustration">
      <defs>
        <marker id="arr-kj" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="var(--accent-color)" /></marker>
      </defs>
      {/* Junction rule */}
      <text x="90" y="18" fontSize="11" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">Junction Rule</text>
      <circle cx="90" cy="70" r="6" fill="var(--foreground)" />
      <line x1="20" y1="40" x2="84" y2="65" stroke="var(--accent-color)" strokeWidth="2" markerEnd="url(#arr-kj)" />
      <text x="35" y="38" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">I₁</text>
      <line x1="20" y1="100" x2="84" y2="75" stroke="var(--accent-color)" strokeWidth="2" markerEnd="url(#arr-kj)" />
      <text x="35" y="105" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">I₂</text>
      <line x1="96" y1="70" x2="160" y2="70" stroke="var(--accent-color)" strokeWidth="2" markerEnd="url(#arr-kj)" />
      <text x="145" y="62" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">I₃</text>
      <text x="90" y="115" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">ΣI_in = ΣI_out</text>
      {/* Loop rule */}
      <text x="240" y="18" fontSize="11" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">Loop Rule</text>
      <rect x="195" y="35" width="90" height="70" fill="none" stroke="var(--foreground)" strokeWidth="2" rx="4" />
      <path d="M 240,42 A 30,30 0 1,1 240,98" fill="none" stroke="var(--primary)" strokeWidth="1.5" markerEnd="url(#arr-kj)" />
      <text x="232" y="73" fontSize="9" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle">loop</text>
      <text x="210" y="33" fontSize="9" fill="var(--foreground)" fontFamily="sans-serif">ε</text>
      <text x="270" y="33" fontSize="9" fill="var(--foreground)" fontFamily="sans-serif">R₁</text>
      <text x="290" y="75" fontSize="9" fill="var(--foreground)" fontFamily="sans-serif">R₂</text>
      <text x="240" y="120" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">Σ(ΔV) = 0 around loop</text>
      <line x1="10" y1="145" x2="310" y2="145" stroke="var(--foreground)" strokeWidth="0.5" opacity="0.3" />
      <text x="160" y="170" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">Kirchhoff&#39;s Current Law: ΣI = 0</text>
      <text x="160" y="190" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">Kirchhoff&#39;s Voltage Law: ΣV = 0</text>
    </svg>
  );
}

/** RC circuit — charging curve */
export function RCCircuitDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 250" className={className} role="img" aria-label="RC circuit charging and discharging curves">
      <line x1="40" y1="200" x2="280" y2="200" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="40" y1="200" x2="40" y2="30" stroke="var(--foreground)" strokeWidth="2" />
      <text x="160" y="225" fontSize="11" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">t</text>
      <text x="25" y="115" fontSize="11" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600" transform="rotate(-90,25,115)">V_C</text>
      <line x1="40" y1="50" x2="280" y2="50" stroke="var(--foreground)" strokeWidth="1" strokeDasharray="5,3" opacity="0.4" />
      <text x="285" y="54" fontSize="9" fill="var(--foreground)" fontFamily="sans-serif">ε</text>
      <path d="M 40,200 C 80,200 100,80 140,60 S 220,52 270,50" fill="none" stroke="var(--accent-color)" strokeWidth="2.5" />
      <text x="180" y="82" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">V_C = ε(1 − e^(−t/RC))</text>
      <line x1="110" y1="200" x2="110" y2="75" stroke="var(--primary)" strokeWidth="1" strokeDasharray="3,2" />
      <text x="110" y="215" fontSize="9" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle">τ = RC</text>
      <line x1="40" y1="93" x2="110" y2="93" stroke="var(--primary)" strokeWidth="1" strokeDasharray="3,2" opacity="0.5" />
      <text x="30" y="96" fontSize="8" fill="var(--primary)" fontFamily="sans-serif">63%ε</text>
      <path d="M 40,50 C 80,50 100,170 140,190 S 220,198 270,200" fill="none" stroke="var(--primary)" strokeWidth="2" strokeDasharray="6,3" />
      <text x="200" y="180" fontSize="10" fill="var(--primary)" fontFamily="sans-serif" fontWeight="600">V_C = εe^(−t/RC)</text>
      <text x="160" y="245" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">τ = RC is the time constant</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Unit 7 — Magnetic Fields & Forces
// ═══════════════════════════════════════════════════════════════

/** Lorentz force on a moving charge */
export function LorentzForceDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 260" className={className} role="img" aria-label="Lorentz force F = qv cross B with right-hand rule">
      <defs>
        <marker id="arr-lf" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="var(--accent-color)" /></marker>
        <marker id="arr-lf-r" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#ef4444" /></marker>
      </defs>
      <circle cx="120" cy="160" r="4" fill="var(--foreground)" />
      <line x1="120" y1="160" x2="250" y2="160" stroke="var(--accent-color)" strokeWidth="2.5" markerEnd="url(#arr-lf)" />
      <text x="200" y="152" fontSize="12" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="700">v⃗</text>
      <circle cx="170" cy="100" r="14" fill="none" stroke="var(--primary)" strokeWidth="2" />
      <line x1="162" y1="92" x2="178" y2="108" stroke="var(--primary)" strokeWidth="2" />
      <line x1="178" y1="92" x2="162" y2="108" stroke="var(--primary)" strokeWidth="2" />
      <text x="192" y="104" fontSize="12" fill="var(--primary)" fontFamily="sans-serif" fontWeight="700">B⃗ (into page)</text>
      <line x1="120" y1="160" x2="120" y2="40" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#arr-lf-r)" />
      <text x="105" y="60" fontSize="12" fill="#ef4444" fontFamily="sans-serif" fontWeight="700">F⃗</text>
      <text x="150" y="210" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">F⃗ = qv⃗ × B⃗</text>
      <text x="150" y="228" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">Fingers curl v⃗ → B⃗, thumb points along F⃗ (+charge)</text>
      <text x="108" y="178" fontSize="11" fill="#ef4444" fontFamily="sans-serif" fontWeight="600">+q</text>
    </svg>
  );
}

/** Charged particle circular motion in B field */
export function CyclotronMotionDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label="Charged particle moving in a circle in a uniform magnetic field">
      <defs>
        <marker id="arr-cm" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="var(--accent-color)" /></marker>
        <marker id="arr-cm-r" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="#ef4444" /></marker>
      </defs>
      {[60,110,160,210,260].map((x) =>
        [60,110,160,210,260].map((y,j) => (
          <circle key={`b${x}${j}`} cx={x} cy={y} r="2" fill="var(--primary)" opacity="0.4" />
        ))
      )}
      <text x="280" y="40" fontSize="9" fill="var(--primary)" fontFamily="sans-serif" fontWeight="600">B⃗ (out)</text>
      <circle cx="160" cy="160" r="70" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeDasharray="6,3" />
      <circle cx="160" cy="90" r="6" fill="var(--accent-color)" />
      <text x="172" y="85" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="700">+q</text>
      <line x1="166" y1="90" x2="220" y2="90" stroke="var(--accent-color)" strokeWidth="2" markerEnd="url(#arr-cm)" />
      <text x="205" y="83" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">v⃗</text>
      <line x1="160" y1="96" x2="160" y2="140" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arr-cm-r)" />
      <text x="145" y="130" fontSize="10" fill="#ef4444" fontFamily="sans-serif" fontWeight="600">F⃗</text>
      <line x1="160" y1="160" x2="160" y2="90" stroke="var(--foreground)" strokeWidth="1" strokeDasharray="3,2" />
      <text x="150" y="135" fontSize="10" fill="var(--foreground)" fontFamily="sans-serif">r</text>
      <circle cx="160" cy="160" r="3" fill="var(--foreground)" />
      <text x="160" y="270" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">r = mv / (qB)</text>
      <text x="160" y="286" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">Cyclotron radius — larger for faster or heavier particles</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Unit 8 — Sources of Magnetic Fields
// ═══════════════════════════════════════════════════════════════

/** Magnetic field around a long straight wire */
export function WireFieldDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 280" className={className} role="img" aria-label="Magnetic field lines circling a current-carrying wire">
      <circle cx="150" cy="140" r="14" fill="var(--foreground)" fillOpacity="0.1" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="142" y1="132" x2="158" y2="148" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="158" y1="132" x2="142" y2="148" stroke="var(--foreground)" strokeWidth="2" />
      <text x="150" y="170" fontSize="10" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">I (into page)</text>
      <circle cx="150" cy="140" r="40" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" />
      <circle cx="150" cy="140" r="70" fill="none" stroke="var(--accent-color)" strokeWidth="1.2" opacity="0.7" />
      <circle cx="150" cy="140" r="100" fill="none" stroke="var(--accent-color)" strokeWidth="1" opacity="0.5" />
      <text x="190" y="102" fontSize="12" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="700">→</text>
      <text x="110" y="182" fontSize="12" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="700">→</text>
      <text x="77" y="120" fontSize="12" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="700">↑</text>
      <text x="220" y="160" fontSize="12" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="700">↓</text>
      <text x="202" y="92" fontSize="11" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">B⃗</text>
      <line x1="150" y1="140" x2="190" y2="140" stroke="var(--foreground)" strokeWidth="1" strokeDasharray="3,2" />
      <text x="170" y="135" fontSize="10" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle">r</text>
      <text x="150" y="260" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">B = μ₀I / (2πr)</text>
      <text x="150" y="276" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">Right-hand rule: thumb = I, fingers = B⃗</text>
    </svg>
  );
}

/** Solenoid cross-section */
export function SolenoidDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 320 220" className={className} role="img" aria-label="Solenoid with uniform magnetic field inside">
      <defs>
        <marker id="arr-sol" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="var(--accent-color)" /></marker>
      </defs>
      <rect x="60" y="50" width="200" height="100" fill="none" stroke="var(--foreground)" strokeWidth="2" rx="6" />
      {[80,105,130,155,180,205,230].map((x,i) => (
        <line key={i} x1={x} y1="50" x2={x} y2="150" stroke="var(--foreground)" strokeWidth="1" opacity="0.3" />
      ))}
      {[75,100,125].map((y,i) => (
        <line key={`b${i}`} x1="70" y1={y} x2="250" y2={y} stroke="var(--accent-color)" strokeWidth="2" markerEnd="url(#arr-sol)" />
      ))}
      <text x="160" y="92" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">B⃗ (uniform inside)</text>
      <path d="M 60,100 C 30,100 20,20 160,15 S 300,20 260,100" fill="none" stroke="var(--accent-color)" strokeWidth="1" strokeDasharray="4,3" opacity="0.4" />
      <path d="M 60,100 C 30,100 20,180 160,185 S 300,180 260,100" fill="none" stroke="var(--accent-color)" strokeWidth="1" strokeDasharray="4,3" opacity="0.4" />
      <text x="30" y="105" fontSize="9" fill="var(--foreground)" fontFamily="sans-serif">N</text>
      <text x="268" y="105" fontSize="9" fill="var(--foreground)" fontFamily="sans-serif">S</text>
      <text x="160" y="200" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">B = μ₀nI  (n = turns per length)</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Unit 9 — Electromagnetic Induction
// ═══════════════════════════════════════════════════════════════

/** Faraday's law — changing flux through a loop */
export function FaradayDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 320 250" className={className} role="img" aria-label="Bar magnet approaching a conducting loop, inducing EMF">
      <defs>
        <marker id="arr-far" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="var(--accent-color)" /></marker>
        <marker id="arr-far-i" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="var(--primary)" /></marker>
      </defs>
      <ellipse cx="220" cy="110" rx="60" ry="80" fill="none" stroke="var(--foreground)" strokeWidth="2.5" />
      <rect x="30" y="90" width="80" height="40" fill="none" stroke="var(--foreground)" strokeWidth="2" rx="4" />
      <rect x="30" y="90" width="40" height="40" fill="#ef4444" fillOpacity="0.2" />
      <rect x="70" y="90" width="40" height="40" fill="#3b82f6" fillOpacity="0.2" />
      <text x="50" y="115" fontSize="12" fill="#ef4444" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">N</text>
      <text x="90" y="115" fontSize="12" fill="#3b82f6" fontFamily="sans-serif" textAnchor="middle" fontWeight="700">S</text>
      <line x1="115" y1="110" x2="155" y2="110" stroke="var(--accent-color)" strokeWidth="2.5" markerEnd="url(#arr-far)" />
      <text x="135" y="100" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">v⃗</text>
      <line x1="110" y1="95" x2="210" y2="95" stroke="var(--accent-color)" strokeWidth="1" strokeDasharray="4,2" opacity="0.5" />
      <line x1="110" y1="110" x2="210" y2="110" stroke="var(--accent-color)" strokeWidth="1" strokeDasharray="4,2" opacity="0.5" />
      <line x1="110" y1="125" x2="210" y2="125" stroke="var(--accent-color)" strokeWidth="1" strokeDasharray="4,2" opacity="0.5" />
      <path d="M 218,30 A 60,80 0 0,1 260,60" fill="none" stroke="var(--primary)" strokeWidth="2" markerEnd="url(#arr-far-i)" />
      <text x="258" y="42" fontSize="10" fill="var(--primary)" fontFamily="sans-serif" fontWeight="600">I_ind</text>
      <text x="160" y="215" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">ε = −dΦ_B/dt</text>
      <text x="160" y="235" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">{"Lenz's Law: induced current opposes the change in flux"}</text>
    </svg>
  );
}

/** RL circuit — current growth curve */
export function RLCircuitDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 300 230" className={className} role="img" aria-label="RL circuit current growth toward epsilon over R">
      <line x1="40" y1="180" x2="280" y2="180" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="40" y1="180" x2="40" y2="20" stroke="var(--foreground)" strokeWidth="2" />
      <text x="160" y="205" fontSize="11" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">t</text>
      <text x="25" y="100" fontSize="11" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600" transform="rotate(-90,25,100)">I</text>
      <line x1="40" y1="40" x2="280" y2="40" stroke="var(--foreground)" strokeWidth="1" strokeDasharray="5,3" opacity="0.4" />
      <text x="285" y="44" fontSize="9" fill="var(--foreground)" fontFamily="sans-serif">ε/R</text>
      <path d="M 40,180 C 80,178 100,70 140,50 S 220,42 270,40" fill="none" stroke="var(--accent-color)" strokeWidth="2.5" />
      <text x="190" y="70" fontSize="10" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="600">I = (ε/R)(1 − e^(−Rt/L))</text>
      <line x1="110" y1="180" x2="110" y2="65" stroke="var(--primary)" strokeWidth="1" strokeDasharray="3,2" />
      <text x="110" y="195" fontSize="9" fill="var(--primary)" fontFamily="sans-serif" textAnchor="middle">τ = L/R</text>
      <text x="160" y="225" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">Inductor opposes changes in current</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Unit 10 — Maxwell's Equations & EM Waves
// ═══════════════════════════════════════════════════════════════

/** EM wave — E, B, k orthogonal */
export function EMWaveDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 340 220" className={className} role="img" aria-label="Electromagnetic wave showing orthogonal E and B fields">
      <defs>
        <marker id="arr-em-k" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="var(--foreground)" /></marker>
      </defs>
      <line x1="30" y1="110" x2="320" y2="110" stroke="var(--foreground)" strokeWidth="1.5" markerEnd="url(#arr-em-k)" />
      <text x="325" y="115" fontSize="10" fill="var(--foreground)" fontFamily="sans-serif" fontWeight="600">k⃗</text>
      <path d="M 30,110 C 50,110 55,40 75,40 S 95,110 115,110 S 135,180 155,180 S 175,110 195,110 S 215,40 235,40 S 255,110 275,110 S 295,180 310,170" fill="none" stroke="var(--accent-color)" strokeWidth="2" />
      <text x="85" y="30" fontSize="11" fill="var(--accent-color)" fontFamily="sans-serif" fontWeight="700">E⃗</text>
      <path d="M 30,110 C 50,110 55,85 75,85 S 95,110 115,110 S 135,135 155,135 S 175,110 195,110 S 215,85 235,85 S 255,110 275,110 S 295,135 310,130" fill="none" stroke="var(--primary)" strokeWidth="2" strokeDasharray="6,3" />
      <text x="160" y="148" fontSize="11" fill="var(--primary)" fontFamily="sans-serif" fontWeight="700">B⃗</text>
      <line x1="30" y1="195" x2="195" y2="195" stroke="var(--foreground)" strokeWidth="1" />
      <line x1="30" y1="190" x2="30" y2="200" stroke="var(--foreground)" strokeWidth="1" />
      <line x1="195" y1="190" x2="195" y2="200" stroke="var(--foreground)" strokeWidth="1" />
      <text x="112" y="210" fontSize="10" fill="var(--foreground)" fontFamily="sans-serif" textAnchor="middle">λ</text>
      <text x="170" y="15" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">{"E⃗ ⊥ B⃗ ⊥ k⃗   |   c = 1/√(μ₀ε₀)"}</text>
    </svg>
  );
}

/** Displacement current diagram */
export function DisplacementCurrentDiagram({ className }: DiagramProps) {
  return (
    <svg viewBox="0 0 320 240" className={className} role="img" aria-label="Displacement current between capacitor plates">
      <defs>
        <marker id="arr-dc" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="var(--accent-color)" /></marker>
        <marker id="arr-dc-b" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="var(--primary)" /></marker>
      </defs>
      <line x1="20" y1="100" x2="100" y2="100" stroke="var(--foreground)" strokeWidth="2" />
      <rect x="100" y="50" width="8" height="100" fill="var(--foreground)" fillOpacity="0.2" stroke="var(--foreground)" strokeWidth="2" />
      <rect x="212" y="50" width="8" height="100" fill="var(--foreground)" fillOpacity="0.2" stroke="var(--foreground)" strokeWidth="2" />
      <line x1="220" y1="100" x2="300" y2="100" stroke="var(--foreground)" strokeWidth="2" />
      {[70,85,100,115,130].map((y,i) => (
        <line key={i} x1="112" y1={y} x2="208" y2={y} stroke="var(--accent-color)" strokeWidth="1.5" markerEnd="url(#arr-dc)" />
      ))}
      <text x="160" y="145" fontSize="9" fill="var(--accent-color)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">dE/dt ≠ 0</text>
      <text x="60" y="90" fontSize="10" fill="var(--foreground)" fontFamily="sans-serif" fontWeight="600">I →</text>
      <text x="255" y="90" fontSize="10" fill="var(--foreground)" fontFamily="sans-serif" fontWeight="600">→ I</text>
      <circle cx="160" cy="100" r="55" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="5,3" />
      <text x="218" y="58" fontSize="9" fill="var(--primary)" fontFamily="sans-serif" fontWeight="600">B⃗ (from I_d)</text>
      <path d="M 160,45 A 55,55 0 0,1 215,100" fill="none" stroke="var(--primary)" strokeWidth="1.5" markerEnd="url(#arr-dc-b)" />
      <text x="160" y="185" fontSize="10" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle" fontWeight="600">I_d = ε₀ dΦ_E/dt</text>
      <text x="160" y="205" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">{"Maxwell's fix: ∮B⃗·dl⃗ = μ₀(I + I_d)"}</text>
      <text x="160" y="225" fontSize="9" fill="var(--muted-foreground)" fontFamily="sans-serif" textAnchor="middle">Changing E-field generates B-field</text>
    </svg>
  );
}
