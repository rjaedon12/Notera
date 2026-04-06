"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StreakIndicator } from "@/components/streak/streak-indicator"
import { 
  Search, 
  Home, 
  Library, 
  Plus, 
  Settings, 
  LogOut, 
  User,
  Menu,
  X
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function Header() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/notera-logo.png"
            alt="Notera logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-[22%]"
          />
          <span className="font-bold text-xl hidden sm:block">Notera</span>
        </Link>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search flashcard sets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
              aria-label="Search study sets"
            />
          </div>
        </form>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
          
          {session ? (
            <>
              <Link href="/library">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Library className="h-4 w-4" />
                  Library
                </Button>
              </Link>
              <Link href="/create">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create
                </Button>
              </Link>
              <StreakIndicator />
              <div className="relative group ml-2">
                <button className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--accent-color) 15%, transparent)' }}>
                  <User className="h-4 w-4" style={{ color: 'var(--accent-color)' }} />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-background rounded-lg shadow-lg border border-border py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium">{session.user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                  </div>
                  <Link href="/settings" className="block px-4 py-2 text-sm hover:bg-muted">
                    <Settings className="h-4 w-4 inline mr-2" />
                    Settings
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted text-red-600"
                  >
                    <LogOut className="h-4 w-4 inline mr-2" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search flashcard sets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </form>
          <nav className="flex flex-col gap-2">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
            {session ? (
              <>
                <Link href="/library" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Library className="h-4 w-4" />
                    Library
                  </Button>
                </Link>
                <Link href="/create" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-start gap-2">
                    <Plus className="h-4 w-4" />
                    Create
                  </Button>
                </Link>
                <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-2 text-red-600"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full">Log in</Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Sign up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
