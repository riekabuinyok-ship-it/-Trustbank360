"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { X, Monitor, Smartphone } from "lucide-react"

type Platform = "ios" | "android" | "chrome" | "edge" | "other"

function getPlatform(): Platform {
  if (typeof navigator === "undefined") return "other"
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return "ios"
  if (/android/i.test(ua)) return "android"
  if (/edg/i.test(ua)) return "edge"
  if (/chrome|crios/i.test(ua)) return "chrome"
  return "other"
}

const GUIDES: Record<Platform, { steps: string[] }> = {
  ios: {
    steps: [
      'Tap the Share icon (square with arrow) at the bottom of Safari',
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" in the top-right corner',
    ],
  },
  android: {
    steps: [
      'Tap the Chrome menu ⋮ (three dots)',
      'Tap "Add to Home screen"',
      'Tap "Add"',
    ],
  },
  chrome: {
    steps: [
      'Click the install icon ⋁ in the right side of the address bar',
      'Or click Chrome menu ⋮ \u2192 "Install TrustBank360\u2026"',
      'Click "Install" in the dialog',
    ],
  },
  edge: {
    steps: [
      'Click the install icon ⋁ in the right side of the address bar',
      'Or click Edge menu ⋯ \u2192 "Apps" \u2192 "Install this site as an app"',
      'Click "Install"',
    ],
  },
  other: {
    steps: [
      'Look for an "Install" or "Add to Home Screen" option in your browser menu',
      'This option is usually in the browser menu (\u22ee or \u22ef)',
      'If you cannot find it, try using Chrome or Edge',
    ],
  },
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const promptFired = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      promptFired.current = true
      setDeferredPrompt(e)
    }
    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", () => setIsInstalled(true))

    // If prompt hasn't fired after 5s, show fallback manual guide
    setTimeout(() => {
      if (!promptFired.current) setShowFallback(true)
    }, 5000)

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === "accepted") {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  if (isInstalled || dismissed) return null

  const promptAvailable = !!deferredPrompt
  if (!promptAvailable && !showFallback) return null

  const platform = getPlatform()

  return (
    <div className="mx-3 mb-2">
      {!showManual && (promptAvailable || showFallback) ? (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-foreground">Install App</p>
            <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">
            Install for offline access, faster loading, and a dedicated window.
          </p>
          <div className="flex gap-2">
            {promptAvailable ? (
              <button
                onClick={handleInstall}
                className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-600 transition-colors"
              >
                Install
              </button>
            ) : null}
            <button
              onClick={() => setShowManual(true)}
              className={`text-xs font-medium rounded-md border border-border hover:bg-surface-100 transition-colors ${
                promptAvailable ? "px-3 py-1.5" : "w-full px-3 py-1.5 bg-primary/5"
              }`}
            >
              {platform === "ios" ? "iOS Guide" : "How to Install"}
            </button>
          </div>
        </div>
      ) : showManual ? (
        <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-foreground">
              {platform === "ios" ? "Install on iPhone/iPad" : platform === "android" ? "Install on Android" : "Install on Desktop"}
            </p>
            <button onClick={() => setShowManual(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ol className="text-[11px] text-muted-foreground space-y-1.5 list-decimal list-inside">
            {GUIDES[platform].steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  )
}
