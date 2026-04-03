"use client"

import { useEffect } from "react"

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global app error:", error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] text-foreground">
        <main className="flex min-h-screen items-center justify-center px-6 py-16">
          <div className="w-full max-w-xl rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-fill)] p-8 text-center shadow-[var(--glass-shadow)] backdrop-blur-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-color)]">
              Critical error
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">The app failed to render.</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Refresh the page to restart the application shell.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
              >
                Retry render
              </button>
              <button
                type="button"
                onClick={() => window.location.assign("/")}
                className="rounded-xl border border-[var(--glass-border)] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-[var(--glass-fill-hover)]"
              >
                Reload app
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}