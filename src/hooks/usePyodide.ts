"use client"

import { useState, useRef, useCallback, useEffect } from "react"

/* ── Types ─────────────────────────────────────────────────────────────── */

export type PyodideStatus = "idle" | "loading" | "ready" | "error"

export interface CASResult {
  id: string
  input: string
  latex: string
  plain: string
  error?: string
  timestamp: number
}

interface WorkerMessage {
  type: "init-progress" | "init-done" | "init-error" | "result" | "error"
  id?: string
  stage?: string
  latex?: string
  plain?: string
  error?: string
}

/* ── localStorage helpers ──────────────────────────────────────────────── */

const STORAGE_KEY = "cas-history"
const MAX_HISTORY = 100

function loadHistory(): CASResult[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(history: CASResult[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  } catch {
    // localStorage full — silently drop old entries
  }
}

/* ── Hook ──────────────────────────────────────────────────────────────── */

const EXECUTION_TIMEOUT = 15_000 // 15 s

export function usePyodide() {
  const [status, setStatus] = useState<PyodideStatus>("idle")
  const [loadingStage, setLoadingStage] = useState("")
  const [history, setHistory] = useState<CASResult[]>([])
  const [isComputing, setIsComputing] = useState(false)

  const workerRef = useRef<Worker | null>(null)
  const pendingRef = useRef<Map<string, { resolve: (r: CASResult) => void; timer: ReturnType<typeof setTimeout> }>>(new Map())
  const idCounterRef = useRef(0)

  // Load history from localStorage on mount
  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  /* ── Worker lifecycle ──────────────────────────────────────────────── */

  const createWorker = useCallback(() => {
    const w = new Worker("/pyodide-worker.js")

    w.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data

      switch (msg.type) {
        case "init-progress":
          setLoadingStage(msg.stage ?? "")
          break

        case "init-done":
          setStatus("ready")
          setLoadingStage("")
          break

        case "init-error":
          setStatus("error")
          setLoadingStage(msg.error ?? "Failed to initialise")
          break

        case "result": {
          const pending = pendingRef.current.get(msg.id!)
          if (pending) {
            clearTimeout(pending.timer)
            pendingRef.current.delete(msg.id!)
            const result: CASResult = {
              id: msg.id!,
              input: "", // filled by execute()
              latex: msg.latex ?? "",
              plain: msg.plain ?? "",
              timestamp: Date.now(),
            }
            pending.resolve(result)
          }
          setIsComputing(pendingRef.current.size > 0)
          break
        }

        case "error": {
          const pending = pendingRef.current.get(msg.id!)
          if (pending) {
            clearTimeout(pending.timer)
            pendingRef.current.delete(msg.id!)
            const result: CASResult = {
              id: msg.id!,
              input: "",
              latex: "",
              plain: "",
              error: msg.error ?? "Unknown error",
              timestamp: Date.now(),
            }
            pending.resolve(result)
          }
          setIsComputing(pendingRef.current.size > 0)
          break
        }
      }
    }

    w.onerror = () => {
      setStatus("error")
      setLoadingStage("Worker crashed")
    }

    return w
  }, [])

  /* ── Initialise ────────────────────────────────────────────────────── */

  const init = useCallback(() => {
    if (workerRef.current) return // already initialised or loading
    setStatus("loading")
    setLoadingStage("Starting…")
    const w = createWorker()
    workerRef.current = w
    w.postMessage({ type: "init" })
  }, [createWorker])

  /* ── Execute ───────────────────────────────────────────────────────── */

  const execute = useCallback(
    (code: string): Promise<CASResult> => {
      return new Promise((resolve) => {
        if (!workerRef.current || status !== "ready") {
          resolve({
            id: "err",
            input: code,
            latex: "",
            plain: "",
            error: "CAS engine is not ready. Please wait for it to load.",
            timestamp: Date.now(),
          })
          return
        }

        const id = `cas-${++idCounterRef.current}-${Date.now()}`
        setIsComputing(true)

        const timer = setTimeout(() => {
          pendingRef.current.delete(id)
          const result: CASResult = {
            id,
            input: code,
            latex: "",
            plain: "",
            error: "Computation timed out (15 s). Try a simpler expression.",
            timestamp: Date.now(),
          }
          // Kill and respawn the worker
          workerRef.current?.terminate()
          workerRef.current = null
          setStatus("loading")
          setLoadingStage("Restarting after timeout…")
          const w = createWorker()
          workerRef.current = w
          w.postMessage({ type: "init" })

          setHistory((prev) => {
            const next = [result, ...prev]
            saveHistory(next)
            return next
          })
          resolve(result)
          setIsComputing(false)
        }, EXECUTION_TIMEOUT)

        pendingRef.current.set(id, {
          resolve: (r) => {
            r.input = code
            setHistory((prev) => {
              const next = [r, ...prev]
              saveHistory(next)
              return next
            })
            resolve(r)
          },
          timer,
        })

        workerRef.current.postMessage({ type: "execute", id, code })
      })
    },
    [status, createWorker],
  )

  /* ── Cancel (kills worker, respawns) ───────────────────────────────── */

  const cancel = useCallback(() => {
    // Clear all pending
    pendingRef.current.forEach(({ timer }) => clearTimeout(timer))
    pendingRef.current.clear()
    setIsComputing(false)

    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    setStatus("loading")
    setLoadingStage("Restarting…")
    const w = createWorker()
    workerRef.current = w
    w.postMessage({ type: "init" })
  }, [createWorker])

  /* ── Clear history ─────────────────────────────────────────────────── */

  const clearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  /* ── Cleanup on unmount ────────────────────────────────────────────── */

  useEffect(() => {
    return () => {
      pendingRef.current.forEach(({ timer }) => clearTimeout(timer))
      pendingRef.current.clear()
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  return {
    status,
    loadingStage,
    isComputing,
    history,
    init,
    execute,
    cancel,
    clearHistory,
  }
}
