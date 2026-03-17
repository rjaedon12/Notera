"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { AnnouncementBanner } from "@/components/announcement-banner"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Landing page = unauthenticated on "/"
  const isLandingPage = pathname === "/" && status !== "loading" && !session?.user
  // Auth pages (login, signup, reset-password) — render without app chrome
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname.startsWith("/reset-password")

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed")
    if (saved !== null) {
      setSidebarCollapsed(saved === "true")
    }
    // Trigger mount animation
    requestAnimationFrame(() => setMounted(true))
  }, [])

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem("sidebarCollapsed", String(newState))
  }

  // Landing page — render without app chrome, forced light
  if (isLandingPage) {
    return (
      <div className="landing-surface min-h-screen relative overflow-x-hidden light" data-landing="true">
        {children}
      </div>
    )
  }

  // Auth pages — render without app chrome, forced light
  if (isAuthPage) {
    return (
      <div className="landing-surface min-h-screen relative overflow-x-hidden light" data-landing="true">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <TopBar onMenuClick={toggleSidebar} />
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <main
        className="pt-14 transition-all duration-300 relative z-10"
        style={{ paddingLeft: sidebarCollapsed ? "4rem" : "14rem" }}
      >
        {/* Global Announcement Banner */}
        <AnnouncementBanner />
        <div
          className={`min-h-[calc(100vh-4rem)] transition-all duration-500 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          {children}
        </div>
      </main>
    </div>
  )
}
