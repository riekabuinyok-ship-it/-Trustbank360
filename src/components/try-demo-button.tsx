"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { Loader2, PlayCircle, ShieldCheck, Briefcase, Wallet, FileCheck, Eye } from "lucide-react"

interface DemoUser {
  email: string
  label: string
  role: string
  description?: string
  icon?: string
}

const FALLBACK_USERS: DemoUser[] = [
  {
    email: "admin@trustbank.com",
    label: "Admin",
    role: "Company Owner",
    description: "Full system access, manage branches, staff, billing, and settings",
    icon: "ShieldCheck",
  },
  {
    email: "manager@trustbank.com",
    label: "Manager",
    role: "Branch Manager",
    description: "Oversee branch operations, approve transactions, manage staff",
    icon: "Briefcase",
  },
  {
    email: "teller@trustbank.com",
    label: "Teller",
    role: "Teller",
    description: "Process money transfers, customer onboarding, daily operations",
    icon: "Wallet",
  },
  {
    email: "compliance@trustbank.com",
    label: "Compliance",
    role: "Compliance Officer",
    description: "KYC verification, AML checks, fraud alerts, regulatory reports",
    icon: "FileCheck",
  },
  {
    email: "auditor@trustbank.com",
    label: "Auditor",
    role: "Auditor",
    description: "Read-only access to audit logs, transaction history, and reports",
    icon: "Eye",
  },
]

const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldCheck,
  Briefcase,
  Wallet,
  FileCheck,
  Eye,
}

const PASSWORD = "Admin@123"

