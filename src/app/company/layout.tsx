"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Sidebar, MobileNav, MobileBottomNav } from "@/components/sidebar"
import { Breadcrumb } from "@/components/breadcrumb"
import { NetworkStatusIndicator } from "@/components/network-status"
import { useBackgroundSync } from "@/lib/sync/use-background-sync"
import { initConnectionMonitoring } from "@/store/network-store"

function Heartbeat() {
  useEffect(() => {
    const beat = () => fetch("/api/heartbeat", { method: "POST" }).catch(() => {})
    beat()
    const interval = setInterval(beat, 60000)
    return () => clearInterval(interval)
  }, [])
  return null
}

function LoadingSpinner() {
  return (
    <div className="h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-primary animate-pulse flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

function SuspendedScreen() {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Company Suspended</h1>
          <div className="space-y-4 text-muted-foreground">
            <p>Your company account has been suspended. This means all business operations are currently disabled.</p>
            <p>Please contact the platform administrator at <strong>admin@trustbank360.com</strong> for assistance with reactivating your account.</p>
            <p>Your account will remain suspended until the suspension is resolved and your company is reactivated.</p>
          </div>
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please submit a support ticket through the platform dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [companySuspended, setCompanySuspended] = useState(false)
  const [checkedCompanyStatus, setCheckedCompanyStatus] = useState(false)

  useEffect(() => {
    if (status !== "authenticated") return

    const checkCompanyStatus = async () => {
      try {
        const res = await fetch("/api/company")
        if (res.ok) {
          const data = await res.json()
          setCompanySuspended(!data.isActive)
        }
      } catch {
        // Silently fail - don't block user on network errors
      } finally {
        setCheckedCompanyStatus(true)
      }
    }

    checkCompanyStatus()
  }, [status])

  // Initialize offline-first features
  useBackgroundSync()

  useEffect(() => {
    initConnectionMonitoring()
  }, [])

  if (status === "loading" || (!checkedCompanyStatus && status === "authenticated")) {
    return <LoadingSpinner />
  }

  if (!session) {
    redirect("/login")
  }

  const user = session.user as any

  if (user?.role === "platform_owner") {
    redirect("/platform")
  }

  if (!user?.onboardingComplete) {
    redirect("/onboarding")
  }

  if (!user?.companyId) {
    redirect("/login")
  }

  if (companySuspended && checkedCompanyStatus) {
    return <SuspendedScreen />
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <Heartbeat />
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <MobileNav />
      <main className={`${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"} pt-16 lg:pt-0 pb-20 lg:pb-0 transition-all duration-300`}>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Breadcrumb />
          {children}
        </div>
      </main>
      <MobileBottomNav />
      <NetworkStatusIndicator />
    </div>
  )
}