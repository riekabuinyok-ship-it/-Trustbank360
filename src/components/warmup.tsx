"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"

export function Warmup() {
  const { data: session } = useSession()
  const isAuthenticated = !!session?.user
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    function warm() {
      if (typeof navigator !== "undefined" && !navigator.onLine) return
      fetch("/api/auth/session", { method: "GET" }).catch(() => {})
      fetch("/api/heartbeat", { method: "POST" }).catch(() => {})
    }

    // Warm immediately (session endpoint keeps NextAuth function warm)
    fetch("/api/auth/session", { method: "GET" }).catch(() => {})

    // Only do periodic heartbeat if authenticated
    if (isAuthenticated) {
      fetch("/api/heartbeat", { method: "POST" }).catch(() => {})
      intervalRef.current = setInterval(warm, 60000)
    }

    // Listen for online/offline to pause/resume
    function handleOnline() {
      if (isAuthenticated && !intervalRef.current) {
        intervalRef.current = setInterval(warm, 60000)
        warm()
      }
    }
    function handleOffline() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [isAuthenticated])

  return null
}
