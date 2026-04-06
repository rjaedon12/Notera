"use client"

import Link from "next/link"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ThemeToggleSimple } from "@/components/theme-toggle"
import { NotificationBell } from "@/components/notification-bell"
import { ThemePicker } from "@/components/ui/ThemePicker"
import { 
  Search, 
  Menu,
  User,
  Settings,
  LogOut,
  Trophy,
} from "lucide-react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CreateMenu } from "@/components/layout/create-menu"
import { SearchResultsDropdown, type SearchResult } from "@/components/layout/search-results-dropdown"

interface TopBarProps {
  onMenuClick: () => void
}

interface AchievementsMenuData {
  total: number
  unlocked: number
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const { data: achievementsSummary, isLoading: isAchievementsLoading } = useQuery<AchievementsMenuData>({
    queryKey: ["achievements", "menu-summary"],
    queryFn: async () => {
      const res = await fetch("/api/achievements")
      if (!res.ok) {
        throw new Error("Failed to fetch achievements")
      }
      return res.json() as Promise<AchievementsMenuData>
    },
    enabled: Boolean(session),
    staleTime: 60_000,
    retry: false,
  })

  const achievementsProgress = achievementsSummary?.total
    ? (achievementsSummary.unlocked / achievementsSummary.total) * 100
    : 0

  const fetchSearchResults = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }
    setIsSearching(true)
    setShowDropdown(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.results ?? [])
      }
    } catch {
      // silently fail
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSearchResults(value), 300)
  }

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setShowDropdown(false)
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
      }}
    >
      <div className="flex h-full items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 flex-shrink-0 logo-spark overflow-hidden rounded-[22%]" aria-hidden="true">
              <Image src="/notera-logo.png" alt="" width={32} height={32} className="h-8 w-8" />
            </div>
            <span className="font-heading font-bold text-[1.15rem] tracking-tight" style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}>Notera</span>
          </Link>
        </div>

        {/* Center - Search Bar (pill shaped glass) */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-6">
          <div className="relative" ref={searchContainerRef}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
            <input
              type="search"
              placeholder="Search sets, quizzes, notes…"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => { if (searchQuery.trim().length >= 2) setShowDropdown(true) }}
              className="w-full h-9 pl-10 pr-4 rounded-full text-sm transition-all
                border-none focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30 focus:ring-offset-0
                placeholder:text-[var(--muted-foreground)]"
              style={{
                background: "var(--background-tertiary)",
                color: "var(--foreground)",
              }}
              aria-label="Search"
            />
            {showDropdown && (
              <SearchResultsDropdown
                results={searchResults}
                isLoading={isSearching}
                onSelect={() => { setShowDropdown(false); setSearchQuery("") }}
              />
            )}
          </div>
        </form>

        {/* Right section */}
        <div className="flex items-center gap-1.5">
          <CreateMenu />
          <ThemeToggleSimple />
          <NotificationBell />
          
          {session ? (
            <div className="relative group">
              <button className="h-8 w-8 rounded-full flex items-center justify-center transition-all overflow-hidden"
                style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
              >
                {session.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt="" 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-[var(--accent-color)]" />
                )}
              </button>
              <div
                className="absolute right-0 top-full mt-2 w-64 rounded-xl py-2 opacity-0 invisible
                  group-hover:opacity-100 group-hover:visible transition-all duration-200"
                style={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <div className="px-4 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                  <p className="text-sm font-medium text-foreground">{session.user?.name || "User"}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{session.user?.email}</p>
                  {session.user?.role === "ADMIN" && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded" style={{ background: "color-mix(in srgb, var(--accent-color) 14%, transparent)", color: "var(--accent-color)", border: "1px solid color-mix(in srgb, var(--accent-color) 22%, transparent)" }}>
                      Admin
                    </span>
                  )}
                  {session.user?.role === "TEACHER" && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded" style={{ background: "color-mix(in srgb, var(--accent-color) 14%, transparent)", color: "var(--accent-color)", border: "1px solid color-mix(in srgb, var(--accent-color) 22%, transparent)" }}>
                      Teacher
                    </span>
                  )}
                </div>
                <Link 
                  href="/settings" 
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <Link
                  href="/achievements"
                  className="mx-3 my-1 block rounded-xl border px-3 py-3 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  style={{
                    borderColor: "var(--glass-border)",
                    background: "var(--glass-fill)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: "color-mix(in srgb, var(--primary) 14%, transparent)",
                        color: "var(--primary)",
                      }}
                    >
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">Achievements</p>
                        {achievementsSummary?.total ? (
                          <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                            {achievementsSummary.unlocked}/{achievementsSummary.total}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {isAchievementsLoading
                          ? "Loading achievement progress..."
                          : achievementsSummary?.total
                            ? "Track milestone unlocks and overall trophy progress."
                            : "View your trophy cabinet and milestone progress."}
                      </p>
                      <div
                        className="mt-2 h-1.5 overflow-hidden rounded-full"
                        style={{ background: "color-mix(in srgb, var(--border) 70%, transparent)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${achievementsProgress}%`,
                            background: "linear-gradient(90deg, var(--primary), var(--accent-color))",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="px-3 py-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>Theme</p>
                  <ThemePicker />
                </div>
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors text-[var(--destructive)]"
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
