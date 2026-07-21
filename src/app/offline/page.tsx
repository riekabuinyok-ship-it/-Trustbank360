"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { WifiOff, RefreshCw, Clock, Home, DollarSign, HelpCircle, BookOpen, Shield, FileText, Activity, MapPin, LogIn, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"



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

export default function OfflinePage() {
  const router = useRouter()
  const [seconds, setSeconds] = useState(30)
  const [offlineSince, setOfflineSince] = useState<string>("")
  const [hasCachedAuth, setHasCachedAuth] = useState(false)
  const [cachedEmail, setCachedEmail] = useState("")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  useEffect(() => {
    setOfflineSince(new Date().toLocaleTimeString())
    try {
      const hasOfflineCookie = document.cookie.includes("tb360_offline")
      if (hasOfflineCookie) setHasCachedAuth(true)
    } catch {}
    import("@/lib/offline-auth").then(({ seedDemoUser }) => seedDemoUser()).catch(() => {})
    const timer = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function checkCachedUser() {
      const { getCachedUser } = await import("@/lib/offline-auth")
      if (cachedEmail) {
        const user = await getCachedUser(cachedEmail)
        if (user) setCachedEmail(user.email)
      }
    }
    if (cachedEmail) checkCachedUser()
  }, [cachedEmail])

  async function handleOfflineLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError("")
    try {
      const { verifyOfflineLogin, createOfflineSessionCookie } = await import("@/lib/offline-auth")
      const user = await verifyOfflineLogin(loginEmail, loginPassword)
      if (user) {
        const cookie = createOfflineSessionCookie(user)
        document.cookie = `tb360_offline=${cookie}; path=/; max-age=${30 * 86400}; SameSite=Lax`
        router.push(user.role === "platform_owner" ? "/platform" : "/company/dashboard")
      } else {
        setLoginError("Invalid credentials or no cached account found.")
      }
    } catch {
      setLoginError("Failed to authenticate offline.")
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center space-y-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/images/logo.svg" alt="TRUSTBANK360" className="h-8 w-8" />
          <span className="text-xl font-bold">TRUSTBANK360</span>
        </div>

        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30">
          <WifiOff className="h-10 w-10 text-amber-600 dark:text-amber-400" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">You&apos;re Offline</h1>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            Your internet connection was interrupted. We&apos;ll automatically reconnect once the network is available.
          </p>
        </div>

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

        {/* Offline Login */}
        {!hasCachedAuth && (
          <div className="bg-card rounded-xl border border-border p-6 text-left">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <LogIn className="h-4 w-4 text-amber-500" />
              Offline Login
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Sign in with a previously used account to continue working offline.
            </p>
            <form onSubmit={handleOfflineLogin} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="offline-email" className="text-xs">Email</Label>
                <Input id="offline-email" type="email" placeholder="you@company.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="offline-password" className="text-xs">Password</Label>
                <Input id="offline-password" type="password" placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
              </div>
              {loginError && <p className="text-xs text-red-500">{loginError}</p>}
              <Button type="submit" className="w-full gap-2" disabled={loginLoading}>
                {loginLoading ? "Verifying..." : "Sign In (Offline)"}
              </Button>
            </form>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Quick testing:</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={async () => {
                  setLoginLoading(true)
                  try {
                    const { verifyOfflineLogin, createOfflineSessionCookie, getDemoCredentials } = await import("@/lib/offline-auth")
                    const { email, password } = getDemoCredentials()
                    const user = await verifyOfflineLogin(email, password)
                    if (user) {
                      const cookie = createOfflineSessionCookie(user)
                      document.cookie = `tb360_offline=${cookie}; path=/; max-age=${30 * 86400}; SameSite=Lax`
                      router.push("/company/dashboard")
                    } else {
                      setLoginError("Demo account not cached. Log in online first with admin@trustbank.com / Admin@123.")
                    }
                  } catch {
                    setLoginError("Demo login failed.")
                  } finally {
                    setLoginLoading(false)
                  }
                }}
                disabled={loginLoading}
              >
                <Bug className="h-4 w-4" />
                Demo Login (admin@trustbank.com)
              </Button>
            </div>
          </div>
        )}

        <div className="bg-card rounded-xl border border-border p-6 text-left">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-500" />
            Available Offline
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {publicLinks.map((link) => {
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
