"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const PopoverContext = React.createContext<PopoverContextValue | undefined>(undefined)

function usePopoverContext() {
  const context = React.useContext(PopoverContext)
  if (!context) {
    throw new Error("Popover components must be used within a Popover")
  }
  return context
}

interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

interface PopoverTriggerProps {
  children: React.ReactElement<{ onClick?: () => void; "aria-expanded"?: boolean }>
  asChild?: boolean
}

export function PopoverTrigger({ children, asChild }: PopoverTriggerProps) {
  const { open, setOpen } = usePopoverContext()
  
  const handleClick = () => setOpen(!open)

  if (asChild) {
    return React.cloneElement(children, {
      onClick: handleClick,
      "aria-expanded": open,
    } as { onClick: () => void; "aria-expanded": boolean })
  }

  return (
    <button onClick={handleClick} aria-expanded={open}>
      {children}
    </button>
  )
}

interface PopoverContentProps {
  children: React.ReactNode
  className?: string
  align?: "start" | "center" | "end"
  sideOffset?: number
}

export function PopoverContent({ 
  children, 
  className,
  align = "center",
  sideOffset = 4
}: PopoverContentProps) {
  const { open, setOpen } = usePopoverContext()
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Close on click outside
  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        // Check if click is on trigger
        const parent = contentRef.current.parentElement
        if (parent && !parent.contains(event.target as Node)) {
          setOpen(false)
        }
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open, setOpen])

  if (!open) return null

  const alignClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 min-w-[8rem] rounded-md border border-border bg-popover text-popover-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        alignClasses[align],
        className
      )}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
    >
      {children}
    </div>
  )
}

export function PopoverClose({ children }: { children: React.ReactNode }) {
  const { setOpen } = usePopoverContext()
  
  return (
    <button onClick={() => setOpen(false)}>
      {children}
    </button>
  )
}
