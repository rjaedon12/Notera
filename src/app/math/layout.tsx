"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ChevronRight, FlaskConical } from "lucide-react"

export default function MathLabLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHub = pathname === "/math"

  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Math Lab", href: "/math" },
  ]

  if (segments.length > 1) {
    const slug = segments[segments.length - 1]
    const label = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
    breadcrumbs.push({ label, href: pathname })
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            {i === 0 && <Home className="h-3.5 w-3.5" />}
            {i < breadcrumbs.length - 1 ? (
              <Link
                href={crumb.href}
                className="hover:underline transition-colors"
                style={{ color: "var(--muted-foreground)" }}
              >
                {crumb.label}
              </Link>
            ) : (
              <span style={{ color: "var(--foreground)" }}>{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Header — only shown on the hub page */}
      {isHub && (
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(79,142,247,0.15)",
                border: "1px solid rgba(79,142,247,0.2)",
              }}
            >
              <FlaskConical className="h-5 w-5" style={{ color: "var(--primary)" }} />
            </div>
            <h1 className="text-3xl font-bold font-heading tracking-tight" style={{ color: "var(--foreground)" }}>
              Math Lab
            </h1>
          </div>
          <p className="text-base ml-[52px]" style={{ color: "var(--muted-foreground)" }}>
            Interactive visual tools for number theory and beyond
          </p>
        </header>
      )}

      {children}
    </div>
  )
}
