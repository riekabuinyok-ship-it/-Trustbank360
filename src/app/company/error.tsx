"use client"

import { useEffect } from "react"

export default function CompanyError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Company Error]", error)
  }, [error])

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-2">
          <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-foreground">Page Error</h1>
        <p className="text-muted-foreground text-sm">
          Something went wrong loading this page. Try refreshing or navigating back.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              sessionStorage.removeItem("tb360_chunk_reload")
              reset()
            }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-600 transition-colors text-sm"
          >
            Try Again
          </button>
          <a
            href="/company/dashboard"
            className="px-4 py-2 rounded-lg border border-border font-medium hover:bg-surface-100 transition-colors text-sm"
          >
            Back to Dashboard
          </a>
        </div>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-xs text-left bg-red-50 dark:bg-red-900/10 p-3 rounded-lg overflow-auto max-h-32 text-red-700 dark:text-red-300 mt-4">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  )
}
