"use client"

import Link from "next/link"
import { 
  Layers, 
  BookOpen, 
  FileText, 
  Grid3X3, 
  Blocks, 
  Shuffle 
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ModeTilesProps {
  setId: string
  className?: string
}

const modes = [
  { 
    id: "flashcards", 
    name: "Flashcards", 
    icon: Layers, 
    color: "bg-blue-500",
    description: "Classic flip cards"
  },
  { 
    id: "learn", 
    name: "Learn", 
    icon: BookOpen, 
    color: "bg-blue-400",
    description: "Adaptive learning"
  },
  { 
    id: "test", 
    name: "Test", 
    icon: FileText, 
    color: "bg-blue-500",
    description: "Quiz yourself"
  },
  { 
    id: "match", 
    name: "Match", 
    icon: Grid3X3, 
    color: "bg-blue-400",
    description: "Match pairs"
  },
  { 
    id: "timed", 
    name: "Blocks", 
    icon: Blocks, 
    color: "bg-purple-500",
    description: "Block puzzle game"
  },
]

export function ModeTiles({ setId, className }: ModeTilesProps) {
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3", className)}>
      {modes.map((mode) => {
        const Icon = mode.icon
        return (
          <Link
            key={mode.id}
            href={`/sets/${setId}/${mode.id}`}
            className="group flex flex-col items-center justify-center p-6 bg-muted/40 hover:bg-muted rounded-xl transition-all hover:shadow-md border border-border"
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110",
              mode.color
            )}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <span className="font-medium text-foreground">{mode.name}</span>
          </Link>
        )
      })}
    </div>
  )
}
