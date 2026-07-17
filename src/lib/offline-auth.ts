"use client"

import { storeRecord, getFirstByIndex, deleteRecord, getRecord, clearStore } from "@/lib/db/client"

const AUTH_STORE = "auth"
const SETTINGS_STORE = "settings"
const DEVICES_STORE = "devices"
const OFFLINE_SESSION_KEY = "tb360_offline_session"

const DEFAULT_OFFLINE_DAYS = 30

export interface CachedUser {
  id: string
  email: string
  name: string
  role: string
  companyId: string | null
  branchId: string | null
  companyName: string | null
  image: string | null
  passwordHash: string
  cachedAt: number
}

export interface OfflineSessionClaims {
  email: string
  name: string
  role: string
  companyId: string | null
  branchId: string | null
  companyName: string | null
  exp: number
}

export interface FullOfflineSession {
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
    role: string
    companyId: string | null
    branchId: string | null
    companyName: string | null
    businessTypes: string[] | null
    isActive: boolean
    companyIsActive: boolean
    onboardingComplete: boolean
    twoFactorEnabled: boolean
    mustChangePassword: boolean
  }
  expires: string
  cachedAt: number
}

export interface DeviceRecord {
  id: string
  fingerprint: string
  userId: string
  companyId: string | null
  branchId: string | null
  lastSync: number
  sessionExpiry: number
  registeredAt: number
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function cacheSession(userData: {
  id: string
  email: string
  name: string
  role: string
  companyId: string | null
  branchId: string | null
  companyName: string | null
  image: string | null
  password: string
}): Promise<void> {
  const passwordHash = await sha256(userData.password)
  const cached: CachedUser = {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    role: userData.role,
    companyId: userData.companyId,
    branchId: userData.branchId,
    companyName: userData.companyName,
    image: userData.image,
    passwordHash,
    cachedAt: Date.now(),
  }
  await storeRecord(AUTH_STORE, cached)
}

export async function getCachedUser(email: string): Promise<CachedUser | null> {
  try {
    return await getFirstByIndex<CachedUser>(AUTH_STORE, "by_email", email)
  } catch {
    return null
  }
}

export async function verifyOfflineLogin(email: string, password: string): Promise<CachedUser | null> {
  const cached = await getCachedUser(email)
  if (!cached) return null
  const hash = await sha256(password)
  if (hash !== cached.passwordHash) return null
  return cached
}

export function createOfflineSessionCookie(user: CachedUser): string {
  const offlineDays = getOfflineSessionDays()
  const claims: OfflineSessionClaims = {
    email: user.email,
    name: user.name,
    role: user.role,
    companyId: user.companyId,
    branchId: user.branchId,
    companyName: user.companyName,
    exp: Math.floor(Date.now() / 1000) + offlineDays * 86400,
  }
  return btoa(JSON.stringify(claims))
}

export function parseOfflineSessionCookie(cookieValue: string | undefined): OfflineSessionClaims | null {
  if (!cookieValue) return null
  try {
    const decoded = JSON.parse(atob(cookieValue)) as OfflineSessionClaims
    if (decoded.exp * 1000 < Date.now()) return null
    return decoded
  } catch {
    return null
  }
}

export async function clearCachedSession(email: string): Promise<void> {
  const cached = await getCachedUser(email)
  if (cached) await deleteRecord(AUTH_STORE, cached.id)
}

export async function clearAllOfflineData(): Promise<void> {
  try {
    await clearStore(AUTH_STORE)
    await clearStore(SETTINGS_STORE)
    await clearStore("syncQueue")
    await clearStore("syncConflicts")
    await clearStore("offlineAuditLogs")
    await clearStore("pendingPayouts")
    await clearStore("apiCache")
    document.cookie = "tb360_offline=; path=/; max-age=0"
    localStorage.removeItem(OFFLINE_SESSION_KEY)
  } catch {
    // Best-effort cleanup
  }
}

// ---- FULL SESSION CACHE (for SessionProvider) ----

export async function cacheFullSession(session: any): Promise<void> {
  if (!session?.user) return
  const offlineDays = getOfflineSessionDays()
  const fullSession: FullOfflineSession = {
    user: session.user,
    expires: new Date(Date.now() + offlineDays * 86400000).toISOString(),
    cachedAt: Date.now(),
  }
  try {
    localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(fullSession))
  } catch {
    // localStorage might be full
  }
}

