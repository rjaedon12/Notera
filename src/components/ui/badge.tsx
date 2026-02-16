"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "selected" | "destructive"
  removable?: boolean
  onRemove?: () => void
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", removable, onRemove, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles - Quizlet-like pill shape
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-all",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
          // Variant styles - all token-driven
          {
            // Default: Muted surface, clear in both themes
            "bg-muted text-foreground border border-border hover:bg-muted/80": variant === "default",
            
            // Secondary: Slightly more prominent
            "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
            
            // Outline: Transparent with visible border
            "border border-border bg-transparent text-foreground hover:bg-muted": variant === "outline",
            
            // Selected: Primary accent (for active filters/chips)
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === "selected",
            
            // Destructive: For tags that can be removed
            "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20": variant === "destructive",
          },
          className
        )}
        {...props}
      >
        {children}
        {removable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove?.()
            }}
            className="hover:opacity-70 transition-opacity focus:outline-none"
            aria-label="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
