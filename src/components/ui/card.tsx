"use client"

import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, style, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl backdrop-blur-[20px] transition-all duration-200 glass-card-hover",
        className
      )}
      style={{
        background: "var(--glass-fill)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--glass-shadow), inset 0 1px 0 0 var(--glass-highlight)",
        color: "var(--card-foreground)",
        ...style,
      }}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-xl font-semibold leading-none tracking-tight font-heading", className)}
      style={{ color: "var(--card-foreground)" }}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm", className)}
      style={{ color: "var(--muted-foreground)" }}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: CardProps) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props} />
  )
}

export function CardFooter({ className, ...props }: CardProps) {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
}
