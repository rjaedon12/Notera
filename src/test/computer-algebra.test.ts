import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { usePyodide } from "@/hooks/usePyodide"

/* ── Mock Worker ───────────────────────────────────────────────────────── */

class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: ErrorEvent) => void) | null = null
  private handlers: Array<(msg: any) => void> = []

  postMessage(msg: any) {
    // Simulate async responses
    if (msg.type === "init") {
      setTimeout(() => {
        this.onmessage?.({ data: { type: "init-progress", stage: "Loading…" } } as MessageEvent)
        setTimeout(() => {
          this.onmessage?.({ data: { type: "init-done" } } as MessageEvent)
        }, 10)
      }, 10)
    }

    if (msg.type === "execute") {
      setTimeout(() => {
        // Simulate a SymPy result
        this.onmessage?.({
          data: {
            type: "result",
            id: msg.id,
            latex: "x^{2} + 1",
            plain: "x**2 + 1",
          },
        } as MessageEvent)
      }, 20)
    }

    this.handlers.forEach((h) => h(msg))
  }

  terminate() {
    // no-op
  }

  addEventListener(_: string, handler: (msg: any) => void) {
    this.handlers.push(handler)
  }

  removeEventListener() {
    // no-op
  }
}

/* ── Tests ─────────────────────────────────────────────────────────────── */

describe("usePyodide hook", () => {
  let originalWorker: typeof Worker

  beforeEach(() => {
    originalWorker = globalThis.Worker
    // @ts-expect-error — mock
    globalThis.Worker = MockWorker
    localStorage.clear()
  })

  afterEach(() => {
    globalThis.Worker = originalWorker
  })

  it("starts in idle status", () => {
    const { result } = renderHook(() => usePyodide())
    expect(result.current.status).toBe("idle")
    expect(result.current.history).toEqual([])
    expect(result.current.isComputing).toBe(false)
  })

  it("transitions to loading then ready on init", async () => {
    const { result } = renderHook(() => usePyodide())

    act(() => {
      result.current.init()
    })

    expect(result.current.status).toBe("loading")

    await waitFor(
      () => {
        expect(result.current.status).toBe("ready")
      },
      { timeout: 500 },
    )
  })

  it("executes code and returns a result in history", async () => {
    const { result } = renderHook(() => usePyodide())

    act(() => {
      result.current.init()
    })

    await waitFor(() => {
      expect(result.current.status).toBe("ready")
    }, { timeout: 500 })

    await act(async () => {
      const res = await result.current.execute("simplify(x**2 + 1)")
      expect(res.latex).toBe("x^{2} + 1")
      expect(res.plain).toBe("x**2 + 1")
      expect(res.error).toBeUndefined()
    })

    expect(result.current.history.length).toBe(1)
    expect(result.current.history[0].input).toBe("simplify(x**2 + 1)")
  })

  it("returns error when engine is not ready", async () => {
    const { result } = renderHook(() => usePyodide())

    // Don't init — status is "idle"
    const res = await result.current.execute("factor(x**2 - 1)")
    expect(res.error).toBeTruthy()
    expect(res.error).toContain("not ready")
  })

  it("clears history", async () => {
    const { result } = renderHook(() => usePyodide())

    act(() => {
      result.current.init()
    })

    await waitFor(() => {
      expect(result.current.status).toBe("ready")
    }, { timeout: 500 })

    await act(async () => {
      await result.current.execute("factor(x**2 - 1)")
    })
    expect(result.current.history.length).toBe(1)

    act(() => {
      result.current.clearHistory()
    })
    expect(result.current.history).toEqual([])
  })

  it("does not init twice", () => {
    const { result } = renderHook(() => usePyodide())

    act(() => {
      result.current.init()
    })

    // Second call should be a no-op (no error)
    act(() => {
      result.current.init()
    })

    expect(result.current.status).toBe("loading")
  })
})
