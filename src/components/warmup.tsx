"use client"

import { useEffect } from "react"

export function Warmup() {
  useEffect(() => {
    const warm = () => {
      // Warm the NextAuth serverless function by hitting the session endpoint
      fetch("/api/auth/session", { method: "GET" }).catch(() => {})
      fetch("/api/heartbeat", { method: "POST" }).catch(() => {})
    }
    warm()
    const interval = setInterval(warm, 60000)
    return () => clearInterval(interval)
  }, [])
  return null
}
