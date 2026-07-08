"use client"

import { useEffect, useState } from "react"

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", () => setIsInstalled(true))
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === "accepted") {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  if (isInstalled || !deferredPrompt || dismissed) return null

  return (
    <div className="mx-3 mb-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
      <p className="text-xs font-medium text-foreground mb-2">Install TrustBank360</p>
      <p className="text-[11px] text-muted-foreground mb-3">Install as an app for offline access and faster loading.</p>
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-600 transition-colors"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-surface-100 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
