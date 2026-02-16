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
  BookOpen,
  Clock,
  PenTool,
  Brain
} from "lucide-react"
import { Button } from "@/components/ui/button"

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
            "inline-flex items-center justify-start gap-3 whitespace-nowrap rounded-lg text-sm font-medium transition-all w-full h-11 px-3",
            "hover:bg-muted hover:text-foreground", // Ghost hover
            isCollapsed && "justify-center px-0",
            isActive 
              ? "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
              : "text-foreground"
          )}
        >
          {item.icon}
          {!isCollapsed && <span>{item.label}</span>}
        </div>
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background border-r border-border z-30 transition-all duration-300",
        isCollapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex flex-col h-full p-3">
        {/* Logo when collapsed */}
        {isCollapsed && (
          <div className="flex justify-center mb-4">
            <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1">
          {filterItems(navItems).map(renderNavItem)}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-border pt-3 space-y-1">
          {filterItems(bottomItems).map(renderNavItem)}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className="mt-3 flex items-center justify-center h-10 rounded-lg border border-border hover:bg-muted transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  )
}
