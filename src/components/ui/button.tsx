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
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium glass-btn",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1",
          "disabled:pointer-events-none disabled:opacity-40",
          // Variant styles
          {
            "bg-primary text-primary-foreground hover:opacity-90 shadow-sm": variant === "default",
            "border border-[var(--glass-border)] bg-transparent text-foreground hover:bg-[var(--glass-fill)]": variant === "outline",
            "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--glass-fill-hover)]": variant === "secondary",
            "text-[var(--foreground)] hover:bg-[var(--glass-fill)]": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
            "bg-destructive text-destructive-foreground hover:opacity-90 shadow-sm": variant === "destructive",
          },
          // Size variants
          {
            "h-9 px-4 py-2": size === "default",
            "h-8 px-3 text-xs rounded-lg": size === "sm",
            "h-11 px-6 text-base": size === "lg",
            "h-9 w-9": size === "icon",
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
