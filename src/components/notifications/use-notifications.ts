"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"

export interface AppNotification {
  id: string
  title: string
  message: string
  type: string
  readAt: string | null
  link: string | null
  createdAt: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const prevCountRef = useRef(0)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.frequency.value = 800
      oscillator.type = "sine"
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.3)
    } catch {}
  }, [soundEnabled])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?unread=true")
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications)
      const newCount = data.unreadCount
      setUnreadCount(newCount)

      if (newCount > prevCountRef.current) {
        playNotificationSound()
      }
      prevCountRef.current = newCount
    } catch {
    } finally {
      setLoading(false)
    }
  }, [playNotificationSound])

  useEffect(() => {
    fetchNotifications()
    intervalRef.current = setInterval(fetchNotifications, 8000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchNotifications])

  const markAsRead = useCallback(async (ids: string[]) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)))
    setUnreadCount((c) => Math.max(0, c - ids.length))
  }, [])

  const markAllAsRead = useCallback(async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    })
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    soundEnabled,
    setSoundEnabled,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  }
}
