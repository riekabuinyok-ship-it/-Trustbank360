"use client"

import { OfflineSessionProvider } from "@/components/offline-session-provider"
import { ThemeProvider } from "next-themes"
import { Toaster } from "react-hot-toast"
import { ErrorBoundary } from "@/components/error-boundary"
import { RouteTracker } from "@/components/route-tracker"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <OfflineSessionProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <RouteTracker />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: "10px",
                background: "#333",
                color: "#fff",
              },
            }}
          />
        </ThemeProvider>
      </OfflineSessionProvider>
    </ErrorBoundary>
  )
}
