// TrustBank360 Offline API Client
// Detects online/offline before every API request
// Falls back to IndexedDB cache when offline

"use client"

import { useNetworkStore } from "@/store/network-store"
import { storeRecord, getRecord } from "@/lib/db/client"

export class OfflineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OfflineError"
  }
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export async function offlineFetch(url: string, options?: RequestInit): Promise<any> {
  if (!useNetworkStore.getState().isOnline) {
    throw new OfflineError("No internet connection")
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const text = await res.text().catch(() => "Request failed")
      throw new ApiError(res.status, text)
    }

    return res.json()
  } catch (err) {
    clearTimeout(timeout)
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new OfflineError("Request timed out")
    }
    if (err instanceof OfflineError || err instanceof ApiError) throw err
    throw new OfflineError("Network request failed")
  }
}

export async function offlineFetchWithCache(
  url: string,
  cacheKey: string,
  options?: RequestInit
): Promise<any> {
  if (!useNetworkStore.getState().isOnline) {
    const cached = await getRecord<{ data: any; cachedAt: number }>("apiCache", cacheKey)
    if (cached?.data) return cached.data
    throw new OfflineError("No internet and no cached data available")
  }

  try {
    const data = await offlineFetch(url, options)
    await storeRecord("apiCache", { key: cacheKey, data, cachedAt: Date.now() })
    return data
  } catch (err) {
    if (err instanceof OfflineError) {
      const cached = await getRecord<{ data: any; cachedAt: number }>("apiCache", cacheKey)
      if (cached?.data) return cached.data
    }
    throw err
  }
}

export function isOffline(): boolean {
  return !useNetworkStore.getState().isOnline
}

export function isOnline(): boolean {
  return useNetworkStore.getState().isOnline
}
