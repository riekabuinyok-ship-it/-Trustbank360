// TrustBank360 Offline Query Hook
// React hook for offline-aware data fetching with IndexedDB fallback

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { offlineFetchWithCache, OfflineError } from "@/lib/api/client"
import { getRecord } from "@/lib/db/client"
import { useNetworkStore } from "@/store/network-store"

interface OfflineQueryResult<T> {
  data: T | null
  isOffline: boolean
  lastUpdated: Date | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useOfflineQuery<T = any>(
  url: string,
  cacheKey: string,
  options?: {
    refetchInterval?: number
    enabled?: boolean
  }
): OfflineQueryResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const load = useCallback(async () => {
    if (options?.enabled === false) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await offlineFetchWithCache(url, cacheKey)
      if (mountedRef.current) {
        setData(result)
        setIsOffline(!useNetworkStore.getState().isOnline)
        const cached = await getRecord<{ cachedAt: number }>("apiCache", cacheKey)
        if (cached?.cachedAt) setLastUpdated(new Date(cached.cachedAt))
      }
    } catch (err) {
      if (mountedRef.current) {
        if (err instanceof OfflineError) {
          setIsOffline(true)
          const cached = await getRecord<{ data: T; cachedAt: number }>("apiCache", cacheKey)
          if (cached?.data) {
            setData(cached.data)
            setLastUpdated(new Date(cached.cachedAt))
          } else {
            setError("No internet connection and no cached data available")
          }
        } else {
          setError(err instanceof Error ? err.message : "Failed to load data")
        }
      }
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [url, cacheKey, options?.enabled])

  useEffect(() => {
    mountedRef.current = true
    load()

    const interval = options?.refetchInterval || 60000
    intervalRef.current = setInterval(() => {
      if (useNetworkStore.getState().isOnline) load()
    }, interval)

    return () => {
      mountedRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [load, options?.refetchInterval])

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      load()
    }
    const handleOffline = () => setIsOffline(true)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [load])

  return { data, isOffline, lastUpdated, isLoading, error, refetch: load }
}
