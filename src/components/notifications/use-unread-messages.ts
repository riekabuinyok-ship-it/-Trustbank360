"use client"

import { useState, useEffect, useRef } from "react"

export function useUnreadMessages() {
  const [count, setCount] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/messages?unread=true")
        if (res.ok) {
          const data = await res.json()
          setCount(data.unreadCount || 0)
        }
      } catch {}
    }

    fetchCount()
    intervalRef.current = setInterval(fetchCount, 10000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return count
}
