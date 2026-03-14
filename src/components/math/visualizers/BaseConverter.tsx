"use client"

import { useState, useCallback } from "react"

interface BitDisplay {
  binary: string
  octal: string
  decimal: string
  hex: string
}

function convertNumber(value: number): BitDisplay {
  if (!Number.isInteger(value) || value < 0) {
    return { binary: "—", octal: "—", decimal: "—", hex: "—" }
  }
  return {
    binary: value.toString(2),
    octal: value.toString(8),
    decimal: value.toString(10),
    hex: value.toString(16).toUpperCase(),
  }
}

function getPositionalBreakdown(value: number, base: number): { position: number; digit: number; placeValue: number; contribution: number }[] {
  if (value === 0) return [{ position: 0, digit: 0, placeValue: 1, contribution: 0 }]
  const digits: { position: number; digit: number; placeValue: number; contribution: number }[] = []
  const str = value.toString(base)
  for (let i = 0; i < str.length; i++) {
    const pos = str.length - 1 - i
    const digit = parseInt(str[i], base)
    const placeValue = Math.pow(base, pos)
    digits.push({ position: pos, digit, placeValue, contribution: digit * placeValue })
  }
  return digits
}

const baseColors: Record<number, string> = {
  2: "#007AFF",
  8: "#FF9F0A",
  10: "#30d158",
  16: "#a050dc",
}

export function BaseConverter() {
  const [inputValue, setInputValue] = useState("42")
  const [inputBase, setInputBase] = useState(10)
  const [showBreakdown, setShowBreakdown] = useState(true)
  const [bits, setBits] = useState<boolean[]>([])

  const decimalValue = (() => {
    try {
      const parsed = parseInt(inputValue, inputBase)
      return isNaN(parsed) || parsed < 0 ? null : parsed
    } catch {
      return null
    }
  })()

  const display = decimalValue !== null ? convertNumber(decimalValue) : null
  const breakdown = decimalValue !== null ? getPositionalBreakdown(decimalValue, 2) : []

  // Initialize bits when value changes
  const binaryStr = decimalValue !== null ? decimalValue.toString(2).padStart(8, "0") : "00000000"
  const currentBits = binaryStr.split("").map((b) => b === "1")

  const flipBit = (index: number) => {
    const newBits = [...currentBits]
    newBits[index] = !newBits[index]
    const newValue = parseInt(newBits.map((b) => (b ? "1" : "0")).join(""), 2)
    setInputValue(newValue.toString(inputBase))
  }

  return {
    canvas: (
      <div
        className="w-full rounded-2xl overflow-hidden p-5 space-y-5"
        style={{
          background: "var(--glass-fill)",
          border: "1px solid var(--glass-border)",
        }}
      >
        {/* Base displays */}
        {display ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Binary (base 2)", value: display.binary, base: 2, prefix: "0b" },
              { label: "Octal (base 8)", value: display.octal, base: 8, prefix: "0o" },
              { label: "Decimal (base 10)", value: display.decimal, base: 10, prefix: "" },
              { label: "Hexadecimal (base 16)", value: display.hex, base: 16, prefix: "0x" },
            ].map(({ label, value, base, prefix }) => (
              <div
                key={base}
                className="p-3 rounded-xl"
                style={{ background: "var(--muted)" }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                  {label}
                </p>
                <p
                  className="font-mono text-lg font-semibold tracking-wider"
                  style={{ color: baseColors[base] }}
                >
                  {prefix}
                  {value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: "var(--muted-foreground)" }}>
            Enter a valid number
          </div>
        )}

        {/* Bit flipper */}
        {display && (
          <div>
            <p className="text-xs mb-2 font-medium" style={{ color: "var(--muted-foreground)" }}>
              Bit Flipper (click to toggle)
            </p>
            <div className="flex gap-1 flex-wrap justify-center">
              {currentBits.map((bit, i) => (
                <button
                  key={i}
                  onClick={() => flipBit(i)}
                  className="w-9 h-10 rounded-lg flex flex-col items-center justify-center text-xs font-mono transition-all"
                  style={{
                    background: bit ? "rgba(0,122,255,0.2)" : "var(--muted)",
                    border: `1px solid ${bit ? "rgba(0,122,255,0.4)" : "var(--glass-border)"}`,
                    color: bit ? "#007AFF" : "var(--muted-foreground)",
                  }}
                >
                  <span className="font-bold text-sm">{bit ? "1" : "0"}</span>
                  <span className="text-[8px] opacity-60">2^{currentBits.length - 1 - i}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Positional breakdown */}
        {display && showBreakdown && (
          <div>
            <p className="text-xs mb-2 font-medium" style={{ color: "var(--muted-foreground)" }}>
              Binary Positional Breakdown
            </p>
            <div className="overflow-x-auto">
              <div className="flex gap-1 min-w-fit">
                {breakdown.map((entry, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center p-2 rounded-lg min-w-[48px]"
                    style={{
                      background: entry.digit > 0 ? "rgba(0,122,255,0.1)" : "var(--muted)",
                      border: `1px solid ${entry.digit > 0 ? "rgba(0,122,255,0.3)" : "var(--glass-border)"}`,
                    }}
                  >
                    <span
                      className="text-xs font-bold"
                      style={{ color: entry.digit > 0 ? "#007AFF" : "var(--muted-foreground)" }}
                    >
                      {entry.digit}
                    </span>
                    <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                      ×2^{entry.position}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: "var(--foreground)" }}>
                      ={entry.contribution}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {decimalValue !== null && (
              <p className="text-xs mt-2 text-center font-mono" style={{ color: "var(--foreground)" }}>
                {breakdown.filter(e => e.digit > 0).map((e) => e.contribution).join(" + ")} = {decimalValue}
              </p>
            )}
          </div>
        )}
      </div>
    ),
    controls: (
      <div className="space-y-4">
        {/* Number input */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>
            Input number
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex h-10 w-full rounded-xl px-3 py-2 text-sm font-mono backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            style={{
              background: "var(--glass-fill)",
              border: "1px solid var(--glass-border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/* Input base */}
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
            Input base
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "Bin", base: 2 },
              { label: "Oct", base: 8 },
              { label: "Dec", base: 10 },
              { label: "Hex", base: 16 },
            ].map(({ label, base }) => (
              <button
                key={base}
                onClick={() => {
                  // Convert current value to new base input
                  if (decimalValue !== null) {
                    setInputValue(decimalValue.toString(base).toUpperCase())
                  }
                  setInputBase(base)
                }}
                className="h-8 rounded-lg text-xs font-medium"
                style={{
                  background: inputBase === base ? baseColors[base] : "var(--muted)",
                  color: inputBase === base ? "#ffffff" : "var(--foreground)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle breakdown */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showBreakdown}
            onChange={(e) => setShowBreakdown(e.target.checked)}
            className="rounded accent-primary"
          />
          <span className="text-sm" style={{ color: "var(--foreground)" }}>
            Show positional breakdown
          </span>
        </label>

        {/* Quick values */}
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
            Quick values:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[0, 1, 7, 42, 127, 255, 1024].map((v) => (
              <button
                key={v}
                onClick={() => { setInputBase(10); setInputValue(String(v)) }}
                className="text-xs px-2.5 py-1 rounded-full font-mono"
                style={{
                  background: "var(--muted)",
                  color: "var(--foreground)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
    ),
  }
}
