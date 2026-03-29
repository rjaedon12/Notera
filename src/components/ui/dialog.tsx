"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    if (open) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [open, onOpenChange])

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div
        className="fixed inset-0 backdrop-blur-md"
        style={{ background: "rgba(0,0,0,0.4)" }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        onClick={() => onOpenChange(false)}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogContent({ className, children, ...props }: DialogContentProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl max-w-lg w-full p-6 backdrop-blur-[40px] animate-slide-up",
        className
      )}
      style={{
        background: "var(--popover)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--glass-shadow), inset 0 1px 0 0 var(--glass-highlight)",
        color: "var(--foreground)",
      }}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4", className)} {...props} />
  )
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-lg font-semibold text-foreground font-heading", className)} {...props} />
  )
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground mt-1", className)} {...props} />
  )
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex justify-end gap-2 mt-6", className)} {...props} />
  )
}
