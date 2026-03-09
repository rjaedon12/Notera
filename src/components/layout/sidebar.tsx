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
  ChevronLeft,
  ChevronRight,
  Clock,
  PenTool,
  Brain,
  BarChart3,
  CalendarCheck,
  Trophy,
  ScrollText,
} from "lucide-react"

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
  { href: "/", label: "Home", icon: <Home className="h-5 w-5" /> },
  { href: "/discover", label: "Discover", icon: <Compass className="h-5 w-5" /> },
  { href: "/library", label: "Library", icon: <Library className="h-5 w-5" />, requiresAuth: true },
  { href: "/groups", label: "Groups", icon: <Users className="h-5 w-5" />, requiresAuth: true },
  { href: "/resources", label: "Resources", icon: <FileText className="h-5 w-5" />, requiresAuth: true },
  { href: "/timeline-builder", label: "Timeline Builder", icon: <Clock className="h-5 w-5" />, requiresAuth: true },
  { href: "/whiteboard", label: "Whiteboard", icon: <PenTool className="h-5 w-5" />, requiresAuth: true },
  { href: "/quizzes", label: "Quizzes", icon: <Brain className="h-5 w-5" />, requiresAuth: true },
  { href: "/dbq", label: "DBQ Practice", icon: <ScrollText className="h-5 w-5" />, requiresAuth: true },
  { href: "/daily-review", label: "Daily Review", icon: <CalendarCheck className="h-5 w-5" />, requiresAuth: true },
  { href: "/analytics", label: "Analytics", icon: <BarChart3 className="h-5 w-5" />, requiresAuth: true },
  { href: "/achievements", label: "Achievements", icon: <Trophy className="h-5 w-5" />, requiresAuth: true },
]

const bottomItems: NavItem[] = [
  { href: "/create", label: "Create", icon: <Plus className="h-5 w-5" />, requiresAuth: true },
  { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" />, requiresAuth: true },
  { href: "/admin", label: "Admin", icon: <Shield className="h-5 w-5" />, requiresAuth: true, requiresAdmin: true },
]

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

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
      <Link 
        key={item.href} 
        href={item.href}
      >
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
          {/* Active indicator bar */}
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full" style={{ background: "var(--primary)" }} />
          )}
          <span className={cn(isActive && !isCollapsed && "ml-1")}>{item.icon}</span>
          {!isCollapsed && <span>{item.label}</span>}
        </div>
      </Link>
    )
  }

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
        {/* Main Navigation */}
        <nav className="flex-1 space-y-0.5 nav-stagger mt-2">
          {filterItems(navItems).map(renderNavItem)}
        </nav>

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
