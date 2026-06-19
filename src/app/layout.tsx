import type { Metadata, Viewport } from "next"
import { Providers } from "./providers"
import { ServiceWorkerRegister } from "@/components/sw-register"
import "./globals.css"

export const metadata: Metadata = {
  title: "TrustBank360 - Enterprise Fintech Platform for Money Transfer & Remittance",
  description: "Multi-company money transfer and remittance management platform for money transfer businesses, forex bureaus, remittance agencies, and financial institutions across Africa and globally.",
  keywords: ["money transfer", "remittance", "fintech", "forex", "banking", "South Sudan", "Africa"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TrustBank360",
  },
  applicationName: "TrustBank360",
  other: {}
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0F4C81" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F1A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/images/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TrustBank360" />
      </head>
      <body className="min-h-screen bg-white dark:bg-surface-950">
        <Providers>{children}</Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
