"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface NavIconProps {
  children: React.ReactNode
  className?: string
}
function NavIcon({ children, className }: NavIconProps) {
  return (
    <span className={cn("flex h-5 w-5 shrink-0 [&>svg]:h-full [&>svg]:w-full [&>svg]:stroke-current", className)}>
      {children}
    </span>
  )
}

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  requiresAuth?: boolean
  requiresAdmin?: boolean
}

const navItems: NavItem[] = [
  // Core
  { href: "/", label: "Home", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-5h-6v5H4a1 1 0 01-1-1z"/></svg></NavIcon> },
  { href: "/discover", label: "Discover", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><line x1="12" y1="3" x2="12" y2="5.5"/><line x1="12" y1="18.5" x2="12" y2="21"/><line x1="3" y1="12" x2="5.5" y2="12"/><line x1="18.5" y1="12" x2="21" y2="12"/><path d="M14.5 9.5l-5.5 2-2 5.5 5.5-2z" strokeWidth="1.4"/></svg></NavIcon> },
  { href: "/library", label: "Library", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V6a1 1 0 011-1h5.5a2 2 0 012 2v12"/><path d="M20 19V6a1 1 0 00-1-1h-5.5a2 2 0 00-2 2v12"/><path d="M2 19h20"/><path d="M12 7v12"/></svg></NavIcon>, requiresAuth: true },
  // Study tools
  { href: "/notes", label: "Notes", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3h14a1 1 0 011 1v16l-3-2-2 2-2-2-2 2-2-2-3 2V4a1 1 0 011-1z"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg></NavIcon>, requiresAuth: true },
  { href: "/studyguides", label: "Study Guides", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg></NavIcon>, requiresAuth: true },
  { href: "/whiteboard", label: "Whiteboard", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M15 18v2M9 18v2M6 20h12"/><path d="M7 9l2.5 2.5L14 8" strokeWidth="1.7"/></svg></NavIcon>, requiresAuth: true },
  { href: "/quizzes", label: "Quizzes", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><path d="M9 10l1.5 1.5L14 8" strokeWidth="1.7"/></svg></NavIcon>, requiresAuth: true },
  { href: "/sightreading", label: "Sightreading", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4h6"/><path d="M12 4v4"/><path d="M7 8h10"/><path d="M15 8c0 4-1 7-3 9-2-2-3-5-3-9"/><circle cx="7" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="17" cy="11" r="1" fill="currentColor" stroke="none"/><path d="M4 20l3-5M20 20l-3-5M7 15h10"/></svg></NavIcon>, requiresAuth: true },
  { href: "/dbq", label: "DBQ Practice", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M10 12a2 2 0 100 4 2 2 0 000-4z"/><path d="M16 18l-2.5-2.5"/></svg></NavIcon>, requiresAuth: true },
  { href: "/daily-review", label: "Daily Review", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg></NavIcon>, requiresAuth: true },
  // Progress
  { href: "/analytics", label: "Analytics", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-6 4 4 4-6" strokeWidth="1.7"/></svg></NavIcon>, requiresAuth: true },
  { href: "/achievements", label: "Achievements", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg></NavIcon>, requiresAuth: true },
]

const bottomItems: NavItem[] = [
  { href: "/create", label: "Create", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></NavIcon>, requiresAuth: true },
  { href: "/settings", label: "Settings", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" strokeWidth="1.5"/></svg></NavIcon>, requiresAuth: true },
  { href: "/admin", label: "Admin", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6z"/></svg></NavIcon>, requiresAuth: true, requiresAdmin: true },
]

const experimentalItems: NavItem[] = [
  { href: "/resources", label: "Resources", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg></NavIcon>, requiresAuth: true },
  { href: "/timeline-builder", label: "Timeline Builder", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12" strokeWidth="1.2"/><circle cx="6" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M6 12v-2M12 12V8M18 12v-3" strokeWidth="1.4"/></svg></NavIcon>, requiresAuth: true },
  { href: "/math", label: "Math Lab", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V9l-5-6z"/><path d="M9 3v5a1 1 0 001 1h5"/><path d="M9 17c.5-1 1.5-2 3-2s2.5 1 3 2"/><circle cx="12" cy="11" r="2"/></svg></NavIcon> },
  { href: "/groups", label: "Study Groups", icon: <NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3"/><circle cx="15" cy="8" r="3"/><path d="M3 20a6 6 0 0112 0"/><path d="M15 11a5 5 0 015 5v4"/></svg></NavIcon>, requiresAuth: true },
]

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"
  // Always start closed — only open when user explicitly clicks
  const [experimentalOpen, setExperimentalOpen] = useState(false)

  // Auto-expand only if the user navigates directly to an experimental page
  useEffect(() => {
    const isOnExperimental = experimentalItems.some(
      item => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
    )
    if (isOnExperimental) setExperimentalOpen(true)
  }, [pathname])

  const toggleExperimental = () => setExperimentalOpen(prev => !prev)

  const filterItems = (items: NavItem[]) => {
    return items.filter(item => {
      if (item.requiresAdmin && !isAdmin) return false
      if (item.requiresAuth && !session) return false
      return true
    })
  }

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href || 
      (item.href !== "/" && pathname.startsWith(item.href))

    return (
      <Link key={item.href} href={item.href} title={isCollapsed ? item.label : undefined}>
        <div
          className={cn(
            "relative inline-flex items-center gap-3 whitespace-nowrap rounded-[10px] text-sm font-medium transition-all w-full h-9 px-3",
            isCollapsed && "justify-center px-0",
            isActive
              ? "text-foreground"
              : "hover:text-foreground hover:bg-[var(--glass-fill)]"
          )}
          style={isActive ? {
            background: "rgba(255,255,255,0.10)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 1px 3px rgba(0,0,0,0.10)",
            color: "var(--foreground)",
          } : {
            color: "var(--muted-foreground)",
          }}
        >
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full" style={{ background: "var(--accent-color)" }} />
          )}
          <span className={cn("shrink-0", isActive && !isCollapsed && "ml-1")}>{item.icon}</span>
          {!isCollapsed && <span>{item.label}</span>}
        </div>
      </Link>
    )
  }

  /** Renders a small section label when sidebar is expanded */
  const renderSectionLabel = (label: string) => {
    if (isCollapsed) return <div className="h-2" />
    return (
      <div className="px-3 pt-4 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>
          {label}
        </span>
      </div>
    )
  }

  // Split navItems into sections for better organization
  const coreItems = filterItems(navItems.filter(i => ["/", "/discover", "/library"].includes(i.href)))
  const studyItems = filterItems(navItems.filter(i => ["/notes", "/studyguides", "/whiteboard", "/quizzes", "/sightreading", "/dbq", "/daily-review"].includes(i.href)))
  const progressItems = filterItems(navItems.filter(i => ["/analytics", "/achievements"].includes(i.href)))

  const isOnExperimentalPage = experimentalItems.some(
    item => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
  )

  return (
    <aside
      className={cn(
        "fixed left-0 top-14 h-[calc(100vh-3.5rem)] z-30 transition-all duration-300",
        "border-r",
        isCollapsed ? "w-16" : "w-56"
      )}
      style={{
        background: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
        backdropFilter: "saturate(180%) blur(48px)",
        WebkitBackdropFilter: "saturate(180%) blur(48px)",
      }}
    >
      <div className="flex flex-col h-full p-3">
        {/* Main Navigation — sectioned for clarity */}
        <nav className="flex-1 min-h-0 nav-stagger mt-2 overflow-y-auto">
          {/* Core */}
          <div className="space-y-0.5">
            {coreItems.map(renderNavItem)}
          </div>
          {/* Study Tools */}
          {studyItems.length > 0 && (
            <>
              {renderSectionLabel("Study Tools")}
              <div className="space-y-0.5">
                {studyItems.map(renderNavItem)}
              </div>
            </>
          )}
          {/* Progress */}
          {progressItems.length > 0 && (
            <>
              {renderSectionLabel("Progress")}
              <div className="space-y-0.5">
                {progressItems.map(renderNavItem)}
              </div>
            </>
          )}
        </nav>

        {/* Experimental Features Section */}
        <div className="pt-3 space-y-0.5" style={{ borderTop: "1px solid var(--glass-border)" }}>
          {isCollapsed ? (
            // Collapsed mode: single icon that links to /experimental
            <Link href="/experimental">
              <div
                className={cn(
                  "relative inline-flex items-center justify-center rounded-[10px] text-sm font-medium transition-all w-full h-9 px-0",
                  "hover:bg-[var(--glass-fill)]"
                )}
                style={isOnExperimentalPage ? {
                  background: "rgba(167,139,250,0.12)",
                } : {}}
                title="Experimental Features"
              >
                <span style={{ color: "#a78bfa" }}><NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg></NavIcon></span>
              </div>
            </Link>
          ) : (
            // Expanded mode: toggle button with chevron
            <>
              <button
                onClick={toggleExperimental}
                className="relative inline-flex items-center gap-3 whitespace-nowrap rounded-[10px] text-sm font-medium transition-all w-full h-9 px-3 hover:bg-[var(--glass-fill)]"
              >
                <span style={{ color: "#a78bfa" }}><NavIcon><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg></NavIcon></span>
                <span className="flex-1 text-left" style={{ color: "#a78bfa" }}>Experimental</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    experimentalOpen && "rotate-180"
                  )}
                  style={{ color: "#a78bfa" }}
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {/* Sub-items — only visible when explicitly opened */}
              {experimentalOpen && (
                <div className="pl-2 space-y-0.5">
                  {filterItems(experimentalItems).map(renderNavItem)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="pt-3 space-y-0.5" style={{ borderTop: "1px solid var(--glass-border)" }}>
          {filterItems(bottomItems).map(renderNavItem)}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className="mt-3 flex items-center justify-center h-9 rounded-[10px] transition-all hover:bg-[var(--glass-fill)]"
          style={{ border: "1px solid var(--glass-border)" }}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className={cn("transition-transform duration-300", isCollapsed ? "rotate-0" : "rotate-180")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[var(--muted-foreground)]"><path d="M9 18l6-6-6-6"/></svg>
          </span>
        </button>
      </div>
    </aside>
  )
}

