import type { Metadata } from "next"
import { Providers } from "./providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "TrustBank360 - Enterprise Fintech Platform for Money Transfer & Remittance",
  description: "Multi-company money transfer and remittance management platform for money transfer businesses, forex bureaus, remittance agencies, and financial institutions across Africa and globally.",
  keywords: ["money transfer", "remittance", "fintech", "forex", "banking", "South Sudan", "Africa"],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-surface-950">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
