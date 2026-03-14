"use client"

import React from "react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class CanvasErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            className="flex flex-col items-center justify-center rounded-2xl p-8 text-center min-h-[300px]"
            style={{
              background: "var(--glass-fill)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <p className="text-lg font-semibold font-heading mb-2" style={{ color: "var(--foreground)" }}>
              Canvas failed to load
            </p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Try refreshing the page. This visualizer requires a browser with Canvas support.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              Retry
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
