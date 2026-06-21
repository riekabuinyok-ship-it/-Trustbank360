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

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
          <div className="text-center max-w-md space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-2">
              <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground text-sm">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-600 transition-colors text-sm"
              >
                Refresh Page
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
