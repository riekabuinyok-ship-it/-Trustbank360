// TrustBank360 App Version Tracking
// Tracks deployments, detects stale clients, logs updates for diagnostics

const VERSION_KEY = "tb360_app_version"
const UPDATE_LOG_KEY = "tb360_update_log"

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"

interface StoredVersion {
  version: string
  updatedAt: number
}

interface UpdateLogEntry {
  from: string
  to: string
  timestamp: number
  page: string
}

export function getStoredVersion(): StoredVersion | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(VERSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredVersion(version: string): void {
  if (typeof window === "undefined") return
  try {
    const entry: StoredVersion = { version, updatedAt: Date.now() }
    localStorage.setItem(VERSION_KEY, JSON.stringify(entry))
  } catch {}
}

export function isNewVersion(): boolean {
  const stored = getStoredVersion()
  if (!stored) return true
  return stored.version !== APP_VERSION
}

export function logUpdate(fromVersion: string, toVersion: string): void {
  if (typeof window === "undefined") return
  try {
    const raw = localStorage.getItem(UPDATE_LOG_KEY)
    const logs: UpdateLogEntry[] = raw ? JSON.parse(raw) : []
    logs.push({
      from: fromVersion,
      to: toVersion,
      timestamp: Date.now(),
      page: window.location.pathname,
    })
    // Keep only last 20 entries
    if (logs.length > 20) logs.splice(0, logs.length - 20)
    localStorage.setItem(UPDATE_LOG_KEY, JSON.stringify(logs))
  } catch {}
}

export function getUpdateLog(): UpdateLogEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(UPDATE_LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
