"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Plus } from "lucide-react"

interface MenuItem {
  label: string
  href: string
  icon: React.ReactNode
}

const menuItems: MenuItem[] = [
  {
    label: "Flashcard set",
    href: "/create",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 stroke-current">
        <rect x="2" y="4" width="16" height="14" rx="2" />
        <rect x="6" y="6" width="16" height="14" rx="2" />
      </svg>
    ),
  },
  {
    label: "Study guide",
    href: "/studyguides",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 stroke-current">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
  {
    label: "Practice test",
    href: "/quizzes/create",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 stroke-current">
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9" />
      </svg>
    ),
  },
  {
    label: "Folder",
    href: "/library?newFolder=true",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 stroke-current">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    label: "Study group",
    href: "/spaces",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 stroke-current">
        <circle cx="9" cy="8" r="3" />
        <circle cx="15" cy="8" r="3" />
        <path d="M3 20a6 6 0 0112 0" />
        <path d="M15 11a5 5 0 015 5v4" />
      </svg>
    ),
  },
]

export function CreateMenu() {
  const { data: session } = useSession()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  if (!session) return null

  return (
    <div className="relative" ref={menuRef}>
      {/* Plus button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 hover:opacity-90 active:scale-95"
        style={{
          background: "var(--accent-color)",
          color: "white",
        }}
        aria-label="Create new"
        aria-expanded={open}
      >
        <Plus
          className="h-4 w-4 transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-2xl py-2 animate-slide-up"
          style={{
            background: "var(--popover)",
            border: "1px solid var(--glass-border)",
            backdropFilter: "saturate(200%) blur(64px)",
            WebkitBackdropFilter: "saturate(200%) blur(64px)",
            boxShadow:
              "var(--glass-shadow), inset 0 1px 0 0 var(--glass-highlight)",
          }}
        >
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => {
                setOpen(false)
                router.push(item.href)
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left 
                hover:bg-[var(--glass-fill)] transition-colors"
              style={{ color: "var(--foreground)" }}
            >
              <span className="text-[var(--muted-foreground)]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
