"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useNetworkStore } from "@/store/network-store"

export function Warmup() {
  const { data: session } = useSession()
  const isAuthenticated = !!session?.user
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    function warm() {
      if (!useNetworkStore.getState().isOnline) return
      fetch("/api/heartbeat", { method: "POST" }).catch(() => {})
    }

    if (isAuthenticated) {
      warm()
      intervalRef.current = setInterval(warm, 60000)
    }

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
