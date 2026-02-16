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
  BookOpen
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
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-muted transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl hidden sm:block text-foreground">StudyApp</span>
          </Link>
        </div>

        {/* Center - Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search sets, resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-muted border-0 focus:ring-2 focus:ring-blue-500"
              aria-label="Search"
            />
          </div>
        </form>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <ThemeToggleSimple />
          
          {session ? (
            <div className="relative group">
              <button className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                {session.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt="" 
                    className="h-9 w-9 rounded-full"
                  />
                ) : (
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </button>
              <div className="absolute right-0 top-full mt-2 w-56 bg-background rounded-lg shadow-lg border border-border py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{session.user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                  {session.user?.role === "ADMIN" && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                      Admin
                    </span>
                  )}
                </div>
                <Link 
                  href="/settings" 
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted text-red-600 dark:text-red-400"
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
