"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { WifiOff, RefreshCw, Clock, Home, DollarSign, HelpCircle, BookOpen, Shield, FileText, Activity, MapPin } from "lucide-react"

const publicLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/exchange-rates", label: "Exchange Rates", icon: DollarSign },
  { href: "/features", label: "Features", icon: Activity },
  { href: "/help", label: "Help Center", icon: HelpCircle },
  { href: "/tutorials", label: "Tutorials", icon: BookOpen },
  { href: "/privacy", label: "Privacy Policy", icon: Shield },
  { href: "/terms", label: "Terms of Service", icon: FileText },
  { href: "/track", label: "Track Transfer", icon: MapPin },
]

const authLinks = [
  { href: "/company/dashboard", label: "Dashboard (Cached)", icon: Activity },
  { href: "/company/transfers", label: "Transactions (Cached)", icon: DollarSign },
  { href: "/company/customers", label: "Customers (Cached)", icon: HelpCircle },
]

export default function OfflinePage() {
  const [seconds, setSeconds] = useState(30)
  const [offlineSince, setOfflineSince] = useState<string>("")

  useEffect(() => {
    setOfflineSince(new Date().toLocaleTimeString())
    const timer = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const isLoggedIn = typeof window !== "undefined" && document.cookie.includes("next-auth.session-token")

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/images/logo.svg" alt="TRUSTBANK360" className="h-8 w-8" />
          <span className="text-xl font-bold">TRUSTBANK360</span>
        </div>

        {/* Offline Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30">
          <WifiOff className="h-10 w-10 text-amber-600 dark:text-amber-400" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">You&apos;re Offline</h1>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            Your internet connection was interrupted. We&apos;ll automatically reconnect once the network is available.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-card rounded-xl border border-border p-4 text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Disconnected at
            </span>
            <span className="font-mono text-sm">{offlineSince}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Auto-retry in
            </span>
            <span className="font-mono text-sm font-bold">{seconds}s</span>
          </div>
          <div className="mt-3 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-1000"
              style={{ width: `${(seconds / 30) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-600 transition-colors"
        >
          <RefreshCw className="h-5 w-5" />
          Try Again Now
        </button>

        {/* Available Offline Content */}
        <div className="bg-card rounded-xl border border-border p-6 text-left">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-500" />
            Available Offline
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {(isLoggedIn ? authLinks : publicLinks).map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-sm font-medium"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Your data is safe. Any actions you take will be saved locally and
          synchronized automatically when your connection is restored.
        </p>
      </div>
    </div>
  )
}
