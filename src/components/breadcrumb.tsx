"use client"

import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  transfers: "Transactions",
  "transfers/new": "New Transaction",
  "transfers/payout": "Payout",
  customers: "Customers",
  branches: "Branches",
  "branches/new": "New Branch",
  staff: "Staff",
  "staff/new": "New Staff",
  "exchange-rates": "Exchange Rates",
  compliance: "Compliance",
  reports: "Reports",
  messages: "Messages",
  settings: "Settings",
  receipt: "Receipt",
  notifications: "Notifications",
}

export function Breadcrumb() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user as any

  if (!user || pathname === "/company/dashboard") return null

  const segments = pathname.split("/").filter(Boolean)
  const homeHref = "/company/dashboard"

  const crumbs = segments.map((segment, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/")
    const label = labelMap[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    return { href, label }
  })

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap">
      <Link href={homeHref} className="hover:text-primary transition-colors flex items-center gap-1">
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Home</span>
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5" />
          {i === crumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-primary transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