export async function getCachedFullSession(): Promise<FullOfflineSession | null> {
  try {
    const raw = localStorage.getItem(OFFLINE_SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as FullOfflineSession
    if (new Date(session.expires) < new Date()) {
      localStorage.removeItem(OFFLINE_SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function isSessionExpiredOffline(): boolean {
  try {
    const raw = localStorage.getItem(OFFLINE_SESSION_KEY)
    if (!raw) return true
    const session = JSON.parse(raw) as FullOfflineSession
    return new Date(session.expires) < new Date()
  } catch {
    return true
  }
}

// ---- CONFIGURABLE OFFLINE SESSION TTL ----

export async function setOfflineSessionDays(days: number): Promise<void> {
  await storeRecord(SETTINGS_STORE, { key: "offlineSessionDays", value: days })
}

export async function getOfflineSessionDaysAsync(): Promise<number> {
  try {
    const record = await getRecord<{ key: string; value: number }>(SETTINGS_STORE, "offlineSessionDays")
    return record?.value || DEFAULT_OFFLINE_DAYS
  } catch {
    return DEFAULT_OFFLINE_DAYS
  }
}

export function getOfflineSessionDays(): number {
  // Synchronous version reads from settings store via a cached value
  // The async version should be called on init to populate this
  try {
    const raw = localStorage.getItem("tb360_offline_days")
    if (raw) return parseInt(raw, 10) || DEFAULT_OFFLINE_DAYS
  } catch {}
  return DEFAULT_OFFLINE_DAYS
}

export async function refreshOfflineDaysCache(): Promise<void> {
  const days = await getOfflineSessionDaysAsync()
  try {
    localStorage.setItem("tb360_offline_days", String(days))
  } catch {}
}

// ---- DEVICE REGISTRATION ----

function getDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    navigator.platform,
  ]
  return components.join("|")
}

export async function getDeviceId(): Promise<string> {
  const fingerprint = getDeviceFingerprint()
  return sha256(fingerprint)
}

export async function registerDevice(userId: string, companyId: string | null, branchId: string | null): Promise<void> {
  const fingerprint = getDeviceFingerprint()
  const deviceId = await getDeviceId()
  const offlineDays = getOfflineSessionDays()
  const record: DeviceRecord = {
    id: deviceId,
    fingerprint,
    userId,
    companyId,
    branchId,
    lastSync: Date.now(),
    sessionExpiry: Date.now() + offlineDays * 86400000,
    registeredAt: Date.now(),
  }
  await storeRecord(DEVICES_STORE, record)
}

export async function isDeviceRegistered(): Promise<boolean> {
  try {
    const deviceId = await getDeviceId()
    const record = await getRecord<DeviceRecord>(DEVICES_STORE, deviceId)
    return record !== null
  } catch {
    return false
  }
}

export async function isDeviceSessionValid(): Promise<boolean> {
  try {
    const deviceId = await getDeviceId()
    const record = await getRecord<DeviceRecord>(DEVICES_STORE, deviceId)
    if (!record) return false
    return record.sessionExpiry > Date.now()
  } catch {
    return false
  }
}

export async function updateDeviceSync(): Promise<void> {
  try {
    const deviceId = await getDeviceId()
    const record = await getRecord<DeviceRecord>(DEVICES_STORE, deviceId)
    if (record) {
      record.lastSync = Date.now()
      await storeRecord(DEVICES_STORE, record)
    }
  } catch {}
}

// ---- DEMO CREDENTIALS ----

const DEMO_EMAIL = "admin@trustbank.com"
const DEMO_PASSWORD = "Admin@123"

export async function seedDemoUser(): Promise<void> {
  const existing = await getCachedUser(DEMO_EMAIL)
  if (existing) return
  const passwordHash = await sha256(DEMO_PASSWORD)
  const cached: CachedUser = {
    id: "demo-offline",
    email: DEMO_EMAIL,
    name: "Admin Demo",
    role: "company_owner",
    companyId: "demo-company",
    branchId: null,
    companyName: "Demo Company",
    image: null,
    passwordHash,
    cachedAt: Date.now(),
  }
  await storeRecord(AUTH_STORE, cached)
}

export function getDemoCredentials(): { email: string; password: string } {
  return { email: DEMO_EMAIL, password: DEMO_PASSWORD }
}
