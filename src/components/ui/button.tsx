"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles - consistent across all variants
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          // Variant styles - all token-driven for theme safety
          {
            // Primary/Default: Vibrant Quizlet-like blue accent
            "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm": variant === "default",
            
            // Outline: Clear border, transparent bg, visible in both themes
            "border border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground": variant === "outline",
            
            // Secondary: Subtle surface, not pure white/black
            "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
            
            // Ghost: Minimal, only shows background on hover
            "text-foreground hover:bg-muted hover:text-foreground": variant === "ghost",
            
            // Link: Text-only button
            "text-primary underline-offset-4 hover:underline": variant === "link",
            
            // Destructive: Red for dangerous actions
            "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm": variant === "destructive",
          },
          // Size variants
          {
            "h-10 px-4 py-2": size === "default",
            "h-8 px-3 text-xs": size === "sm",
            "h-12 px-6 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
