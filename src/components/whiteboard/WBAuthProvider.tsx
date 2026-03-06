"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { WBUser, Announcement } from "@/lib/whiteboard/types"
import {
  loadStore, saveStore, getCurrentUser, logIn, logOut, signUp,
  getAnnouncement as getAnnouncementFromStore,
} from "@/lib/whiteboard/storage"

interface WBAuthContextValue {
  user: WBUser | null
  isAdmin: boolean
  announcement: Announcement
  login: (username: string, password: string) => { success: boolean; error?: string }
  signup: (username: string, password: string, email?: string) => { success: boolean; error?: string }
  logout: () => void
  refresh: () => void
}

const WBAuthContext = createContext<WBAuthContextValue | null>(null)

export function useWBAuth() {
  const ctx = useContext(WBAuthContext)
  if (!ctx) throw new Error("useWBAuth must be inside WBAuthProvider")
  return ctx
}

export function WBAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WBUser | null>(null)
  const [announcement, setAnnouncement] = useState<Announcement>({ text: "", color: "#3b82f6", enabled: false })
  const [hydrated, setHydrated] = useState(false)

  const refresh = useCallback(() => {
    const u = getCurrentUser()
    setUser(u)
    setAnnouncement(getAnnouncementFromStore())
  }, [])

  useEffect(() => {
    refresh()
    setHydrated(true)
  }, [refresh])

  const login = useCallback((username: string, password: string) => {
    const result = logIn(username, password)
    if (result.success && result.user) {
      setUser(result.user)
    }
    return result
  }, [])

  const signup = useCallback((username: string, password: string, email?: string) => {
    const result = signUp(username, password, email)
    if (result.success && result.user) {
      setUser(result.user)
    }
    return result
  }, [])

  const logout = useCallback(() => {
    logOut()
    setUser(null)
  }, [])

  if (!hydrated) return null

  return (
    <WBAuthContext.Provider value={{ user, isAdmin: user?.isAdmin || false, announcement, login, signup, logout, refresh }}>
      {children}
    </WBAuthContext.Provider>
  )
}
