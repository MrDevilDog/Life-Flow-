"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { getAuthUser, AuthUser } from "@/services/auth";

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  loading: boolean
  setUser: (u: AuthUser | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const TOKEN_KEY = "token"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(async () => {
    try {
      // Call logout API to clear server-side cookie
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Always clear client-side state
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      setUser(null)
    }
  }, [])

  const setUserSynced = useCallback(
    (nextUser: AuthUser | null) => {
      setUser(nextUser)
      if (nextUser) {
        const t = localStorage.getItem(TOKEN_KEY)
        if (t) setToken(t)
      } else {
        setToken(null)
      }
    },
    []
  )

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      try {
        const t = localStorage.getItem(TOKEN_KEY)
        if (!t) {
          if (mounted) setLoading(false)
          return
        }

        setToken(t)
        const res = await fetch("/api/me", {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${t}`,
          },
        })

        if (!res.ok) {
          if (mounted) logout()
          return
        }

        const data = (await res.json()) as { user: AuthUser }
        if (mounted) setUserSynced(data.user)
      } catch {
        if (mounted) logout()
      } finally {
        if (mounted) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      mounted = false
    }
  }, [logout])

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, setUser: setUserSynced, logout }),
    [user, token, loading, logout, setUserSynced]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

