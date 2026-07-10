"use client"

import { useState, useEffect, useRef } from "react"

export function useUnreadTicketReplies() {
  const [count, setCount] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/support/reports/stats")
        if (!res.ok) return
        const data = await res.json()
        setCount(data.unreadReplies || 0)
      } catch {}
    }
    fetchCount()
    intervalRef.current = setInterval(fetchCount, 15000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return count
}
