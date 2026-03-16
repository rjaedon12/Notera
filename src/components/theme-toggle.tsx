"use client"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--glass-fill)", border: "1px solid var(--glass-border)" }}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("light")}
        className={cn(
          "h-8 w-8 p-0 rounded-lg",
          theme === "light" && "bg-[var(--glass-fill-hover)]"
        )}
        aria-label="Light mode"
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("dark")}
        className={cn(
          "h-8 w-8 p-0 rounded-lg",
          theme === "dark" && "bg-[var(--glass-fill-hover)]"
        )}
        aria-label="Dark mode"
      >
        <Moon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("system")}
        className={cn(
          "h-8 w-8 p-0 rounded-lg",
          theme === "system" && "bg-[var(--glass-fill-hover)]"
        )}
        aria-label="System theme"
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function ThemeToggleSimple() {
  const { resolvedTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <button
      onClick={toggleTheme}
      className="h-9 w-9 rounded-full flex items-center justify-center transition-all hover:bg-[var(--glass-fill)]"
      style={{ border: "1px solid transparent" }}
      aria-label="Toggle theme"
    >
      <span
        key={resolvedTheme}
        className="theme-icon-enter"
      >
        {resolvedTheme === "dark" ? (
          <Sun className="h-[18px] w-[18px]" />
        ) : (
          <Moon className="h-[18px] w-[18px]" />
        )}
      </span>
    </button>
  )
}
