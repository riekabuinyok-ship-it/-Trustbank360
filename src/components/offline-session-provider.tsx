"use client"

import { useState, useEffect, useCallback, createContext, useContext } from "react"
import { useRouter } from "next/navigation"
import { SessionProvider, useSession as useNextAuthSession } from "next-auth/react"
import {
  getCachedFullSession,
  cacheFullSession,
  isSessionExpiredOffline,
  registerDevice,
  refreshOfflineDaysCache,
  isDeviceRegistered,
} from "@/lib/offline-auth"
import { getSavedRoute } from "@/lib/route-persistence"
import { useNetworkStore } from "@/store/network-store"

interface OfflineSessionContextValue {
  isOfflineMode: boolean
  offlineSessionExpired: boolean
  lastSyncedAt: Date | null
}

const OfflineSessionContext = createContext<OfflineSessionContextValue>({
  isOfflineMode: false,
  offlineSessionExpired: false,
  lastSyncedAt: null,
})

export const useOfflineSession = () => useContext(OfflineSessionContext)

function InnerOfflineProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [offlineSession, setOfflineSession] = useState<any>(null)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [offlineSessionExpired, setOfflineSessionExpired] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [initialized, setInitialized] = useState(false)
  const isOnline = useNetworkStore((s) => s.isOnline)

  const initOfflineSession = useCallback(async () => {
    await refreshOfflineDaysCache()

    if (navigator.onLine) {
      setIsOfflineMode(false)
      setInitialized(true)
      return
    }

    const cached = await getCachedFullSession()
    if (cached) {
      setOfflineSession(cached)
      setIsOfflineMode(true)
      setOfflineSessionExpired(false)
      setLastSyncedAt(new Date(cached.cachedAt))
      // Restore last visited route — client-side navigation only (no new window, no middleware re-run)
      const savedRoute = getSavedRoute()
      if (savedRoute && !window.location.pathname.startsWith("/login")) {
        const currentPath = window.location.pathname
        const isOnLoginOrOffline = currentPath === "/login" || currentPath === "/offline" || currentPath === "/"
        if (isOnLoginOrOffline && savedRoute !== currentPath) {
          router.replace(savedRoute)
          setInitialized(true)
          return
        }
      }
    } else if (isSessionExpiredOffline()) {
      setOfflineSessionExpired(true)
      setIsOfflineMode(true)
    } else {
      setIsOfflineMode(true)
    }
    setInitialized(true)
  }, [])

  useEffect(() => {
    initOfflineSession()
  }, [initOfflineSession])

  useEffect(() => {
    if (isOnline && !isOfflineMode) {
      setLastSyncedAt(new Date())
    }
  }, [isOnline, isOfflineMode])

  if (!initialized) return null

  const sessionToProvide = isOnline ? undefined : offlineSession?.user ? { user: offlineSession.user, expires: offlineSession.expires } : null

  return (
    <OfflineSessionContext.Provider value={{ isOfflineMode, offlineSessionExpired, lastSyncedAt }}>
      <SessionProvider session={sessionToProvide} refetchInterval={isOnline ? 300 : undefined} refetchOnWindowFocus={isOnline} refetchWhenOffline={false}>
        {children}
      </SessionProvider>
    </OfflineSessionContext.Provider>
  )
}

function SessionCacher({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useNextAuthSession()
  const isOnline = useNetworkStore((s) => s.isOnline)

  useEffect(() => {
    if (status === "authenticated" && session?.user && isOnline) {
      cacheFullSession(session).catch(() => {})
      registerDevice(
        (session.user as any).id,
        (session.user as any).companyId,
        (session.user as any).branchId
      ).catch(() => {})
    }
  }, [session, status, isOnline])

  return <>{children}</>
}

export function OfflineSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <InnerOfflineProvider>
      <SessionCacher>
        {children}
      </SessionCacher>
    </InnerOfflineProvider>
  )
}
