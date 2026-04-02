"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface FlipCardProps {
  front: string
  back: string
  isFlipped: boolean
  onFlip: () => void
  className?: string
}

export function FlipCard({ front, back, isFlipped, onFlip, className }: FlipCardProps) {
  return (
    <div
      className={cn(
        "relative w-full aspect-[3/2] cursor-pointer perspective-1000",
        className
      )}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault()
          onFlip()
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={isFlipped ? "Card showing definition, click to flip" : "Card showing term, click to flip"}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 30 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 w-full h-full bg-card-study rounded-2xl shadow-lg border border-card-study-border flex items-center justify-center p-8 backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-2xl md:text-3xl font-medium text-center text-foreground">
            {front}
          </p>
        </div>
        
        {/* Back */}
        <div
          className="absolute inset-0 w-full h-full bg-card-study rounded-2xl shadow-lg border border-card-study-border flex items-center justify-center p-8 backface-hidden"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <p className="text-2xl md:text-3xl font-medium text-center text-foreground">
            {back}
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export function SimpleFlipCard({ 
  front, 
  back, 
  className 
}: { 
  front: string
  back: string
  className?: string 
}) {
  const [isFlipped, setIsFlipped] = useState(false)
  
  return (
    <FlipCard
      front={front}
      back={back}
      isFlipped={isFlipped}
      onFlip={() => setIsFlipped(!isFlipped)}
      className={className}
    />
  )
}