export function TryDemoButton({ showRoles = false }: { showRoles?: boolean }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [users, setUsers] = useState<DemoUser[]>(FALLBACK_USERS)

  useEffect(() => {
    if (!navigator.onLine) return
    fetch("/api/auth/demo-users")
      .then((r) => r.json())
      .then((data) => {
        if (data?.users) {
          setUsers(
            data.users.map((u: DemoUser, i: number) => ({
              ...FALLBACK_USERS[i] || u,
              ...u,
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

  async function handleDemoLogin(email: string) {
    setLoading(email)
    try {
      const result = await signIn("credentials", {
        email,
        password: PASSWORD,
        redirect: false,
      })
      if (result?.error) {
        const { seedDemoUser, verifyOfflineLogin, createOfflineSessionCookie, cacheFullSession } = await import("@/lib/offline-auth")
        await seedDemoUser()
        const user = await verifyOfflineLogin(email, PASSWORD)
        if (user) {
          const cookie = createOfflineSessionCookie(user)
          document.cookie = `tb360_offline=${cookie}; path=/; max-age=${30 * 86400}; SameSite=Lax`
          await cacheFullSession({
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role,
              companyId: user.companyId,
              branchId: user.branchId,
              companyName: user.companyName,
              businessTypes: null,
              isActive: true,
              companyIsActive: true,
              onboardingComplete: true,
              twoFactorEnabled: false,
              mustChangePassword: false,
            },
            expires: new Date(Date.now() + 30 * 86400000).toISOString(),
            cachedAt: Date.now(),
          })
          window.location.href = "/company/dashboard"
          return
        }
        setLoading(null)
        return
      }
      if (navigator.onLine) {
        const sessionRes = await fetch("/api/auth/session")
        const session = await sessionRes.json()
        const userData = session?.user
        if (userData) {
          try {
            const { cacheSession } = await import("@/lib/offline-auth")
            await cacheSession({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
              companyId: userData.companyId,
              branchId: userData.branchId,
              companyName: userData.companyName,
              image: userData.image,
              password: PASSWORD,
            })
          } catch {}
        }
        const role = userData?.role
        document.cookie = "tb360_offline=; path=/; max-age=0"
        window.location.href = role === "platform_owner" ? "/platform" : "/company/dashboard"
      } else {
        window.location.href = "/company/dashboard"
      }
    } catch {
      setLoading(null)
    }
  }

  if (showRoles) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground text-center">Try different roles:</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {users.map((user) => {
            const Icon = ROLE_ICONS[user.icon || ""] || PlayCircle
            return (
              <button
                key={user.email}
                onClick={() => handleDemoLogin(user.email)}
                disabled={loading !== null}
                className="px-3 py-2 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all text-center disabled:opacity-50"
              >
                {loading === user.email ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  <>
                    <Icon className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <span className="text-sm font-medium block">{user.label}</span>
                    <span className="text-[10px] text-muted-foreground block">{user.role}</span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => handleDemoLogin(users[0]?.email || FALLBACK_USERS[0].email)}
      disabled={loading !== null}
      className="inline-flex items-center px-6 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25 gap-2 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <PlayCircle className="h-5 w-5" />
      )}
      Try Demo Account
    </button>
  )
}

export function TryDemoAccountsSection() {
  const [loading, setLoading] = useState<string | null>(null)
  const [users, setUsers] = useState<DemoUser[]>(FALLBACK_USERS)

  useEffect(() => {
    if (!navigator.onLine) return
    fetch("/api/auth/demo-users")
      .then((r) => r.json())
      .then((data) => {
        if (data?.users) {
          setUsers(
            data.users.map((u: DemoUser, i: number) => ({
              ...FALLBACK_USERS[i] || u,
              ...u,
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

  async function handleDemoLogin(email: string) {
    setLoading(email)
    try {
      const result = await signIn("credentials", {
        email,
        password: PASSWORD,
        redirect: false,
      })
      if (result?.error) {
        const { seedDemoUser, verifyOfflineLogin, createOfflineSessionCookie, cacheFullSession } = await import("@/lib/offline-auth")
        await seedDemoUser()
        const user = await verifyOfflineLogin(email, PASSWORD)
        if (user) {
          const cookie = createOfflineSessionCookie(user)
          document.cookie = `tb360_offline=${cookie}; path=/; max-age=${30 * 86400}; SameSite=Lax`
          await cacheFullSession({
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role,
              companyId: user.companyId,
              branchId: user.branchId,
              companyName: user.companyName,
              businessTypes: null,
              isActive: true,
              companyIsActive: true,
              onboardingComplete: true,
              twoFactorEnabled: false,
              mustChangePassword: false,
            },
            expires: new Date(Date.now() + 30 * 86400000).toISOString(),
            cachedAt: Date.now(),
          })
          window.location.href = "/company/dashboard"
          return
        }
        setLoading(null)
        return
      }
      if (navigator.onLine) {
        const sessionRes = await fetch("/api/auth/session")
        const session = await sessionRes.json()
        const userData = session?.user
        if (userData) {
          try {
            const { cacheSession } = await import("@/lib/offline-auth")
            await cacheSession({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
              companyId: userData.companyId,
              branchId: userData.branchId,
              companyName: userData.companyName,
              image: userData.image,
              password: PASSWORD,
            })
          } catch {}
        }
        const role = userData?.role
        document.cookie = "tb360_offline=; path=/; max-age=0"
        window.location.href = role === "platform_owner" ? "/platform" : "/company/dashboard"
      } else {
        window.location.href = "/company/dashboard"
      }
    } catch {
      setLoading(null)
    }
  }

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-4">
            <PlayCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">No signup required</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">Try Demo Accounts</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Experience TrustBank360 from every angle. Click any role below to log in instantly with pre-loaded sample data — no password needed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {users.map((user) => {
            const Icon = ROLE_ICONS[user.icon || ""] || PlayCircle
            return (
              <button
                key={user.email}
                onClick={() => handleDemoLogin(user.email)}
                disabled={loading !== null}
                className="group p-5 rounded-2xl border-2 border-border bg-card hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === user.email ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base mb-1">{user.label}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{user.role}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{user.description}</p>
                    <div className="mt-4 text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                      <span>Sign in as {user.label}</span>
                      <span>→</span>
                    </div>
                  </>
                )}
              </button>
            )
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          All demo accounts use the same password: <code className="px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 font-mono text-foreground">Admin@123</code>
        </p>
      </div>
    </section>
  )
}
