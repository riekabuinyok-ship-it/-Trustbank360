import type { Metadata, Viewport } from "next"
import { Providers } from "./providers"
import { ServiceWorkerRegister } from "@/components/sw-register"
import { Warmup } from "@/components/warmup"
import "./globals.css"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trustbank360.com"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TrustBank360 - Enterprise Fintech Platform for Money Transfer & Remittance",
    template: "%s | TrustBank360",
  },
  description: "Multi-company money transfer and remittance management platform for money transfer businesses, forex bureaus, remittance agencies, and financial institutions across Africa and globally.",
  keywords: ["money transfer", "remittance", "fintech", "forex", "banking", "South Sudan", "Africa"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TrustBank360",
  },
  applicationName: "TrustBank360",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "TrustBank360",
    title: "TrustBank360 - Enterprise Fintech Platform for Money Transfer & Remittance",
    description: "Multi-company money transfer and remittance management platform serving Africa and beyond.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "TrustBank360 - Enterprise Fintech Platform",
    description: "Multi-company money transfer and remittance management platform serving Africa and beyond.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: siteUrl },
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
        <link rel="icon" type="image/svg+xml" href="/images/logo.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/icons/icon-192.png" />
        <meta name="theme-color" content="#0F4C81" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TrustBank360" />
      </head>
      <body className="min-h-screen bg-white dark:bg-surface-950">
        <Providers>
          {children}
          <Warmup />
        </Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
