"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "react-hot-toast"
import { ErrorBoundary } from "@/components/error-boundary"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
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
      </SessionProvider>
    </ErrorBoundary>
  )
}
