"use client"

import { useState, useEffect } from "react"
import { NoteSidebar } from "@/components/notes/NoteSidebar"
import { PanelLeftClose, PanelLeft } from "lucide-react"

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("notesSidebarCollapsed")
    if (saved !== null) {
      setSidebarCollapsed(saved === "true")
    }
    setMounted(true)
  }, [])

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem("notesSidebarCollapsed", String(newState))
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden relative">
      {/* Sidebar */}
      <NoteSidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Sidebar toggle — sticky so it scrolls with content viewport */}
        <div className="sticky top-2 z-20 pointer-events-none" style={{ height: 0 }}>
          <button
            onClick={toggleSidebar}
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{
              marginLeft: "0.5rem",
            }}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
            ) : (
              <PanelLeftClose className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
            )}
          </button>
        </div>

        <div
          className={`transition-opacity duration-300 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
