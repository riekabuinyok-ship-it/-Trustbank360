"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useNotifications, type AppNotification } from "./use-notifications"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const typeIcons: Record<string, string> = {
  TRANSACTION_CREATED: "📤",
  INCOMING_TRANSFER: "📥",
  CANCELLED: "🚫",
  REVERSED: "↩️",
  PAYOUT_CONFIRMED: "🟢",
  COMPLETED: "🎉",
}

const typeColors: Record<string, string> = {
  TRANSACTION_CREATED: "text-yellow-600 dark:text-yellow-400",
  INCOMING_TRANSFER: "text-blue-600 dark:text-blue-400",
  CANCELLED: "text-red-600 dark:text-red-400",
  REVERSED: "text-orange-600 dark:text-orange-400",
  PAYOUT_CONFIRMED: "text-emerald-600 dark:text-emerald-400",
  COMPLETED: "text-green-600 dark:text-green-400",
}

function NotificationCard({
  n,
  onMarkRead,
  onOpen,
}: {
  n: AppNotification
  onMarkRead: (id: string) => void
  onOpen: (n: AppNotification) => void
}) {
  const icon = typeIcons[n.type] || "🔔"
  const color = typeColors[n.type] || "text-foreground"

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  return (
    <div
      onClick={() => onOpen(n)}
      className="flex gap-3 p-3 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer group"
    >
      <span className="text-lg mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${color} truncate`}>{n.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onMarkRead(n.id)
        }}
        className="self-start opacity-0 group-hover:opacity-100 text-[10px] text-primary hover:underline shrink-0 mt-0.5 transition-opacity"
      >
        Done
      </button>
    </div>
  )
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<AppNotification | null>(null)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const { notifications, unreadCount, soundEnabled, setSoundEnabled, markAsRead, markAllAsRead } =
    useNotifications()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const positionPanel = useCallback(() => {
    if (!open || !buttonRef.current || !panelRef.current) return

    const btn = buttonRef.current.getBoundingClientRect()
    const panel = panelRef.current
    const panelW = isMobile ? Math.min(320, window.innerWidth - 16) : 384
    const panelH = panel.scrollHeight

    let top = btn.bottom + 8
    let left: number

    if (btn.right + panelW > window.innerWidth) {
      left = Math.max(8, window.innerWidth - panelW - 8)
    } else {
      left = btn.right - panelW
      if (left < 8) left = 8
    }

    if (top + panelH > window.innerHeight) {
      top = Math.max(8, window.innerHeight - panelH - 8)
    }

    setPanelStyle({
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${panelW}px`,
      maxHeight: "70vh",
      zIndex: 9999,
    })
  }, [open, isMobile])

  useEffect(() => {
    positionPanel()
    window.addEventListener("scroll", positionPanel, true)
    window.addEventListener("resize", positionPanel)
    return () => {
      window.removeEventListener("scroll", positionPanel, true)
      window.removeEventListener("resize", positionPanel)
    }
  }, [positionPanel])

  const typeLabels: Record<string, string> = {
    TRANSACTION_CREATED: "Transaction Created",
    INCOMING_TRANSFER: "Incoming Transfer",
    CANCELLED: "Transaction Cancelled",
    REVERSED: "Transaction Reversed",
    PAYOUT_CONFIRMED: "Payout Completed",
    COMPLETED: "Transaction Completed",
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            style={panelStyle}
            className="bg-white dark:bg-surface-900 rounded-xl shadow-2xl border border-surface-200 dark:border-surface-700 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700 shrink-0">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title={soundEnabled ? "Mute sounds" : "Enable sounds"}
                >
                  {soundEnabled ? "🔊" : "🔇"}
                </button>
                {notifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg className="w-10 h-10 text-muted-foreground/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="text-sm text-muted-foreground">No new notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <NotificationCard key={n.id} n={n} onMarkRead={(id) => markAsRead([id])} onOpen={setSelected} />
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-surface-200 dark:border-surface-700 shrink-0">
              <Link
                href="/company/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-xs text-primary hover:underline py-1"
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}

      <Dialog open={!!selected} onOpenChange={(v) => { if (!v) setSelected(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected && <span>{typeIcons[selected.type] || "🔔"}</span>}
              {selected?.title}
            </DialogTitle>
            <DialogDescription>
              {selected && (typeLabels[selected.type] || selected.type.replace(/_/g, " "))}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-800/50">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(selected.createdAt).toLocaleString()}</span>
                {!selected.readAt && (
                  <button
                    onClick={() => { markAsRead([selected.id]); setSelected(null) }}
                    className="text-primary hover:underline"
                  >
                    Mark as read
                  </button>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setSelected(null)} className="flex-1">
                  Close
                </Button>
                {selected.link && (
                  <Link href={selected.link} onClick={() => { setTimeout(() => markAsRead([selected.id]), 500); setSelected(null); setOpen(false) }} className="flex-1">
                    <Button size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
