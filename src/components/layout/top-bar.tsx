"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggleSimple } from "@/components/theme-toggle"
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
      className="fixed top-0 left-0 right-0 z-50 h-16 backdrop-blur-[32px] border-b"
      style={{
        background: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
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
          
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center font-heading"
              style={{ background: "var(--primary)", color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}
            >
              K
            </div>
            <span className="font-heading font-bold text-xl hidden sm:block text-foreground tracking-tight">Koda</span>
          </Link>
        </div>

        {/* Center - Search Bar (pill shaped glass) */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              type="search"
              placeholder="Search sets, resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-11 pr-4 rounded-full text-sm transition-all
                backdrop-blur-xl border focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-0
                placeholder:text-[var(--muted-foreground)]"
              style={{
                background: "var(--glass-fill)",
                borderColor: "var(--glass-border)",
                color: "var(--foreground)",
              }}
              aria-label="Search"
            />
          </div>
        </form>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <ThemeToggleSimple />
          
          {session ? (
            <div className="relative group">
              <button className="h-9 w-9 rounded-full flex items-center justify-center avatar-glow transition-all"
                style={{ background: "var(--glass-fill)", border: "1px solid var(--glass-border)" }}
              >
                {session.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt="" 
                    className="h-9 w-9 rounded-full"
                  />
                ) : (
                  <User className="h-5 w-5 text-[var(--primary)]" />
                )}
              </button>
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-xl py-2 opacity-0 invisible
                  group-hover:opacity-100 group-hover:visible transition-all duration-200 backdrop-blur-[40px]"
                style={{
                  background: "var(--popover)",
                  border: "1px solid var(--glass-border)",
                  boxShadow: "var(--glass-shadow), inset 0 1px 0 0 var(--glass-highlight)",
                }}
              >
                <div className="px-4 py-2" style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  <p className="text-sm font-medium text-foreground">{session.user?.name || "User"}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{session.user?.email}</p>
                  {session.user?.role === "ADMIN" && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded glass-tag" style={{ background: "rgba(79,142,247,0.15)", color: "var(--primary)", border: "1px solid rgba(79,142,247,0.2)" }}>
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
