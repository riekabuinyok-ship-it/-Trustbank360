"use client"

import { Component, ErrorInfo, ReactNode } from "react"
import Link from "next/link"

const CHUNK_RELOAD_KEY = "tb360_chunk_reload"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  isChunkError: boolean
  isRecovering: boolean
}

function isChunkLoadError(error: Error): boolean {
  const msg = error.message || ""
  const name = error.name || ""
  return (
    name === "ChunkLoadError" ||
    name === "LoadingChunkError" ||
    msg.includes("Loading chunk") ||
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Cannot find module") ||
    msg.includes("Unexpected token") ||
    msg.includes("SyntaxError")
  )
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, isChunkError: false, isRecovering: false }
  }

  static getDerivedStateFromError(error: Error) {
    const isChunk = isChunkLoadError(error)
    return { hasError: true, error, isChunkError: isChunk }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo)
  }

  componentDidMount() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline)
      // Reset chunk reload flag on successful mount
      if (!this.state.hasError) {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY)
      }
    }
  }

  componentWillUnmount() {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline)
    }
  }

  handleOnline = () => {
    if (this.state.hasError) {
      window.location.reload()
    }
  }

  componentDidCatchRecover = async () => {
    if (!this.state.isChunkError) return

    // Check if we've already tried reloading
    const alreadyRetried = sessionStorage.getItem(CHUNK_RELOAD_KEY)
    if (alreadyRetried) {
      console.error("[ErrorBoundary] ChunkLoadError recovery already attempted — showing error page")
      this.setState({ isRecovering: false })
      return
    }

    this.setState({ isRecovering: true })
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1")

    // Clear all SW caches
    try {
      if ("caches" in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((name) => caches.delete(name)))
        console.log("[ErrorBoundary] Cleared all caches")
      }

      // Also tell the SW to clear its caches
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHES" })
      }
    } catch (err) {
      console.error("[ErrorBoundary] Failed to clear caches:", err)
    }

    // Reload after a brief delay
    setTimeout(() => window.location.reload(), 500)
  }

  render() {
    if (this.state.hasError) {
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine

      // ChunkLoadError — attempt recovery
      if (this.state.isChunkError && this.state.isRecovering) {
        return (
          <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
            <div className="text-center max-w-md space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-2">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <h1 className="text-xl font-bold">Updating application...</h1>
              <p className="text-muted-foreground text-sm">
                A new version is being loaded. This will only take a moment.
              </p>
            </div>
          </div>
        )
      }

      return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
          <div className="text-center max-w-md space-y-4">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${isOffline ? "bg-orange-100 dark:bg-orange-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
              {isOffline ? (
                <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M12 8v4m0 4h.01" />
                </svg>
              ) : this.state.isChunkError ? (
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
            <h1 className="text-xl font-bold">
              {isOffline
                ? "You're offline"
                : this.state.isChunkError
                ? "Update required"
                : "Something went wrong"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isOffline
                ? "It looks like you've lost your internet connection. Some features may be unavailable."
                : this.state.isChunkError
                ? "A new version of TrustBank360 is available. Please refresh to continue."
                : "An unexpected error occurred. Please try refreshing the page."}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  if (this.state.isChunkError) {
                    sessionStorage.removeItem(CHUNK_RELOAD_KEY)
                    this.componentDidCatchRecover()
                  } else {
                    window.location.reload()
                  }
                }}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-600 transition-colors text-sm"
              >
                {isOffline ? "Try Again" : "Refresh Page"}
              </button>
              <Link
                href="/"
                className="px-4 py-2 rounded-lg border border-border font-medium hover:bg-surface-100 transition-colors text-sm"
              >
                Go Home
              </Link>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="text-xs text-left bg-red-50 dark:bg-red-900/10 p-3 rounded-lg overflow-auto max-h-32 text-red-700 dark:text-red-300">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
