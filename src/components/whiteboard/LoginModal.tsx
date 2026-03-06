"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { X, Eye, EyeOff } from "lucide-react"

interface LoginModalProps {
  onLogin: (username: string, password: string) => { success: boolean; error?: string }
  onSignup: (username: string, password: string, email?: string) => { success: boolean; error?: string }
}

export function LoginModal({ onLogin, onSignup }: LoginModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (mode === "login") {
      const result = onLogin(username, password)
      if (!result.success) setError(result.error || "Login failed")
    } else {
      const result = onSignup(username, password, email || undefined)
      if (!result.success) setError(result.error || "Signup failed")
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-[#1a1d2e] border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-2xl font-bold text-white">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {mode === "login"
              ? "Sign in to access your whiteboards"
              : "Sign up to start creating whiteboards"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex px-6 gap-1 mb-4">
          <button
            onClick={() => { setMode("login"); setError("") }}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
              mode === "login"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode("signup"); setError("") }}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
              mode === "signup"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <X className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
              placeholder="Enter username"
              required
              autoFocus
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                placeholder="email@example.com"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition pr-10"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  )
}
