"use client"

import { storeRecord, getFirstByIndex, deleteRecord } from "@/lib/db/client"

const AUTH_STORE = "auth"

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
  const claims: OfflineSessionClaims = {
    email: user.email,
    name: user.name,
    role: user.role,
    companyId: user.companyId,
    branchId: user.branchId,
    companyName: user.companyName,
    exp: Math.floor(Date.now() / 1000) + 86400,
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

// Demo credentials for offline testing
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
