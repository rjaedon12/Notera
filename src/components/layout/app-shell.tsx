"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed")
    if (saved !== null) {
      setSidebarCollapsed(saved === "true")
    }
  }, [])

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem("sidebarCollapsed", String(newState))
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar onMenuClick={toggleSidebar} />
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <main
        className="pt-16 transition-all duration-300"
        style={{ paddingLeft: sidebarCollapsed ? "4rem" : "14rem" }}
      >
        <div className="min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </main>
    </div>
  )
}
