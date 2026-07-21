"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { saveRoute } from "@/lib/route-persistence"

export function RouteTracker() {
  const pathname = usePathname()

  useEffect(() => {
    saveRoute(pathname)
  }, [pathname])

  return null
}
