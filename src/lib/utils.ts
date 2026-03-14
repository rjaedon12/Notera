import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function getHint(text: string, revealPercentage: number = 0.3): string {
  const words = text.split(' ')
  const revealCount = Math.max(1, Math.ceil(words.length * revealPercentage))
  return words.slice(0, revealCount).join(' ') + '...'
}

export function speakText(text: string): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }
}

export function generateShareToken(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

export function calculateMastery(correct: number, incorrect: number): number {
  const total = correct + incorrect
  if (total === 0) return 0
  const ratio = correct / total
  return Math.min(5, Math.floor(ratio * 6))
}
