"use client"

import { useEffect } from "react"
import Link from "next/link"

type AppErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error("App route error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-fill)] p-8 text-center shadow-[var(--glass-shadow)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-color)]">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">This page hit an unexpected error.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Try the action again. If it keeps happening, refresh the page or return home.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl border border-[var(--glass-border)] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-[var(--glass-fill-hover)]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}