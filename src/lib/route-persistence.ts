const STORAGE_KEY = "tb360_saved_route"

const TRANSIENT_ROUTES = [
  "/login",
  "/logout",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/billing/checkout",
  "/force-change-password",
  "/onboarding",
  "/offline",
  "/api/",
]

function isTransient(pathname: string): boolean {
  return TRANSIENT_ROUTES.some((route) => pathname.startsWith(route))
}

export function saveRoute(pathname: string): void {
  if (!pathname || isTransient(pathname)) return
  try {
    localStorage.setItem(STORAGE_KEY, pathname)
  } catch {}
}

export function getSavedRoute(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearSavedRoute(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}
