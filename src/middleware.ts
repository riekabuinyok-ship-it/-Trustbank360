import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const publicRoutes = ["/login", "/signup", "/track", "/forgot-password", "/api/auth", "/api/public", "/", "/features", "/pricing", "/about", "/contact", "/tutorials", "/exchange-rates", "/help", "/privacy", "/terms", "/api/public/stats", "/offline", "/sw.js", "/manifest.json", "/images/icons"]

function isCompanyRole(role: string): boolean {
  return ["company_owner", "company_admin", "branch_manager", "teller", "compliance_officer", "auditor"].includes(role)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Public routes → allow
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    const response = NextResponse.next()
    response.headers.set("X-Robots-Tag", "index, follow")
    return response
  }

  // 2. Next.js internals / API routes → allow
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/api/")) {
    const response = NextResponse.next()
    return response
  }

  const token = await getToken({ req: request })

  // 3. Not authenticated → redirect to /login
  if (!token) {
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
