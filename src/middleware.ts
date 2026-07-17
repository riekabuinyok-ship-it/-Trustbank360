import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const publicRoutes = ["/login", "/signup", "/track", "/forgot-password", "/reset-password", "/reset-password/", "/api/auth", "/api/public", "/", "/features", "/pricing", "/about", "/contact", "/tutorials", "/exchange-rates", "/help", "/privacy", "/terms", "/api/public/stats", "/offline", "/sw.js", "/manifest.json", "/images"]

function isCompanyRole(role: string): boolean {
  return ["company_owner", "company_admin", "branch_manager", "teller", "compliance_officer", "auditor"].includes(role)
}

interface OfflineClaims {
  email: string
  name: string
  role: string
  companyId: string | null
  branchId: string | null
  companyName: string | null
  exp: number
}

function base64Decode(str: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  let result = ""
  const arr = str.replace(/=/g, "").split("")
  for (let i = 0; i < arr.length; i += 4) {
    const a = chars.indexOf(arr[i])
    const b = chars.indexOf(arr[i + 1])
    const c = chars.indexOf(arr[i + 2])
    const d = chars.indexOf(arr[i + 3])
    result += String.fromCharCode((a << 2) | (b >> 4))
    if (c !== -1) result += String.fromCharCode(((b & 15) << 4) | (c >> 2))
    if (d !== -1) result += String.fromCharCode(((c & 3) << 6) | d)
  }
  return result
}

function parseOfflineCookie(cookieValue: string | undefined): OfflineClaims | null {
  if (!cookieValue) return null
  try {
    const decoded = JSON.parse(base64Decode(cookieValue)) as OfflineClaims
    if (decoded.exp * 1000 < Date.now()) return null
    return decoded
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 0. RSC flight requests → pass through (prevent broken App Router navigation)
  if (request.headers.get("RSC") === "1") {
    return NextResponse.next()
  }

  // 1. Public routes → allow
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    const response = NextResponse.next()
    response.headers.set("X-Robots-Tag", "index, follow")
    return response
  }

  // 2. Next.js internals / static files → allow
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/api/") || pathname.startsWith("/robots") || pathname.startsWith("/sitemap")) {
    const response = NextResponse.next()
    return response
  }

  const token = await getToken({ req: request })

  // 3. Not authenticated → try offline session cookie
  if (!token) {
    const offlineCookie = request.cookies.get("tb360_offline")?.value
    const offlineUser = parseOfflineCookie(offlineCookie)

    if (offlineUser && isCompanyRole(offlineUser.role) && pathname.startsWith("/company")) {
      const response = NextResponse.next()
      response.headers.set("X-Robots-Tag", "noindex, nofollow")
      response.headers.set("X-Offline-Session", "true")
      return response
    }

    if (offlineUser && offlineUser.role === "platform_owner" && pathname.startsWith("/platform")) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("error", "platform-offline")
      return NextResponse.redirect(loginUrl)
    }

    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const user = token as any
  const role: string = user.role

  // 4. Suspended/inactive → redirect to /login?error=suspended
  if (!user.isActive) {
    return NextResponse.redirect(new URL("/login?error=suspended", request.url))
  }

  // 4a. Company-level suspension check
  if (isCompanyRole(role) && !user.companyIsActive && pathname.startsWith("/company")) {
    return NextResponse.redirect(new URL("/login?error=suspended&reason=company", request.url))
  }

  // 6. Platform owner — skip onboarding / password checks, only /platform/* allowed
  if (role === "platform_owner") {
    if (pathname.startsWith("/platform")) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL("/platform", request.url))
  }

  // 5. Company role — onboarding / password checks
  if (isCompanyRole(role)) {
    if (!user.onboardingComplete) {
      if (pathname.startsWith("/onboarding")) {
        return NextResponse.next()
      }
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }

    if (user.mustChangePassword) {
      if (pathname.startsWith("/force-change-password")) {
        return NextResponse.next()
      }
      return NextResponse.redirect(new URL("/force-change-password", request.url))
    }

    // Onboarding/password checks passed — redirect away if still on those pages
    if (pathname.startsWith("/onboarding") || pathname.startsWith("/force-change-password")) {
      return NextResponse.redirect(new URL("/company/dashboard", request.url))
    }

    // Role-based route protection
    if (pathname.startsWith("/platform")) {
      return NextResponse.redirect(new URL("/company/dashboard", request.url))
    }

    if (pathname === "/company") {
      return NextResponse.redirect(new URL("/company/dashboard", request.url))
    }

    if (pathname.startsWith("/company")) {
      const response = NextResponse.next()
      response.headers.set("X-Robots-Tag", "noindex, nofollow")
      return response
    }

    // Default: send company roles to their dashboard
    return NextResponse.redirect(new URL("/company/dashboard", request.url))
  }

  // Unknown role — redirect to login
  return NextResponse.redirect(new URL("/login", request.url))
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
