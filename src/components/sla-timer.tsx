"use client"

import { useState, useEffect } from "react"

export function SlaTimer({ createdAt, completedAt }: { createdAt: string; completedAt?: string | null }) {
  const [elapsed, setElapsed] = useState("")

  useEffect(() => {
    const update = () => {
      const start = new Date(createdAt).getTime()
      const end = completedAt ? new Date(completedAt).getTime() : Date.now()
      const diff = Math.max(0, end - start)
      const mins = Math.floor(diff / 60000)
      if (mins < 1) { setElapsed("Just now"); return }
      const hrs = Math.floor(mins / 60)
      const days = Math.floor(hrs / 24)
      if (days > 0) { setElapsed(`${days}d ${hrs % 24}h`); return }
      if (hrs > 0) { setElapsed(`${hrs}h ${mins % 60}m`); return }
      setElapsed(`${mins}m`)
    }
    update()
    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [createdAt, completedAt])

  if (!elapsed) return null

  const isLong = !completedAt && (() => {
    const mins = (Date.now() - new Date(createdAt).getTime()) / 60000
    return mins > 30
  })()

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${isLong ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {completedAt ? `Completed in ${elapsed}` : `Waiting ${elapsed}`}
    </span>
  )
}
