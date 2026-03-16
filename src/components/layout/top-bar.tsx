"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggleSimple } from "@/components/theme-toggle"
import { NotificationBell } from "@/components/notification-bell"
import { ThemePicker } from "@/components/ui/ThemePicker"
import { 
  Search, 
  Menu,
  User,
  Settings,
  LogOut,
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/discover?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 border-b"
      style={{
        background: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
        backdropFilter: "saturate(180%) blur(48px)",
        WebkitBackdropFilter: "saturate(180%) blur(48px)",
      }}
    >
      <div className="flex h-full items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-[10px] hover:bg-[var(--glass-fill)] transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 flex-shrink-0 logo-spark" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
                <defs>
                  <linearGradient id="topbar-spark" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#34AAFF"/>
                    <stop offset="45%" stopColor="#007AFF"/>
                    <stop offset="100%" stopColor="#5856D6"/>
                  </linearGradient>
                  <linearGradient id="topbar-specular" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
                    <stop offset="0%" stopColor="white" stopOpacity={0.22}/>
                    <stop offset="55%" stopColor="white" stopOpacity={0.04}/>
                    <stop offset="100%" stopColor="white" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="7" fill="#080810"/>
                <rect width="32" height="32" rx="7" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={0.75}/>
                <path d="M16 4 L19.5 12.5 L28 16 L19.5 19.5 L16 28 L12.5 19.5 L4 16 L12.5 12.5 Z" fill="url(#topbar-spark)"/>
                <path d="M16 4 L19.5 12.5 L28 16 L19.5 19.5 L16 28 L12.5 19.5 L4 16 L12.5 12.5 Z" fill="url(#topbar-specular)"/>
              </svg>
            </div>
            <span className="font-heading font-bold text-[1.15rem] tracking-tight" style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}>Koda</span>
          </Link>
        </div>

        {/* Center - Search Bar (pill shaped glass) */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
            <input
              type="search"
              placeholder="Search sets, resources…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-10 pr-4 rounded-full text-sm transition-all
                border focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-0
                placeholder:text-[var(--muted-foreground)]"
              style={{
                background: "var(--glass-fill)",
                backdropFilter: "saturate(180%) blur(48px)",
                WebkitBackdropFilter: "saturate(180%) blur(48px)",
                borderColor: "var(--glass-border)",
                color: "var(--foreground)",
                boxShadow: "inset 0 1px 0 var(--glass-highlight)",
              }}
              aria-label="Search"
            />
          </div>
        </form>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <ThemeToggleSimple />
          <NotificationBell />
          
          {session ? (
            <div className="relative group">
              <button className="h-8 w-8 rounded-full flex items-center justify-center avatar-glow transition-all"
                style={{ background: "var(--glass-fill)", border: "1px solid var(--glass-border)" }}
              >
                {session.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt="" 
                    className="h-9 w-9 rounded-full"
                  />
                ) : (
                  <User className="h-5 w-5 text-[var(--accent)]" />
                )}
              </button>
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl py-2 opacity-0 invisible
                  group-hover:opacity-100 group-hover:visible transition-all duration-200"
                style={{
                  background: "var(--popover)",
                  border: "1px solid var(--glass-border)",
                  backdropFilter: "saturate(200%) blur(64px)",
                  WebkitBackdropFilter: "saturate(200%) blur(64px)",
                  boxShadow: "var(--glass-shadow), inset 0 1px 0 0 var(--glass-highlight)",
                }}
              >
                <div className="px-4 py-2" style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  <p className="text-sm font-medium text-foreground">{session.user?.name || "User"}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{session.user?.email}</p>
                  {session.user?.role === "ADMIN" && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded" style={{ background: "color-mix(in srgb, var(--accent) 14%, transparent)", color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)" }}>
                      Admin
                    </span>
                  )}
                </div>
                <Link 
                  href="/settings" 
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--glass-fill)] transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <div className="px-3 py-2" style={{ borderTop: "1px solid var(--glass-border)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>Theme</p>
                  <ThemePicker />
                </div>
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--glass-fill)] transition-colors text-[var(--destructive)]"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
