"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { AdminSidebar, AdminMobileNav, AdminMobileBottomNav } from "@/components/admin-sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 animate-pulse flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    redirect("/login")
  }

  const user = session.user as any
  if (user?.role !== "platform_owner") {
    redirect("/company/dashboard?error=unauthorized")
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 overflow-x-hidden w-full max-w-full">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <AdminMobileNav />
      <main className={`${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"} pt-16 lg:pt-0 pb-20 lg:pb-0 transition-all duration-300 min-w-0 overflow-x-hidden w-full max-w-full`}>
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
          {children}
        </div>
      </main>
      <AdminMobileBottomNav />
    </div>
  )
}
