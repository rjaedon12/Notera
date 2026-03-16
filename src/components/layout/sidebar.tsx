"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { 
  Home, 
  Library, 
  Plus, 
  Users, 
  FileText, 
  Compass,
  Settings,
  Shield,
  ChevronRight,
  Clock,
  PenTool,
  Brain,
  BarChart3,
  CalendarCheck,
  Trophy,
  ScrollText,
  Music,
  FlaskConical,
  Beaker,
  ChevronDown,
  NotebookPen,
} from "lucide-react"
import { useState, useEffect } from "react"

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
  { href: "/", label: "Home", icon: <Home className="h-5 w-5" /> },
  { href: "/discover", label: "Discover", icon: <Compass className="h-5 w-5" /> },
  { href: "/library", label: "Library", icon: <Library className="h-5 w-5" />, requiresAuth: true },
  // Study tools
  { href: "/notes", label: "Notes", icon: <NotebookPen className="h-5 w-5" />, requiresAuth: true },
  { href: "/whiteboard", label: "Whiteboard", icon: <PenTool className="h-5 w-5" />, requiresAuth: true },
  { href: "/quizzes", label: "Quizzes", icon: <Brain className="h-5 w-5" />, requiresAuth: true },
  { href: "/sightreading", label: "Sightreading", icon: <Music className="h-5 w-5" />, requiresAuth: true },
  { href: "/dbq", label: "DBQ Practice", icon: <ScrollText className="h-5 w-5" />, requiresAuth: true },
  { href: "/daily-review", label: "Daily Review", icon: <CalendarCheck className="h-5 w-5" />, requiresAuth: true },
  // Progress
  { href: "/analytics", label: "Analytics", icon: <BarChart3 className="h-5 w-5" />, requiresAuth: true },
  { href: "/achievements", label: "Achievements", icon: <Trophy className="h-5 w-5" />, requiresAuth: true },
]

const bottomItems: NavItem[] = [
  { href: "/create", label: "Create", icon: <Plus className="h-5 w-5" />, requiresAuth: true },
  { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" />, requiresAuth: true },
  { href: "/admin", label: "Admin", icon: <Shield className="h-5 w-5" />, requiresAuth: true, requiresAdmin: true },
]

const experimentalItems: NavItem[] = [
  { href: "/resources", label: "Resources", icon: <FileText className="h-5 w-5" />, requiresAuth: true },
  { href: "/timeline-builder", label: "Timeline Builder", icon: <Clock className="h-5 w-5" />, requiresAuth: true },
  { href: "/math", label: "Math Lab", icon: <FlaskConical className="h-5 w-5" /> },
  { href: "/groups", label: "Study Groups", icon: <Users className="h-5 w-5" />, requiresAuth: true },
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
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full" style={{ background: "var(--accent)" }} />
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
  const studyItems = filterItems(navItems.filter(i => ["/notes", "/whiteboard", "/quizzes", "/sightreading", "/dbq", "/daily-review"].includes(i.href)))
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
                <Beaker className="h-5 w-5" style={{ color: "#a78bfa" }} />
              </div>
            </Link>
          ) : (
            // Expanded mode: toggle button with chevron
            <>
              <button
                onClick={toggleExperimental}
                className="relative inline-flex items-center gap-3 whitespace-nowrap rounded-[10px] text-sm font-medium transition-all w-full h-9 px-3 hover:bg-[var(--glass-fill)]"
              >
                <Beaker className="h-5 w-5 shrink-0" style={{ color: "#a78bfa" }} />
                <span className="flex-1 text-left" style={{ color: "#a78bfa" }}>Experimental</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    experimentalOpen && "rotate-180"
                  )}
                  style={{ color: "#a78bfa" }}
                />
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
            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
          </span>
        </button>
      </div>
    </aside>
  )
}

