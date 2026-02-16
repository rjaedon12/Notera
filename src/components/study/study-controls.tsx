"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Shuffle, 
  Volume2, 
  Star,
  Lightbulb,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface StudyHeaderProps {
  title: string
  currentIndex: number
  totalCards: number
  setId: string
  mode: string
  onClose?: () => void
}

export function StudyHeader({ 
  title, 
  currentIndex, 
  totalCards, 
  setId,
  mode,
  onClose 
}: StudyHeaderProps) {
  return (
    <div className="flex items-center justify-between py-4 px-4 border-b border-border">
      <div className="flex items-center gap-4">
        <Link href={`/sets/${setId}`}>
          <Button variant="ghost" size="icon" aria-label="Back to set">
            <X className="h-5 w-5" />
          </Button>
        </Link>
        <div className="hidden sm:block">
          <p className="text-sm text-muted-foreground capitalize">{mode}</p>
          <h1 className="font-semibold truncate max-w-xs">{title}</h1>
        </div>
      </div>
      
      <div className="text-center">
        <span className="text-lg font-medium">
          {currentIndex + 1} / {totalCards}
        </span>
      </div>
      
      <div className="w-20" /> {/* Spacer for centering */}
    </div>
  )
}

interface FlashcardControlsProps {
  onPrevious: () => void
  onNext: () => void
  onFlip: () => void
  onShuffle: () => void
  onSpeak: () => void
  onStar: () => void
  onHint: () => void
  isPlaying: boolean
  onTogglePlay: () => void
  trackProgress: boolean
  onToggleTrackProgress: (value: boolean) => void
  isStarred: boolean
  canGoPrevious: boolean
  canGoNext: boolean
  showHint?: boolean
  hint?: string
}

export function FlashcardControls({
  onPrevious,
  onNext,
  onFlip,
  onShuffle,
  onSpeak,
  onStar,
  onHint,
  isPlaying,
  onTogglePlay,
  trackProgress,
  onToggleTrackProgress,
  isStarred,
  canGoPrevious,
  canGoNext,
  showHint,
  hint
}: FlashcardControlsProps) {
  return (
    <div className="space-y-4">
      {/* Hint Display */}
      {showHint && hint && (
        <div className="text-center text-muted-foreground text-sm py-2 px-4 bg-muted/40 rounded-lg">
          Hint: {hint}
        </div>
      )}
      
      {/* Top Controls (inside card area) */}
      <div className="flex items-center justify-between px-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onHint}
          className="text-muted-foreground hover:text-foreground"
        >
          <Lightbulb className="h-4 w-4 mr-1" />
          Get a hint
        </Button>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onSpeak}
            aria-label="Read aloud"
          >
            <Volume2 className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onStar}
            aria-label={isStarred ? "Unstar card" : "Star card"}
          >
            <Star className={cn(
              "h-5 w-5",
              isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            )} />
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between px-4 py-4 bg-muted/40 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Track progress</span>
          <Switch 
            checked={trackProgress} 
            onCheckedChange={onToggleTrackProgress}
            aria-label="Toggle progress tracking"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            aria-label="Previous card"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNext}
            disabled={!canGoNext}
            aria-label="Next card"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onTogglePlay}
            aria-label={isPlaying ? "Pause autoplay" : "Start autoplay"}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onShuffle}
            aria-label="Shuffle cards"
          >
            <Shuffle className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Autoplay Bar */}
      <div className="bg-blue-600 text-white text-center py-3 rounded-xl text-sm font-medium">
        Click ▶ to flip and advance each card automatically
      </div>
    </div>
  )
}

interface ProgressRatingProps {
  onRate: (rating: 'again' | 'hard' | 'good' | 'easy') => void
}

export function ProgressRating({ onRate }: ProgressRatingProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <span className="text-sm text-muted-foreground mr-2">How well did you know this?</span>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => onRate('again')}
        className="border-red-200 text-red-600 hover:bg-red-50"
      >
        Again
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => onRate('hard')}
        className="border-orange-200 text-orange-600 hover:bg-orange-50"
      >
        Hard
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => onRate('good')}
        className="border-green-200 text-green-600 hover:bg-green-50"
      >
        Good
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => onRate('easy')}
        className="border-blue-200 text-blue-600 hover:bg-blue-50"
      >
        Easy
      </Button>
    </div>
  )
}
