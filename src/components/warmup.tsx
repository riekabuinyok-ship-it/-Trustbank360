"use client"

import { useEffect } from "react"

export function Warmup() {
  useEffect(() => {
    const warm = () => {
      fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }).catch(() => {})
      fetch("/api/heartbeat", { method: "POST" }).catch(() => {})
    }
    warm()
    const interval = setInterval(warm, 60000)
    return () => clearInterval(interval)
  }, [])
  return null
}
