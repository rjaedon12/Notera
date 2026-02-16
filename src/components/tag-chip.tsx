"use client"

import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface TagChipProps {
  name: string
  slug?: string
  color?: string
  size?: "sm" | "md"
  removable?: boolean
  onRemove?: () => void
  onClick?: () => void
  className?: string
}

const colorClasses: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  green: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  pink: "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  yellow: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  red: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  gray: "bg-muted text-muted-foreground",
}

export function TagChip({
  name,
  slug,
  color = "blue",
  size = "md",
  removable = false,
  onRemove,
  onClick,
  className
}: TagChipProps) {
  const colorClass = colorClasses[color] || colorClasses.blue
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        colorClass,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      onClick={onClick}
    >
      {name}
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="ml-0.5 hover:text-current/80"
        >
          <X className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
        </button>
      )}
    </span>
  )
}
