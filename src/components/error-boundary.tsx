"use client"

import { Component } from "react"
import Link from "next/link"

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App error:", error, errorInfo)
  }

  componentDidMount() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline)
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

  render() {
    if (this.state.hasError) {
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine
      return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
          <div className="text-center max-w-md space-y-4">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${isOffline ? "bg-orange-100 dark:bg-orange-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
              {isOffline ? (
                <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M12 8v4m0 4h.01" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
            <h1 className="text-xl font-bold">{isOffline ? "You're offline" : "Something went wrong"}</h1>
            <p className="text-muted-foreground text-sm">
              {isOffline
                ? "It looks like you've lost your internet connection. Some features may be unavailable."
                : "An unexpected error occurred. Please try refreshing the page."}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
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
